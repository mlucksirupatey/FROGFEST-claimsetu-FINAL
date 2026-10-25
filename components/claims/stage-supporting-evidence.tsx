// components/claims/stage-supporting-evidence.tsx
// Supporting evidence multi-file upload with heuristic auto-categorization and user-editable categories
// Adheres strictly to CLAIMSETU_FULL_CLAIM_AUTH_MEMBER_IMPLEMENTATION_PLAN.md Sections 17, 18, 19, 20

"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  BriefcaseMedical,
  Trash2,
  FileSpreadsheet,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  type ClaimDocumentType,
  detectDocumentCategory,
} from "@/lib/claims/document-classifier";

export type { ClaimDocumentType };
export { detectDocumentCategory };

export interface SupportingFile {
  id: string;
  name: string;
  size: string;
  type: string;
  category: ClaimDocumentType;
  detectedCategory?: ClaimDocumentType;
  detectionReason?: string;
  uploadStatus?: "pending" | "uploaded" | "processing" | "ready" | "error";
  file?: File;
}

export const CATEGORY_LABELS: Record<ClaimDocumentType, string> = {
  bill: "Hospital Bill / VAT Invoice",
  discharge_summary: "Discharge Record / Summary",
  prescription: "Physician Prescription (Rx)",
  diagnostic_report: "Diagnostic / Lab Report",
  claim_form: "Signed Claim Form",
  other: "Other Supporting Evidence",
};

interface StageSupportingEvidenceProps {
  onFilesChanged?: (files: SupportingFile[]) => void;
  onNext?: () => void;
  onBack?: () => void;
  isActive?: boolean;
  stageNumber?: number;
  stageBadge?: string;
  showStageBadge?: boolean;
  backLabel?: string;
  initialFiles?: SupportingFile[];
}

export function StageSupportingEvidence({
  onFilesChanged,
  onNext,
  onBack,
  isActive = true,
  stageNumber = 4,
  stageBadge = "STAGE 04 OF 05",
  showStageBadge = true,
  backLabel = "Back: Claim Form",
  initialFiles = [],
}: StageSupportingEvidenceProps) {
  const [files, setFiles] = useState<SupportingFile[]>(initialFiles);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    const newFiles: SupportingFile[] = Array.from(e.target.files).map(
      (file, idx) => {
        const formattedSize =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(file.size / 1024)} KB`;
        const ext = file.name.split(".").pop()?.toUpperCase() || "DOC";
        const { category, reason } = detectDocumentCategory(file.name);

        return {
          id: `upload-${Date.now()}-${idx}`,
          name: file.name,
          size: formattedSize,
          type: ext,
          category,
          detectedCategory: category,
          detectionReason: reason,
          file,
        };
      }
    );

    const updated = [...files, ...newFiles];
    setFiles(updated);
    if (onFilesChanged) onFilesChanged(updated);
  };

  const handleCategoryChange = (id: string, newCategory: ClaimDocumentType) => {
    const updated = files.map((f) => (f.id === id ? { ...f, category: newCategory } : f));
    setFiles(updated);
    if (onFilesChanged) onFilesChanged(updated);
  };

  const handleRemove = (id: string) => {
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    if (onFilesChanged) onFilesChanged(updated);
  };

  return (
    <section
      id="stage-supporting-evidence"
      className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs w-full transition-all"
      data-purpose="stage-supporting-evidence"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
              {stageNumber}
            </span>
            <h3 className="font-bold text-sm text-slate-900 font-sans">
              Supporting Evidence
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-8">
            Itemized medical bills, physician prescriptions, and discharge summaries
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showStageBadge && (
            <div className="border border-emerald-300 bg-emerald-50 text-emerald-700 font-mono text-[11px] font-bold px-3 py-0.5 rounded-md">
              {stageBadge}
            </div>
          )}
          <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-700">
            <BriefcaseMedical className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>
      </div>

      <hr className="border-slate-200 my-4" />

      {/* Upload Zone */}
      <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 sm:p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-emerald-50/20 group">
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleAddFiles}
          className="hidden"
        />
        <UploadCloud className="w-7 h-7 text-slate-400 group-hover:text-emerald-700 mb-1.5 transition-colors" />
        <span className="text-sm font-bold text-slate-900">
          Upload itemized hospital invoices and medical reports
        </span>
        <span className="text-xs text-slate-500 mt-0.5">
          Select single or multiple files (PDF, JPG, PNG up to 25MB each)
        </span>
      </label>

      {/* Uploaded Evidence Ledger List */}
      <div className="mt-5 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-600 px-1">
          <span>ATTACHED EVIDENCE ({files.length})</span>
          <span className="text-emerald-700 font-semibold">ALL COMPLIANT FOR OCR</span>
        </div>

        {files.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-xs text-slate-500">
            No evidence files attached yet. Select at least one invoice or medical report.
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-slate-900 truncate">
                      {file.name}
                    </span>
                    {file.detectedCategory && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-200"
                        title={file.detectionReason}
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Auto-detected</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {file.type} • {file.size} • Ready for analysis
                  </div>
                </div>
              </div>

              {/* Editable Category Selector & Remove */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <select
                  value={file.category}
                  onChange={(e) => handleCategoryChange(file.id, e.target.value as ClaimDocumentType)}
                  className="text-xs font-mono font-medium border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900 cursor-pointer shadow-2xs"
                >
                  <option value="bill">Hospital Bill (VAT Invoice)</option>
                  <option value="discharge_summary">Discharge Summary</option>
                  <option value="prescription">Doctor Prescription</option>
                  <option value="diagnostic_report">Diagnostic / Lab Report</option>
                  <option value="claim_form">Claim Form</option>
                  <option value="other">Other Document</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleRemove(file.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  title="Delete File"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="pt-5 flex items-center justify-between gap-3 border-t border-slate-100 mt-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-bold text-xs shadow-2xs hover:translate-y-[1px] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </button>
        )}

        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={files.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#064E3B] hover:bg-[#04382a] text-white border-2 border-[#022c22] rounded-md font-bold text-xs shadow-tactile hover:translate-y-[1px] active:shadow-tactile-pressed transition-all cursor-pointer ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Next: Review &amp; Submit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </section>
  );
}
