// nextjs/app/portal/_components/policyholder-new-claim-client.tsx
// Policyholder new claim client component powered by real verified member & eligible policies
// Adheres strictly to CLAIMSETU_FULL_CLAIM_AUTH_MEMBER_IMPLEMENTATION_PLAN.md Sections 12, 13, 14

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PortalTopBar } from "./portal-top-bar";
import { PortalFooter } from "./portal-footer";
import {
  StagePolicySelect,
  ActivePolicy,
  StageClaimFormUpload,
  AttachedClaimFile,
  StageSupportingEvidence,
  SupportingFile,
  ClaimSubmitBar,
  VerifiedMember,
} from "@/components/claims";
import { ArrowLeft, RotateCcw } from "lucide-react";

interface StepLabel {
  id: number;
  label: string;
}

const stageLabels: StepLabel[] = [
  { id: 1, label: "01 Policy" },
  { id: 2, label: "02 Claim Form" },
  { id: 3, label: "03 Evidence" },
  { id: 4, label: "04 Review" },
];

export interface PolicyholderNewClaimClientProps {
  member: VerifiedMember;
  policies: ActivePolicy[];
}

export function PolicyholderNewClaimClient({
  member,
  policies,
}: PolicyholderNewClaimClientProps) {
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [maxUnlockedStage, setMaxUnlockedStage] = useState<number>(1);
  const [policy, setPolicy] = useState<ActivePolicy | null>(policies[0] ?? null);
  const [claimForm, setClaimForm] = useState<AttachedClaimFile | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<SupportingFile[]>([]);

  const handlePolicySelected = (selected: ActivePolicy) => {
    setPolicy(selected);
    setMaxUnlockedStage((prev) => Math.max(prev, 2));
  };

  const handleNextFromStage1 = () => {
    setMaxUnlockedStage((prev) => Math.max(prev, 2));
    setCurrentStage(2);
  };

  const handleClaimFormUploaded = (file: AttachedClaimFile | null) => {
    setClaimForm(file);
    if (file) {
      setMaxUnlockedStage((prev) => Math.max(prev, 3));
    }
  };

  const handleNextFromStage2 = () => {
    setMaxUnlockedStage((prev) => Math.max(prev, 3));
    setCurrentStage(3);
  };

  const handleNextFromStage3 = () => {
    setMaxUnlockedStage((prev) => Math.max(prev, 4));
    setCurrentStage(4);
  };

  const handleReset = () => {
    setCurrentStage(1);
    setMaxUnlockedStage(1);
    setClaimForm(null);
    setEvidenceFiles([]);
  };

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen bg-[#F8FAFC] antialiased text-slate-800">
      {/* Fixed Clean Top Bar */}
      <PortalTopBar />

      {/* Main Unified Page Container */}
      <main className="w-full pt-28 pb-16 bg-[#F8FAFC] flex-1">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-6">
          {/* Breadcrumb Back Link */}
          <div>
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-[#064E3B] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>BACK TO CLAIMS DASHBOARD</span>
            </Link>
          </div>

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-mono font-bold text-[#064E3B] uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                Statutory Reimbursement Claim
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2 font-sans">
                File a Reimbursement Claim
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Choose your active policy, upload the signed claim form and hospital evidence for instant verification.
              </p>
            </div>

            {/* Stepper Status Badge & Reset */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>STAGE 0{currentStage} OF 04</span>
              </div>

              {currentStage > 1 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-white text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer transition-colors shadow-2xs"
                  title="Reset to Step 1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress Stepper Tabs */}
          <nav aria-label="Claim Progress Steps" className="flex items-center gap-2 overflow-x-auto pb-1">
            {stageLabels.map((st) => {
              const isCurrent = currentStage === st.id;
              const isCompleted = currentStage > st.id;
              const isUnlocked = st.id <= maxUnlockedStage;

              return (
                <button
                  key={st.id}
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => setCurrentStage(st.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isCurrent
                      ? "bg-slate-900 text-white shadow-2xs"
                      : isCompleted
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{st.label}</span>
                  {isCompleted && <span>✓</span>}
                </button>
              );
            })}
          </nav>

          {/* Stage Card */}
          <div className="w-full">
            {/* Stage 1: Active Policy Selection */}
            {currentStage === 1 && (
              <div className="animate-in fade-in zoom-in-98 duration-200 w-full">
                <StagePolicySelect
                  selectedPolicyId={policy?.id}
                  onPolicySelected={handlePolicySelected}
                  onNext={handleNextFromStage1}
                  isActive={true}
                  stageNumber={1}
                  showStageBadge={false}
                  member={member}
                  policies={policies}
                />
              </div>
            )}

            {/* Stage 2: Claim Form Upload */}
            {currentStage === 2 && (
              <div className="animate-in fade-in zoom-in-98 duration-200 w-full">
                <StageClaimFormUpload
                  initialFile={claimForm}
                  onFileUploaded={handleClaimFormUploaded}
                  onNext={handleNextFromStage2}
                  onBack={() => setCurrentStage(1)}
                  isActive={true}
                  stageNumber={2}
                  showStageBadge={false}
                  backLabel="Back: Select Policy"
                />
              </div>
            )}

            {/* Stage 3: Supporting Evidence */}
            {currentStage === 3 && (
              <div className="animate-in fade-in zoom-in-98 duration-200 w-full">
                <StageSupportingEvidence
                  initialFiles={evidenceFiles}
                  onFilesChanged={setEvidenceFiles}
                  onNext={handleNextFromStage3}
                  onBack={() => setCurrentStage(2)}
                  isActive={true}
                  stageNumber={3}
                  showStageBadge={false}
                  backLabel="Back: Claim Form"
                />
              </div>
            )}

            {/* Stage 4: Review & Submit */}
            {currentStage === 4 && (
              <div className="animate-in fade-in zoom-in-98 duration-200 w-full">
                <ClaimSubmitBar
                  member={member}
                  policy={policy}
                  claimForm={claimForm}
                  evidenceFiles={evidenceFiles}
                  onBack={() => setCurrentStage(3)}
                  showStageBadge={false}
                  dashboardUrl="/portal"
                  dashboardLabel="Go to Claims Dashboard"
                  backLabel="Back: Supporting Evidence"
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Institutional Legal Footer */}
      <PortalFooter />
    </div>
  );
}
