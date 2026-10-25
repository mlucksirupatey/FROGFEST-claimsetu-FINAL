// nextjs/tests/09_reasoning_e2e.test.mjs
// Test 10 from CLAIM_REASONING_AGENT.md Section 17:
// Live End-to-End Integration test:
// Real claim facts + live HIPML evaluation + live RAG evidence retrieval + live Gemini reasoning + report rendering.
// Also tests /api/claims/:id/reason dry-run vs persistence modes.

import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('.env.local') });

import { query, pool } from '../lib/db.ts';
import { runReasoningEngine } from '../lib/reasoning/engine.ts';
import { getAuthCookie } from './helpers/auth_helper.mjs';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
let authCookie;

after(async () => {
  await pool.end().catch(() => {});
});

before(async () => {
  // Ensure Claim 1 has valid structured data and policy associated
  const claim = await query('SELECT id, policy_id, structured_data FROM claims WHERE id = 1');
  if (claim.rowCount === 0) {
    throw new Error('Claim #1 not found in database. Please run pipeline first.');
  }
  authCookie = await getAuthCookie();
});

test('Test 10A — runReasoningEngine: live end-to-end execution with real RAG & Gemini', async () => {
  console.log('Running live reasoning engine on Claim #1...');
  const startTime = Date.now();

  const result = await runReasoningEngine(1, { dryRun: true });
  const duration = Date.now() - startTime;
  console.log(`Reasoning completed in ${duration}ms with disposition: ${result.disposition}`);

  // Assertions on structured result
  assert.equal(result.success, true);
  assert.equal(result.claimId, 1);
  assert.ok(result.disposition, 'Disposition must be computed');
  assert.ok(result.structured_analysis, 'Structured analysis must exist');
  assert.ok(typeof result.structured_analysis.analysis_status === 'string' && result.structured_analysis.analysis_status.length > 0);

  // Assertions on evidence and citation grounding
  assert.ok(result.frozen_evidence.length > 0, 'Should have frozen evidence chunks from RAG');
  for (const ev of result.frozen_evidence) {
    assert.ok(ev.evidence_id.startsWith('E'), 'Evidence ID must follow E# format');
    assert.ok(ev.chunk_id !== undefined, 'Chunk ID must be preserved');
    assert.ok(ev.text && ev.text.length > 0, 'Evidence chunk text must exist');
  }

  // Assertions on rendered reports
  assert.ok(result.full_report_markdown.includes('## 1. Executive Assessment'));
  assert.ok(result.full_report_markdown.includes('## 9. Evidence & Citations Audit Trail'));
  assert.ok(result.summary_report_markdown.includes('### Executive Summary'));

  console.log(`Full report word count approx: ${result.full_report_markdown.split(/\s+/).length} words`);
  console.log(`Summary report word count approx: ${result.summary_report_markdown.split(/\s+/).length} words`);
});

test('Test 10B — POST /api/claims/1/reason: API endpoint dry_run vs persistence', async () => {
  // 1. Dry run = true: executes pipeline, does not update DB
  console.log(`Calling POST ${BASE_URL}/api/claims/1/reason?dry_run=true ...`);
  const dryRes = await fetch(`${BASE_URL}/api/claims/1/reason?dry_run=true`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: authCookie,
    },
  });

  assert.equal(dryRes.status, 200);
  const dryJson = await dryRes.json();
  assert.equal(dryJson.success, true);
  assert.equal(dryJson.dryRun, true);
  assert.equal(dryJson.persisted, false);

  // 2. Dry run = false: executes pipeline and persists reasoning_result to DB
  console.log(`Calling POST ${BASE_URL}/api/claims/1/reason?dry_run=false ...`);
  const persistRes = await fetch(`${BASE_URL}/api/claims/1/reason?dry_run=false`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: authCookie,
    },
  });

  assert.equal(persistRes.status, 200);
  const persistJson = await persistRes.json();
  assert.equal(persistJson.success, true);
  assert.equal(persistJson.dryRun, false);
  assert.equal(persistJson.persisted, true);

  // 3. Verify in PostgreSQL that reasoning_result column is populated
  const dbCheck = await query('SELECT status, reasoning_result FROM claims WHERE id = 1');
  assert.ok(dbCheck.rows[0].reasoning_result, 'reasoning_result must be saved in database');
  assert.ok(dbCheck.rows[0].reasoning_result.structured_analysis, 'structured_analysis must be persisted');
  assert.ok(dbCheck.rows[0].reasoning_result.full_report, 'full_report must be persisted');

  console.log(`DB updated: claim status is now "${dbCheck.rows[0].status}"`);
});
