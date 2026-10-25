"use client";

import React from "react";
import { Users, UserPlus } from "lucide-react";

interface PolicyHoldersHeaderProps {
  totalMembers: number;
  onAddSingle?: () => void;
}

export function PolicyHoldersHeader({
  totalMembers,
  onAddSingle,
}: PolicyHoldersHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 sm:px-8 py-5 shrink-0 sticky top-0 z-20 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Policy Holders Registry
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            Manage insured beneficiaries, corporate census rosters, and
            automated eligibility verification.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Total Count Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>{totalMembers.toLocaleString()} Total Policyholders</span>
          </div>

          {/* Add Single Policyholder Button */}
          {onAddSingle && (
            <button
              type="button"
              onClick={onAddSingle}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#064E3B] hover:bg-[#04382a] text-white border-2 border-[#022c22] rounded-md font-bold text-xs shadow-tactile hover:translate-y-[1px] active:shadow-tactile-pressed transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Single Policyholder</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
