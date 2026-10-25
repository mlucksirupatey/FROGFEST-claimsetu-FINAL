"use client";

import React, { useState } from "react";
import { IdCard, CheckCircle2, RefreshCw, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { ActivePolicy } from "./stage-policy-select";

export interface VerifiedMember {
  memberId: string;
  name: string;
  panOrCitizenship: string;
  dob: string;
  phone: string;
  userId?: number | null;
  policyId?: number;
  policy?: ActivePolicy;
}

interface StageMemberLookupProps {
  initialMemberId?: string;
  isVerified?: boolean;
  onVerified: (member: VerifiedMember) => void;
  onNext?: () => void;
  isActive?: boolean;
  onLookup?: (memberId: string) => Promise<VerifiedMember | null>;
}

export const mockMemberDatabase: Record<string, VerifiedMember> = {
  "MEM-9841-NP": {
    memberId: "MEM-9841-NP",
    name: "Ram Bahadur Thapa",
    panOrCitizenship: "27-01-79-10943",
    dob: "1988/04/12",
    phone: "+977 9841******",
  },
  "MEM-5137-NP": {
    memberId: "MEM-5137-NP",
    name: "Sita Devi Gurung",
    panOrCitizenship: "12-01-78-44102",
    dob: "1992/08/19",
    phone: "+977 9851******",
  },
  "MEM-7284-NP": {
    memberId: "MEM-7284-NP",
    name: "Bikash Gurung",
    panOrCitizenship: "34-02-76-90218",
    dob: "1985/11/04",
    phone: "+977 9860******",
  },
};

const DEMO_MEMBERS = [
  { id: "MEM-9841-NP", label: "Ram Thapa (Shikhar)" },
  { id: "MEM-5137-NP", label: "Sita Gurung (SALICO Plan 1)" },
  { id: "MEM-4412-NP", label: "Prakash Adhikari (SALICO Plan 2)" },
  { id: "MEM-7284-NP", label: "Bikash Gurung (Shikhar)" },
];

export function StageMemberLookup({
  initialMemberId = "",
  isVerified: initialVerified = false,
  onVerified,
  onNext,
  isActive = true,
  onLookup,
}: StageMemberLookupProps) {
  const [memberId, setMemberId] = useState(initialMemberId);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [verifiedMember, setVerifiedMember] = useState<VerifiedMember | null>(null);

  const executeLookup = async (lookupId: string) => {
    const cleanId = lookupId.trim().toUpperCase();
    if (!cleanId) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      if (onLookup) {
        const result = await onLookup(cleanId);
        if (result) {
          setVerifiedMember(result);
          onVerified(result);
        } else {
          setSearchError(`Member ID "${cleanId}" not found in member registry.`);
          setVerifiedMember(null);
        }
      } else {
        // Query live API endpoint
        const res = await fetch(
          `/api/insurer/members/lookup?memberId=${encodeURIComponent(cleanId)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.found && data.member) {
            setVerifiedMember(data.member);
            onVerified(data.member);
          } else {
            setSearchError(`Member ID "${cleanId}" not found in member registry.`);
            setVerifiedMember(null);
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          // Fallback to mock DB if offline/testing
          if (mockMemberDatabase[cleanId]) {
            const match = mockMemberDatabase[cleanId];
            setVerifiedMember(match);
            onVerified(match);
          } else {
            setSearchError(
              errData.error || `Member ID "${cleanId}" not found in insurer member registry.`
            );
            setVerifiedMember(null);
          }
        }
      }
    } catch (err: any) {
      console.warn("[Member lookup network fallback]", err);
      if (mockMemberDatabase[cleanId]) {
        const match = mockMemberDatabase[cleanId];
        setVerifiedMember(match);
        onVerified(match);
      } else {
        setSearchError(`Network error while looking up "${cleanId}". Please try again.`);
        setVerifiedMember(null);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    executeLookup(memberId);
  };

  const handleQuickSelect = (id: string) => {
    setMemberId(id);
    executeLookup(id);
  };

  return (
    <section
      id="stage-member-lookup"
      className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs w-full transition-all"
      data-purpose="stage-member-lookup"
    >
      {/* Header Row: Stage indicator & Stage Badge */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
            1
          </div>
          <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-slate-900 uppercase ml-2.5">
            MEMBER ID LOOKUP
          </span>
        </div>

        <div className="border border-emerald-300 bg-emerald-50 text-emerald-700 font-mono text-[11px] font-bold px-3 py-0.5 rounded-md">
          STAGE 01 OF 05
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleLookup} className="space-y-4">
        <div>
          <label
            htmlFor="member-id-input"
            className="block font-mono text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
          >
            ENTER MEMBER ID <span className="text-rose-500">*</span>
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <IdCard className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="member-id-input"
                type="text"
                value={memberId}
                onChange={(e) => {
                  setMemberId(e.target.value);
                  setSearchError(null);
                }}
                placeholder="e.g. MEM-9841-NP or Citizenship ID"
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-2xs transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSearching || !memberId.trim()}
              className="inline-flex items-center justify-center gap-2 bg-[#0B1527] hover:bg-slate-800 active:scale-[0.99] text-white font-semibold text-sm px-6 py-2.5 rounded-lg shadow-sm transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching DB...</span>
                </>
              ) : (
                <>
                  <span>Lookup Member</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Quick Demo Selector Chips */}
          <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Demo Members:</span>
            </span>
            {DEMO_MEMBERS.map((dm) => (
              <button
                key={dm.id}
                type="button"
                onClick={() => handleQuickSelect(dm.id)}
                className="px-2.5 py-1 rounded-md border border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/60 text-slate-700 hover:text-emerald-800 font-mono text-[11px] transition-all cursor-pointer"
              >
                {dm.id}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert Box */}
        {searchError && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {/* Verified State Box */}
        {verifiedMember && (
          <div className="mt-5 p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all animate-in fade-in duration-300">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white border border-emerald-300 text-emerald-700 text-xs font-mono font-bold shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                  <span>MEMBER VERIFIED ✓</span>
                </span>
                <span className="font-mono text-xs text-emerald-800 font-semibold">
                  {verifiedMember.memberId}
                </span>
              </div>

              <div className="text-sm font-semibold text-slate-900 font-sans">
                <span>{verifiedMember.name}</span>
                <span className="text-slate-400 mx-2">•</span>
                <span className="font-mono text-slate-700 text-xs">
                  Citizen / PAN: {verifiedMember.panOrCitizenship}
                </span>
              </div>

              {verifiedMember.policy && (
                <div className="text-xs text-slate-600 font-mono">
                  Enrolled Policy: <span className="font-bold text-slate-800">{verifiedMember.policy.name}</span>
                </div>
              )}
            </div>

            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#064E3B] hover:bg-[#04382a] text-white border-2 border-[#022c22] rounded-md font-bold text-xs shadow-tactile hover:translate-y-[1px] active:shadow-tactile-pressed transition-all shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <span>Next: Select Policy</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </form>
    </section>
  );
}
