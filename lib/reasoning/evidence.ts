// lib/reasoning/evidence.ts
// Evidence freezing, closed-namespace ID assignment (E1, E2, ...),
// citation validation, and quote verification.

import type { RagQueryResponse } from '../rag-client.ts';
import type {
  FrozenEvidence,
  ReasoningAnalysis,
  ReasoningFinding,
  CitationDetail,
} from './types.ts';

const MAX_FROZEN_EVIDENCE_COUNT = 15;

/**
 * Freezes RAG query results into an immutable, deduplicated evidence list
 * with closed-namespace identifiers E1, E2, E3...
 */
export function freezeEvidence(
  ragResponse: RagQueryResponse | null | undefined,
  defaultDocumentName = 'policy.pdf'
): FrozenEvidence[] {
  if (!ragResponse || !ragResponse.results || ragResponse.results.length === 0) {
    return [];
  }

  const seenChunkIds = new Set<number>();
  const frozen: FrozenEvidence[] = [];

  for (const group of ragResponse.results) {
    for (const chunk of group.evidence) {
      if (seenChunkIds.has(chunk.chunkId)) {
        continue;
      }
      seenChunkIds.add(chunk.chunkId);

      const evidenceId = `E${frozen.length + 1}`;
      frozen.push({
        evidence_id: evidenceId,
        chunk_id: chunk.chunkId,
        clause_ref: chunk.clauseRef ?? null,
        section_title: chunk.sectionTitle ?? null,
        page_start: chunk.pageStart ?? null,
        page_end: chunk.pageEnd ?? null,
        source_document: defaultDocumentName,
        similarity: chunk.cosineSimilarity ?? 0,
        text: chunk.chunkText,
        query: chunk.query,
      });

      if (frozen.length >= MAX_FROZEN_EVIDENCE_COUNT) {
        break;
      }
    }
    if (frozen.length >= MAX_FROZEN_EVIDENCE_COUNT) {
      break;
    }
  }

  return frozen;
}

/**
 * Builds a citation lookup dictionary keyed by E1, E2...
 */
export function buildCitationMap(
  frozenEvidence: FrozenEvidence[]
): Record<string, CitationDetail> {
  const map: Record<string, CitationDetail> = {};
  for (const ev of frozenEvidence) {
    map[ev.evidence_id] = {
      chunk_id: ev.chunk_id,
      clause_ref: ev.clause_ref,
      section_title: ev.section_title,
      page_start: ev.page_start,
      page_end: ev.page_end,
      source_document: ev.source_document,
      similarity: ev.similarity,
    };
  }
  return map;
}

/**
 * Validates that all evidence_refs emitted by the LLM belong to the closed frozen evidence set.
 * Removes/flags unknown references to guarantee zero hallucinated citations.
 */
export function validateCitations(
  analysis: ReasoningAnalysis,
  frozenEvidence: FrozenEvidence[]
): { valid: boolean; invalidRefs: string[] } {
  const validIds = new Set(frozenEvidence.map(e => e.evidence_id));
  const invalidRefs: string[] = [];

  // 1. Findings
  for (const finding of analysis.findings) {
    const cleanedRefs: string[] = [];
    for (const ref of finding.evidence_refs || []) {
      if (validIds.has(ref)) {
        cleanedRefs.push(ref);
      } else {
        invalidRefs.push(ref);
      }
    }
    finding.evidence_refs = cleanedRefs;
  }

  // 2. Cross-document analysis
  for (const item of analysis.cross_document_analysis || []) {
    const cleanedRefs: string[] = [];
    for (const ref of item.evidence_refs || []) {
      if (validIds.has(ref)) {
        cleanedRefs.push(ref);
      } else {
        invalidRefs.push(ref);
      }
    }
    item.evidence_refs = cleanedRefs;
  }

  // 3. Financial impact
  for (const item of analysis.financial_impact || []) {
    const cleanedRefs: string[] = [];
    for (const ref of item.evidence_refs || []) {
      if (validIds.has(ref)) {
        cleanedRefs.push(ref);
      } else {
        invalidRefs.push(ref);
      }
    }
    item.evidence_refs = cleanedRefs;
  }

  return {
    valid: invalidRefs.length === 0,
    invalidRefs,
  };
}

/**
 * Validates that model-supplied quotes are exact substrings of referenced evidence text.
 * If not an exact match, replaces with deterministic excerpt from the first referenced evidence chunk,
 * preserving the valid citation.
 */
export function validateQuotes(
  findings: ReasoningFinding[],
  frozenEvidence: FrozenEvidence[]
): void {
  const evidenceMap = new Map(frozenEvidence.map(e => [e.evidence_id, e]));

  for (const finding of findings) {
    if (!finding.quote || finding.quote.trim() === '') {
      continue;
    }

    const firstRef = finding.evidence_refs?.[0];
    const evidence = firstRef ? evidenceMap.get(firstRef) : undefined;

    if (!evidence) {
      finding.quote = null;
      continue;
    }

    // Check if the quote is a verbatim substring
    const normalizedEvidence = evidence.text.toLowerCase().replace(/\s+/g, ' ');
    const normalizedQuote = finding.quote.toLowerCase().replace(/\s+/g, ' ').trim();

    if (!normalizedEvidence.includes(normalizedQuote)) {
      // Not a verbatim match: replace with deterministic short excerpt from source chunk
      const cleanSource = evidence.text.trim();
      const excerpt = cleanSource.length > 120 ? `${cleanSource.slice(0, 117)}...` : cleanSource;
      finding.quote = `[Excerpt]: ${excerpt}`;
    }
  }
}
