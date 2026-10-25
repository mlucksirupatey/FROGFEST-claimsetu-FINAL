// lib/reasoning/engine.ts
// Main reasoning engine orchestrator.
// Executes the post-deterministic reasoning layer adhering to CLAIM_REASONING_AGENT.md.

import { GoogleGenAI, Type } from '@google/genai';
import { query } from '../db.ts';
import {
  getPolicyVariables,
  buildHipmlInputs,
  runPolicyEvaluation,
  extractRetrievalNeeds,
} from '../hipml.ts';
import { queryRagEvidence, type RagQueryResponse } from '../rag-client.ts';
import {
  ReasoningAnalysisSchema,
  type ReasoningAnalysis,
  type ReasoningResult,
  type FrozenEvidence,
} from './types.ts';
import { freezeEvidence, buildCitationMap, validateCitations, validateQuotes } from './evidence.ts';
import { calculateDeterministicFinancials } from './math.ts';
import { computeFinalDisposition } from './disposition.ts';
import { REASONING_SYSTEM_PROMPT, buildReasoningPrompt } from './prompt.ts';
import { renderOperationsReport, renderSummaryReport } from './renderer.ts';

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({ apiKey });
}

function getReasoningModel() {
  return process.env.REASONING_MODEL || process.env.EXTRACTION_MODEL || 'gemini-3.5-flash';
}

function getGeminiReasoningSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      report_title: { type: Type.STRING },
      analysis_status: { type: Type.STRING },
      deterministic_disposition: { type: Type.STRING },
      executive_assessment: { type: Type.STRING },
      claim_context: {
        type: Type.OBJECT,
        properties: {
          claim_id: { type: Type.STRING },
          policy_id: { type: Type.STRING },
          hospital: { type: Type.STRING, nullable: true },
          admission_date: { type: Type.STRING, nullable: true },
          discharge_date: { type: Type.STRING, nullable: true },
          claimed_amount: { type: Type.NUMBER, nullable: true },
        },
        required: ['claim_id', 'policy_id'],
      },
      findings: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            finding_id: { type: Type.STRING },
            code: { type: Type.STRING },
            item: { type: Type.STRING },
            deterministic_status: { type: Type.STRING },
            assessment: { type: Type.STRING },
            explanation: { type: Type.STRING },
            claim_facts: { type: Type.ARRAY, items: { type: Type.STRING } },
            evidence_refs: { type: Type.ARRAY, items: { type: Type.STRING } },
            review_required: { type: Type.BOOLEAN },
            quote: { type: Type.STRING, nullable: true },
          },
          required: ['finding_id', 'code', 'item', 'deterministic_status', 'assessment', 'explanation', 'evidence_refs'],
        },
      },
      cross_document_analysis: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            issue: { type: Type.STRING },
            assessment: { type: Type.STRING },
            explanation: { type: Type.STRING },
            evidence_refs: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['issue', 'assessment', 'explanation'],
        },
      },
      financial_impact: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            item_id: { type: Type.STRING },
            claimed_amount: { type: Type.NUMBER, nullable: true },
            allowed_amount: { type: Type.NUMBER, nullable: true },
            difference: { type: Type.NUMBER, nullable: true },
            basis: { type: Type.STRING },
            evidence_refs: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['item_id', 'basis'],
        },
      },
      open_questions: { type: Type.ARRAY, items: { type: Type.STRING } },
      human_review_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
      operational_conclusion: { type: Type.STRING },
      summary_report: { type: Type.STRING },
    },
    required: [
      'report_title',
      'analysis_status',
      'deterministic_disposition',
      'executive_assessment',
      'claim_context',
      'findings',
      'cross_document_analysis',
      'financial_impact',
      'open_questions',
      'human_review_actions',
      'operational_conclusion',
      'summary_report',
    ],
  };
}

export interface RunReasoningOptions {
  dryRun?: boolean;
  mockLlmOutput?: any;
  mockRagResponse?: RagQueryResponse;
  mockHipmlResult?: any;
}

/**
 * Execute the post-deterministic reasoning engine for a given claim.
 */
export async function runReasoningEngine(
  claimId: number,
  options: RunReasoningOptions = {}
): Promise<ReasoningResult> {
  const { dryRun = false, mockLlmOutput, mockRagResponse, mockHipmlResult } = options;

  // 1. Load claim and policy metadata from database
  const claimRes = await query(
    `SELECT c.id, c.policy_id, c.status, c.structured_data, p.name AS policy_name, p.hipml_file_id
     FROM claims c
     JOIN policies p ON c.policy_id = p.id
     WHERE c.id = $1`,
    [claimId]
  );

  if (claimRes.rowCount === 0) {
    throw new Error(`Claim #${claimId} not found in database`);
  }

  const claimRow = claimRes.rows[0];
  const structuredData = claimRow.structured_data || {};

  // 2. Deterministic HIPML evaluation
  let evalResult = mockHipmlResult;
  let retrievalNeeds: any[] = [];

  if (!evalResult) {
    const requiredVars = await getPolicyVariables(claimRow.hipml_file_id);
    const hipmlData = {
      patient: {
        name: structuredData.patient?.name ?? undefined,
        age: structuredData.patient?.age ?? undefined,
        sex: structuredData.patient?.sex ?? undefined,
      },
      policy: {
        sumInsured: structuredData.policy?.sum_insured ?? structuredData.policy?.sumInsured ?? undefined,
        inceptionDate: structuredData.policy?.inception_date ?? structuredData.policy?.inceptionDate ?? undefined,
      },
      hospitalization: {
        startDate: structuredData.hospitalization?.admission_date ?? structuredData.hospitalization?.startDate ?? undefined,
        endDate: structuredData.hospitalization?.discharge_date ?? structuredData.hospitalization?.endDate ?? undefined,
        reason: structuredData.hospitalization?.reason ?? undefined,
        treatmentCountry: structuredData.hospitalization?.treatment_country ?? structuredData.hospitalization?.treatmentCountry ?? undefined,
      },
      diagnoses: structuredData.diagnoses || [],
      procedures: structuredData.procedures || [],
    };
    const hipmlInputs = buildHipmlInputs(hipmlData, requiredVars);
    evalResult = await runPolicyEvaluation(claimRow.hipml_file_id, hipmlInputs);
  }

  retrievalNeeds = extractRetrievalNeeds(evalResult, claimId, claimRow.policy_id, {
    diagnoses: structuredData.diagnoses || [],
    procedures: structuredData.procedures || [],
    lineItems: structuredData.line_items || [],
  });

  // 3. RAG Retrieval via localhost:4100 (Single upstream retrieval, no reasoning-layer vector searches)
  let ragResponse: RagQueryResponse | null = mockRagResponse || null;
  if (!ragResponse && retrievalNeeds.length > 0) {
    try {
      const flaggedItems = retrievalNeeds.map(need => ({
        code: need.code,
        item: need.item,
        claimFact: need.reason,
      }));
      ragResponse = await queryRagEvidence({
        policyId: claimRow.policy_id,
        flaggedItems,
        topK: 3,
      });
    } catch (ragErr: any) {
      console.warn(`RAG retrieval error for claim #${claimId}:`, ragErr.message);
      ragResponse = { results: [] };
    }
  }

  // 4. Evidence freezing (Assign closed-namespace E1, E2, ... and preserve provenance)
  const frozenEvidence = freezeEvidence(ragResponse, claimRow.policy_name ? `${claimRow.policy_name}.pdf` : 'policy.pdf');
  const citationMap = buildCitationMap(frozenEvidence);

  // 5. Deterministic arithmetic calculation
  const deterministicFinancials = calculateDeterministicFinancials(
    structuredData,
    evalResult,
    frozenEvidence
  );

  // 6. Check deterministic failure state
  const conditions = evalResult?.Conditions || {};
  const hasDeterministicFailure = Object.values(conditions).some(v => v === false);
  const hasDeterministicReviewNeed = retrievalNeeds.length > 0;

  // 7. Invoke Gemini LLM for structured reasoning (or use mock for testing)
  let rawParsedOutput: any = null;
  let modelNameUsed = 'mock';

  if (mockLlmOutput) {
    rawParsedOutput = mockLlmOutput;
  } else {
    const prompt = buildReasoningPrompt({
      claimId,
      policyId: claimRow.policy_id,
      claimFacts: structuredData,
      deterministicEval: evalResult,
      retrievalNeeds,
      frozenEvidence,
      financialImpact: deterministicFinancials,
    });

    const genai = getGenAI();
    const configuredModel = getReasoningModel();
    const candidateModels = [configuredModel, 'gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    const uniqueModels = Array.from(new Set(candidateModels));

    let response: any = null;
    let lastError: any = null;

    for (const m of uniqueModels) {
      try {
        response = await genai.models.generateContent({
          model: m,
          contents: prompt,
          config: {
            systemInstruction: REASONING_SYSTEM_PROMPT,
            responseMimeType: 'application/json',
            responseSchema: getGeminiReasoningSchema(),
            temperature: 0.1,
          },
        });
        if (response && response.text) {
          modelNameUsed = m;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Reasoning generation with ${m} failed (${err.message}). Trying fallback model...`);
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    if (!response || !response.text) {
      throw new Error(`Reasoning LLM returned empty response: ${lastError?.message || 'Unknown error'}`);
    }

    rawParsedOutput = JSON.parse(response.text);
  }

  // 8. Validate structured output with Zod
  const validatedAnalysis: ReasoningAnalysis = ReasoningAnalysisSchema.parse(rawParsedOutput);

  // 9. Post-generation citation and quote validation against closed evidence set
  validateCitations(validatedAnalysis, frozenEvidence);
  validateQuotes(validatedAnalysis.findings, frozenEvidence);

  // 10. Authoritative final disposition calculation
  const authoritativeDisposition = computeFinalDisposition({
    deterministicState: {
      hasDeterministicFailure,
      hasDeterministicReviewNeed,
      findings: validatedAnalysis.findings,
    },
    llmFindings: validatedAnalysis.findings,
    frozenEvidence,
    llmDispositionSuggestion: validatedAnalysis.deterministic_disposition,
  });

  // Ensure structured analysis reflects the authoritative application disposition
  validatedAnalysis.deterministic_disposition = authoritativeDisposition;

  // 11. Render full 9-section report and executive summary
  const fullReportMarkdown = renderOperationsReport({
    analysis: validatedAnalysis,
    frozenEvidence,
    citationMap,
    disposition: authoritativeDisposition,
  });

  const summaryReportMarkdown = renderSummaryReport({
    analysis: validatedAnalysis,
    disposition: authoritativeDisposition,
  });

  // 12. Persistence (when dryRun is false)
  let persisted = false;
  if (!dryRun) {
    const reasoningPayload = {
      structured_analysis: validatedAnalysis,
      disposition: authoritativeDisposition,
      full_report: fullReportMarkdown,
      summary_report: summaryReportMarkdown,
      frozen_evidence: frozenEvidence,
      citation_map: citationMap,
      model_metadata: {
        model: modelNameUsed,
        timestamp: new Date().toISOString(),
        call_budget: 1,
      },
      deterministic_eval: evalResult,
      generated_at: new Date().toISOString(),
    };

    // Map disposition to canonical status column:
    // "failed" -> "REJECTED_DETERMINISTIC"
    // "needs_review" -> "NEEDS_REVIEW"
    // "passed" -> "APPROVED_DETERMINISTIC"
    const statusMap: Record<string, string> = {
      failed: 'REJECTED_DETERMINISTIC',
      needs_review: 'NEEDS_REVIEW',
      passed: 'APPROVED_DETERMINISTIC',
    };
    const newDbStatus = statusMap[authoritativeDisposition] || 'REASONED';

    await query(
      `UPDATE claims
       SET reasoning_result = $1, status = $2, updated_at = now()
       WHERE id = $3`,
      [JSON.stringify(reasoningPayload), newDbStatus, claimId]
    );
    persisted = true;
  }

  return {
    success: true,
    claimId,
    disposition: authoritativeDisposition,
    structured_analysis: validatedAnalysis,
    full_report_markdown: fullReportMarkdown,
    summary_report_markdown: summaryReportMarkdown,
    frozen_evidence: frozenEvidence,
    citation_map: citationMap,
    model_metadata: {
      model: modelNameUsed,
      timestamp: new Date().toISOString(),
      call_budget: 1,
    },
    deterministic_eval: evalResult,
    persisted,
  };
}
