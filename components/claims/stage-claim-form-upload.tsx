"use client";

import React, { useState } from "react";
import { UploadCloud, FileText, CheckCircle2, Trash2, Eye, ArrowLeft, ArrowRight } from "lucide-react";

export interface AttachedClaimFile {
  name: string;
  size: string;
  type: string;
  file?: File;
}

interface StageClaimFormUploadProps {
  onFileUploaded: (file: AttachedClaimFile | null) => void;
  onNext?: () => void;
  onBack?: () => void;
  isActive?: boolean;
  stageNumber?: number;
  stageBadge?: string;
  showStageBadge?: boolean;
  backLabel?: string;
  initialFile?: AttachedClaimFile | null;
}

export function StageClaimFormUpload({
  onFileUploaded,
  onNext,
  onBack,
  isActive = true,
  stageNumber = 3,
  stageBadge = "STAGE 03 OF 05",
  showStageBadge = true,
  backLabel = "Back: Policy Selection",
  initialFile = null,
}: StageClaimFormUploadProps) {
  const [attachedFile, setAttachedFile] = useState<AttachedClaimFile | null>(initialFile);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const extension = file.name.split(".").pop()?.toUpperCase() || "FILE";

    const newFile: AttachedClaimFile = {
      name: file.name,
      size: formattedSize,
      type: extension,
      file,
    };

    setAttachedFile(newFile);
    onFileUploaded(newFile);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAttachedFile(null);
    onFileUploaded(null);
  };

  return (
    <section
      id="stage-claim-form-upload"
      className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs w-full transition-all"
      data-purpose="stage-claim-form-upload"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
              {stageNumber}
            </span>
            <h3 className="font-bold text-sm text-slate-900 font-sans">
              Claim Form / Rejection Letter
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-8">
            PDF or high-resolution image of completed and signed claim form
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showStageBadge && (
            <div className="border border-emerald-300 bg-emerald-50 text-emerald-700 font-mono text-[11px] font-bold px-3 py-0.5 rounded-md">
              {stageBadge}
            </div>
          )}
          <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <FileText className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>
      </div>

      <hr className="border-slate-200 my-4" />

      {/* Dropzone Container */}
      {attachedFile ? (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-800 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-slate-900 truncate">
                  {attachedFile.name}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  Attached ✓
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {attachedFile.type} • {attachedFile.size} • 100% Legible
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Preview File"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              title="Remove File"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <label className="relative border-2 border-dashed border-emerald-200/90 hover:border-emerald-500 bg-slate-50/40 hover:bg-emerald-50/10 rounded-xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <UploadCloud className="w-8 h-8 text-[#134E35] group-hover:scale-105 mb-2 transition-transform" />
          <span className="text-sm font-bold text-slate-900">
            Click to upload or drag &amp; drop
          </span>
          <span className="text-xs text-slate-500 mt-1">
            Standard Claim Form (Annexure 1), Rejection Note, or Inpatient Intake Form
          </span>
          <span className="inline-block mt-3 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px] font-mono">
            PDF, JPG, PNG up to 15MB
          </span>
        </label>
      )}

      {/* Navigation Buttons */}
      <div className="pt-5 flex items-center justify-between gap-3 border-t border-slate-100 mt-5">
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
            disabled={!attachedFile}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#064E3B] hover:bg-[#04382a] text-white border-2 border-[#022c22] rounded-md font-bold text-xs shadow-tactile hover:translate-y-[1px] active:shadow-tactile-pressed transition-all cursor-pointer ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Next: Supporting Evidence</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Preview Modal */}
      {previewOpen && attachedFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-sm font-bold font-mono text-slate-900 truncate">
                {attachedFile.name}
              </span>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="py-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-600">
                Official Claim Form signed by beneficiary and certified healthcare representative.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
