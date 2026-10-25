// nextjs/app/portal/newclaim/page.tsx
// Server component fetching real authenticated member context and rendering new claim client
// Adheres strictly to CLAIMSETU_FULL_CLAIM_AUTH_MEMBER_IMPLEMENTATION_PLAN.md Section 12

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCurrentPolicyholderContext } from "@/lib/members/member-service";
import { PolicyholderNewClaimClient } from "../_components/policyholder-new-claim-client";

export const metadata = {
  title: "New Claim | ClaimSetu Statutory Adjudication",
  description: "Submit health reimbursement claims with automated HIPML verification.",
};

export default async function PolicyholderNewClaimPage() {
  const session = await auth();

  if (!session?.user?.userId) {
    redirect("/login?callbackUrl=/portal/newclaim");
  }

  const context = await getCurrentPolicyholderContext(session.user.userId);

  if (!context) {
    redirect("/login");
  }

  return (
    <PolicyholderNewClaimClient
      member={context.member}
      policies={context.policies}
    />
  );
}
