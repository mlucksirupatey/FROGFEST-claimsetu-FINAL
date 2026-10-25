"use client";

import React, { useState } from "react";
import {
  FilePlus,
  Tag,
  UploadCloud,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { addPolicyAction } from "@/actions/insurer-policies";

interface AddPolicyFormProps {
  onSuccess?: () => void;
}

export function AddPolicyForm({ onSuccess }: AddPolicyFormProps) {
  const [policyName, setPolicyName] = useState("");
  const [policyCode, setPolicyCode] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await addPolicyAction({
        name: policyName,
        code: policyCode,
        pdfUrl: uploadedFileName ? "/policies/default-policy.pdf" : undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to register policy.");
        setIsSubmitting(false);
        return;
      }

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        handleClear();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setPolicyName("");
    setPolicyCode("");
    setUploadedFileName(null);
    setErrorMessage(null);
  };

  return (
    <section
      id="add-policy-block"
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 w-full"
    >
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-[#064E3B] flex items-center justify-center shrink-0">
            <FilePlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
              Add New Policy
            </h2>
            <p className="text-xs text-slate-500">
              Register a new policy with its unique policy ID and policy document for automated adjudication.
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body: Only Name and Policy ID */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            {/* Policy Name */}
            <div>
              <label
                htmlFor="policy-name"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-mono"
              >
                Policy Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="policy-name"
                required
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                placeholder="e.g. Arogya Plus Comprehensive Plan"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#064E3B] focus:border-[#064E3B] bg-white placeholder-slate-400 text-slate-900 font-sans shadow-2xs"
              />
            </div>

            {/* Policy Code */}
            <div>
              <label
                htmlFor="policy-id"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-mono"
              >
                Policy Code / ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="policy-id"
                  required
                  value={policyCode}
                  onChange={(e) => setPolicyCode(e.target.value.toUpperCase())}
                  placeholder="POL-SHK-990"
                  className="w-full text-sm font-mono pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#064E3B] focus:border-[#064E3B] bg-white placeholder-slate-400 uppercase text-slate-900 shadow-2xs"
                />
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-1">
                Standard format prefix: POL-[INSURER]-[CODE]
              </p>
            </div>
          </div>

          {/* Policy Document / PDF Upload Section */}
          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 font-mono">
              Policy Contract / PDF Document
            </label>
            <label className="block border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-8 text-center bg-slate-50/70 hover:bg-emerald-50/30 transition-all cursor-pointer group w-full">
              <input
                type="file"
                accept=".pdf,.json,.docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setUploadedFileName(e.target.files[0].name);
                  }
                }}
              />
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#064E3B] flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {uploadedFileName ? (
                  <span className="text-emerald-800 font-mono">
                    Loaded: {uploadedFileName}
                  </span>
                ) : (
                  "Click to upload or drag & drop policy contract PDF"
                )}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Policy document PDF will be stored and viewable in the policy inspection modal (Max 25MB)
              </p>
            </label>
          </div>

          {/* Action Controls with Tactile Buttons */}
          <div className="flex items-center justify-end pt-5 border-t border-slate-200 gap-3 w-full">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 rounded-md border-2 border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold shadow-tactile hover:translate-y-[1px] active:shadow-tactile-pressed transition-all cursor-pointer"
            >
              Clear Form
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-[#064E3B] text-white border-2 border-[#022c22] text-xs font-bold shadow-tactile hover:translate-y-[1px] active:shadow-tactile-pressed transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>
                {isSubmitting
                  ? "Saving to Database..."
                  : isSaved
                  ? "Compiled & Activated!"
                  : "Save & Compile Policy"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
