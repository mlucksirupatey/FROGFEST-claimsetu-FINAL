"use server";

import { auth } from "@/auth";
import { query } from "@/lib/db";

export interface PortalKpiData {
  totalClaims: number;
  approvedClaims: number;
  approvedPercentage: number;
  inReviewClaims: number;
  inReviewPercentage: number;
  rejectedClaims: number;
  rejectedPercentage: number;
}

export interface PortalClaimItem {
  id: string;
  rawId: number;
  hospital: string;
  dateFiled: string;
  billedAmount: string;
  numericAmount: number;
  status: "In Review" | "Approved" | "Rejected";
  hasPing: boolean;
  policyName: string;
}

export interface PortalDashboardData {
  kpis: PortalKpiData;
  claims: PortalClaimItem[];
  policyholderName: string;
  policyholderEmail: string;
  memberId?: string;
  policyName?: string;
  timestamp: string;
}

/**
 * Server Action: Fetches real policyholder portal dashboard data from PostgreSQL.
 * Strict ownership: Retrieves profile and claims specifically for the authenticated policyholder.
 */
export async function getPortalDashboardDataAction(): Promise<PortalDashboardData> {
  const session = await auth();
  if (!session?.user?.userId) {
    throw new Error("Unauthorized: Active session required");
  }

  const userId = session.user.userId;

  // 1. Fetch policyholder identity and profile
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
     WHERE u.id = $1`,
    [userId]
  );

  const profileRow = profileRes.rows[0];
  const policyholderName =
    profileRow?.profile_name ||
    profileRow?.member_name ||
    session.user.name ||
    (profileRow?.email ? profileRow.email.split("@")[0] : "Member");
  const policyholderEmail = profileRow?.email || session.user.email || "";

  // 2. Fetch all claims filed by this policyholder
  const claimsRes = await query(
    `SELECT 
       c.id, c.policy_id, c.status, c.processing_status, c.submitted_at, c.created_at, c.updated_at,
       c.structured_data, c.reasoning_result,
       p.name AS policy_name, p.issuer AS policy_issuer
     FROM claims c
     LEFT JOIN policies p ON p.id = c.policy_id
     WHERE c.policyholder_user_id = $1
     ORDER BY c.id DESC`,
    [userId]
  );

  const rawClaims = claimsRes.rows;
  const totalClaims = rawClaims.length;

  let approvedCount = 0;
  let inReviewCount = 0;
  let rejectedCount = 0;

  const claims: PortalClaimItem[] = rawClaims.map((row) => {
    const rawId = Number(row.id);
    const structured = row.structured_data || {};
    const statusRaw = String(row.status || "PENDING").toUpperCase();

    let mappedStatus: "In Review" | "Approved" | "Rejected" = "In Review";
    if (
      statusRaw === "AUTO_APPROVED" ||
      statusRaw === "APPROVED" ||
      statusRaw === "COMPLETED"
    ) {
      mappedStatus = "Approved";
      approvedCount++;
    } else if (
      statusRaw === "FLAGGED" ||
      statusRaw === "REJECTED_DETERMINISTIC" ||
      statusRaw === "REJECTED"
    ) {
      mappedStatus = "Rejected";
      rejectedCount++;
    } else {
      mappedStatus = "In Review";
      inReviewCount++;
    }

    const hospital =
      structured?.hospitalization?.hospital_name ||
      structured?.hospital ||
      "Kathmandu Medical Center";

    const numAmount =
      Number(structured?.declared_total) ||
      Number(structured?.hospitalization?.total_amount) ||
      Number(structured?.computed_line_item_total) ||
      0;

    const formattedAmount =
      numAmount > 0
        ? `Rs. ${numAmount.toLocaleString("en-US")}`
        : "Rs. 0";

    const dateVal = row.submitted_at || row.created_at;
    const formattedDate = dateVal
      ? new Date(dateVal).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Today";

    const hasPing =
      mappedStatus === "In Review" ||
      row.processing_status === "processing" ||
      row.processing_status === "pending";

    return {
      id: `#CLM-${rawId.toString().padStart(4, "0")}`,
      rawId,
      hospital,
      dateFiled: formattedDate,
      billedAmount: formattedAmount,
      numericAmount: numAmount,
      status: mappedStatus,
      hasPing,
      policyName: row.policy_name || "Health Insurance Policy",
    };
  });

  const approvedPercentage =
    totalClaims > 0
      ? Math.round((approvedCount / totalClaims) * 1000) / 10
      : 0;
  const inReviewPercentage =
    totalClaims > 0
      ? Math.round((inReviewCount / totalClaims) * 1000) / 10
      : 0;
  const rejectedPercentage =
    totalClaims > 0
      ? Math.round((rejectedCount / totalClaims) * 1000) / 10
      : 0;

  const kpis: PortalKpiData = {
    totalClaims,
    approvedClaims: approvedCount,
    approvedPercentage,
    inReviewClaims: inReviewCount,
    inReviewPercentage,
    rejectedClaims: rejectedCount,
    rejectedPercentage,
  };

  return {
    kpis,
    claims,
    policyholderName,
    policyholderEmail,
    memberId: profileRow?.member_id || undefined,
    policyName: profileRow?.policy_name || undefined,
    timestamp: new Date().toISOString(),
  };
}
