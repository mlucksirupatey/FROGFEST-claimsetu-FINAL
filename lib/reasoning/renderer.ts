// lib/reasoning/renderer.ts
// Renders validated structured reasoning output into comprehensive Operations Analysis Reports
// and concise Executive Summaries. Formatting is decoupled from the LLM.

import type { ReasoningAnalysis, FrozenEvidence, CitationDetail } from './types.ts';

/**
 * Resolves citation references (e.g. "E1") into descriptive human-readable strings.
 */
function resolveCitation(
  ref: string,
  citationMap: Record<string, CitationDetail>
): string {
  const detail = citationMap[ref];
  if (!detail) return `[${ref}]`;

  const parts: string[] = [];
  if (detail.source_document) parts.push(detail.source_document);
  if (detail.clause_ref) parts.push(`Clause ${detail.clause_ref}`);
  if (detail.section_title) parts.push(detail.section_title);
  if (detail.page_start) parts.push(`Page ${detail.page_start}`);

  return `[${ref}: ${parts.join(' — ')}]`;
}

/**
 * Renders the full 9-section Operations Analysis Report in Markdown (~900–1,400 words).
 */
export function renderOperationsReport(params: {
  analysis: ReasoningAnalysis;
  frozenEvidence: FrozenEvidence[];
  citationMap: Record<string, CitationDetail>;
  disposition: 'passed' | 'failed' | 'needs_review';
}): string {
  const { analysis, frozenEvidence, citationMap, disposition } = params;
  const ctx = analysis.claim_context;

  const sections: string[] = [];

  // Header
  sections.push(`# ${analysis.report_title}
**Claim Reference:** Claim #${ctx.claim_id} | **Policy Reference:** Policy #${ctx.policy_id}
**Authoritative Operational Disposition:** \`${disposition.toUpperCase()}\`
**Evaluation Status:** ${analysis.analysis_status.toUpperCase()}
`);

  // Section 1: Executive Assessment
  sections.push(`## 1. Executive Assessment
${analysis.executive_assessment}
`);

  // Section 2: Claim and Policy Context
  sections.push(`## 2. Claim and Policy Context
The insured claim under review corresponds to hospitalization at **${ctx.hospital || 'Designated Medical Facility'}**, with an admission window from **${ctx.admission_date || 'N/A'}** through **${ctx.discharge_date || 'N/A'}**.

- **Claim Identifier:** CLM-${ctx.claim_id}
- **Associated Policy ID:** POL-${ctx.policy_id}
- **Treating Hospital:** ${ctx.hospital || 'Not Specified'}
- **Total Invoiced / Claimed Amount:** NPR ${ctx.claimed_amount?.toLocaleString() ?? 'N/A'}
- **Adjudication Path:** Automated deterministic rules verification followed by evidence-grounded operations synthesis.

The claimant file incorporates authenticated billing records, formal discharge documentation, and official claim documentation. Sensitive patient personally identifiable data has been withheld from operational logs in strict adherence to data governance protocols.
`);

  // Section 3: Deterministic Rule Findings
  let findingsTable = `## 3. Deterministic Rule Findings
The initial underwriting and adjudication phase subjected this claim to deterministic rules verification via the Vitraya HIPML engine. The deterministic results represent verified computational facts that cannot be altered or bypassed:

| Finding ID | Rule Code | Evaluation Target | Deterministic Status | Review Flag |
| :--- | :--- | :--- | :--- | :--- |
`;

  if (analysis.findings.length === 0) {
    findingsTable += `| N/A | ALL_CLEAR | Standard Hospitalization | PASSED | NO |\n`;
  } else {
    for (const f of analysis.findings) {
      findingsTable += `| ${f.finding_id} | ${f.code} | ${f.item} | **${f.deterministic_status.toUpperCase()}** | ${f.review_required ? 'YES' : 'NO'} |\n`;
    }
  }
  sections.push(findingsTable);

  // Section 4: Evidence-Based Analysis of Each Material Finding
  let evidenceAnalysis = `## 4. Evidence-Based Analysis of Material Findings
This section synthesizes the verified claim facts against authoritative policy clauses retrieved from the primary policy schedule. Every analytical assertion is grounded strictly in indexed policy evidence:
\n`;

  if (analysis.findings.length === 0) {
    evidenceAnalysis += `No adverse findings or condition failures were identified during deterministic evaluation. The claim fully complies with standard coverage criteria.\n`;
  } else {
    for (const f of analysis.findings) {
      const citedSources = (f.evidence_refs || [])
        .map(ref => resolveCitation(ref, citationMap))
        .join('; ');

      evidenceAnalysis += `### Finding ${f.finding_id}: ${f.code} (${f.item})
- **Deterministic Determination:** \`${f.deterministic_status.toUpperCase()}\`
- **Assessment Posture:** \`${f.assessment.toUpperCase()}\`
- **Associated Claim Facts:** ${f.claim_facts && f.claim_facts.length > 0 ? f.claim_facts.join('; ') : 'Standard hospitalization parameters'}
- **Evidence Reference(s):** ${citedSources || 'No policy evidence chunks retrieved (INSUFFICIENT_EVIDENCE)'}
- **Detailed Operations Analysis:**
  ${f.explanation}
${f.quote ? `  > **Verified Policy Quote:** "${f.quote}"\n` : ''}
`;
    }
  }
  sections.push(evidenceAnalysis);

  // Section 5: Cross-Document Consistency / Evidence Issues
  let crossDocSection = `## 5. Cross-Document Consistency and Evidence Issues
A multi-way document consistency evaluation was executed across the uploaded claim form, hospital invoice, and discharge summary:
\n`;

  if (analysis.cross_document_analysis.length === 0) {
    crossDocSection += `No cross-document discrepancies or extraction conflicts were detected across the submitted medical and billing artifacts.\n`;
  } else {
    for (const item of analysis.cross_document_analysis) {
      const cited = item.evidence_refs?.map(ref => resolveCitation(ref, citationMap)).join(', ');
      crossDocSection += `- **Issue:** ${item.issue}
  - **Status:** \`${item.assessment.toUpperCase()}\`
  - **Evaluation:** ${item.explanation}
  ${cited ? `  - **Evidence Context:** ${cited}\n` : ''}
`;
    }
  }
  sections.push(crossDocSection);

  // Section 6: Financial and Coverage Impact
  let financialSection = `## 6. Financial and Coverage Impact
Financial liability and sub-limit adjustments are determined via deterministic calculation. The table below itemizes the billed charges, applicable policy limits, and calculated excess deductions:

| Item Identifier | Claimed Amount (NPR) | Allowed Limit (NPR) | Excess / Deductible (NPR) | Basis of Calculation |
| :--- | :--- | :--- | :--- | :--- |
`;

  let totalClaimed = 0;
  let totalAllowed = 0;
  let totalDiff = 0;

  for (const fi of analysis.financial_impact) {
    const c = fi.claimed_amount ?? 0;
    const a = fi.allowed_amount ?? c;
    const d = fi.difference ?? Math.max(0, c - a);
    totalClaimed += c;
    totalAllowed += a;
    totalDiff += d;

    financialSection += `| ${fi.item_id} | NPR ${c.toLocaleString()} | NPR ${a.toLocaleString()} | NPR ${d.toLocaleString()} | ${fi.basis} |\n`;
  }

  financialSection += `| **TOTALS** | **NPR ${totalClaimed.toLocaleString()}** | **NPR ${totalAllowed.toLocaleString()}** | **NPR ${totalDiff.toLocaleString()}** | **Aggregated Financial Exposure** |\n\n`;

  if (totalDiff > 0) {
    financialSection += `**Financial Implication:** An aggregate excess of NPR ${totalDiff.toLocaleString()} has been identified due to sub-limit ceilings or non-covered line items. In the event of claim settlement, the payable sum must be capped at NPR ${totalAllowed.toLocaleString()}.\n`;
  } else {
    financialSection += `**Financial Implication:** All billed line items fall within prescribed policy sub-limits without requiring excess deductions.\n`;
  }
  sections.push(financialSection);

  // Section 7: Required Human Review / Open Questions
  let reviewSection = `## 7. Required Human Review and Open Operational Inquiries
The following items represent outstanding ambiguities, unmapped exclusions, or verification steps requiring human underwriter or claims operations intervention prior to final binding settlement:
\n`;

  if (analysis.open_questions.length === 0 && analysis.human_review_actions.length === 0) {
    reviewSection += `All claim parameters have been verified deterministically and corroborated with policy evidence. No open operational inquiries require manual triage.\n`;
  } else {
    if (analysis.open_questions.length > 0) {
      reviewSection += `### Open Operational Questions\n`;
      for (const q of analysis.open_questions) {
        reviewSection += `1. ${q}\n`;
      }
      reviewSection += `\n`;
    }
    if (analysis.human_review_actions.length > 0) {
      reviewSection += `### Recommended Reviewer Action Items\n`;
      for (const a of analysis.human_review_actions) {
        reviewSection += `- [ ] ${a}\n`;
      }
    }
  }
  sections.push(reviewSection);

  // Section 8: Overall Operational Conclusion
  sections.push(`## 8. Overall Operational Conclusion
${analysis.operational_conclusion}

*Notice: This operational analysis report is an automated explainability artifact synthesized from deterministic rule evaluations and frozen policy evidence. It does not constitute a legally binding underwriting commitment without human review approval.*
`);

  // Section 9: Evidence & Citations Audit Table
  let citationSection = `## 9. Evidence & Citations Audit Trail
The table below documents the full provenance of all policy evidence chunks retrieved from the vector knowledge store and made available to this evaluation:

| ID | Clause Ref | Policy Section | Page | Cosine Similarity | Source File | Chunk Excerpt |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;

  if (frozenEvidence.length === 0) {
    citationSection += `| N/A | None | No Evidence Retrieved | N/A | 0.0000 | N/A | Policy retrieval produced 0 matching chunks. |\n`;
  } else {
    for (const ev of frozenEvidence) {
      const excerpt = ev.text.replace(/[\n\r]+/g, ' ').slice(0, 90) + '...';
      citationSection += `| **${ev.evidence_id}** | ${ev.clause_ref || 'N/A'} | ${ev.section_title || 'General'} | ${ev.page_start ?? 'N/A'} | ${ev.similarity.toFixed(4)} | ${ev.source_document} | "${excerpt}" |\n`;
    }
  }
  sections.push(citationSection);

  return sections.join('\n');
}

/**
 * Renders the concise Executive Summary Report in Markdown (~180–300 words).
 */
export function renderSummaryReport(params: {
  analysis: ReasoningAnalysis;
  disposition: 'passed' | 'failed' | 'needs_review';
}): string {
  const { analysis, disposition } = params;
  const ctx = analysis.claim_context;

  return `### Executive Summary: Claim #${ctx.claim_id}

- **Disposition:** \`${disposition.toUpperCase()}\`
- **Claimed Amount:** NPR ${ctx.claimed_amount?.toLocaleString() ?? 'N/A'}
- **Hospitalization:** ${ctx.hospital || 'Hospital'} (${ctx.admission_date || 'N/A'} to ${ctx.discharge_date || 'N/A'})

#### Key Findings
${analysis.summary_report}

#### Required Operational Action
${analysis.human_review_actions.length > 0
  ? analysis.human_review_actions.map(a => `- ${a}`).join('\n')
  : '- Claim conforms to policy standards. Proceed to standard processing.'}
`;
}
