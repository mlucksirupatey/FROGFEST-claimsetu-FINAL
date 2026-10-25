// nextjs/app/insurer/claims/new/page.tsx
// Insurer & Institutional Claim Filing Flow (5-Stage Verification & Reasoning Pipeline)
// Adheres to CLAIMSETU_FULL_CLAIM_AUTH_MEMBER_IMPLEMENTATION_PLAN.md Sections 13, 14, 17, 20, 25

"use client";

import React, { useState } from "react";
import {
  ClaimHeader,
  StageMemberLookup,
  VerifiedMember,
  StagePolicySelect,
  ActivePolicy,
  StageClaimFormUpload,
  AttachedClaimFile,
  StageSupportingEvidence,
  SupportingFile,
  ClaimSubmitBar,
} from "@/components/claims";
import { DashboardFooter } from "@/app/insurer/_components/dashboard-footer";

export default function InsurerNewClaimFilingPage() {
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [maxUnlockedStage, setMaxUnlockedStage] = useState<number>(1);
  const [member, setMember] = useState<VerifiedMember | null>(null);
  const [policy, setPolicy] = useState<ActivePolicy | null>(null);
  const [claimForm, setClaimForm] = useState<AttachedClaimFile | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<SupportingFile[]>([]);

  // Stage 1 -> 2: Member Verified
  const handleMemberVerified = (verified: VerifiedMember) => {
    setMember(verified);
    if (verified.policy) {
      setPolicy(verified.policy);
    }
    setMaxUnlockedStage((prev) => Math.max(prev, 2));
  };

  const handleNextFromStage1 = () => {
    setMaxUnlockedStage((prev) => Math.max(prev, 2));
    setCurrentStage(2);
  };

  // Stage 2 -> 3: Policy Selected
  const handlePolicySelected = (selected: ActivePolicy) => {
    setPolicy(selected);
    setMaxUnlockedStage((prev) => Math.max(prev, 3));
  };

  const handleNextFromStage2 = () => {
    setMaxUnlockedStage((prev) => Math.max(prev, 3));
    setCurrentStage(3);
  };

  // Stage 3 -> 4: Claim Form Attached
  const handleClaimFormUploaded = (file: AttachedClaimFile | null) => {
    setClaimForm(file);
    if (file) {
      setMaxUnlockedStage((prev) => Math.max(prev, 4));
    }
  };

  const handleNextFromStage3 = () => {
    setMaxUnlockedStage((prev) => Math.max(prev, 4));
    setCurrentStage(4);
  };

  // Stage 4 -> 5: Supporting Evidence Added
  const handleNextFromStage4 = () => {
    setMaxUnlockedStage((prev) => Math.max(prev, 5));
    setCurrentStage(5);
  };

  // Full reset
  const handleReset = () => {
    setMember(null);
    setPolicy(null);
    setClaimForm(null);
    setEvidenceFiles([]);
    setCurrentStage(1);
    setMaxUnlockedStage(1);
  };

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen bg-[#F8FAFC]">
      {/* 1. Overall Title Header with Stepper Tabs */}
      <ClaimHeader
        currentStage={currentStage}
        totalStages={5}
        maxUnlockedStage={maxUnlockedStage}
        onSelectStage={(stage) => setCurrentStage(stage)}
        onReset={handleReset}
      />

      {/* 2. Main Container: Displays ONLY ONE card at a time */}
      <main className="p-6 sm:p-8 max-w-4xl w-full mx-auto space-y-6 flex-1 flex flex-col justify-start">
        {/* Card 1: Member ID Lookup (Only visible when currentStage === 1) */}
        {currentStage === 1 && (
          <div className="animate-in fade-in zoom-in-98 duration-200 w-full">
            <StageMemberLookup
              isVerified={Boolean(member)}
              onVerified={handleMemberVerified}
              onNext={handleNextFromStage1}
              isActive={true}
            />
          </div>
        )}

        {/* Card 2: Active Policy Confirmation/Select (Only visible when currentStage === 2) */}
        {currentStage === 2 && (
          <div className="animate-in fade-in zoom-in-98 duration-200 w-full">
            <StagePolicySelect
              selectedPolicyId={policy?.id}
              policies={policy ? [policy] : undefined}
              member={member}
              onPolicySelected={handlePolicySelected}
              onNext={handleNextFromStage2}
              onBack={() => setCurrentStage(1)}
              isActive={true}
              stageNumber={2}
              stageBadge="STAGE 02 OF 05"
              backLabel="Back: Member Lookup"
            />
          </div>
        )}

        {/* Card 3: Claim Form Upload (Only visible when currentStage === 3) */}
        {currentStage === 3 && (
          <div className="animate-in fade-in zoom-in-98 duration-200 w-full">
            <StageClaimFormUpload
              initialFile={claimForm}
              onFileUploaded={handleClaimFormUploaded}
              onNext={handleNextFromStage3}
              onBack={() => setCurrentStage(2)}
              isActive={true}
              stageNumber={3}
              stageBadge="STAGE 03 OF 05"
              backLabel="Back: Policy Confirmation"
            />
          </div>
        )}

        {/* Card 4: Supporting Evidence (Only visible when currentStage === 4) */}
        {currentStage === 4 && (
          <div className="animate-in fade-in zoom-in-98 duration-200 w-full">
            <StageSupportingEvidence
              initialFiles={evidenceFiles}
              onFilesChanged={setEvidenceFiles}
              onNext={handleNextFromStage4}
              onBack={() => setCurrentStage(3)}
              isActive={true}
              stageNumber={4}
              stageBadge="STAGE 04 OF 05"
              backLabel="Back: Claim Form"
            />
          </div>
        )}

        {/* Card 5: Review & Submit (Only visible when currentStage === 5) */}
        {currentStage === 5 && (
          <div className="animate-in fade-in zoom-in-98 duration-200 w-full">
            <ClaimSubmitBar
              member={member}
              policy={policy}
              claimForm={claimForm}
              evidenceFiles={evidenceFiles}
              onBack={() => setCurrentStage(4)}
              stageBadge="STAGE 05 OF 05"
              dashboardUrl="/insurer"
              dashboardLabel="Go to Insurer Dashboard"
              backLabel="Back: Supporting Evidence"
            />
          </div>
        )}
      </main>

      {/* Institutional Legal Footer */}
      <DashboardFooter />
    </div>
  );
}
