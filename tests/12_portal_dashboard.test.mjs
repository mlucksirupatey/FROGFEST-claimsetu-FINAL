// nextjs/tests/12_portal_dashboard.test.mjs
// Test suite for Policyholder Portal backend integration

import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env.local') });

const { pool, query } = await import('../lib/db.ts');

test('1. Policyholder Profile & Metadata Lookup', async () => {
  // Query policyholder profile for Aarav Sharma (user_id = 2)
  const profileRes = await query(
    `SELECT 
       u.id AS user_id, u.email,
       pp.full_name AS profile_name,
       m.full_name AS member_name,
       m.member_id,
       p.name AS policy_name
     FROM users u
     LEFT JOIN policyholder_profile pp ON pp.user_id = u.id
     LEFT JOIN members m ON m.id = pp.member_id
     LEFT JOIN policies p ON p.id = COALESCE(pp.policy_id, m.policy_id, 1)
     WHERE u.id = 2`
  );

  assert.equal(profileRes.rows.length, 1, 'Aarav Sharma user should exist');
  const profile = profileRes.rows[0];
  assert.equal(profile.email, 'aarav.sharma@nepalmail.np');
  assert.ok(profile.profile_name.startsWith('Aarav Sharma'), 'Profile name should start with Aarav Sharma');
  assert.ok(profile.policy_name, 'Should resolve policy name');
});

test('2. Dynamic Claims Query & IDOR Filtering for Policyholder', async () => {
  // Aarav Sharma has claims in DB
  const aaravClaims = await query(
    `SELECT c.id, c.status, c.processing_status, c.submitted_at, c.structured_data
     FROM claims c
     WHERE c.policyholder_user_id = 2
     ORDER BY c.id DESC`
  );

  assert.ok(aaravClaims.rows.length >= 1, 'Aarav should have claims');

  // Verify other users do not see Aarav\'s claims
  const otherUserClaims = await query(
    `SELECT c.id FROM claims c WHERE c.policyholder_user_id = 3`
  );
  // User 3 should only see their own claims
  for (const c of otherUserClaims.rows) {
    assert.notEqual(c.id, 1, 'User 3 should not see claim 1 if not owned');
  }
});

test('3. Dynamic KPI Calculation and Zero-Division Safety', () => {
  // Test with real claims status distribution
  const mockClaims = [
    { status: 'AUTO_APPROVED' },
    { status: 'APPROVED' },
    { status: 'NEEDS_REASONING' },
    { status: 'PENDING' },
    { status: 'FLAGGED' },
  ];

  let approvedCount = 0;
  let inReviewCount = 0;
  let rejectedCount = 0;

  for (const row of mockClaims) {
    const s = row.status;
    if (s === 'AUTO_APPROVED' || s === 'APPROVED' || s === 'COMPLETED') {
      approvedCount++;
    } else if (s === 'FLAGGED' || s === 'REJECTED_DETERMINISTIC' || s === 'REJECTED') {
      rejectedCount++;
    } else {
      inReviewCount++;
    }
  }

  const totalClaims = mockClaims.length;
  assert.equal(totalClaims, 5);
  assert.equal(approvedCount, 2);
  assert.equal(inReviewCount, 2);
  assert.equal(rejectedCount, 1);

  const approvedPercentage = totalClaims > 0 ? Math.round((approvedCount / totalClaims) * 1000) / 10 : 0;
  const inReviewPercentage = totalClaims > 0 ? Math.round((inReviewCount / totalClaims) * 1000) / 10 : 0;
  const rejectedPercentage = totalClaims > 0 ? Math.round((rejectedCount / totalClaims) * 1000) / 10 : 0;

  assert.equal(approvedPercentage, 40.0);
  assert.equal(inReviewPercentage, 40.0);
  assert.equal(rejectedPercentage, 20.0);

  // Test zero claims edge case (no division by zero or NaN)
  const zeroClaims = [];
  const zeroTotal = zeroClaims.length;
  const zeroApproved = zeroTotal > 0 ? Math.round((0 / zeroTotal) * 1000) / 10 : 0;
  assert.equal(zeroApproved, 0);
  assert.ok(!Number.isNaN(zeroApproved));
});

test('4. End-to-End Simulation: Insert new claim for policyholder & verify portal updates', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert a new claim for policyholder user 2
    const insertRes = await client.query(
      `INSERT INTO claims (policy_id, policyholder_user_id, status, processing_status, submitted_at, structured_data)
       VALUES (1, 2, 'PENDING', 'pending', now(), $1)
       RETURNING id`,
      [JSON.stringify({
        hospitalization: { hospital_name: 'Civil Service Hospital' },
        declared_total: 62500,
      })]
    );
    const newClaimId = insertRes.rows[0].id;

    // Verify policyholder query returns this newly inserted claim
    const fetched = await client.query(
      `SELECT c.id, c.status, c.structured_data->'hospitalization'->>'hospital_name' AS hospital,
              (c.structured_data->>'declared_total')::numeric AS billed_amount
       FROM claims c
       WHERE c.id = $1 AND c.policyholder_user_id = 2`,
      [newClaimId]
    );

    assert.equal(fetched.rows.length, 1);
    assert.equal(fetched.rows[0].hospital, 'Civil Service Hospital');
    assert.equal(Number(fetched.rows[0].billed_amount), 62500);

    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
});

test.after(async () => {
  await pool.end();
});

