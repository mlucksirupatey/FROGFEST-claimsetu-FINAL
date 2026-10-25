"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Filter, MoreVertical, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { ClaimQueueItem } from "@/actions/insurer-dashboard";

interface ClaimsQueueTableProps {
  claims?: ClaimQueueItem[];
}

export function ClaimsQueueTable({ claims = [] }: ClaimsQueueTableProps) {
  const [filterActive, setFilterActive] = useState<string>("all");

  const totalAll = claims.length;
  const totalFlagged = claims.filter((c) => c.status === "flagged").length;
  const totalClean = claims.filter((c) => c.status === "clean").length;

  const filteredItems = claims.filter((item) => {
    if (filterActive === "flagged") return item.status === "flagged";
    if (filterActive === "clean") return item.status === "clean";
    return true;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
      {/* Table Header Section */}
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
            Active Claims Queue
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Devanagari OCR &amp; NIA Rule Engine verification stream
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Filter Toggle */}
          <div className="flex rounded-md border border-slate-200 p-0.5 bg-slate-50 text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilterActive("all")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${filterActive === "all"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-500 hover:text-slate-900"
                }`}
            >
              All ({totalAll})
            </button>
            <button
              type="button"
              onClick={() => setFilterActive("flagged")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${filterActive === "flagged"
                ? "bg-white text-red-600 shadow-2xs font-semibold"
                : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Flags ({totalFlagged})
            </button>
            <button
              type="button"
              onClick={() => setFilterActive("clean")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${filterActive === "clean"
                ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Clean ({totalClean})
            </button>
          </div>

          <button
            type="button"
            className="p-2 bg-white border-2 border-slate-300 rounded hover:bg-slate-50 transition-colors text-slate-700 flex items-center shadow-xs"
            title="Advanced Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2 bg-white border-2 border-slate-300 rounded hover:bg-slate-50 transition-colors text-slate-700 shadow-xs"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-xs font-bold font-mono uppercase tracking-wider">
              <th className="py-4 px-6">Claim ID</th>
              <th className="py-4 px-6">Hospital Name</th>
              <th className="py-4 px-6 text-left">Claim Amount (NPR)</th>
              <th className="py-4 px-6">Submission Date</th>
              <th className="py-4 px-6">Status &amp; Confidence</th>
              <th className="py-4 px-6 text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-800 divide-y divide-slate-100 bg-white">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500 font-mono text-xs">
                  No claims found matching current filter.
                </td>
              </tr>
            ) : (
              filteredItems.map((claim) => {
                const borderColors = {
                  flagged: "bg-[#EF4444]",
                  clean: "bg-[#10B981]",
                  review: "bg-yellow-500",
                }[claim.status];

                const statusTextColors = {
                  flagged: "text-[#EF4444]",
                  clean: "text-[#10B981]",
                  review: "text-yellow-600",
                }[claim.status];

                const dotColors = {
                  flagged: "bg-[#EF4444]",
                  clean: "bg-[#10B981]",
                  review: "bg-yellow-500",
                }[claim.status];

                return (
                  <tr
                    key={claim.id}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* Claim ID with left color indicator strip */}
                    <td className="py-4 px-6 relative">
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1 ${borderColors}`}
                      />
                      <span className="font-mono text-slate-900 font-bold">
                        {claim.id}
                      </span>
                    </td>

                    {/* Hospital Name & Patient subtext */}
                    <td className="py-4 px-6">
                      <div className="text-slate-900 font-medium font-sans">
                        {claim.hospital}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        <p>{claim.patientName} •</p>  <p>{claim.policyName}</p>
                      </div>
                    </td>

                    {/* Claim Amount */}
                    <td className="py-4 px-6 font-mono text-slate-900 font-bold text-left">
                      {claim.amount}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {claim.date}
                    </td>

                    {/* Status & Confidence Badge */}
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center rounded border-2 border-slate-300 bg-white text-xs font-bold overflow-hidden shadow-xs">
                        <span className="px-2.5 py-1 bg-slate-100 border-r-2 border-slate-300 text-slate-700 font-mono">
                          {claim.confidence}%
                        </span>
                        <span
                          className={`px-2.5 py-1 ${statusTextColors} flex items-center bg-white gap-1.5`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${dotColors}`}
                          />
                          <span>{claim.statusText}</span>
                        </span>
                      </div>
                    </td>

                    {/* Action Button: Tactile Specimen */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <Link
                        href={`/insurer/claims/${claim.rawId}`}
                        className="inline-flex items-center gap-1.5 bg-[#1F2937] text-white border-2 border-black rounded py-1.5 px-4 font-bold text-xs shadow-tactile hover:translate-y-[2px] active:shadow-tactile-pressed transition-all shrink-0 whitespace-nowrap"
                      >
                        <span className="whitespace-nowrap">View Reasoning Trace</span>
                        <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-white shrink-0" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-500 bg-white gap-3">
        <span className="font-mono text-xs text-slate-500 font-medium">
          Showing 1-{filteredItems.length} of {claims.length} active claims in stream
        </span>
        <div className="flex space-x-2">
          <button
            type="button"
            disabled
            className="px-4 py-1.5 bg-white border-2 border-slate-300 rounded text-xs font-bold text-slate-400 shadow-xs cursor-not-allowed opacity-60"
          >
            Prev
          </button>
          <button
            type="button"
            className="px-4 py-1.5 bg-white border-2 border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
