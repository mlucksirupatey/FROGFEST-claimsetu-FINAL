"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Shield,
  Users,
  PlusCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  User,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/insurer",
    icon: LayoutDashboard,
  },
  {
    label: "Policies",
    href: "/insurer/policies",
    icon: Shield,
  },
  {
    label: "Policy Holders",
    href: "/insurer/policy-holders",
    icon: Users,
  },
  {
    label: "New Claim",
    href: "/insurer/claims/new",
    icon: PlusCircle,
  },

];

interface InsurerNavbarProps {
  className?: string;
  onCloseMobile?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  showCollapseToggle?: boolean;
  variant?: "sidebar" | "top";
}

export function InsurerNavbar({
  className = "",
  onCloseMobile,
  collapsed: controlledCollapsed,
  onToggleCollapse,
  showCollapseToggle = true,
  variant = "sidebar",
}: InsurerNavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(false);

  const isCollapsed =
    controlledCollapsed !== undefined
      ? controlledCollapsed
      : uncontrolledCollapsed;

  const toggleCollapse =
    onToggleCollapse ||
    (() => setUncontrolledCollapsed((prev) => !prev));

  const isItemActive = (href: string) => {
    if (href === "/insurer") {
      return pathname === "/insurer" || pathname === "/insurer/dashboard";
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onCloseMobile) onCloseMobile();
    await signOut({ callbackUrl: "/" });
  };

  const displayName = session?.user?.name || (session?.user?.email ? session.user.email.split("@")[0].replace(/[._]/g, " ") : "Officer Jones");
  const displayRole = session?.user?.role === "institutional" ? "Institutional Officer" : (session?.user?.role || "Institutional Officer");

  if (variant === "top") {
    return (
      <header
        className={`w-full bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs ${className}`}
        data-purpose="navigation-topbar"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo Link */}
          <Link
            href="/insurer"
            className="flex items-center gap-3 group"
            title="ClaimSetu Portal"
          >
            <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
              <Image
                src="/claimsetu-logo.webp"
                alt="ClaimSetu Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-[#0F172A]">
                ClaimSetu
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 hidden sm:inline-block">
                Portal
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="flex items-center space-x-1 sm:space-x-2" data-purpose="top-navigation">
            {navItems.map((item) => {
              const active = isItemActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md font-semibold text-xs transition-all ${active
                    ? "bg-[#E8EFEA] border border-[#D5E2D9] text-[#134E35]"
                    : "text-[#334155] hover:bg-slate-50 border border-transparent"
                    }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${active ? "text-[#134E35]" : "text-[#475569]"
                      }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Profile & Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/insurer/profile"
              className="flex items-center gap-2.5 hover:opacity-85 transition-opacity group"
              title="View Institutional Profile"
            >
              <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-2xs ring-1 ring-slate-200 shrink-0">
                <Image
                  src="/default-avatar.svg"
                  alt="Institutional Profile"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-[#0F172A] leading-tight capitalize group-hover:text-[#064E3B] transition-colors">
                  {displayName}
                </span>
                <span className="text-[10px] font-mono text-slate-500 leading-tight">
                  {displayRole}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <aside
      className={`bg-white flex flex-col justify-between border-r border-slate-200 min-h-screen rounded-tl-2xl rounded-bl-2xl shadow-sm selection:bg-teal-100 transition-all duration-300 ease-in-out ${isCollapsed ? "w-20" : "w-72"
        } ${className}`}
      data-purpose="navigation-sidebar"
    >
      {/* Top Segment: Brand & Primary Navigation */}
      <div
        className={`flex flex-col pt-6 transition-all duration-300 ${isCollapsed ? "px-2.5" : "px-4"
          }`}
      >
        {/* BEGIN: Brand Header & Collapse Toggle */}
        <div
          className={`flex items-center mb-8 transition-all ${isCollapsed
            ? "flex-col gap-3 justify-center items-center"
            : "justify-between px-2"
            }`}
          data-purpose="brand-header"
        >
          {/* Logo & Brand Title Link */}
          <Link
            href="/insurer"
            onClick={onCloseMobile}
            className={`flex items-center group ${isCollapsed ? "justify-center" : "gap-3"
              }`}
            title="ClaimSetu Insurer Portal"
          >
            {/* Shield Badge Icon with Checkmark */}
            <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
              <Image
                src="/claimsetu-logo.webp"
                alt="ClaimSetu Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            {/* Brand Title */}
            {!isCollapsed && (
              <span className="text-xl font-bold tracking-tight text-[#0F172A] whitespace-nowrap overflow-hidden transition-opacity duration-200">
                ClaimSetu
              </span>
            )}
          </Link>

          {/* Collapse / Expand Toggle Button */}
          {showCollapseToggle && (
            <button
              type="button"
              onClick={toggleCollapse}
              className={`text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors p-1.5 shrink-0 ${isCollapsed ? "mt-1" : ""
                }`}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-[18px] h-[18px]" />
              ) : (
                <PanelLeftClose className="w-[18px] h-[18px]" />
              )}
            </button>
          )}
        </div>
        {/* END: Brand Header */}

        {/* BEGIN: NavigationMenu */}
        <nav
          aria-label="Main Navigation"
          className="flex flex-col space-y-1.5"
          data-purpose="main-navigation"
        >
          {navItems.map((item) => {
            const active = isItemActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={isCollapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={`flex items-center rounded-md font-semibold text-sm transition-colors ${isCollapsed
                  ? "justify-center p-3"
                  : "gap-3.5 px-3.5 py-3"
                  } ${active
                    ? "bg-[#E8EFEA] border border-[#D5E2D9] text-[#134E35]"
                    : "text-[#334155] hover:bg-slate-50 border border-transparent"
                  }`}
              >
                <Icon
                  className={`w-[22px] h-[22px] shrink-0 ${active ? "text-[#134E35]" : "text-[#334155]"
                    }`}
                />
                {!isCollapsed && (
                  <span className="whitespace-nowrap overflow-hidden transition-opacity duration-200">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        {/* END: NavigationMenu */}
      </div>

      {/* BEGIN: UserAndActionsFooter */}
      <div
        className={`mt-auto border-t border-slate-100 pb-6 transition-all duration-300 ${isCollapsed ? "p-2 pt-4" : "p-4 pt-5"
          }`}
        data-purpose="user-footer"
      >
        {/* User Profile Information */}
        <Link
          href="/insurer/profile"
          onClick={onCloseMobile}
          className={`flex items-center mb-5 hover:opacity-85 transition-opacity group ${isCollapsed ? "justify-center px-0" : "gap-3 px-1"
            }`}
          title={isCollapsed ? `${displayName} - ${displayRole}` : "View Institutional Profile"}
        >
          {/* Avatar Photo */}
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200 shrink-0">
            <Image
              src="/default-avatar.svg"
              alt="Institutional Profile"
              width={40}
              height={40}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              priority
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 overflow-hidden transition-opacity duration-200">
              <span className="text-sm font-bold text-[#0F172A] leading-snug truncate capitalize group-hover:text-[#064E3B] transition-colors">
                {displayName}
              </span>
              <span className="text-xs text-[#64748B] font-medium leading-normal truncate">
                {displayRole}
              </span>
            </div>
          )}
        </Link>

        {/* Sign Out Action */}
        <button
          type="button"
          onClick={handleSignOut}
          title={isCollapsed ? "Sign Out" : undefined}
          aria-label="Sign Out"
          className={`w-full flex items-center text-[#334155] hover:text-slate-900 font-medium text-sm transition-colors group cursor-pointer ${isCollapsed
            ? "justify-center p-2 rounded-md hover:bg-slate-50"
            : "gap-3.5 px-2 py-2"
            }`}
        >
          <LogOut className="w-[22px] h-[22px] text-[#475569] group-hover:text-slate-900 transition-colors shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
      {/* END: UserAndActionsFooter */}
    </aside>
  );
}

// Re-export as InsurerSidebar and TopNavbar for convenience
export { InsurerNavbar as InsurerSidebar };

export function TopNavbar(props: Omit<InsurerNavbarProps, "variant">) {
  return <InsurerNavbar {...props} variant="top" />;
}
