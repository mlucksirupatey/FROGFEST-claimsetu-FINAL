"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowRight,
  FileText,
  Plus,
} from "lucide-react";
import type { PortalClaimItem } from "@/actions/portal-dashboard";

interface PortalClaimsTableProps {
  claims?: PortalClaimItem[];
}

export function PortalClaimsTable({ claims = [] }: PortalClaimsTableProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const allClaims = claims;
  const inReviewCount = allClaims.filter((c) => c.status === "In Review").length;
  const approvedCount = allClaims.filter((c) => c.status === "Approved").length;
  const rejectedCount = allClaims.filter((c) => c.status === "Rejected").length;

  const filteredClaims = allClaims.filter((claim) => {
    if (filter === "IN_REVIEW") return claim.status === "In Review";
    if (filter === "APPROVED") return claim.status === "Approved";
    if (filter === "REJECTED") return claim.status === "Rejected";
    return true;
  });

  const getFilterLabel = () => {
    switch (filter) {
      case "IN_REVIEW":
        return `Filter: In Review (${inReviewCount})`;
      case "APPROVED":
        return `Filter: Approved (${approvedCount})`;
      case "REJECTED":
        return `Filter: Rejected (${rejectedCount})`;
      default:
        return `Filter: All Claims (${allClaims.length})`;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header Filter Bar */}
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            All Claims
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            View and track your submitted claims, verification status, and settlement amounts.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="bg-white border border-slate-200 text-xs font-medium text-slate-800 px-3 py-2 rounded-lg shadow-xs flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Filter className="w-4 h-4 text-slate-500" />
            <span>{getFilterLabel()}</span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-11 w-56 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-30">
              <button
                type="button"
                onClick={() => {
                  setFilter("ALL");
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                  filter === "ALL" ? "font-bold text-[#064E3B] bg-emerald-50/50" : "text-slate-700"
                }`}
              >
                <span>All Claims ({allClaims.length})</span>
                {filter === "ALL" && <Check className="w-3.5 h-3.5 text-[#064E3B]" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter("IN_REVIEW");
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                  filter === "IN_REVIEW" ? "font-bold text-amber-700 bg-amber-50/50" : "text-slate-700"
                }`}
              >
                <span>In Review ({inReviewCount})</span>
                {filter === "IN_REVIEW" && <Check className="w-3.5 h-3.5 text-amber-700" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter("APPROVED");
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                  filter === "APPROVED" ? "font-bold text-[#064E3B] bg-emerald-50/50" : "text-slate-700"
                }`}
              >
                <span>Approved ({approvedCount})</span>
                {filter === "APPROVED" && <Check className="w-3.5 h-3.5 text-[#064E3B]" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter("REJECTED");
                  setIsDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 transition-colors cursor-pointer ${
                  filter === "REJECTED" ? "font-bold text-red-600 bg-red-50/50" : "text-slate-700"
                }`}
              >
                <span>Rejected ({rejectedCount})</span>
                {filter === "REJECTED" && <Check className="w-3.5 h-3.5 text-red-600" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Data Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-slate-200">
              <th className="py-3 px-6 font-mono text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Claim ID
              </th>
              <th className="py-3 px-6 font-mono text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Hospital
              </th>
              <th className="py-3 px-6 font-mono text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Date Filed
              </th>
              <th className="py-3 px-6 font-mono text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">
                Billed Amount
              </th>
              <th className="py-3 px-6 font-mono text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">
                Status
              </th>
              <th className="py-3 px-6 font-mono text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClaims.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500 space-y-2.5">
                    <FileText className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-800 text-sm">
                      {filter === "ALL" ? "No claims submitted yet" : "No claims match this status"}
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      {filter === "ALL"
                        ? "You have not filed any reimbursement or cashless claims yet. Submit your first claim to get fast, automated adjudication."
                        : `There are currently no claims in the "${filter.toLowerCase().replace("_", " ")}" category.`}
                    </p>
                    {filter === "ALL" && (
                      <Link
                        href="/portal/newclaim"
                        className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#064E3B] hover:bg-[#044e3b] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>File New Claim</span>
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredClaims.map((claim) => (
                <tr
                  key={claim.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {/* Claim ID */}
                  <td className="py-4 px-6 font-mono text-sm font-bold text-slate-900">
                    <Link
                      href={`/portal/claims/${claim.rawId}/result`}
                      className="inline-flex items-center gap-2 hover:text-[#064E3B] transition-colors"
                    >
                      <span>{claim.id}</span>
                      {claim.hasPing && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                        </span>
                      )}
                    </Link>
                  </td>

                  {/* Hospital */}
                  <td className="py-4 px-6 text-sm font-medium text-slate-900">
                    <div>{claim.hospital}</div>
                    <div className="text-[11px] font-mono text-slate-400">{claim.policyName}</div>
                  </td>

                  {/* Date Filed */}
                  <td className="py-4 px-6 font-mono text-xs text-slate-500">
                    {claim.dateFiled}
                  </td>

                  {/* Billed Amount */}
                  <td className="py-4 px-6 font-mono text-sm font-semibold text-slate-900 text-right">
                    {claim.billedAmount}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-6 text-center">
                    {claim.status === "In Review" && (
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-mono text-xs font-medium border border-amber-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        In Review
                      </span>
                    )}
                    {claim.status === "Approved" && (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#006948] px-2.5 py-0.5 rounded-full font-mono text-xs font-medium border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                        Approved
                      </span>
                    )}
                    {claim.status === "Rejected" && (
                      <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-mono text-xs font-medium border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Rejected
                      </span>
                    )}
                  </td>

                  {/* Action Link */}
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/portal/claims/${claim.rawId}/result`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-black hover:border-black transition-all shadow-2xs"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ledger Footer Strip */}
      <div className="px-6 py-4 bg-[#F8FAFC] border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Showing <span className="font-semibold text-slate-800">{filteredClaims.length > 0 ? `1-${filteredClaims.length}` : "0"}</span> of{" "}
          <span className="font-semibold text-slate-800">{allClaims.length}</span> submitted claims
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 text-xs font-medium opacity-60 cursor-not-allowed inline-flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded-lg bg-[#006948] text-white text-xs font-semibold shadow-xs"
          >
            1
          </button>
          <button
            type="button"
            disabled
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 text-xs font-medium opacity-60 cursor-not-allowed inline-flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
