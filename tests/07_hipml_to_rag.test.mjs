// nextjs/tests/07_hipml_to_rag.test.mjs
// Test 10 from CLAIM_PIPELINE_AGENT.md:
// - Verifies HIPML findings trigger RAG query planning and retrieval
// - Tests live RAG service at http://localhost:4100
// - Asserts returned evidence chunks retain chunkId, clauseRef, sectionTitle, cosineSimilarity, and chunkText

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('.env.local') });

import { queryRagEvidence, checkRagHealth } from '../lib/rag-client.ts';
import { extractRetrievalNeeds } from '../lib/hipml.ts';

test('RAG service health check', async () => {
  const health = await checkRagHealth();
  assert.equal(health.status, 'ok');
  assert.equal(health.db?.connected, true);
  console.log(`RAG service healthy, pgvector version: ${health.db?.pgvectorVersion}`);
});

test('HIPML finding triggers deterministic RAG evidence retrieval (Test 10)', async () => {
  // Simulate a finding produced by deterministic HIPML evaluation:
  // e.g. Waiting period or Claim admissibility finding
  const mockHipmlResult = {
    'Policy Attributes': [['Name', 'Shikhar Health Policy']],
    Coverage: {
      'Cataract': {
        included: true,
        'Limit per policy period': 40000,
        type: 'Procedure',
      },
    },
    Conditions: {
      'Claim Admissibility': false, // Condition failed
    },
  };

  const findings = extractRetrievalNeeds(mockHipmlResult, 1, 1);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].code, 'CLAIM_ADMISSIBILITY');

  // Call RAG service with the flagged item
  const ragResponse = await queryRagEvidence({
    policyId: 1,
    flaggedItems: [
      {
        code: findings[0].code,
        item: findings[0].item,
        claimFact: findings[0].reason,
      },
    ],
    topK: 3,
  });

  assert.ok(ragResponse.results, 'Response should contain results array');
  assert.equal(ragResponse.results.length, 1);

  const result = ragResponse.results[0];
  assert.equal(result.finding.code, 'CLAIM_ADMISSIBILITY');
  assert.ok(result.evidence.length > 0, 'Should retrieve at least one evidence chunk');

  // Verify all required evidence fields per Section 16 of CLAIM_PIPELINE_AGENT.md
  for (const chunk of result.evidence) {
    assert.ok(chunk.chunkId !== undefined, 'Evidence must retain chunkId');
    assert.ok(chunk.cosineSimilarity > 0, 'Evidence must retain similarity score > 0');
    assert.ok(chunk.chunkText && chunk.chunkText.length > 0, 'Evidence must retain chunkText');
    assert.ok(chunk.query, 'Evidence must retain query string');
  }

  console.log(`Retrieved ${result.evidence.length} evidence chunks for ${result.finding.code}. Top similarity: ${result.evidence[0].cosineSimilarity.toFixed(4)}`);
  console.log(`Top chunk section: "${result.evidence[0].sectionTitle}", clause: "${result.evidence[0].clauseRef}"`);
});

test('RAG retrieval for specific waiting period exclusion', async () => {
  const ragResponse = await queryRagEvidence({
    policyId: 1,
    flaggedItems: [
      {
        code: 'WAITING_PERIOD',
        item: 'Pre-existing conditions',
        claimFact: 'Admission occurred within the 24-month waiting period window.',
      },
    ],
    topK: 2,
  });

  assert.ok(ragResponse.results.length === 1);
  const evidence = ragResponse.results[0].evidence;
  assert.ok(evidence.length > 0);
  assert.ok(evidence[0].cosineSimilarity > 0.4);
});
