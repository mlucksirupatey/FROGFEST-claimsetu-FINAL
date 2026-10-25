"use client";

import React from "react";
import Link from "next/link";
import { Search, UploadCloud, Menu } from "lucide-react";

interface DashboardHeaderProps {
  onOpenMobileSidebar?: () => void;
}

export function DashboardHeader({ onOpenMobileSidebar }: DashboardHeaderProps) {
  return (
    <header className="px-6 sm:px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-xs border-b border-slate-200/80 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-sans">
            Institutional Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            Real-time claim flow &amp; SLA tracking.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        {/* Search Input */}
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Claim ID or Entity..."
            className="bg-white border-2 border-slate-300 rounded-md py-2 pl-10 pr-4 text-sm w-64 lg:w-72 focus:outline-hidden focus:border-[#064E3B] transition-all text-slate-800 placeholder:text-slate-400 shadow-xs"
          />
        </div>

        {/* Upload New Claim Button (Tactile Edition) */}
        <Link
          href="/insurer/claims/new"
          className="bg-[#064E3B] text-white border-2 border-[#022c22] rounded-md py-2 px-4 sm:px-5 font-bold text-sm shadow-tactile hover:translate-y-[2px] active:shadow-tactile-pressed transition-all flex items-center gap-2 shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Claim</span>
        </Link>
      </div>
    </header>
  );
}
