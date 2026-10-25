// nextjs/tests/08_reasoning_unit.test.mjs
// Unit tests for the post-deterministic reasoning engine per CLAIM_REASONING_AGENT.md Section 17:
// Tests 1 to 9 (run without requiring live Gemini API calls):
// 1. Evidence grounding
// 2. Deterministic status cannot be overridden
// 3. No evidence (safe abstention)
// 4. Conflicting evidence handling
// 5. Financial calculation determinism
// 6. Citation metadata preservation
// 7. Unsupported quote rejection / replacement
// 8. Report completeness (9 mandatory sections)
// 9. Summary consistency

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('.env.local') });

import { freezeEvidence, validateCitations, validateQuotes, buildCitationMap } from '../lib/reasoning/evidence.ts';
import { calculateDeterministicFinancials } from '../lib/reasoning/math.ts';
import { computeFinalDisposition } from '../lib/reasoning/disposition.ts';
import { renderOperationsReport, renderSummaryReport } from '../lib/reasoning/renderer.ts';
import { ReasoningAnalysisSchema } from '../lib/reasoning/types.ts';

// ── Mock Data Fixtures ──

const mockRagResponse = {
  results: [
    {
      finding: {
        code: 'CLAIM_ADMISSIBILITY',
        item: 'Claim Admissibility',
        claimFact: 'Admission occurred before policy waiting period concluded',
      },
      evidence: [
        {
          query: 'claim admissibility waiting period',
          chunkId: 101,
          clauseRef: '4.2',
          sectionTitle: 'Section 4 - Waiting Periods',
          pageStart: 5,
          pageEnd: 5,
          cosineSimilarity: 0.88,
          chunkText: 'Expenses related to specified treatments are subject to a mandatory 24-month waiting period from inception.',
        },
        {
          query: 'claim admissibility exclusions',
          chunkId: 102,
          clauseRef: '6.1',
          sectionTitle: 'Section 6 - Exclusions',
          pageStart: 8,
          pageEnd: 8,
          cosineSimilarity: 0.75,
          chunkText: 'Cosmetic and elective procedures are strictly excluded from policy coverage.',
        },
      ],
    },
  ],
};

// ── Test 1: Evidence Grounding ──
test('Test 1 — Evidence grounding: valid refs retained, unknown refs stripped', () => {
  const frozen = freezeEvidence(mockRagResponse);
  assert.equal(frozen.length, 2);
  assert.equal(frozen[0].evidence_id, 'E1');
  assert.equal(frozen[1].evidence_id, 'E2');

  const analysis = {
    report_title: 'Health Claim Analysis Report',
    analysis_status: 'complete',
    deterministic_disposition: 'failed',
    executive_assessment: 'Executive assessment text here.',
    claim_context: {
      claim_id: '1',
      policy_id: '1',
      hospital: 'City Hospital',
      admission_date: '2083-05-10',
      discharge_date: '2083-05-12',
      claimed_amount: 65000,
    },
    findings: [
      {
        finding_id: 'F1',
        code: 'WAITING_PERIOD',
        item: 'Waiting period rule',
        deterministic_status: 'failed',
        assessment: 'supported',
        explanation: 'Patient presented within the waiting period window.',
        claim_facts: ['Hospitalization date is within 24 months'],
        evidence_refs: ['E1', 'E99'], // E99 is hallucinated!
        review_required: false,
        quote: null,
      },
    ],
    cross_document_analysis: [],
    financial_impact: [],
    open_questions: [],
    human_review_actions: [],
    operational_conclusion: 'Claim rejected deterministically.',
    summary_report: 'Summary report content.',
  };

  const validationResult = validateCitations(analysis, frozen);
  assert.equal(validationResult.valid, false);
  assert.deepEqual(validationResult.invalidRefs, ['E99']);
  // Assert E99 was stripped from the finding
  assert.deepEqual(analysis.findings[0].evidence_refs, ['E1']);
});

// ── Test 2: Deterministic Status Cannot Be Overridden ──
test('Test 2 — Deterministic status cannot be overridden by LLM suggestion', () => {
  const frozen = freezeEvidence(mockRagResponse);

  // Scenario: Deterministic engine failed a condition, but LLM returned "passed"
  const disposition = computeFinalDisposition({
    deterministicState: {
      hasDeterministicFailure: true,
      hasDeterministicReviewNeed: true,
      findings: [{ code: 'CLAIM_ADMISSIBILITY', deterministic_status: 'failed' }],
    },
    llmFindings: [
      {
        finding_id: 'F1',
        code: 'CLAIM_ADMISSIBILITY',
        item: 'Claim Admissibility',
        deterministic_status: 'failed',
        assessment: 'supported',
        explanation: 'Admissibility condition failed',
        claim_facts: [],
        evidence_refs: ['E1'],
        review_required: false,
        quote: null,
      },
    ],
    frozenEvidence: frozen,
    llmDispositionSuggestion: 'passed', // LLM attempts to pass
  });

  assert.equal(disposition, 'failed', 'Authoritative disposition MUST remain failed');
});

// ── Test 3: No Evidence (Safe Abstention) ──
test('Test 3 — No evidence safe abstention: returns needs_review with zero generic fallback', () => {
  const emptyFrozen = freezeEvidence({ results: [] });
  assert.equal(emptyFrozen.length, 0);

  const disposition = computeFinalDisposition({
    deterministicState: {
      hasDeterministicFailure: false,
      hasDeterministicReviewNeed: true, // Needed retrieval
      findings: [{ code: 'WAITING_PERIOD', deterministic_status: 'needs_review' }],
    },
    llmFindings: [
      {
        finding_id: 'F1',
        code: 'WAITING_PERIOD',
        item: 'Waiting period',
        deterministic_status: 'needs_review',
        assessment: 'insufficient_evidence',
        explanation: 'No policy clauses retrieved from RAG.',
        claim_facts: [],
        evidence_refs: [],
        review_required: true,
        quote: null,
      },
    ],
    frozenEvidence: emptyFrozen,
  });

  assert.equal(disposition, 'needs_review');
});

// ── Test 4: Conflicting Evidence Handling ──
test('Test 4 — Conflicting evidence: marks assessment contradicted and sets needs_review', () => {
  const frozen = freezeEvidence(mockRagResponse);

  const disposition = computeFinalDisposition({
    deterministicState: {
      hasDeterministicFailure: false,
      hasDeterministicReviewNeed: true,
      findings: [{ code: 'COVERAGE_CONFLICT', deterministic_status: 'needs_review' }],
    },
    llmFindings: [
      {
        finding_id: 'F1',
        code: 'COVERAGE_CONFLICT',
        item: 'Conflicting policy wording',
        deterministic_status: 'needs_review',
        assessment: 'contradicted', // Conflicting evidence
        explanation: 'Clause 4.2 conflicts with Clause 6.1 regarding procedure coverage.',
        claim_facts: [],
        evidence_refs: ['E1', 'E2'],
        review_required: true,
        quote: null,
      },
    ],
    frozenEvidence: frozen,
  });

  assert.equal(disposition, 'needs_review');
});

// ── Test 5: Financial Calculation Determinism ──
test('Test 5 — Financial calculation: deterministic arithmetic preserves exact sub-limit amounts', () => {
  const claim = {
    line_items: [
      {
        description: 'Room and Nursing Charges',
        quantity: 2,
        unit_price: 7000,
        claimed_amount: 14000,
      },
      {
        description: 'Surgery Charge',
        quantity: 1,
        unit_price: 45000,
        claimed_amount: 45000,
      },
    ],
  };

  const hipmlResult = {
    Coverage: {
      'Room and Nursing charges': {
        included: true,
        'Limit per day': 5000,
      },
    },
  };

  const financials = calculateDeterministicFinancials(claim, hipmlResult);
  assert.equal(financials.length, 2);

  // Room charge: 14,000 claimed, 10,000 allowed (5,000 * 2), difference = 4,000
  const roomItem = financials[0];
  assert.equal(roomItem.claimed_amount, 14000);
  assert.equal(roomItem.allowed_amount, 10000);
  assert.equal(roomItem.difference, 4000);

  // Surgery charge: 45,000 claimed, 45,000 allowed, difference = 0
  const surgeryItem = financials[1];
  assert.equal(surgeryItem.claimed_amount, 45000);
  assert.equal(surgeryItem.allowed_amount, 45000);
  assert.equal(surgeryItem.difference, 0);
});

// ── Test 6: Citation Metadata Preservation ──
test('Test 6 — Citation metadata: resolves E1 to chunkId, clauseRef, sectionTitle, and pageStart', () => {
  const frozen = freezeEvidence(mockRagResponse, 'Shikhar Policy.pdf');
  const citationMap = buildCitationMap(frozen);

  assert.ok(citationMap['E1']);
  assert.equal(citationMap['E1'].chunk_id, 101);
  assert.equal(citationMap['E1'].clause_ref, '4.2');
  assert.equal(citationMap['E1'].section_title, 'Section 4 - Waiting Periods');
  assert.equal(citationMap['E1'].page_start, 5);
  assert.equal(citationMap['E1'].source_document, 'Shikhar Policy.pdf');

  // Verify rendering includes these metadata items
  const analysis = {
    report_title: 'Health Claim Analysis Report',
    analysis_status: 'complete',
    deterministic_disposition: 'failed',
    executive_assessment: 'Executive summary assessment.',
    claim_context: {
      claim_id: '1',
      policy_id: '1',
      hospital: 'City Hospital',
      admission_date: '2083-05-10',
      discharge_date: '2083-05-12',
      claimed_amount: 65000,
    },
    findings: [
      {
        finding_id: 'F1',
        code: 'WAITING_PERIOD',
        item: 'Waiting period rule',
        deterministic_status: 'failed',
        assessment: 'supported',
        explanation: 'Waiting period applies.',
        claim_facts: ['24 months'],
        evidence_refs: ['E1'],
        review_required: false,
        quote: null,
      },
    ],
    cross_document_analysis: [],
    financial_impact: [],
    open_questions: [],
    human_review_actions: [],
    operational_conclusion: 'Conclusion',
    summary_report: 'Summary',
  };

  const report = renderOperationsReport({
    analysis,
    frozenEvidence: frozen,
    citationMap,
    disposition: 'failed',
  });

  assert.ok(report.includes('Clause 4.2'));
  assert.ok(report.includes('Section 4 - Waiting Periods'));
  assert.ok(report.includes('Page 5'));
  assert.ok(report.includes('Shikhar Policy.pdf'));
});

// ── Test 7: Unsupported Quote Rejection / Replacement ──
test('Test 7 — Unsupported quote: rejected and replaced with deterministic excerpt from evidence', () => {
  const frozen = freezeEvidence(mockRagResponse);

  const findings = [
    {
      finding_id: 'F1',
      code: 'WAITING_PERIOD',
      item: 'Waiting period',
      deterministic_status: 'failed',
      assessment: 'supported',
      explanation: 'Explanation',
      claim_facts: [],
      evidence_refs: ['E1'],
      review_required: false,
      quote: 'THIS IS A COMPLETELY FABRICATED QUOTE NOT IN SOURCE TEXT',
    },
  ];

  validateQuotes(findings, frozen);

  // Verifies the fabricated quote was replaced with deterministic excerpt
  assert.notEqual(findings[0].quote, 'THIS IS A COMPLETELY FABRICATED QUOTE NOT IN SOURCE TEXT');
  assert.ok(findings[0].quote?.startsWith('[Excerpt]:'));
  assert.ok(findings[0].quote?.includes('Expenses related to specified treatments'));
});

// ── Test 8: Report Completeness (9 Mandatory Sections) ──
test('Test 8 — Report completeness: full report contains all 9 required sections', () => {
  const frozen = freezeEvidence(mockRagResponse);
  const citationMap = buildCitationMap(frozen);

  const analysis = {
    report_title: 'Health Claim Analysis Report',
    analysis_status: 'complete',
    deterministic_disposition: 'failed',
    executive_assessment: 'Executive assessment text explaining major findings and financial exposure.',
    claim_context: {
      claim_id: '1',
      policy_id: '1',
      hospital: 'City Hospital',
      admission_date: '2083-05-10',
      discharge_date: '2083-05-12',
      claimed_amount: 65000,
    },
    findings: [
      {
        finding_id: 'F1',
        code: 'WAITING_PERIOD',
        item: 'Waiting Period',
        deterministic_status: 'failed',
        assessment: 'supported',
        explanation: 'Patient was hospitalized within the waiting period window.',
        claim_facts: ['Hospitalized at month 6'],
        evidence_refs: ['E1'],
        review_required: false,
        quote: null,
      },
    ],
    cross_document_analysis: [
      {
        issue: 'Diagnosis consistency',
        assessment: 'consistent',
        explanation: 'Acute Appendicitis matched across Claim Form and Discharge Summary.',
        evidence_refs: [],
      },
    ],
    financial_impact: [
      {
        item_id: 'item-1',
        claimed_amount: 14000,
        allowed_amount: 10000,
        difference: 4000,
        basis: 'Room sub-limit cap',
        evidence_refs: [],
      },
    ],
    open_questions: ['Verify if pre-authorization was obtained.'],
    human_review_actions: ['Senior underwriter sign-off required for waiting period waiver.'],
    operational_conclusion: 'Claim cannot be settled automatically due to waiting period breach.',
    summary_report: 'Summary of the claim findings.',
  };

  const report = renderOperationsReport({
    analysis,
    frozenEvidence: frozen,
    citationMap,
    disposition: 'failed',
  });

  // Verify all 9 sections exist
  assert.ok(report.includes('## 1. Executive Assessment'), 'Must contain Section 1');
  assert.ok(report.includes('## 2. Claim and Policy Context'), 'Must contain Section 2');
  assert.ok(report.includes('## 3. Deterministic Rule Findings'), 'Must contain Section 3');
  assert.ok(report.includes('## 4. Evidence-Based Analysis of Material Findings'), 'Must contain Section 4');
  assert.ok(report.includes('## 5. Cross-Document Consistency and Evidence Issues'), 'Must contain Section 5');
  assert.ok(report.includes('## 6. Financial and Coverage Impact'), 'Must contain Section 6');
  assert.ok(report.includes('## 7. Required Human Review and Open Operational Inquiries'), 'Must contain Section 7');
  assert.ok(report.includes('## 8. Overall Operational Conclusion'), 'Must contain Section 8');
  assert.ok(report.includes('## 9. Evidence & Citations Audit Trail'), 'Must contain Section 9');
});

// ── Test 9: Summary Consistency ──
test('Test 9 — Summary consistency: executive summary reflects core findings without discrepancy', () => {
  const analysis = {
    report_title: 'Health Claim Analysis Report',
    analysis_status: 'complete',
    deterministic_disposition: 'needs_review',
    executive_assessment: 'Executive assessment narrative.',
    claim_context: {
      claim_id: '1',
      policy_id: '1',
      hospital: 'Kathmandu Hospital',
      admission_date: '2083-05-10',
      discharge_date: '2083-05-12',
      claimed_amount: 65000,
    },
    findings: [
      {
        finding_id: 'F1',
        code: 'CLAIM_ADMISSIBILITY',
        item: 'Admissibility',
        deterministic_status: 'needs_review',
        assessment: 'ambiguous',
        explanation: 'Policy ambiguity regarding admission protocol.',
        claim_facts: [],
        evidence_refs: [],
        review_required: true,
        quote: null,
      },
    ],
    cross_document_analysis: [],
    financial_impact: [],
    open_questions: [],
    human_review_actions: ['Confirm whether surgery was elective.'],
    operational_conclusion: 'Review needed.',
    summary_report: 'Claim exhibits material ambiguity regarding emergency admission protocol.',
  };

  const summary = renderSummaryReport({
    analysis,
    disposition: 'needs_review',
  });

  assert.ok(summary.includes('Claim #1'));
  assert.ok(summary.includes('NEEDS_REVIEW'));
  assert.ok(summary.includes('Claim exhibits material ambiguity regarding emergency admission protocol.'));
  assert.ok(summary.includes('Confirm whether surgery was elective.'));
});
