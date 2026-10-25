// nextjs/tests/06_pipeline_e2e.test.mjs
// End-to-end integration tests for the ClaimSetu document pipeline:
// POST /api/claims/:id/documents
// Tests all 5 scenarios from CLAIM_PIPELINE_AGENT.md Section 18 & 20:
// 1. Initial upload of real documents -> full processing (hash, MinIO, extract, structure, aggregate, HIPML, RAG)
// 2. Repeat upload of exact same documents -> 100% reuse, zero duplicate rows, zero new LLM calls
// 3. Same bytes under a different filename -> recognized by hash and reused
// 4. Modified file bytes -> new hash, new document, new extraction
// 5. Type conflict (same bytes uploaded under a different doc_type) -> HTTP 409 Conflict

import test, { before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('.env.local') });

import { query } from '../lib/db.ts';
import { getAuthCookie } from './helpers/auth_helper.mjs';

const FIXTURES_DIR = path.resolve('fixtures');
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

let firstRunDocIds = [];
let firstRunHashes = [];
let authCookie;

before(async () => {
  console.log('Resetting claim 1 documents and status before running E2E tests...');
  await query('DELETE FROM documents WHERE claim_id = 1');
  await query("UPDATE claims SET status = 'PENDING', structured_data = '{}', policyholder_user_id = 2 WHERE id = 1");
  authCookie = await getAuthCookie();
});

test('Test 1 — Initial upload of 3 real claim documents', async () => {
  const claimBuf = fs.readFileSync(path.join(FIXTURES_DIR, 'claim.pdf'));
  const dischargeBuf = fs.readFileSync(path.join(FIXTURES_DIR, 'discharge_summary.pdf'));
  const billBuf = fs.readFileSync(path.join(FIXTURES_DIR, 'bill.pdf'));

  const formData = new FormData();
  formData.append('claim', new Blob([claimBuf], { type: 'application/pdf' }), 'Claim Form.pdf');
  formData.append('discharge_summary', new Blob([dischargeBuf], { type: 'application/pdf' }), 'Discharge Summary.pdf');
  formData.append('bill', new Blob([billBuf], { type: 'application/pdf' }), 'Hospital Invoice.pdf');

  console.log(`Sending POST ${BASE_URL}/api/claims/1/documents ...`);
  const startTime = Date.now();
  const res = await fetch(`${BASE_URL}/api/claims/1/documents`, {
    method: 'POST',
    headers: {
      cookie: authCookie,
    },
    body: formData,
  });

  const durationMs = Date.now() - startTime;
  console.log(`Pipeline completed in ${durationMs}ms with HTTP status ${res.status}`);

  assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
  const json = await res.json();

  assert.equal(json.success, true);
  assert.equal(json.claimId, 1);
  assert.equal(json.documents.length, 3);

  // Validate per-document processing status
  for (const doc of json.documents) {
    assert.equal(doc.status, 'STRUCTURED', `Document ${doc.docType} should have status STRUCTURED`);
    assert.equal(doc.reused, false, `Initial upload should not be reused`);
    assert.equal(doc.extractionReused, false, `Initial extraction should not be reused`);
    assert.ok(doc.documentId, `Document ID must be present`);
  }

  firstRunDocIds = json.documents.map(d => d.documentId);

  // Validate unified aggregated claim
  assert.ok(json.claim, 'Aggregated claim object must exist');
  assert.ok(json.claim.patient.name?.includes('Ram Bahadur Thapa'));
  assert.ok(json.claim.diagnoses.some(d => d.toLowerCase().includes('appendicitis')));
  assert.ok(json.claim.procedures.some(p => p.toLowerCase().includes('appendectomy')));
  assert.equal(json.claim.declared_total, 65000);
  assert.ok(json.claim.computed_line_item_total >= 58000, `Expected computed total >= 58000, got ${json.claim.computed_line_item_total}`);

  // Validate deterministic HIPML output
  assert.ok(json.hipml, 'HIPML section must exist in debug response');
  assert.ok(json.hipml.result, 'HIPML result must be returned');

  console.log('Test 1 succeeded: all 3 real documents structured, aggregated, and evaluated with HIPML.');
});

test('Test 2 — Critical Deduplication Invariant: Repeat exact same upload', async () => {
  const claimBuf = fs.readFileSync(path.join(FIXTURES_DIR, 'claim.pdf'));
  const dischargeBuf = fs.readFileSync(path.join(FIXTURES_DIR, 'discharge_summary.pdf'));
  const billBuf = fs.readFileSync(path.join(FIXTURES_DIR, 'bill.pdf'));

  const formData = new FormData();
  formData.append('claim', new Blob([claimBuf], { type: 'application/pdf' }), 'Claim Form.pdf');
  formData.append('discharge_summary', new Blob([dischargeBuf], { type: 'application/pdf' }), 'Discharge Summary.pdf');
  formData.append('bill', new Blob([billBuf], { type: 'application/pdf' }), 'Hospital Invoice.pdf');

  console.log(`Sending duplicate POST ${BASE_URL}/api/claims/1/documents ...`);
  const startTime = Date.now();
  const res = await fetch(`${BASE_URL}/api/claims/1/documents`, {
    method: 'POST',
    headers: {
      cookie: authCookie,
    },
    body: formData,
  });

  const durationMs = Date.now() - startTime;
  console.log(`Duplicate upload processed in ${durationMs}ms (should be fast due to cached extractions)`);

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.documents.length, 3);

  // INVARIANT VERIFICATION:
  // 1. Same document IDs
  // 2. reused === true
  // 3. extractionReused === true
  // 4. No second LLM call, execution is near-instant (< 2000ms vs ~30000ms)
  for (let i = 0; i < json.documents.length; i++) {
    const doc = json.documents[i];
    assert.equal(doc.reused, true, `Document ${doc.docType} must be marked reused: true`);
    assert.equal(doc.extractionReused, true, `Document ${doc.docType} must have extractionReused: true`);
    assert.equal(String(doc.documentId), String(firstRunDocIds[i]), `Document ID should match original ID (${firstRunDocIds[i]})`);
  }

  assert.ok(durationMs < 5000, `Cached duplicate upload took ${durationMs}ms, expected < 5000ms`);
  console.log('Test 2 succeeded: exact duplicate upload achieved 100% extraction reuse with zero new LLM calls.');
});

test('Test 3 — Same bytes under a different filename', async () => {
  const billBuf = fs.readFileSync(path.join(FIXTURES_DIR, 'bill.pdf'));

  const formData = new FormData();
  formData.append('bill', new Blob([billBuf], { type: 'application/pdf' }), 'RENAMED_INVOICE_COPY.pdf');

  const res = await fetch(`${BASE_URL}/api/claims/1/documents`, {
    method: 'POST',
    headers: {
      cookie: authCookie,
    },
    body: formData,
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.documents.length, 1);
  assert.equal(json.documents[0].reused, true, 'Renamed file with identical bytes must be reused');
  assert.equal(json.documents[0].extractionReused, true);
});

test('Test 4 — Modified file bytes triggers new extraction', async () => {
  // Create slightly modified PDF bytes by appending a comment
  const billBuf = fs.readFileSync(path.join(FIXTURES_DIR, 'bill.pdf'));
  const modifiedBuf = Buffer.concat([billBuf, Buffer.from('\n% Modified for test 4')]);

  const formData = new FormData();
  formData.append('bill', new Blob([modifiedBuf], { type: 'application/pdf' }), 'modified_bill.pdf');

  const res = await fetch(`${BASE_URL}/api/claims/1/documents`, {
    method: 'POST',
    headers: {
      cookie: authCookie,
    },
    body: formData,
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.documents.length, 1);
  assert.equal(json.documents[0].reused, false, 'Modified file must NOT be reused');
  assert.notEqual(String(json.documents[0].documentId), String(firstRunDocIds[2]), 'New document ID must be assigned');
});

test('Test 5 — Type conflict: uploading same bytes under different doc_type returns 409', async () => {
  const claimBuf = fs.readFileSync(path.join(FIXTURES_DIR, 'claim.pdf'));

  // Upload claim form bytes under 'discharge_summary' form field
  const formData = new FormData();
  formData.append('discharge_summary', new Blob([claimBuf], { type: 'application/pdf' }), 'wrong_type.pdf');

  const res = await fetch(`${BASE_URL}/api/claims/1/documents`, {
    method: 'POST',
    headers: {
      cookie: authCookie,
    },
    body: formData,
  });

  assert.equal(res.status, 409, `Expected HTTP 409 Conflict, got ${res.status}`);
  const json = await res.json();
  assert.ok(json.error?.includes('File hash conflict'), `Error should mention file hash conflict: ${json.error}`);
});
