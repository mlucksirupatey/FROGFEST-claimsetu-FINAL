import React from "react";
import Link from "next/link";

export function DashboardFooter() {
  return (
    <footer className="flex flex-col sm:flex-row justify-between items-center px-6 sm:px-8 py-6 w-full bg-white/50 border-t border-slate-200 shrink-0 mt-12 gap-4">
      <div className="font-bold text-slate-900 text-sm tracking-tight">
        ClaimSetu
      </div>
      <div className="text-slate-500 text-xs font-mono font-medium text-center sm:text-left">
        © 2024 ClaimSetu. NIA Compliant (Insurance Act 2079 Section 123 30-Day Mandate).
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-500 font-medium">
        <Link href="#privacy" className="hover:text-[#064E3B] transition-colors">
          Privacy Policy
        </Link>
        <Link href="#terms" className="hover:text-[#064E3B] transition-colors">
          Terms of Service
        </Link>
        <Link href="#security" className="hover:text-[#064E3B] transition-colors">
          Security
        </Link>

      </div>
    </footer>
  );
}
