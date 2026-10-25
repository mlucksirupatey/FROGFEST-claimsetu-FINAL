import type { Metadata } from "next";
import { getPortalDashboardDataAction } from "@/actions/portal-dashboard";
import { PolicyholderDashboard } from "./_components/portal-dashboard";

export const metadata: Metadata = {
  title: "Policyholder Dashboard | ClaimSetu",
  description:
    "View health coverage, track statutory claims adjudication, and calculate procedure reimbursement in real time.",
};

export default async function PolicyholderDashboardPage() {
  try {
    const initialData = await getPortalDashboardDataAction();
    return <PolicyholderDashboard initialData={initialData} />;
  } catch (err) {
    console.error("PolicyholderDashboardPage SSR load error:", err);
    return <PolicyholderDashboard />;
  }
}
