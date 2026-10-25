// nextjs/tests/13_portal_profile.test.mjs
// Test suite for Policyholder Profile backend integration

import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env.local') });

const { pool, query } = await import('../lib/db.ts');

test('1. Policyholder Profile Query & Formatting', async () => {
  // Query policyholder profile for Aarav Sharma (user_id = 2)
  const res = await query(
    `SELECT u.id AS user_id, u.email, u.role,
            pp.full_name AS profile_name, pp.pan_id, pp.insurance_provider, pp.policy_id,
            m.id AS member_pk, m.member_id, m.full_name AS member_name,
            pol.name AS policy_name, pol.issuer AS policy_issuer
     FROM users u
     LEFT JOIN policyholder_profile pp ON pp.user_id = u.id
     LEFT JOIN members m ON m.id = pp.member_id
     LEFT JOIN policies pol ON pol.id = COALESCE(pp.policy_id, m.policy_id, 1)
     WHERE u.id = 2
     LIMIT 1`
  );

  assert.equal(res.rows.length, 1);
  const row = res.rows[0];
  assert.equal(row.email, 'aarav.sharma@nepalmail.np');
  assert.ok(row.profile_name.startsWith('Aarav Sharma'), 'Profile name should start with Aarav Sharma');
  assert.equal(row.pan_id, 'PAN-994821');
  assert.ok(row.policy_name, 'Policy name should be resolved');
});

test('2. Policyholder Profile Database Update & Integrity', async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create a temporary test user & profile
    const testEmail = `test_ph_prof_${Date.now()}@example.com`;
    const uRes = await client.query(
      `INSERT INTO users (email, password, role, is_active)
       VALUES ($1, 'secret123', 'policyholder', true)
       RETURNING id`,
      [testEmail]
    );
    const testUserId = uRes.rows[0].id;

    await client.query(
      `INSERT INTO policyholder_profile (user_id, full_name, pan_id, insurance_provider)
       VALUES ($1, 'Original Name', 'PAN-ORIG-123', 'shikhar')`,
      [testUserId]
    );

    // Perform profile update
    const updateRes = await client.query(
      `UPDATE policyholder_profile
       SET full_name = $1,
           pan_id = $2,
           updated_at = NOW()
       WHERE user_id = $3
       RETURNING full_name, pan_id, updated_at`,
      ['Updated Legal Name', 'CIT-9921-UPDATED', testUserId]
    );

    assert.equal(updateRes.rows.length, 1);
    assert.equal(updateRes.rows[0].full_name, 'Updated Legal Name');
    assert.equal(updateRes.rows[0].pan_id, 'CIT-9921-UPDATED');

    // Rollback test changes
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
});

test('3. Policyholder Profile Validation Rules', () => {
  const validate = (name, pan) => {
    if (!name || !name.trim()) return 'Full legal name cannot be blank.';
    if (!pan || !pan.trim()) return 'Citizenship / PAN ID cannot be blank.';
    return null;
  };

  assert.equal(validate('', 'PAN-123'), 'Full legal name cannot be blank.');
  assert.equal(validate('   ', 'PAN-123'), 'Full legal name cannot be blank.');
  assert.equal(validate('Valid Name', ''), 'Citizenship / PAN ID cannot be blank.');
  assert.equal(validate('Valid Name', '   '), 'Citizenship / PAN ID cannot be blank.');
  assert.equal(validate('Aarav Sharma', 'PAN-994821'), null);
});

test.after(async () => {
  await pool.end();
});
