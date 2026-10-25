"use server";

import { auth } from "@/auth";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface PolicyData {
  id: string;
  code: string;
  name: string;
  addedDate: string;
  pdfUrl: string;
  status: "active" | "archived";
}

export interface AddPolicyInput {
  name: string;
  code: string;
  pdfUrl?: string;
}

/**
 * Server Action: Fetches all active insurance policies from PostgreSQL.
 */
export async function getPoliciesAction(): Promise<PolicyData[]> {
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
       id, name, issuer, hipml_file_id, 
       code, pdf_url, status,
       created_at
     FROM policies
     WHERE status != 'archived'
     ORDER BY id ASC`
  );

  return res.rows.map((row) => {
    const rawId = String(row.id);
    const code = row.code || `POL-${rawId.padStart(3, "0")}`;
    const status = (row.status === "archived" ? "archived" : "active") as "active" | "archived";
    const pdfUrl = row.pdf_url || "/policies/default-policy.pdf";

    const dateVal = row.created_at;
    const formattedDate = dateVal
      ? new Date(dateVal).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "01 Jan 2024";

    return {
      id: rawId,
      code,
      name: row.name,
      addedDate: formattedDate,
      pdfUrl,
      status,
    };
  });
}

/**
 * Server Action: Creates and compiles a new policy in PostgreSQL.
 */
export async function addPolicyAction(
  input: AddPolicyInput
): Promise<{ success: boolean; policy?: PolicyData; error?: string }> {
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

    const name = input.name?.trim();
    const code = input.code?.trim().toUpperCase();

    if (!name || !code) {
      return { success: false, error: "Policy name and code are required." };
    }

    // Generate unique hipml_file_id
    const slug = code.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const hipmlFileId = `${slug}-${Date.now().toString(36)}`;
    const pdfUrl = input.pdfUrl || "/policies/default-policy.pdf";

    const insertRes = await query(
      `INSERT INTO policies (
         name, issuer, hipml_file_id, code, pdf_url, status
       )
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id, name, issuer, code, pdf_url, status, created_at`,
      [name, "ClaimSetu Underwriter", hipmlFileId, code, pdfUrl]
    );

    const row = insertRes.rows[0];
    const createdPolicy: PolicyData = {
      id: String(row.id),
      code: row.code,
      name: row.name,
      addedDate: new Date(row.created_at).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      pdfUrl: row.pdf_url || "/policies/default-policy.pdf",
      status: "active",
    };

    revalidatePath("/insurer/policies");
    return { success: true, policy: createdPolicy };
  } catch (err: any) {
    console.error("addPolicyAction error:", err);
    return { success: false, error: err.message || "Failed to create policy" };
  }
}

/**
 * Server Action: Deletes or archives a policy from PostgreSQL.
 * If policy has dependent claims, it safely marks it as 'archived'.
 */
export async function deletePolicyAction(
  id: string
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

    const policyId = Number(id);
    if (!policyId || isNaN(policyId)) {
      return { success: false, error: "Invalid policy ID" };
    }

    // Check if any claims reference this policy
    const claimsCheck = await query(
      `SELECT COUNT(*)::int AS count FROM claims WHERE policy_id = $1`,
      [policyId]
    );

    const hasClaims = (claimsCheck.rows[0]?.count || 0) > 0;

    if (hasClaims) {
      // Soft-delete to preserve foreign key constraints on historical claims
      await query(
        `UPDATE policies SET status = 'archived' WHERE id = $1`,
        [policyId]
      );
    } else {
      // Hard delete if no claims reference it
      await query(`DELETE FROM policies WHERE id = $1`, [policyId]);
    }

    revalidatePath("/insurer/policies");
    return { success: true };
  } catch (err: any) {
    console.error("deletePolicyAction error:", err);
    return { success: false, error: err.message || "Failed to delete policy" };
  }
}
