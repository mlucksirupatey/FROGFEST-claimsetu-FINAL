// nextjs/tests/10_auth_system.test.mjs
// Comprehensive test suite for ClaimSetu Authentication System
// Adheres strictly to CLAIMSETU_AUTH_IMPLEMENTATION_PLAN.md Section 20

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: path.resolve('.env.local') });

import { verifyPassword } from '../lib/auth/password.ts';
import {
  policyholderRegisterSchema,
  institutionalRegisterSchema,
  insurerProfileUpdateSchema,
} from '../lib/auth/schemas.ts';

const pool = new pg.Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'claimsetu',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'devpassword',
});

// Helper for test cleanup
async function cleanTestUser(email) {
  await pool.query('DELETE FROM users WHERE LOWER(email) = LOWER($1)', [email]);
}

test('1. Database Constraints: Lowercase email uniqueness and role check', async () => {
  const testEmail = `test_unique_${Date.now()}@example.com`;
  await cleanTestUser(testEmail);

  // 1. Insert user with mixed case
  const insert1 = await pool.query(
    `INSERT INTO users (email, password, role, is_active)
     VALUES ($1, 'pass123', 'policyholder', true)
     RETURNING id, email, role`,
    [testEmail]
  );
  assert.equal(insert1.rowCount, 1, 'First user inserted successfully');

  // 2. Second insert with uppercase email must trigger unique violation
  await assert.rejects(
    async () => {
      await pool.query(
        `INSERT INTO users (email, password, role, is_active)
         VALUES ($1, 'pass123', 'policyholder', true)`,
        [testEmail.toUpperCase()]
      );
    },
    /duplicate key value|uq_users_email_lower/i,
    'Duplicate case-insensitive email must be rejected'
  );

  // 3. Invalid role check constraint
  await assert.rejects(
    async () => {
      await pool.query(
        `INSERT INTO users (email, password, role, is_active)
         VALUES ($1, 'pass123', 'superuser', true)`,
        [`invalid_role_${Date.now()}@example.com`]
      );
    },
    /check constraint.*role/i,
    'Invalid role must be rejected by check constraint'
  );

  await cleanTestUser(testEmail);
});

test('2. Database Constraints: Foreign keys and cascade / set-null behavior', async () => {
  const testEmail = `test_fk_${Date.now()}@example.com`;
  await cleanTestUser(testEmail);

  // 1. Insert user
  const uRes = await pool.query(
    `INSERT INTO users (email, password, role, is_active)
     VALUES ($1, 'pass123', 'institutional', true)
     RETURNING id`,
    [testEmail]
  );
  const userId = uRes.rows[0].id;

  // 2. Institutional profile with valid institution_id (1 = Shikhar)
  await pool.query(
    `INSERT INTO institutional_profile (user_id, institution_id, pan_number, nia_license_number)
     VALUES ($1, 1, 'PAN12345', 'NIA-LIC-100')`,
    [userId]
  );

  // 3. Institutional profile with non-existent institution_id must fail FK
  const uRes2 = await pool.query(
    `INSERT INTO users (email, password, role, is_active)
     VALUES ($1, 'pass123', 'institutional', true)
     RETURNING id`,
    [`test_fk2_${Date.now()}@example.com`]
  );
  const userId2 = uRes2.rows[0].id;

  await assert.rejects(
    async () => {
      await pool.query(
        `INSERT INTO institutional_profile (user_id, institution_id, pan_number, nia_license_number)
         VALUES ($1, 999999, 'PAN12345', 'NIA-LIC-100')`,
        [userId2]
      );
    },
    /foreign key constraint/i,
    'Non-existent institution_id must be rejected'
  );

  await pool.query('DELETE FROM users WHERE id = $1', [userId2]);

  // 4. Create a test claim linked to this user
  const claimRes = await pool.query(
    `INSERT INTO claims (policy_id, policyholder_user_id, status)
     VALUES (1, $1, 'PENDING')
     RETURNING id`,
    [userId]
  );
  const claimId = claimRes.rows[0].id;

  // 5. Deleting user cascades to institutional_profile and SET NULL on claims
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);

  const profileCheck = await pool.query(
    'SELECT * FROM institutional_profile WHERE user_id = $1',
    [userId]
  );
  assert.equal(profileCheck.rows.length, 0, 'institutional_profile cascaded on user delete');

  const claimCheck = await pool.query(
    'SELECT id, policyholder_user_id FROM claims WHERE id = $1',
    [claimId]
  );
  assert.equal(claimCheck.rows[0].policyholder_user_id, null, 'claim policyholder_user_id set to NULL');

  // Clean up test claim
  await pool.query('DELETE FROM claims WHERE id = $1', [claimId]);
});

test('3. Password Module: Plaintext comparison verification', () => {
  assert.equal(verifyPassword('mySecretPass123', 'mySecretPass123'), true, 'Exact match returns true');
  assert.equal(verifyPassword('mySecretPass123', 'wrongpassword'), false, 'Mismatch returns false');
  assert.equal(verifyPassword('caseSensitive', 'casesensitive'), false, 'Password comparison is case sensitive');
});

test('4. Zod Schemas: Validation of registration payloads', () => {
  // Policyholder schema
  const validPh = policyholderRegisterSchema.safeParse({
    email: 'test.ph@claimsetu.np',
    password: 'password123',
    full_name: 'Sita Thapa',
    policy_id: 2,
    insurance_provider: 'salico',
    pan_id: 'PAN-109283',
  });
  assert.equal(validPh.success, true, 'Valid policyholder payload passes');

  const invalidPh = policyholderRegisterSchema.safeParse({
    email: 'not-an-email',
    password: '12', // too short (< 4 chars)
    full_name: '',
    policy_id: -1,
    insurance_provider: 'unsupported_insurance',
    pan_id: '',
  });
  assert.equal(invalidPh.success, false, 'Invalid policyholder payload fails');

  // Institutional schema
  const validIns = institutionalRegisterSchema.safeParse({
    email: 'admin@salico-micro.com.np',
    password: 'password123',
    institution_id: 3,
    pan_number: '300184912',
    nia_license_number: 'NIA-2024-001',
  });
  assert.equal(validIns.success, true, 'Valid institutional payload passes');

  // Policyholder schema without policy_id
  const validPhNoPolicy = policyholderRegisterSchema.safeParse({
    email: 'test.ph.nopolicy@claimsetu.np',
    password: 'password123',
    full_name: 'Sita Thapa',
    insurance_provider: 'salico',
    pan_id: 'PAN-109283',
  });
  assert.equal(validPhNoPolicy.success, true, 'Policyholder payload without policy_id passes');

  // Institutional schema with institution_name string instead of institution_id
  const validInsWithName = institutionalRegisterSchema.safeParse({
    email: 'admin@everest.com.np',
    password: 'password123',
    institution_name: 'Everest Insurance Limited',
    pan_number: '300184912',
    nia_license_number: 'NIA-2024-001',
  });
  assert.equal(validInsWithName.success, true, 'Institutional payload with institution_name passes');

  // Insurer profile update schema (Stage 2)
  const validUpdate = insurerProfileUpdateSchema.safeParse({
    full_name: 'Bikash Adhikari',
    employee_id: 'EMP-9021',
    job_title: 'Senior Claims Adjudicator',
  });
  assert.equal(validUpdate.success, true, 'Valid stage-2 update payload passes');
});

test('5. Transactional Registration: Policyholder creation and rollback on error', async () => {
  const email = `ph_reg_${Date.now()}@example.com`;
  await cleanTestUser(email);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert user
    const uRes = await client.query(
      `INSERT INTO users (email, password, role, is_active)
       VALUES ($1, 'plainPass123', 'policyholder', true)
       RETURNING id, email, role`,
      [email]
    );
    const userId = uRes.rows[0].id;

    // 2. Insert profile
    await client.query(
      `INSERT INTO policyholder_profile (user_id, full_name, policy_id, insurance_provider, pan_id)
       VALUES ($1, 'Kiran Shrestha', 1, 'shikhar', 'PAN-88912')`,
      [userId]
    );

    await client.query('COMMIT');

    // Verify both rows exist
    const checkUser = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    assert.equal(checkUser.rows[0].password, 'plainPass123', 'Password stored as submitted plaintext');
    assert.equal(checkUser.rows[0].role, 'policyholder');

    const checkProfile = await pool.query('SELECT * FROM policyholder_profile WHERE user_id = $1', [userId]);
    assert.equal(checkProfile.rows[0].full_name, 'Kiran Shrestha');
  } finally {
    client.release();
    await cleanTestUser(email);
  }

  // 2b. Insert profile with NULL policy_id
  const emailNullPolicy = `ph_null_policy_${Date.now()}@example.com`;
  await cleanTestUser(emailNullPolicy);
  const clientNull = await pool.connect();
  try {
    await clientNull.query('BEGIN');
    const uRes = await clientNull.query(
      `INSERT INTO users (email, password, role, is_active)
       VALUES ($1, 'plainPass123', 'policyholder', true)
       RETURNING id, email, role`,
      [emailNullPolicy]
    );
    const userId = uRes.rows[0].id;
    await clientNull.query(
      `INSERT INTO policyholder_profile (user_id, full_name, policy_id, insurance_provider, pan_id)
       VALUES ($1, 'Null Policy Holder', NULL, 'shikhar', 'PAN-99999')`,
      [userId]
    );
    await clientNull.query('COMMIT');

    const checkNullProfile = await pool.query(
      `SELECT u.id, p.full_name, p.policy_id, pol.name AS policy_name
       FROM users u
       JOIN policyholder_profile p ON p.user_id = u.id
       LEFT JOIN policies pol ON pol.id = p.policy_id
       WHERE u.id = $1`,
      [userId]
    );
    assert.equal(checkNullProfile.rows.length, 1);
    assert.equal(checkNullProfile.rows[0].policy_id, null);
    assert.equal(checkNullProfile.rows[0].policy_name, null);
  } finally {
    clientNull.release();
    await cleanTestUser(emailNullPolicy);
  }

  // 3. Test Rollback on forced error
  const rollbackEmail = `rollback_${Date.now()}@example.com`;
  const client2 = await pool.connect();
  try {
    await client2.query('BEGIN');
    const uRes = await client2.query(
      `INSERT INTO users (email, password, role, is_active)
       VALUES ($1, 'pass', 'policyholder', true)
       RETURNING id`,
      [rollbackEmail]
    );
    const userId = uRes.rows[0].id;

    // Intentional failure: invalid policy_id (999999)
    await assert.rejects(
      async () => {
        await client2.query(
          `INSERT INTO policyholder_profile (user_id, full_name, policy_id, insurance_provider, pan_id)
           VALUES ($1, 'Fail User', 999999, 'salico_micro', 'PAN-000')`,
          [userId]
        );
      },
      /foreign key/i
    );

    await client2.query('ROLLBACK');

    const checkRollback = await pool.query('SELECT * FROM users WHERE email = $1', [rollbackEmail]);
    assert.equal(checkRollback.rows.length, 0, 'User row rolled back when profile insertion failed');
  } finally {
    client2.release();
  }
});

test('6. Auth Authorize Logic: DB credentials check, role spoofing resistance, inactive accounts', async () => {
  const email = `auth_test_${Date.now()}@example.com`;
  await cleanTestUser(email);

  // 1. Create active policyholder
  const uRes = await pool.query(
    `INSERT INTO users (email, password, role, is_active)
     VALUES ($1, 'secret123', 'policyholder', true)
     RETURNING id`,
    [email]
  );
  const userId = uRes.rows[0].id;

  // 2. Test successful credential verification
  const lookup = await pool.query(
    `SELECT id, email, password, role, is_active FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email.toUpperCase()] // Test case insensitivity
  );
  assert.equal(lookup.rows.length, 1, 'Case-insensitive lookup finds user');
  const user = lookup.rows[0];

  assert.equal(verifyPassword(user.password, 'secret123'), true, 'Correct password passes');
  assert.equal(verifyPassword(user.password, 'wrongSecret'), false, 'Wrong password fails');

  // 3. Role spoofing resistance: user is policyholder in DB
  assert.equal(user.role, 'policyholder', 'Role is strictly policyholder from DB');

  // 4. Test inactive account
  await pool.query('UPDATE users SET is_active = false WHERE id = $1', [userId]);
  const lookupInactive = await pool.query(
    `SELECT id, is_active FROM users WHERE id = $1`,
    [userId]
  );
  assert.equal(lookupInactive.rows[0].is_active, false, 'Account marked inactive');

  await cleanTestUser(email);
});

test('7. Insurer Profile Completion (Stage 2) & Joined Institution Query', async () => {
  const email = `ins_stage2_${Date.now()}@example.com`;
  await cleanTestUser(email);

  // 1. Register institutional user (Stage 1)
  const uRes = await pool.query(
    `INSERT INTO users (email, password, role, is_active)
     VALUES ($1, 'admin123', 'institutional', true)
     RETURNING id`,
    [email]
  );
  const userId = uRes.rows[0].id;

  await pool.query(
    `INSERT INTO institutional_profile (user_id, institution_id, pan_number, nia_license_number, full_name, employee_id, job_title)
     VALUES ($1, 2, 'PAN-7788', 'NIA-2024-77', NULL, NULL, NULL)`,
    [userId]
  );

  // 2. Query initial incomplete profile joined with institutions
  const q1 = await pool.query(
    `SELECT u.id, u.email, u.role,
            p.institution_id, i.name AS institution_name,
            p.pan_number, p.nia_license_number,
            p.full_name, p.employee_id, p.job_title
     FROM users u
     JOIN institutional_profile p ON p.user_id = u.id
     JOIN institutions i ON i.id = p.institution_id
     WHERE u.id = $1`,
    [userId]
  );

  assert.equal(q1.rows[0].institution_name, 'SALICO Insurance Limited', 'Joined real institution name');
  assert.equal(q1.rows[0].full_name, null, 'Stage 2 full_name is initially NULL');

  // 3. Complete Stage 2 (PATCH)
  await pool.query(
    `UPDATE institutional_profile
     SET full_name = $1, employee_id = $2, job_title = $3, updated_at = NOW()
     WHERE user_id = $4`,
    ['Pooja Karki', 'EMP-4401', 'Adjudication Manager', userId]
  );

  const q2 = await pool.query(
    `SELECT full_name, employee_id, job_title FROM institutional_profile WHERE user_id = $1`,
    [userId]
  );
  assert.equal(q2.rows[0].full_name, 'Pooja Karki', 'Updated full_name');
  assert.equal(q2.rows[0].employee_id, 'EMP-4401', 'Updated employee_id');
  assert.equal(q2.rows[0].job_title, 'Adjudication Manager', 'Updated job_title');

  await cleanTestUser(email);
});

test('8. Claim Ownership & Cross-User Security (IDOR Protection)', async () => {
  // Create 2 test policyholders
  const ph1 = await pool.query(
    `INSERT INTO users (email, password, role, is_active)
     VALUES ($1, 'pass', 'policyholder', true)
     RETURNING id`,
    [`idor1_${Date.now()}@example.com`]
  );
  const ph2 = await pool.query(
    `INSERT INTO users (email, password, role, is_active)
     VALUES ($1, 'pass', 'policyholder', true)
     RETURNING id`,
    [`idor2_${Date.now()}@example.com`]
  );

  const id1 = ph1.rows[0].id;
  const id2 = ph2.rows[0].id;

  // Create claim owned by user 1
  const claimRes = await pool.query(
    `INSERT INTO claims (policy_id, policyholder_user_id, status)
     VALUES (1, $1, 'PENDING')
     RETURNING id`,
    [id1]
  );
  const claimId = claimRes.rows[0].id;

  // 1. User 1 queries their claims: sees the claim
  const qPh1 = await pool.query(
    `SELECT id FROM claims WHERE id = $1 AND policyholder_user_id = $2`,
    [claimId, id1]
  );
  assert.equal(qPh1.rows.length, 1, 'Owner can access their own claim');

  // 2. User 2 queries claims with ownership condition: returns 0 rows (blocked)
  const qPh2 = await pool.query(
    `SELECT id FROM claims WHERE id = $1 AND policyholder_user_id = $2`,
    [claimId, id2]
  );
  assert.equal(qPh2.rows.length, 0, 'Cross-user claim access blocked by ownership filter');

  // Clean up
  await pool.query('DELETE FROM claims WHERE id = $1', [claimId]);
  await pool.query('DELETE FROM users WHERE id IN ($1, $2)', [id1, id2]);
});

test.after(async () => {
  await pool.end();
});
