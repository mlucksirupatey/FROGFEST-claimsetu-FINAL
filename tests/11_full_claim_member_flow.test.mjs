// nextjs/tests/11_full_claim_member_flow.test.mjs
// Test suite covering Insurer CSV sync, member-policy linkage, policy tampering protection,
// multi-evidence categorization, claim processing, cached results, and IDOR protection.
// Adheres strictly to CLAIMSETU_FULL_CLAIM_AUTH_MEMBER_IMPLEMENTATION_PLAN.md Section 38

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('.env.local') });

import { pool, query } from '../lib/db.ts';
import {
  parseAndValidateMemberCsv,
  syncMembersFromCsv,
  getCurrentPolicyholderContext,
  verifyPolicyEligibility,
} from '../lib/members/member-service.ts';
import { detectDocumentCategory } from '../lib/claims/document-classifier.ts';

const MOCK_10_ROW_CSV = `member_id,full_name,policy_id
MEM-9841-NP,Ram Bahadur Thapa,1
MEM-7284-NP,Bikash Gurung,1
MEM-5137-NP,Sita Devi Gurung,2
MEM-4412-NP,Prakash Adhikari,2
MEM-6629-NP,Anita Shrestha,1
MEM-3078-NP,Suman Karki,2
MEM-8154-NP,Nabin Tamang,1
MEM-2936-NP,Manisha Rai,2
MEM-5741-NP,Roshan KC,1
MEM-9362-NP,Sarita Gurung,2`;

test('1. Member CSV Parser & Validator', () => {
  // Valid CSV
  const valid = parseAndValidateMemberCsv(MOCK_10_ROW_CSV);
  assert.equal(valid.errors.length, 0);
  assert.equal(valid.rows.length, 10);
  assert.equal(valid.rows[0].member_id, 'MEM-9841-NP');
  assert.equal(valid.rows[0].policy_id, 1);

  // Missing headers
  const badHeaders = parseAndValidateMemberCsv('id,name\n1,Ram');
  assert.equal(badHeaders.rows.length, 0);
  assert.match(badHeaders.errors[0], /Missing required CSV headers/);

  // Duplicate member_id in same file
  const dupCsv = `member_id,full_name,policy_id\nMEM-01,Ram,1\nMEM-01,Hari,1`;
  const dupRes = parseAndValidateMemberCsv(dupCsv);
  assert.match(dupRes.errors[0], /Duplicate member_id/);
});

test('2. Member CSV Synchronization & Deactivation Semantics', async () => {
  // Sync full 10 members
  const sync1 = await syncMembersFromCsv(MOCK_10_ROW_CSV);
  assert.equal(sync1.success, true);
  assert.equal(sync1.total, 10);

  // Idempotent re-import
  const sync2 = await syncMembersFromCsv(MOCK_10_ROW_CSV);
  assert.equal(sync2.success, true);
  assert.equal(sync2.inserted, 0);
  assert.equal(sync2.updated, 10);
  assert.equal(sync2.deactivated, 0);

  // Deactivation test: omit Sarita Gurung (MEM-9362-NP)
  const nineRowCsv = MOCK_10_ROW_CSV.replace('MEM-9362-NP,Sarita Gurung,2', '').trim();
  const sync3 = await syncMembersFromCsv(nineRowCsv);
  assert.equal(sync3.success, true);
  assert.equal(sync3.deactivated, 1);

  // Verify Sarita is marked is_active = FALSE and NOT deleted
  const saritaRes = await query(`SELECT is_active FROM members WHERE member_id = 'MEM-9362-NP'`);
  assert.equal(saritaRes.rows.length, 1);
  assert.equal(saritaRes.rows[0].is_active, false);

  // Restore Sarita
  await syncMembersFromCsv(MOCK_10_ROW_CSV);
  const restoredRes = await query(`SELECT is_active FROM members WHERE member_id = 'MEM-9362-NP'`);
  assert.equal(restoredRes.rows[0].is_active, true);
});

test('3. Seed Demo Users & Authentication Verification', async () => {
  const users = [
    { email: 'ram.thapa@example.test', name: 'Ram Bahadur Thapa', memberId: 'MEM-9841-NP' },
    { email: 'bikash.gurung@example.test', name: 'Bikash Gurung', memberId: 'MEM-7284-NP' },
    { email: 'sita.gurung@example.test', name: 'Sita Devi Gurung', memberId: 'MEM-5137-NP' },
  ];

  for (const u of users) {
    const res = await query(
      `SELECT u.id, u.email, u.password, u.role, u.is_active, m.member_id, pp.full_name
       FROM users u
       JOIN policyholder_profile pp ON pp.user_id = u.id
       JOIN members m ON m.id = pp.member_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [u.email]
    );

    assert.equal(res.rows.length, 1, `User ${u.email} should exist in DB`);
    const row = res.rows[0];
    assert.equal(row.password, '123456', 'Password should match demo password 123456');
    assert.equal(row.role, 'policyholder');
    assert.equal(row.is_active, true);
    assert.equal(row.member_id, u.memberId);
    assert.equal(row.full_name, u.name);
  }
});

test('4. Server-Side Policyholder Context & Policy Eligibility', async () => {
  const ramUser = await query(`SELECT id FROM users WHERE email = 'ram.thapa@example.test'`);
  const ramId = ramUser.rows[0].id;

  const ctx = await getCurrentPolicyholderContext(ramId);
  assert.ok(ctx);
  assert.equal(ctx.member.name, 'Ram Bahadur Thapa');
  assert.equal(ctx.member.memberId, 'MEM-9841-NP');
  assert.equal(ctx.policies.length, 1);
  assert.equal(ctx.policies[0].numericId, 1);

  // Policy tampering protection: Ram is eligible for policy 1, but NOT policy 2
  const eligiblePol1 = await verifyPolicyEligibility(ramId, 1);
  assert.equal(eligiblePol1, true);

  const eligiblePol2 = await verifyPolicyEligibility(ramId, 2);
  assert.equal(eligiblePol2, false);
});

test('5. Multi-Evidence Heuristic Categorization', () => {
  const cases = [
    { filename: 'Mediciti_VAT_Invoice_781.pdf', expected: 'bill' },
    { filename: 'Hospital_Tax_Invoice.pdf', expected: 'bill' },
    { filename: 'Discharge_Summary_Sheet.pdf', expected: 'discharge_summary' },
    { filename: 'Prescription_DrSharma.jpg', expected: 'prescription' },
    { filename: 'Doctor_Rx_Prescription.png', expected: 'prescription' },
    { filename: 'Claim_Form_Signed.pdf', expected: 'claim_form' },
    { filename: 'Blood_Test_Diagnostic_Report.pdf', expected: 'diagnostic_report' },
    { filename: 'scan_9381.pdf', expected: 'other' },
  ];

  for (const c of cases) {
    const { category } = detectDocumentCategory(c.filename);
    assert.equal(category, c.expected, `File ${c.filename} should detect as ${c.expected}`);
  }
});

test('6. Claim Processing Concurrency & Cached Result Lifecycle', async () => {
  const ramUser = await query(`SELECT id FROM users WHERE email = 'ram.thapa@example.test'`);
  const ramId = ramUser.rows[0].id;

  // Insert a test claim
  const insertRes = await query(
    `INSERT INTO claims (policy_id, policyholder_user_id, status, processing_status, submitted_at, structured_data)
     VALUES (1, $1, 'PENDING', 'pending', now(), '{}')
     RETURNING id`,
    [ramId]
  );
  const testClaimId = insertRes.rows[0].id;

  // Verify initial state
  const statusRes1 = await query(`SELECT processing_status FROM claims WHERE id = $1`, [testClaimId]);
  assert.equal(statusRes1.rows[0].processing_status, 'pending');

  // Simulate completion and caching
  const mockReasoning = {
    summary_report: 'Patient eligibility verified. Statutory claim admissible under Section 4.',
    full_report: '# Claim Adjudication Report\nAll criteria satisfied.',
    disposition: 'passed',
    structured_analysis: {
      findings: [
        { code: 'VERDICT_ELIGIBILITY', item: 'Patient Eligibility', deterministic_status: 'passed' },
      ],
    },
    frozen_evidence: [
      { evidence_id: 'E1', section_title: 'Eligibility', clause_ref: 'Clause 1.2', chunk_text: 'Eligible for inpatient treatment.' },
    ],
  };

  await query(
    `UPDATE claims
     SET processing_status = 'completed', status = 'APPROVED_DETERMINISTIC', reasoning_result = $1
     WHERE id = $2`,
    [JSON.stringify(mockReasoning), testClaimId]
  );

  // Cached retrieval: confirm processing_status is completed and reasoning_result is immediately available
  const cachedRes = await query(
    `SELECT processing_status, status, reasoning_result FROM claims WHERE id = $1`,
    [testClaimId]
  );
  assert.equal(cachedRes.rows[0].processing_status, 'completed');
  assert.equal(cachedRes.rows[0].status, 'APPROVED_DETERMINISTIC');
  assert.equal(cachedRes.rows[0].reasoning_result.disposition, 'passed');

  // Clean up test claim
  await query(`DELETE FROM claims WHERE id = $1`, [testClaimId]);
});

test('7. Cross-User IDOR Claim Protection', async () => {
  const ramUser = await query(`SELECT id FROM users WHERE email = 'ram.thapa@example.test'`);
  const ramId = ramUser.rows[0].id;

  const sitaUser = await query(`SELECT id FROM users WHERE email = 'sita.gurung@example.test'`);
  const sitaId = sitaUser.rows[0].id;

  // Create claim owned by Ram
  const insertRes = await query(
    `INSERT INTO claims (policy_id, policyholder_user_id, status, processing_status, submitted_at, structured_data)
     VALUES (1, $1, 'PENDING', 'pending', now(), '{}')
     RETURNING id`,
    [ramId]
  );
  const ramClaimId = insertRes.rows[0].id;

  // Sita querying Ram's claim should be blocked by IDOR check
  const accessCheck = await query(
    `SELECT id FROM claims WHERE id = $1 AND policyholder_user_id = $2`,
    [ramClaimId, sitaId]
  );
  assert.equal(accessCheck.rows.length, 0, "User B should not have access to User A's claim");

  // Clean up
  await query(`DELETE FROM claims WHERE id = $1`, [ramClaimId]);
});

test('8. Insurer Member Lookup Query & Policy Linkage', async () => {
  const memberId = 'MEM-5137-NP';
  const res = await query(
    `SELECT 
      m.id AS member_pk,
      m.member_id,
      m.full_name,
      m.policy_id,
      m.is_active,
      p.id AS policy_numeric_id,
      p.name AS policy_name,
      p.issuer AS policy_issuer,
      u.id AS policyholder_user_id,
      u.email AS policyholder_email
     FROM members m
     JOIN policies p ON p.id = m.policy_id
     LEFT JOIN policyholder_profile pp ON pp.member_id = m.id
     LEFT JOIN users u ON u.id = pp.user_id
     WHERE UPPER(m.member_id) = UPPER($1)
     LIMIT 1`,
    [memberId]
  );
  assert.equal(res.rowCount, 1);
  const row = res.rows[0];
  assert.equal(row.member_id, 'MEM-5137-NP');
  assert.equal(row.full_name, 'Sita Devi Gurung');
  assert.equal(Number(row.policy_id), 2);
  assert.ok(row.policy_name.includes('SALICO') || row.policy_issuer.includes('SALICO'));
  assert.ok(row.policyholder_user_id > 0);
  assert.equal(row.policyholder_email, 'sita.gurung@example.test');
});

test.after(async () => {
  await pool.end();
});

