"use client";

import React from "react";
import { Menu, Search, Bell, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AppHeaderProps {
  onOpenMobileSidebar?: () => void;
  title?: string;
  subtitle?: string;
}

export function AppHeader({
  onOpenMobileSidebar,
  title = "Adjudication Queue",
  subtitle = "Nepal Insurance Authority (NIA) Direct Feed",
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-6 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Header Title & Subtitle */}
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-500 font-mono hidden sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Statutory SLA Status Tag */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>SLA SAFE-HARBOR</span>
          <span className="text-emerald-600 font-normal">|</span>
          <span className="font-semibold">0 OVERDUE</span>
        </div>

        {/* Quick Search */}
        <div className="relative hidden xl:block w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Policy, Bill or NIA ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all font-sans"
          />
        </div>

        {/* Regulatory Alert Notification icon */}
        <button
          type="button"
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors relative"
          title="Regulatory Notices"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
