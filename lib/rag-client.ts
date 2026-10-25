// lib/rag-client.ts
// HTTP client for the standalone RAG service (rag_demo_claim_setu).
// This module calls the RAG service over HTTP — it does NOT embed retrieval logic
// inside Next.js.

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:4100';

export interface RagFlaggedItem {
  code: string;
  item: string;
  claimFact: string;
}

export interface RagEvidenceChunk {
  query: string;
  chunkId: number;
  clauseRef: string | null;
  sectionTitle: string | null;
  pageStart: number | null;
  pageEnd: number | null;
  cosineSimilarity: number;
  chunkText: string;
}

export interface RagQueryResult {
  finding: RagFlaggedItem;
  evidence: RagEvidenceChunk[];
}

export interface RagQueryResponse {
  results: RagQueryResult[];
}

/**
 * Query the RAG service for policy evidence matching the given findings.
 */
export async function queryRagEvidence(params: {
  policyId: number;
  flaggedItems: RagFlaggedItem[];
  topK?: number;
}): Promise<RagQueryResponse> {
  const { policyId, flaggedItems, topK = 3 } = params;

  const res = await fetch(`${RAG_SERVICE_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      policy_id: policyId,
      flagged_items: flaggedItems,
      top_k: topK,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`RAG service error (${res.status}): ${body}`);
  }

  return res.json() as Promise<RagQueryResponse>;
}

/**
 * Check RAG service health.
 */
export async function checkRagHealth(): Promise<{ status: string; db?: any }> {
  const res = await fetch(`${RAG_SERVICE_URL}/health`);
  if (!res.ok) {
    throw new Error(`RAG service unhealthy (${res.status})`);
  }
  return res.json();
}
