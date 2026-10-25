import React from "react";
import Link from "next/link";

export function PortalFooter() {
  return (
    <footer className="w-full bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs sm:text-sm text-slate-500 text-center md:text-left">
          ClaimSetu • Protected under Nepal Insurance Act 2079 (Sec 123) &amp; NIA Directives 2081
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link
            href="#"
            className="text-xs sm:text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            Statutory Terms
          </Link>
          <Link
            href="#"
            className="text-xs sm:text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            Hospital Empanelment
          </Link>
        </div>
      </div>
    </footer>
  );
}
