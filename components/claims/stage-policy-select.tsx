"use client";

import React, { useState } from "react";
import { Shield, ChevronDown, CheckCircle2, ArrowRight, ArrowLeft, UserCheck } from "lucide-react";
import { VerifiedMember } from "./stage-member-lookup";

export interface ActivePolicy {
  id: string;
  name: string;
  policyNo: string;
  sumInsured: number;
  remainingSum: number;
  status: string;
  validUntil: string;
  copayPercent: number;
}

export const mockUserPolicies: ActivePolicy[] = [
  {
    id: "SHK-8921-2081",
    name: "Shikhar Aarogya Family Health Plan",
    policyNo: "SHK-8921-2081",
    sumInsured: 500000,
    remainingSum: 385000,
    status: "Active • NIA Regulated • Cashless & Reimbursement",
    validUntil: "2082-03-31 (BS)",
    copayPercent: 0,
  },
  {
    id: "HIM-4412-2081",
    name: "Himalayan Suraksha OPD & Diagnostic Rider",
    policyNo: "HIM-4412-2081",
    sumInsured: 50000,
    remainingSum: 42000,
    status: "Active • Co-Pay 10% • Reimbursement Only",
    validUntil: "2082-03-31 (BS)",
    copayPercent: 10,
  },
  {
    id: "PRB-9921-2080",
    name: "Prabhu Health Shield Inpatient Coverage",
    policyNo: "PRB-9921-2080",
    sumInsured: 250000,
    remainingSum: 200000,
    status: "Active • Tier-1 Hospitals Only",
    validUntil: "2082-01-15 (BS)",
    copayPercent: 5,
  },
];

interface StagePolicySelectProps {
  selectedPolicyId?: string;
  onPolicySelected: (policy: ActivePolicy) => void;
  onNext?: () => void;
  onBack?: () => void;
  isActive?: boolean;
  stageNumber?: number;
  stageBadge?: string;
  showStageBadge?: boolean;
  backLabel?: string;
  member?: VerifiedMember | null;
  policies?: ActivePolicy[];
}

export function StagePolicySelect({
  selectedPolicyId,
  onPolicySelected,
  onNext,
  onBack,
  isActive = true,
  stageNumber = 2,
  stageBadge = "STAGE 02 OF 05",
  showStageBadge = true,
  backLabel = "Back: Member Lookup",
  member,
  policies,
}: StagePolicySelectProps) {
  const availablePolicies = (policies && policies.length > 0) ? policies : mockUserPolicies;
  const [selectedId, setSelectedId] = useState(selectedPolicyId || availablePolicies[0]?.id);

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedId(newId);
    const chosen =
      availablePolicies.find((p) => p.id === newId) || availablePolicies[0];
    onPolicySelected(chosen);
  };

  const selectedPolicy =
    availablePolicies.find((p) => p.id === selectedId) || availablePolicies[0];

  return (
    <section
      id="stage-policy-select"
      className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs w-full transition-all"
      data-purpose="stage-policy-select"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
            {stageNumber}
          </div>
          <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-slate-900 uppercase ml-2.5">
            SELECT ACTIVE POLICY
          </span>
        </div>

        {showStageBadge && (
          <div className="border border-emerald-300 bg-emerald-50 text-emerald-700 font-mono text-[11px] font-bold px-3 py-0.5 rounded-md">
            {stageBadge}
          </div>
        )}
      </div>

      {/* Verified Member Info Strip (Shown for Policyholders where member ID is pre-filled) */}
      {member && (
        <div className="mb-5 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 font-sans">
                  {member.name}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  Verified Member
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Member ID: <strong className="text-slate-800">{member.memberId}</strong> • Citizenship: {member.panOrCitizenship}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Selection */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="policy-dropdown"
            className="block font-mono text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
          >
            CHOOSE POLICY <span className="text-rose-500">*</span>
          </label>

          <div className="relative">
            <Shield className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              id="policy-dropdown"
              value={selectedId}
              onChange={handleDropdownChange}
              className="w-full pl-11 pr-10 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 font-sans text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-2xs appearance-none cursor-pointer transition-all"
            >
              {availablePolicies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (POL #{p.policyNo})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Selected Policy Detail Card */}
        {selectedPolicy && (
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-600">
              <span>Coverage Limit (Sum Insured):</span>
              <strong className="text-slate-900 font-sans text-sm">
                Rs. {selectedPolicy.sumInsured.toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Available Balance:</span>
              <strong className="text-emerald-700 font-sans text-sm">
                Rs. {selectedPolicy.remainingSum.toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between items-center text-slate-600 border-t border-slate-200 pt-2 mt-1">
              <span>Statutory Compliance:</span>
              <span className="text-slate-700 font-sans">{selectedPolicy.status}</span>
            </div>
          </div>
        )}

        {/* Navigation Action Row */}
        <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100 mt-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-bold text-xs shadow-2xs hover:translate-y-[1px] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{backLabel}</span>
            </button>
          )}

          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#064E3B] hover:bg-[#04382a] text-white border-2 border-[#022c22] rounded-md font-bold text-xs shadow-tactile hover:translate-y-[1px] active:shadow-tactile-pressed transition-all cursor-pointer ml-auto"
            >
              <span>Next: Upload Claim Form</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
