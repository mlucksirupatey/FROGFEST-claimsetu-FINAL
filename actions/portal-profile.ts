"use server";

import { auth } from "@/auth";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface PolicyholderProfileData {
  userId: number;
  email: string;
  role: string;
  fullName: string;
  memberId: string;
  panId: string;
  insuranceProvider: string;
  policyId: number | null;
  policyName: string;
  policyIssuer: string;
  underwriterDisplay: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePolicyholderProfileInput {
  fullName: string;
  panId: string;
  insuranceProvider?: string;
}

/**
 * Server Action: Fetches policyholder profile directly from PostgreSQL.
 */
export async function getPolicyholderProfileAction(): Promise<PolicyholderProfileData | null> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: Active session required");
  }

  const role = String(session.user.role || "").toLowerCase();
  if (role !== "policyholder") {
    throw new Error("Forbidden: Policyholder account required");
  }

  const userId = session.user.userId || (session.user as any).id;
  const email = session.user.email || "";

  const res = await query(
    `SELECT u.id AS user_id, u.email, u.role,
            pp.full_name AS profile_name, pp.pan_id, pp.insurance_provider, pp.policy_id,
            pp.created_at, pp.updated_at,
            m.id AS member_pk, m.member_id, m.full_name AS member_name,
            pol.name AS policy_name, pol.issuer AS policy_issuer
     FROM users u
     LEFT JOIN policyholder_profile pp ON pp.user_id = u.id
     LEFT JOIN members m ON m.id = pp.member_id
     LEFT JOIN policies pol ON pol.id = COALESCE(pp.policy_id, m.policy_id, 1)
     WHERE u.id = $1 OR LOWER(u.email) = LOWER($2)
     LIMIT 1`,
    [userId || -1, email]
  );

  if (res.rows.length === 0) {
    return null;
  }

  const row = res.rows[0];

  const fullName =
    row.profile_name ||
    row.member_name ||
    session.user.name ||
    (row.email ? row.email.split("@")[0] : "Verified Policyholder");

  const memberId =
    row.member_id ||
    (row.member_pk ? `MEM-${row.member_pk}` : `MEM-${row.user_id}-NP`);

  const panId = row.pan_id || `PAN-${row.user_id}948`;
  const insuranceProvider = row.insurance_provider || "salico";
  const policyName = row.policy_name || "Statutory Health Policy";

  const providerNames: Record<string, string> = {
    shikhar: "Shikhar Insurance",
    salico: "SALICO Insurance Limited",
    salico_micro: "salico micro insurance company(synthetic)",
  };

  const policyIssuer =
    row.policy_issuer ||
    providerNames[insuranceProvider] ||
    "ClaimSetu Partner Carrier";

  const underwriterDisplay = row.policy_name
    ? `${policyIssuer} (${row.policy_name})`
    : policyIssuer;

  return {
    userId: Number(row.user_id),
    email: row.email,
    role: row.role,
    fullName,
    memberId,
    panId,
    insuranceProvider,
    policyId: row.policy_id ? Number(row.policy_id) : null,
    policyName,
    policyIssuer,
    underwriterDisplay,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

/**
 * Server Action: Updates policyholder profile credentials.
 */
export async function updatePolicyholderProfileAction(
  input: UpdatePolicyholderProfileInput
): Promise<{ success: boolean; error?: string; profile?: PolicyholderProfileData }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized: Active session required" };
    }

    const role = String(session.user.role || "").toLowerCase();
    if (role !== "policyholder") {
      return { success: false, error: "Forbidden: Policyholder account required" };
    }

    const fullName = input.fullName?.trim();
    const panId = input.panId?.trim();

    if (!fullName) {
      return { success: false, error: "Full legal name cannot be blank." };
    }
    if (!panId) {
      return { success: false, error: "Citizenship / PAN ID cannot be blank." };
    }

    const userId = session.user.userId || (session.user as any).id;
    const email = session.user.email || "";

    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const userRes = await query(
        `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [email]
      );
      if (userRes.rows.length > 0) {
        resolvedUserId = Number(userRes.rows[0].id);
      }
    }

    if (!resolvedUserId) {
      return { success: false, error: "Unable to identify active user session." };
    }

    // Upsert into policyholder_profile
    await query(
      `INSERT INTO policyholder_profile (user_id, full_name, pan_id, insurance_provider)
       VALUES ($1, $2, $3, COALESCE($4, 'salico'))
       ON CONFLICT (user_id) DO UPDATE
       SET full_name = EXCLUDED.full_name,
           pan_id = EXCLUDED.pan_id,
           insurance_provider = COALESCE(EXCLUDED.insurance_provider, policyholder_profile.insurance_provider),
           updated_at = NOW()`,
      [resolvedUserId, fullName, panId, input.insuranceProvider || null]
    );

    revalidatePath("/portal/profile");
    revalidatePath("/portal");

    const fresh = await getPolicyholderProfileAction();
    return { success: true, profile: fresh || undefined };
  } catch (err: any) {
    console.error("updatePolicyholderProfileAction error:", err);
    return { success: false, error: err.message || "Failed to update profile." };
  }
}
