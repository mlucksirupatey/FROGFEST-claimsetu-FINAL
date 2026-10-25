import React from "react";
import Link from "next/link";
import Image from "next/image";

export function AuthHeader() {
  return (
    <header className="sticky top-0 z-50 h-16 w-full bg-white/95 backdrop-blur-md border-b-[1.5px] border-[#0F172A] px-6 lg:px-12 flex items-center justify-center transition-colors shadow-xs">
      <Link className="flex items-center gap-3 group" href="/">
        <div className="w-8 h-8 rounded-[4px] bg-[#0B1528] overflow-hidden flex items-center justify-center shrink-0 p-0.5">
          <Image
            alt="ClaimSetu Logo"
            className="w-full h-full object-contain"
            src="/claimsetu-logo.webp"
            width={32}
            height={32}
            priority
          />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-sans font-bold text-lg tracking-tight text-[#0F172A]">
            ClaimSetu
          </span>
        </div>
      </Link>
    </header>
  );
}
