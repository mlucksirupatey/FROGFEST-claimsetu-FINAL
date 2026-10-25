"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, Loader2, User, Building2 } from "lucide-react";

export function RegistrationGateways() {
  const router = useRouter();
  const [navigatingRole, setNavigatingRole] = useState<"policyholder" | "insurer" | null>(null);

  const handleNavigate = (path: string, role: "policyholder" | "insurer") => {
    setNavigatingRole(role);
    router.push(path);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
      {/* Top Tag Badge */}
      <div className="inline-flex items-center justify-center px-4 py-1 rounded-full border-[1.5px] border-black bg-white text-[11px] font-mono font-bold tracking-widest uppercase text-slate-800 shadow-[2px_2px_0px_0px_#000000] mb-4">
        DUAL PORTAL ARCHITECTURE
      </div>

      {/* Main Header / Topic */}
      <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-slate-900 tracking-tight text-center leading-tight">
        One Engine. Tailored Direct Gateways.
      </h1>

      {/* Tagline contextualized to ClaimSetu */}
      <p className="mt-3.5 text-sm sm:text-base text-slate-600 font-medium text-center max-w-2xl mx-auto leading-relaxed">
        Whether you are a policyholder submitting raw hospital bills for instant reimbursement or an insurance claims officer managing compliance queues, ClaimSetu gives you dedicated workflows.
      </p>

      {/* Dual Cards Grid */}
      <div className="mt-10 sm:mt-12 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Card 1: For Policyholders */}
        <div className="bg-white border-[2.5px] border-black rounded-[22px] shadow-[7px_7px_0px_0px_#000000] p-7 sm:p-9 flex flex-col justify-between transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[9px_9px_0px_0px_#000000]">
          <div>
            {/* Card Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-emerald-50 border border-emerald-300 text-[#064E3B] rounded-md">
                <User className="w-4 h-4 stroke-[2.5]" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
                MEMBER REIMBURSEMENT
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              For Policyholders
            </h2>
            <p className="mt-2.5 text-sm text-slate-600 font-medium leading-relaxed">
              Take control of your medical reimbursement without bureaucratic delays or confusing tariff deductions.
            </p>

            {/* Checklist Items */}
            <div className="mt-7 space-y-5 text-sm leading-snug">
              {/* Feature 1 */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-[4px] border-[1.5px] border-emerald-600 bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <strong className="font-bold text-slate-900">
                    Upload bills &amp; discharge summaries directly:
                  </strong>{" "}
                  <span className="text-slate-600">
                    Supports multi-page phone photos, PDFs, and laboratory slips.
                  </span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-[4px] border-[1.5px] border-emerald-600 bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <strong className="font-bold text-slate-900">
                    Real-time OCR extraction in &lt;1 sec:
                  </strong>{" "}
                  <span className="text-slate-600">
                    High-precision text parsing runs before insurer handoff to guarantee completeness.
                  </span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-[4px] border-[1.5px] border-emerald-600 bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <strong className="font-bold text-slate-900">
                    Live 5-stage claim status &amp; transparent reason trace:
                  </strong>{" "}
                  <span className="text-slate-600">
                    Know exactly why an item was approved or flagged instantly.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section with Direct Action Button */}
          <div>
            <div className="border-t border-slate-200 mt-8 mb-6" />
            <div className="w-full flex justify-center">
              <button
                type="button"
                onClick={() => handleNavigate("/register/policyholder", "policyholder")}
                disabled={navigatingRole !== null}
                className="w-full sm:w-auto px-6 py-3 bg-[#064E3B] hover:bg-[#043e2f] active:bg-[#022e23] text-white border-[1.5px] border-black rounded-[6px] font-mono font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {navigatingRole === "policyholder" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>OPENING GATEWAY...</span>
                  </>
                ) : (
                  <>
                    <span>REGISTER NEW POLICYHOLDER</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: For Insurers, TPAs & Adjudicators */}
        <div className="bg-white border-[2.5px] border-black rounded-[22px] shadow-[7px_7px_0px_0px_#000000] p-7 sm:p-9 flex flex-col justify-between transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[9px_9px_0px_0px_#000000]">
          <div>
            {/* Card Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-slate-100 border border-slate-300 text-slate-800 rounded-md">
                <Building2 className="w-4 h-4 stroke-[2.5]" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                INSTITUTIONAL COCKPIT
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              For Insurers, TPAs &amp; Adjudicators
            </h2>
            <p className="mt-2.5 text-sm text-slate-600 font-medium leading-relaxed">
              Streamline claims operations, eliminate manual bill line audit, and maintain full compliance with Nepal Insurance Authority guidelines.
            </p>

            {/* Checklist Items */}
            <div className="mt-7 space-y-5 text-sm leading-snug">
              {/* Feature 1 */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-[4px] border-[1.5px] border-slate-700 bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <strong className="font-bold text-slate-900">
                    Upload Policyholder Registry (CSV):
                  </strong>{" "}
                  <span className="text-slate-600">
                    Instant automated matching of active policy terms, limits, and deductible conditions.
                  </span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-[4px] border-[1.5px] border-slate-700 bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <strong className="font-bold text-slate-900">
                    Review pre-validated structured records:
                  </strong>{" "}
                  <span className="text-slate-600">
                    Replace paper stacks with deterministic ledger audits and item-by-item flags.
                  </span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-[4px] border-[1.5px] border-slate-700 bg-slate-100 text-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <strong className="font-bold text-slate-900">
                    Deterministic HIPML engine &amp; statutory 30-day SLA:
                  </strong>{" "}
                  <span className="text-slate-600">
                    Execute Vitraya rule models with pgvector RAG citations to maintain Insurance Act 2079 compliance.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section with Direct Action Button */}
          <div>
            <div className="border-t border-slate-200 mt-8 mb-6" />
            <div className="w-full flex justify-center">
              <button
                type="button"
                onClick={() => handleNavigate("/register/insurer", "insurer")}
                disabled={navigatingRole !== null}
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-black active:bg-slate-800 text-white border-[1.5px] border-black rounded-[6px] font-mono font-bold text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {navigatingRole === "insurer" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>OPENING GATEWAY...</span>
                  </>
                ) : (
                  <>
                    <span>REGISTER NEW INSURER</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Login Navigation Link */}
      <div className="mt-8 text-center text-xs sm:text-sm text-slate-600 font-medium">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-bold text-slate-900 underline underline-offset-4 hover:text-[#064E3B] transition-colors"
        >
          Sign in here
        </Link>
      </div>
    </div>
  );
}

