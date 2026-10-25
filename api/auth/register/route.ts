// nextjs/app/api/auth/register/route.ts
// Transactional user registration API conforming to CLAIMSETU_AUTH_IMPLEMENTATION_PLAN.md Section 7

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  policyholderRegisterSchema,
  institutionalRegisterSchema,
} from "@/lib/auth/schemas";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const role = body?.role;
  if (role !== "policyholder" && role !== "institutional") {
    return NextResponse.json(
      { error: "Invalid role specified. Must be 'policyholder' or 'institutional'." },
      { status: 400 }
    );
  }

  // Validate request body with appropriate Zod schema
  let validatedData: any;
  if (role === "policyholder") {
    const parseRes = policyholderRegisterSchema.safeParse(body);
    if (!parseRes.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseRes.error.flatten() },
        { status: 400 }
      );
    }
    validatedData = parseRes.data;
  } else {
    const parseRes = institutionalRegisterSchema.safeParse(body);
    if (!parseRes.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseRes.error.flatten() },
        { status: 400 }
      );
    }
    validatedData = parseRes.data;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Case-insensitive duplicate email check
    const existing = await client.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [validatedData.email]
    );

    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // 1. Insert into users table (plaintext password for MVP)
    const userInsertRes = await client.query(
      `INSERT INTO users (email, password, role, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING id, email, role, created_at`,
      [validatedData.email.trim().toLowerCase(), validatedData.password, role]
    );

    const newUser = userInsertRes.rows[0];
    const userId = newUser.id;

    // 2. Insert into matching profile table
    if (role === "policyholder") {
      let memberPk: number | null = null;
      let effectivePolicyId: number | null = validatedData.policy_id || null;
      let effectiveFullName = validatedData.full_name?.trim() || "";
      let effectiveProvider = validatedData.insurance_provider;
      let effectivePanId = validatedData.pan_id?.trim() || "";

      // Section 9: If member_id provided, link to insurer registry
      if (validatedData.member_id) {
        const memberRes = await client.query(
          `SELECT id, member_id, full_name, policy_id, is_active FROM members WHERE member_id = $1`,
          [validatedData.member_id.trim()]
        );

        if (memberRes.rows.length === 0 || !memberRes.rows[0].is_active) {
          await client.query("ROLLBACK");
          return NextResponse.json(
            { error: "Invalid member_id: Member not found in active insurer registry" },
            { status: 400 }
          );
        }

        const memberRow = memberRes.rows[0];
        memberPk = Number(memberRow.id);
        effectivePolicyId = Number(memberRow.policy_id);
        if (!effectiveFullName) effectiveFullName = memberRow.full_name;
        if (!effectiveProvider) {
          effectiveProvider = effectivePolicyId === 1 ? "shikhar" : effectivePolicyId === 3 ? "salico_micro" : "salico";
        }
        if (!effectivePanId) effectivePanId = `PAN-${memberRow.member_id.replace(/\D/g, "")}`;
      }

      // If effectivePolicyId is specified, verify it exists; otherwise allow null
      if (effectivePolicyId) {
        const policyCheck = await client.query(`SELECT id FROM policies WHERE id = $1`, [effectivePolicyId]);
        if (policyCheck.rows.length === 0) {
          effectivePolicyId = null;
        }
      }

      await client.query(
        `INSERT INTO policyholder_profile (user_id, member_id, full_name, policy_id, insurance_provider, pan_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          memberPk,
          effectiveFullName || "Policyholder",
          effectivePolicyId,
          effectiveProvider || "shikhar",
          effectivePanId || "PAN-0000",
        ]
      );
    } else {
      let resolvedInstitutionId = validatedData.institution_id;
      const rawInstitutionName = validatedData.institution_name?.trim();

      if (!resolvedInstitutionId && !rawInstitutionName) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Institution name is required" }, { status: 400 });
      }

      // If text institution_name is provided, lookup or create institution record
      if (rawInstitutionName) {
        const existingIns = await client.query(
          `SELECT id FROM institutions WHERE LOWER(name) = LOWER($1) LIMIT 1`,
          [rawInstitutionName]
        );
        if (existingIns.rows.length > 0) {
          resolvedInstitutionId = Number(existingIns.rows[0].id);
        } else {
          const code = rawInstitutionName
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "_")
            .slice(0, 30);
          const newIns = await client.query(
            `INSERT INTO institutions (name, code) VALUES ($1, $2) RETURNING id`,
            [rawInstitutionName, code]
          );
          resolvedInstitutionId = Number(newIns.rows[0].id);
        }
      } else if (resolvedInstitutionId) {
        const institutionCheck = await client.query(`SELECT id FROM institutions WHERE id = $1`, [resolvedInstitutionId]);
        if (institutionCheck.rows.length === 0) {
          await client.query("ROLLBACK");
          return NextResponse.json({ error: "Invalid institution specified" }, { status: 400 });
        }
      }

      await client.query(
        `INSERT INTO institutional_profile (user_id, institution_id, pan_number, nia_license_number, full_name, employee_id, job_title)
         VALUES ($1, $2, $3, $4, NULL, NULL, NULL)`,
        [
          userId,
          resolvedInstitutionId,
          validatedData.pan_number.trim(),
          validatedData.nia_license_number.trim(),
        ]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json(
      {
        success: true,
        user: {
          id: String(newUser.id),
          userId: String(newUser.id),
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("[Registration error]", err);
    return NextResponse.json(
      { error: "Registration transaction failed", message: err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
