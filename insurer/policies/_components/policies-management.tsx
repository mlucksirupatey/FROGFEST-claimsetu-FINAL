"use client";

import React, { useState, useTransition } from "react";
import { PoliciesHeader } from "./policies-header";
import { PoliciesList } from "./policies-list";
import { AddPolicyForm } from "./add-policy-form";
import { DashboardFooter } from "@/app/insurer/_components/dashboard-footer";
import type { PolicyData } from "@/actions/insurer-policies";
import { getPoliciesAction } from "@/actions/insurer-policies";

interface PoliciesManagementProps {
  initialPolicies?: PolicyData[];
}

export function PoliciesManagement({
  initialPolicies = [],
}: PoliciesManagementProps) {
  const [policies, setPolicies] = useState<PolicyData[]>(initialPolicies);
  const [, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const fresh = await getPoliciesAction();
        setPolicies(fresh);
      } catch (err) {
        console.error("Failed to refresh policies:", err);
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen bg-[#F8FAFC]">
      {/* Top Header */}
      <PoliciesHeader totalPolicies={policies.length} />

      {/* Main Workspace Body */}
      <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
        {/* Section 1: Policies Listing */}
        <PoliciesList
          policies={policies}
          onRefresh={handleRefresh}
          onTotalChange={(c) => {
            // Count synced with policies state
          }}
        />

        {/* Section 2: Add New Policy Dedicated Block */}
        <AddPolicyForm onSuccess={handleRefresh} />
      </main>

      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}

