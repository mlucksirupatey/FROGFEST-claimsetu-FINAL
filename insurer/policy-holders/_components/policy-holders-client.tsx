"use client";

import React, { useState, useTransition } from "react";
import { PolicyHoldersHeader } from "./policy-holders-header";
import { BulkUploadSection } from "./bulk-upload-section";
import { AddPolicyholderForm } from "./add-policyholder-form";
import { MembersDirectory } from "./members-directory";
import { DashboardFooter } from "@/app/insurer/_components/dashboard-footer";
import type { PolicyholderRecord } from "@/actions/insurer-policy-holders";
import { getPolicyHoldersAction } from "@/actions/insurer-policy-holders";

interface PolicyHoldersClientProps {
  initialRecords?: PolicyholderRecord[];
}

export function PolicyHoldersClient({
  initialRecords = [],
}: PolicyHoldersClientProps) {
  const [records, setRecords] = useState<PolicyholderRecord[]>(initialRecords);
  const [, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const fresh = await getPolicyHoldersAction();
        setRecords(fresh);
      } catch (err) {
        console.error("Failed to refresh policyholders:", err);
      }
    });
  };

  const scrollToManualAdd = () => {
    const el = document.getElementById("manual-member-id");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      el.focus();
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen bg-[#F8FAFC]">
      {/* Top Header */}
      <PolicyHoldersHeader
        totalMembers={records.length}
        onAddSingle={scrollToManualAdd}
      />

      {/* Main Workspace Body */}
      <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
        {/* Section 1: Bulk CSV Upload */}
        <BulkUploadSection onSuccess={handleRefresh} />

        {/* Section 2: Add Policyholder Manually */}
        <AddPolicyholderForm onSuccess={handleRefresh} />

        {/* Section 3: Registered Members Directory */}
        <MembersDirectory records={records} onRefresh={handleRefresh} />
      </main>

      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}
