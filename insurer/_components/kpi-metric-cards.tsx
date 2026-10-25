import React from "react";
import { Clock, CheckCircle2, AlertTriangle, TrendingUp, AlertCircle } from "lucide-react";
import type { KpiData } from "@/actions/insurer-dashboard";

interface KpiMetricCardsProps {
  kpis?: KpiData;
}

export function KpiMetricCards({ kpis }: KpiMetricCardsProps) {
  const pendingCount = kpis?.totalPending ?? 0;
  const pendingTrend = kpis?.totalPendingTrend ?? "+12%";
  const cleanCount = kpis?.cleanClaims ?? 0;
  const cleanPercentage = kpis?.cleanPercentage ?? 0;
  const cleanVsTarget = kpis?.cleanVsTarget ?? "+8.4%";
  const flaggedCount = kpis?.flaggedClaims ?? 0;
  const flaggedPercentage = kpis?.flaggedPercentage ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* KPI 1: Pending */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs font-mono uppercase tracking-wider text-slate-500">
              Total Claims Pending
            </h3>
          </div>
          <span className="text-xs font-bold text-[#064E3B] bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5" />
            {pendingTrend}
          </span>
        </div>

        <div>
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <div className="text-4xl font-bold text-slate-900 mb-1 tracking-tight font-sans">
                {pendingCount.toLocaleString()}
              </div>
              <div className="flex items-center text-xs text-slate-500 font-medium">
                <span>vs last week</span>
              </div>
            </div>

            {/* Sparkline Graph */}
            <div className="w-28 h-12 relative">
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 110 44"
                fill="none"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="kpiPendingSparkline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 38 Q 18 36, 32 26 T 64 22 T 88 12 T 110 4 L 110 44 L 0 44 Z"
                  fill="url(#kpiPendingSparkline)"
                />
                <path
                  d="M 0 38 Q 18 36, 32 26 T 64 22 T 88 12 T 110 4"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="110" cy="4" r="3" fill="#10B981" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* KPI 2: Clean */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-200/80 text-[#10B981]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs font-mono uppercase tracking-wider text-slate-500">
              Clean Claims
            </h3>
          </div>
          <span className="text-xs font-bold text-[#10B981] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono">
            {cleanPercentage}% STP
          </span>
        </div>

        <div>
          <div className="flex items-end justify-between mb-2">
            <div className="text-4xl font-bold text-slate-900 tracking-tight font-sans">
              {cleanCount.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-500">
              <span className="text-[#10B981] font-bold">{cleanVsTarget}</span> vs target
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
            <div
              className="bg-[#10B981] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(cleanPercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Auto-approved (Zero touch)</span>
            <span className="font-bold text-slate-800">Target: 65%</span>
          </div>
        </div>
      </div>

      {/* KPI 3: Flagged */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors relative overflow-hidden">
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center border border-red-200 text-[#EF4444]">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-xs font-mono uppercase tracking-wider text-slate-500">
              Flagged for Defect
            </h3>
          </div>
          <span className="text-xs font-bold text-[#EF4444] bg-red-50 border border-red-200 px-2 py-0.5 rounded font-mono">
            {flaggedPercentage}% rate
          </span>
        </div>

        <div className="relative z-10">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <div className="text-4xl font-bold text-slate-900 mb-1 tracking-tight font-sans">
                {flaggedCount.toLocaleString()}
              </div>
              <div className="flex items-center text-xs text-slate-500 font-medium gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
                <span className="text-[#EF4444] font-bold">Action needed:</span>
                <span>Manual review</span>
              </div>
            </div>

            {/* Sparkline Graph */}
            <div className="w-28 h-12 relative">
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 110 44"
                fill="none"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="kpiFlaggedSparkline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 14 Q 24 16, 42 28 T 72 32 T 92 18 T 110 10 L 110 44 L 0 44 Z"
                  fill="url(#kpiFlaggedSparkline)"
                />
                <path
                  d="M 0 14 Q 24 16, 42 28 T 72 32 T 92 18 T 110 10"
                  stroke="#EF4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="110" cy="10" r="3" fill="#EF4444" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
