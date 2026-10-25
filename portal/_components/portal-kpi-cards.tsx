"use client";

import React from "react";
import { Receipt, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import type { PortalKpiData } from "@/actions/portal-dashboard";

interface PortalKpiCardsProps {
  kpis?: PortalKpiData;
}

export function PortalKpiCards({ kpis }: PortalKpiCardsProps) {
  const totalClaims = kpis?.totalClaims ?? 0;
  const approvedClaims = kpis?.approvedClaims ?? 0;
  const approvedPercentage = kpis?.approvedPercentage ?? 0;
  const inReviewClaims = kpis?.inReviewClaims ?? 0;
  const inReviewPercentage = kpis?.inReviewPercentage ?? 0;
  const rejectedClaims = kpis?.rejectedClaims ?? 0;
  const rejectedPercentage = kpis?.rejectedPercentage ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* KPI 1: Total Claims */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                Total Claims
              </h3>
            </div>
          </div>
        </div>
        <div>
          <div className="text-4xl font-bold text-slate-900 tracking-tight mb-1 font-mono">
            {totalClaims.toLocaleString("en-US")}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-3">
            All submitted claims
          </div>
        </div>
      </div>

      {/* KPI 2: Approved Claims */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-500/20 text-[#006948]">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                Approved
              </h3>
            </div>
          </div>
          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-500/20">
            {approvedPercentage}% STP
          </span>
        </div>
        <div>
          <div className="text-4xl font-bold text-slate-900 tracking-tight mb-2 font-mono">
            {approvedClaims.toLocaleString("en-US")}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-1.5">
            <div
              className="bg-[#059669] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(approvedPercentage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Auto-settled &amp; paid
          </div>
        </div>
      </div>

      {/* KPI 3: In Review */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-500/20 text-amber-600">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                In Review
              </h3>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Active
          </span>
        </div>
        <div>
          <div className="text-4xl font-bold text-slate-900 tracking-tight mb-2 font-mono">
            {inReviewClaims.toLocaleString("en-US")}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-1.5">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(inReviewPercentage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Under active adjudication
          </div>
        </div>
      </div>

      {/* KPI 4: Rejected */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center border border-red-200 text-red-500">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-[11px] text-slate-500 uppercase tracking-wider">
                Rejected
              </h3>
            </div>
          </div>
          <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
            {rejectedPercentage}% Flagged
          </span>
        </div>
        <div>
          <div className="text-4xl font-bold text-slate-900 tracking-tight mb-2 font-mono">
            {rejectedClaims.toLocaleString("en-US")}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-1.5">
            <div
              className="bg-red-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(rejectedPercentage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Requires member review
          </div>
        </div>
      </div>
    </div>
  );
}
