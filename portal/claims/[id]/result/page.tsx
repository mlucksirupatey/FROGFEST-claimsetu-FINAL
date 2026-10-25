// nextjs/app/portal/claims/[id]/result/page.tsx
// Server component for claim review result with ownership verification and cached report presentation
// Adheres strictly to CLAIMSETU_FULL_CLAIM_AUTH_MEMBER_IMPLEMENTATION_PLAN.md Sections 34, 35, 36

import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { query } from "@/lib/db";
import { ClaimResultView } from "./ClaimResultView";

export const metadata = {
  title: "Claim Adjudication Result | ClaimSetu",
  description: "View deterministic policy adjudication findings and evidence-grounded reports.",
};

export default async function ClaimResultPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.userId) {
    redirect("/login");
  }

  const { id } = await props.params;
  const claimId = parseInt(id, 10);
  if (isNaN(claimId)) {
    notFound();
  }

  const res = await query(
    `SELECT c.id, c.status, c.processing_status, c.reasoning_result, c.submitted_at,
            c.policyholder_user_id,
            p.id AS policy_id, p.name AS policy_name, p.issuer AS policy_issuer,
            m.member_id, COALESCE(m.full_name, pp.full_name, u.email) AS beneficiary_name
     FROM claims c
     JOIN policies p ON p.id = c.policy_id
     LEFT JOIN users u ON u.id = c.policyholder_user_id
     LEFT JOIN policyholder_profile pp ON pp.user_id = u.id
     LEFT JOIN members m ON m.id = pp.member_id
     WHERE c.id = $1`,
    [claimId]
  );

  if (res.rowCount === 0) {
    notFound();
  }

  const claim = res.rows[0];

  // Policyholder IDOR check (Section 34)
  if (
    session.user.role === "policyholder" &&
    claim.policyholder_user_id &&
    String(claim.policyholder_user_id) !== String(session.user.userId)
  ) {
    redirect("/portal");
  }

  const reasoning = claim.reasoning_result || {};

  const initialClaim = {
    claimId: claim.id,
    status: claim.status,
    processingStatus: claim.processing_status || "pending",
    submittedAt: claim.submitted_at,
    member: {
      memberId: claim.member_id || "N/A",
      name: claim.beneficiary_name || "Beneficiary",
    },
    policy: {
      id: claim.policy_id,
      name: claim.policy_name,
      issuer: claim.policy_issuer,
    },
    summary: reasoning.summary_report || "",
    fullReport: reasoning.full_report || "",
    disposition: reasoning.disposition || claim.status,
    analysis: reasoning.structured_analysis || null,
    findings: reasoning.structured_analysis?.findings || [],
    evidence: reasoning.frozen_evidence || [],
    citations: reasoning.citation_map || {},
  };

  return <ClaimResultView initialClaim={initialClaim} />;
}
