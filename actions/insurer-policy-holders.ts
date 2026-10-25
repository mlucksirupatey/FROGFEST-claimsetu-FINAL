"use server";

import { auth } from "@/auth";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { syncMembersFromCsv, type MemberImportResult } from "@/lib/members/member-service";

export interface PolicyholderRecord {
  id: number;
  memberId: string;
  name: string;
  policyPin: string;
  policyId: number;
  policyName: string;
  isActive: boolean;
  importedAt: string;
}

/**
 * Server Action: Fetches all active policyholder members from the PostgreSQL members table.
 */
export async function getPolicyHoldersAction(): Promise<PolicyholderRecord[]> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: Active session required");
  }

  const role = String(session.user.role || "").toLowerCase();
  if (role !== "institutional" && role !== "insurer") {
    throw new Error("Forbidden: Insurer / Institutional access required");
  }

  const res = await query(
    `SELECT 
       m.id, 
       m.member_id, 
       m.full_name, 
       m.policy_id, 
       m.is_active, 
       m.imported_at,
       p.code AS policy_code, 
       p.name AS policy_name
     FROM members m
     JOIN policies p ON p.id = m.policy_id
     WHERE m.is_active = TRUE
     ORDER BY m.id DESC`
  );

  return res.rows.map((row) => ({
    id: Number(row.id),
    memberId: row.member_id,
    name: row.full_name,
    policyPin: row.policy_code || `POL-${String(row.policy_id).padStart(3, "0")}`,
    policyId: Number(row.policy_id),
    policyName: row.policy_name,
    isActive: Boolean(row.is_active),
    importedAt: row.imported_at
      ? new Date(row.imported_at).toISOString()
      : new Date().toISOString(),
  }));
}

/**
 * Server Action: Manually registers an individual member in the company members registry.
 */
export async function registerPolicyHolderAction(input: {
  memberId: string;
  name: string;
  policyCodeOrId: string;
}): Promise<{ success: boolean; error?: string; member?: PolicyholderRecord }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized: Active session required" };
    }

    const role = String(session.user.role || "").toLowerCase();
    if (role !== "institutional" && role !== "insurer") {
      return {
        success: false,
        error: "Forbidden: Insurer / Institutional access required",
      };
    }

    const memberId = input.memberId?.trim().toUpperCase();
    const name = input.name?.trim();
    const pin = input.policyCodeOrId?.trim();

    if (!memberId || !name || !pin) {
      return {
        success: false,
        error: "Member ID, full name, and policy identifier are required.",
      };
    }

    // Resolve policy_id by code, numeric id, or policy name
    let policyId = 1;
    if (!isNaN(Number(pin))) {
      policyId = Number(pin);
    } else {
      const polRes = await query(
        `SELECT id FROM policies WHERE code ILIKE $1 OR name ILIKE $1 LIMIT 1`,
        [pin]
      );
      if (polRes.rows.length > 0) {
        policyId = Number(polRes.rows[0].id);
      }
    }

    // Verify target policy exists
    const validCheck = await query(
      `SELECT id, code, name FROM policies WHERE id = $1`,
      [policyId]
    );
    if (validCheck.rows.length === 0) {
      return {
        success: false,
        error: `Referenced policy '${pin}' does not exist in policy catalog.`,
      };
    }

    const pol = validCheck.rows[0];

    // Insert or update member in registry
    const insertRes = await query(
      `INSERT INTO members (member_id, full_name, policy_id, is_active, source, updated_at)
       VALUES ($1, $2, $3, TRUE, 'manual_portal', NOW())
       ON CONFLICT (member_id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         policy_id = EXCLUDED.policy_id,
         is_active = TRUE,
         updated_at = NOW()
       RETURNING id, member_id, full_name, policy_id, is_active, imported_at`,
      [memberId, name, policyId]
    );

    const row = insertRes.rows[0];
    const member: PolicyholderRecord = {
      id: Number(row.id),
      memberId: row.member_id,
      name: row.full_name,
      policyPin: pol.code || `POL-${String(pol.id).padStart(3, "0")}`,
      policyId: Number(pol.id),
      policyName: pol.name,
      isActive: true,
      importedAt: row.imported_at
        ? new Date(row.imported_at).toISOString()
        : new Date().toISOString(),
    };

    revalidatePath("/insurer/policy-holders");
    return { success: true, member };
  } catch (err: any) {
    console.error("registerPolicyHolderAction error:", err);
    return {
      success: false,
      error: err.message || "Failed to register member.",
    };
  }
}

/**
 * Server Action: Deactivates or removes a policyholder from the registry.
 */
export async function deletePolicyHolderAction(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized: Active session required" };
    }

    const role = String(session.user.role || "").toLowerCase();
    if (role !== "institutional" && role !== "insurer") {
      return {
        success: false,
        error: "Forbidden: Insurer / Institutional access required",
      };
    }

    await query(
      `UPDATE members SET is_active = FALSE, updated_at = NOW() WHERE member_id = $1`,
      [memberId]
    );

    revalidatePath("/insurer/policy-holders");
    return { success: true };
  } catch (err: any) {
    console.error("deletePolicyHolderAction error:", err);
    return {
      success: false,
      error: err.message || "Failed to remove member.",
    };
  }
}

/**
 * Server Action: Synchronizes bulk customer registry from an uploaded CSV file.
 */
export async function importMembersCsvAction(
  csvContent: string
): Promise<MemberImportResult> {
  const session = await auth();
  if (!session?.user) {
    return {
      success: false,
      total: 0,
      inserted: 0,
      updated: 0,
      deactivated: 0,
      errors: ["Unauthorized: Active session required"],
    };
  }

  const role = String(session.user.role || "").toLowerCase();
  if (role !== "institutional" && role !== "insurer") {
    return {
      success: false,
      total: 0,
      inserted: 0,
      updated: 0,
      deactivated: 0,
      errors: ["Forbidden: Insurer / Institutional access required"],
    };
  }

  const result = await syncMembersFromCsv(csvContent);
  if (result.success) {
    revalidatePath("/insurer/policy-holders");
  }
  return result;
}
