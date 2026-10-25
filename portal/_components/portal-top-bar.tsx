"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { User, LogOut, Plus, ChevronDown, ShieldCheck } from "lucide-react";

interface PortalTopBarProps {
  showAddClaimButton?: boolean;
  userName?: string;
  userEmail?: string;
}

export function PortalTopBar({
  showAddClaimButton,
  userName: propUserName,
  userEmail: propUserEmail,
}: PortalTopBarProps = {}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isNewClaimPage = pathname === "/portal/newclaim" || pathname === "/newclaim";
  const shouldShowAddClaim = showAddClaimButton ?? !isNewClaimPage;

  const userName = propUserName || session?.user?.name || "Member";
  const userEmail = propUserEmail || session?.user?.email || "member@claimsetu.np";

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto h-20 px-6 sm:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo & Title with Clickable Profile/Menu toggle */}
        <Link href="/portal">
          <div className="relative flex gap-2 cursor-pointer">

            <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform">
              <Image
                src="/claimsetu-logo.webp"
                alt="ClaimSetu Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900 group-hover:text-[#064E3B] transition-colors">
              ClaimSetu
            </span>


          </div>
        </Link>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3 relative" ref={menuRef}>
          {/* + Add New Claim CTA (hidden on /portal/newclaim) */}
          {shouldShowAddClaim && (
            <Link
              href="/portal/newclaim"
              className="inline-flex items-center gap-1.5 bg-[#064E3B] hover:bg-[#044e3b] text-white px-3.5 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm border border-[#0F172A] shadow-[2px_2px_0px_0px_#0F172A] transition-all active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
              <span>Add New Claim</span>
            </Link>
          )}

          {/* Member Profile Avatar Circle Trigger */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 hover:border-slate-400 bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#064E3B]/20"
            title="Member Profile & Menu"
            aria-label="Member Profile & Menu"
            aria-expanded={menuOpen}
          >
            <User className="w-5 h-5 stroke-[1.8]" />
          </button>

          {/* Small Profile & Logout Extension Popover */}
          {menuOpen && (
            <div className="absolute right-0 top-12 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Header Details */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 text-[#064E3B] flex items-center justify-center font-bold text-sm">
                    {userName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {userName}
                    </p>
                    <p className="text-xs text-slate-500 font-mono truncate">
                      {userEmail}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-mono font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Verified Policyholder</span>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="p-1 space-y-0.5">
                <Link
                  href="/portal/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#064E3B] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Profile</span>
                </Link>
              </div>

              {/* Logout Action */}
              <div className="border-t border-slate-100 p-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header >
  );
}
