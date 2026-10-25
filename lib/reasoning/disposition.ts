// lib/reasoning/disposition.ts
// Application-controlled final disposition calculation.
// Invariant: The LLM is an explainability layer and CANNOT override deterministic failures.

import type { ReasoningFinding, FrozenEvidence } from './types.ts';

interface DeterministicInput {
  hasDeterministicFailure: boolean;
  hasDeterministicReviewNeed: boolean;
  findings: Array<{ code: string; deterministic_status?: string }>;
}

/**
 * Computes the authoritative claim disposition.
 *
 * Rules:
 * 1. If any deterministic finding is FAILED -> "failed".
 * 2. If deterministic evaluation requires review, or RAG returned 0 evidence,
 *    or LLM identifies unresolved material ambiguity -> "needs_review".
 * 3. Only if deterministic rules passed AND evidence is sufficient -> "passed".
 * 4. LLM verdict CANNOT override a deterministic failure.
 */
export function computeFinalDisposition(params: {
  deterministicState: DeterministicInput;
  llmFindings: ReasoningFinding[];
  frozenEvidence: FrozenEvidence[];
  llmDispositionSuggestion?: string;
}): 'passed' | 'failed' | 'needs_review' {
  const { deterministicState, llmFindings, frozenEvidence } = params;

  // Invariant 1: If any deterministic condition failed, the disposition MUST be failed
  if (deterministicState.hasDeterministicFailure) {
    return 'failed';
  }

  // Also check if any finding in the list has status failed
  const anyFindingFailed = deterministicState.findings.some(
    f => f.deterministic_status?.toLowerCase() === 'failed'
  ) || llmFindings.some(
    f => f.deterministic_status?.toLowerCase() === 'failed'
  );

  if (anyFindingFailed) {
    return 'failed';
  }

  // Invariant 2: If there are flagged items requiring retrieval, but zero evidence was retrieved
  if (deterministicState.hasDeterministicReviewNeed && frozenEvidence.length === 0) {
    return 'needs_review';
  }

  // Invariant 3: Check for material ambiguity or insufficient evidence in findings
  const hasUnresolvedIssues = llmFindings.some(
    f => f.review_required ||
         f.assessment === 'ambiguous' ||
         f.assessment === 'insufficient_evidence' ||
         f.assessment === 'contradicted'
  );

  if (hasUnresolvedIssues || deterministicState.hasDeterministicReviewNeed) {
    return 'needs_review';
  }

  return 'passed';
}
