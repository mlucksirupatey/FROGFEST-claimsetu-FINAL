"use client";

import React from "react";
import Link from "next/link";
import { User, Building2 } from "lucide-react";

interface RegisterRoleToggleProps {
  activeRole: "policyholder" | "insurer";
}

export function RegisterRoleToggle({ activeRole }: RegisterRoleToggleProps) {
  return (
    <div className="w-full max-w-[580px] bg-white border-[2.5px] border-black shadow-[6px_6px_0px_0px_#000000] p-3 sm:p-3.5 mb-6 flex items-center justify-center">
      <div className="inline-flex items-center border-[1.5px] border-black p-1 bg-white">
        {/* Policyholder Tab */}
        <Link
          href="/register/policyholder"
          className={`flex items-center justify-center gap-2 py-2 px-3.5 sm:px-5 text-xs font-mono font-bold uppercase tracking-wider transition-all border ${
            activeRole === "policyholder"
              ? "bg-[#064E3B] text-white border-black"
              : "bg-transparent text-slate-800 hover:text-black border-transparent hover:bg-slate-50"
          }`}
        >
          <User className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
          <span>POLICYHOLDER</span>
        </Link>

        {/* Insurer Tab */}
        <Link
          href="/register/insurer"
          className={`flex items-center justify-center gap-2 py-2 px-3.5 sm:px-5 text-xs font-mono font-bold uppercase tracking-wider transition-all border ${
            activeRole === "insurer"
              ? "bg-[#064E3B] text-white border-black"
              : "bg-transparent text-slate-800 hover:text-black border-transparent hover:bg-slate-50"
          }`}
        >
          <Building2 className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
          <span>INSURANCE INSTITUTION</span>
        </Link>
      </div>
    </div>
  );
}
