"use client";

import React, { useRef, useState, useTransition } from "react";
import {
  FileSpreadsheet,
  Download,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { importMembersCsvAction } from "@/actions/insurer-policy-holders";

interface BulkUploadSectionProps {
  onSuccess?: () => void;
}

export function BulkUploadSection({ onSuccess }: BulkUploadSectionProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("active_roster_2024_q3.csv");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDownloadTemplate = () => {
    const csvContent =
      "member_id,full_name,policy_id\n" +
      "MEM-2024-001,Ram Bahadur Shrestha,1\n" +
      "MEM-2024-002,Sita Kumari Thapa,1\n" +
      "MEM-2024-003,Hari Prasad Sharma,2\n" +
      "MEM-2024-004,Kamala Devi Adhikari,2\n" +
      "MEM-2024-005,Bishnu Maya Gurung,1\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "claimsetu_members_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setErrorMessage(null);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      startTransition(async () => {
        try {
          const res = await importMembersCsvAction(text);
          if (!res.success) {
            setErrorMessage(
              res.errors?.join(", ") || "Failed to process CSV file."
            );
            return;
          }

          setStatusMessage(
            `Successfully synchronized ${res.total} members (${res.inserted} added, ${res.updated} updated, ${res.deactivated} deactivated).`
          );
          if (onSuccess) onSuccess();
        } catch (err: any) {
          setErrorMessage(err.message || "An unexpected error occurred.");
        }
      });
    };
    reader.readAsText(file);
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Bulk Customer Registry (CSV)
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {selectedFileName}
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-bold text-xs shadow-2xs hover:translate-y-[1px] transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download Template</span>
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#064E3B] hover:bg-[#04382a] text-white border-2 border-[#022c22] rounded-md font-bold text-xs shadow-tactile hover:translate-y-[1px] active:shadow-tactile-pressed transition-all cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            <span>{isPending ? "Uploading & Syncing..." : "Upload CSV"}</span>
          </button>

          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}
    </section>
  );
}
