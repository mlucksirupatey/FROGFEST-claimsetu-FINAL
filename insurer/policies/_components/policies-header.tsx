"use client";

import React from "react";
import { Plus } from "lucide-react";

interface PoliciesHeaderProps {
  totalPolicies?: number;
  onAddNewClick?: () => void;
}

export function PoliciesHeader({
  totalPolicies = 6,
  onAddNewClick,
}: PoliciesHeaderProps) {
  const scrollToForm = () => {
    if (onAddNewClick) {
      onAddNewClick();
    } else {
      const el = document.getElementById("add-policy-block");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 sm:px-8 py-5 shrink-0 sticky top-0 z-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Company Insurance Policies
          </h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            View and manage active company policies or add new underwriter coverage.
          </p>
        </div>

        {/* Quick Summary Chips & Tactile Action */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{totalPolicies} Policies Active</span>
          </div>

          <button
            type="button"
            onClick={scrollToForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#064E3B] text-white border-2 border-[#022c22] text-sm font-bold shadow-tactile hover:translate-y-[2px] active:shadow-tactile-pressed transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Policy</span>
          </button>
        </div>
      </div>
    </header>
  );
}
