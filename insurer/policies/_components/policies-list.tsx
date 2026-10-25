"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Search, Eye, Trash2, Calendar, Tag, Loader2 } from "lucide-react";
import { PolicyData, PolicyDetailModal } from "./policy-detail-modal";
import { deletePolicyAction } from "@/actions/insurer-policies";

interface PoliciesListProps {
  policies?: PolicyData[];
  onTotalChange?: (count: number) => void;
  onRefresh?: () => void;
}

export function PoliciesList({
  policies: initialPolicies = [],
  onTotalChange,
  onRefresh,
}: PoliciesListProps) {
  const [policies, setPolicies] = useState<PolicyData[]>(initialPolicies);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setPolicies(initialPolicies);
  }, [initialPolicies]);

  const filtered = policies.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.code || "").toLowerCase().includes(q) ||
      (p.name || "").toLowerCase().includes(q)
    );
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove policy "${name}"?`)) {
      setDeletingId(id);
      startTransition(async () => {
        try {
          const res = await deletePolicyAction(id);
          if (res.success) {
            setPolicies((prev) => {
              const next = prev.filter((p) => p.id !== id);
              if (onTotalChange) onTotalChange(next.length);
              return next;
            });
            if (onRefresh) onRefresh();
          } else {
            alert(res.error || "Failed to remove policy");
          }
        } catch (err: any) {
          alert(err.message || "Error deleting policy");
        } finally {
          setDeletingId(null);
        }
      });
    }
  };


  return (
    <section className="space-y-4">
      {/* Section Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">
            Current Policies
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {filtered.length} total
          </span>
        </div>

        {/* Filter / Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#064E3B] focus:border-[#064E3B] w-full sm:w-64 shadow-2xs font-sans placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Grid of Policy Cards from Stitch */}
      <div className="flex flex-col gap-3.5" id="policies-grid">
        {filtered.map((policy) => (
          <div
            key={policy.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
          >
            {/* Policy Info */}
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  <Tag className="w-3 h-3 text-slate-400" />
                  {policy.code}
                </span>

              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-[#064E3B] transition-colors leading-snug">
                {policy.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Added: {policy.addedDate}</span>


              </p>
            </div>

            {/* Tactile Actions */}
            <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedPolicy(policy)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border-2 border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-tactile hover:translate-y-[1px] active:shadow-tactile-pressed transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>View</span>
              </button>

              <button
                type="button"
                disabled={deletingId === policy.id}
                onClick={() => handleDelete(policy.id, policy.name)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-rose-300 bg-rose-50/60 hover:bg-rose-50 text-rose-700 text-xs font-bold shadow-tactile hover:translate-y-[1px] active:shadow-tactile-pressed transition-all cursor-pointer disabled:opacity-50"
                title="Delete Policy"
              >
                {deletingId === policy.id ? (
                  <Loader2 className="w-3.5 h-3.5 text-rose-500 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                )}
                <span>{deletingId === policy.id ? "Deleting..." : "Delete"}</span>
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
            No policies matching &ldquo;{searchQuery}&rdquo;. Try another search term.
          </div>
        )}
      </div>

      {/* Policy Details Inspection Modal */}
      <PolicyDetailModal
        policy={selectedPolicy}
        onClose={() => setSelectedPolicy(null)}
      />
    </section>
  );
}
