"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { PortalTopBar } from "./portal-top-bar";
import { PortalKpiCards } from "./portal-kpi-cards";
import { PortalClaimsTable } from "./portal-claims-table";
import { PortalFooter } from "./portal-footer";

import type { PortalDashboardData } from "@/actions/portal-dashboard";

export function PolicyholderDashboard({
  initialData,
}: {
  initialData?: PortalDashboardData;
}) {
  const { data: session } = useSession();
  const displayName =
    initialData?.policyholderName ||
    session?.user?.name ||
    "Member";
  const firstName = displayName.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased text-slate-800">
      {/* Fixed Clean Top Bar */}
      <PortalTopBar
        userName={initialData?.policyholderName}
        userEmail={initialData?.policyholderEmail}
      />

      {/* Main Content Area */}
      <main className="w-full pt-20 bg-[#F8FAFC] flex-1">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col w-full">
            {/* Top Greeting */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-200">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Welcome back, {firstName}
                </h1>
                <p className="text-sm text-slate-600">
                  Overview of your health coverage, statutory adjudication timeline, and active reimbursement claims.
                </p>
              </div>
            </div>

            {/* Primary 4-Stat KPI Section */}
            <div className="pt-8 pb-8">
              <PortalKpiCards kpis={initialData?.kpis} />
            </div>

            {/* Primary Ledger: Claims History & Adjudication Table */}
            <PortalClaimsTable claims={initialData?.claims} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <PortalFooter />
    </div>
  );
}
