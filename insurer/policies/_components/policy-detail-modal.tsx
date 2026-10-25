"use client";

import React from "react";
import { X, ShieldCheck, ExternalLink } from "lucide-react";
import type { PolicyData } from "@/actions/insurer-policies";
export type { PolicyData };

interface PolicyDetailModalProps {
  policy: PolicyData | null;
  onClose: () => void;
}

export function PolicyDetailModal({ policy, onClose }: PolicyDetailModalProps) {
  if (!policy) return null;

  const pdfUrl = policy.pdfUrl || "/policies/default-policy.pdf";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl border-2 border-slate-900 w-full max-w-4xl max-h-[92vh] shadow-tactile flex flex-col overflow-hidden">
        {/* Header: Policy ID and Name */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-[#064E3B] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {policy.code}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 leading-snug">
                {policy.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-tactile hover:translate-y-[1px] active:shadow-tactile-pressed transition-all"
              title="Open PDF in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Open in Tab</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 w-full bg-slate-100 min-h-[450px] h-[65vh] relative overflow-hidden flex flex-col">
          <iframe
            src={`${pdfUrl}#toolbar=1&view=FitH`}
            title={`Policy Document - ${policy.name}`}
            className="w-full h-full border-none flex-1"
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="font-mono">
            Registration Date: <strong className="text-slate-700">{policy.addedDate}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border-2 border-slate-300 text-slate-700 text-xs font-bold rounded-md shadow-tactile hover:translate-y-[1px] active:shadow-tactile-pressed transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
