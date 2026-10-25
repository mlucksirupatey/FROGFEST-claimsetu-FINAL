import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface BrandLogoProps {
  className?: string;
  showBadge?: boolean;
  href?: string;
}

export function BrandLogo({
  className = "",
  showBadge = true,
  href = "/insurer",
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-2 group ${className}`}
      data-purpose="brand-header"
    >
      {/* Brand Icon */}
      <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-slate-200/90 shadow-xs bg-emerald-50 flex items-center justify-center">
        <Image
          src="/claimsetu-logo.webp"
          alt="ClaimSetu Logo"
          width={36}
          height={36}
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to SVG shield if image fails to render
            e.currentTarget.style.display = "none";
          }}
        />
        <ShieldCheck className="w-5 h-5 text-emerald-700 absolute pointer-events-none opacity-0 [img:not([style*='display: none'])~&]:opacity-0" />
      </div>

      {/* Brand Title */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-[#0F172A]">
            ClaimSetu
          </span>
          {showBadge && (
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Insurer
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-slate-500 tracking-tight">
          Adjudication Cockpit
        </span>
      </div>
    </Link>
  );
}
