"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  BookOpen,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import type { PolicyholderRecord } from "@/actions/insurer-policy-holders";
import { deletePolicyHolderAction } from "@/actions/insurer-policy-holders";

export type { PolicyholderRecord };

const ROWS_PER_PAGE = 8;

interface MembersDirectoryProps {
  records?: PolicyholderRecord[];
  onRefresh?: () => void;
}

export function MembersDirectory({
  records = [],
  onRefresh,
}: MembersDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(
      (r) =>
        r.memberId.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.policyPin && r.policyPin.toLowerCase().includes(q)) ||
        (r.policyName && r.policyName.toLowerCase().includes(q))
    );
  }, [records, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const handleRemove = (memberId: string, name: string) => {
    if (confirm(`Are you sure you want to deactivate member "${name}" (${memberId})?`)) {
      setDeletingId(memberId);
      startTransition(async () => {
        try {
          const res = await deletePolicyHolderAction(memberId);
          if (res.success) {
            if (onRefresh) onRefresh();
          } else {
            alert(res.error || "Failed to remove member.");
          }
        } catch (err: any) {
          alert(err.message || "An unexpected error occurred.");
        } finally {
          setDeletingId(null);
        }
      });
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Registered Members Directory
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-mono font-bold border border-emerald-200">
                {records.length.toLocaleString()} Active Members
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Active insurance roster records loaded directly from company database
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Member ID, name, policy…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs font-sans focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-2xs placeholder:text-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="pb-3 font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Member ID
              </th>
              <th className="pb-3 font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Beneficiary Name
              </th>
              <th className="pb-3 font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Policy Identifier / Coverage
              </th>
              <th className="pb-3 font-mono text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((record) => (
              <tr
                key={record.memberId}
                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-3.5 font-mono text-sm font-semibold text-emerald-800">
                  {record.memberId}
                </td>
                <td className="py-3.5 text-sm font-medium text-slate-900 font-sans">
                  {record.name}
                </td>
                <td className="py-3.5 font-mono text-xs text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-900">{record.policyPin}</span>
                    {record.policyName && (
                      <span className="text-slate-500 font-sans text-[11px]">
                        • {record.policyName}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 text-right">
                  <button
                    type="button"
                    disabled={deletingId === record.memberId}
                    onClick={() => handleRemove(record.memberId, record.name)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-40"
                    title="Deactivate Member"
                  >
                    {deletingId === record.memberId ? (
                      <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </td>
              </tr>
            ))}

            {paginated.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-slate-500 font-mono text-xs">
                  No policyholders found matching &ldquo;{searchQuery}&rdquo;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <span className="text-xs font-mono text-slate-500">
          Showing {filtered.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1}-
          {Math.min(currentPage * ROWS_PER_PAGE, filtered.length)} of{" "}
          {filtered.length} members
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(
            (page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  currentPage === page
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            )
          )}

          {totalPages > 5 && (
            <span className="text-xs text-slate-400 px-1">…</span>
          )}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
