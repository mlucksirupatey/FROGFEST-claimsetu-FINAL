// components/claims/claim-submit-bar.tsx
// Review and submit bar for claim submissions with live API orchestration
// Adheres strictly to CLAIMSETU_FULL_CLAIM_AUTH_MEMBER_IMPLEMENTATION_PLAN.md Sections 25, 26, 30

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Send,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { VerifiedMember } from "./stage-member-lookup";
import { ActivePolicy } from "./stage-policy-select";
import { AttachedClaimFile } from "./stage-claim-form-upload";
import { SupportingFile } from "./stage-supporting-evidence";

interface ClaimSubmitBarProps {
  member: VerifiedMember | null;
  policy: ActivePolicy | null;
  claimForm: AttachedClaimFile | null;
  evidenceFiles: SupportingFile[];
  onBack?: () => void;
  onSubmitSuccess?: (claimId: string) => void;
  stageBadge?: string;
  showStageBadge?: boolean;
  dashboardUrl?: string;
  dashboardLabel?: string;
  backLabel?: string;
}

export function ClaimSubmitBar({
  member,
  policy,
  claimForm,
  evidenceFiles,
  onBack,
  onSubmitSuccess,
  stageBadge = "STAGE 04 OF 04",
  showStageBadge = true,
  dashboardUrl = "/portal",
  dashboardLabel = "Go to Claims Dashboard",
  backLabel = "Back",
}: ClaimSubmitBarProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [claimId, setClaimId] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isReady = Boolean(member && policy && claimForm);

  const handleSubmit = async () => {
    if (!isReady) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Create claim row
      const numericPolicyId =
        Number((policy as any).numericId || policy?.id?.replace(/\D/g, "")) || 1;

      const claimCreateRes = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policy_id: numericPolicyId,
          policyholder_user_id: (member as any)?.userId || null,
          structured_data: {
            member_id: member?.memberId,
            member_name: member?.name,
          },
        }),
      });

      if (!claimCreateRes.ok) {
        const errData = await claimCreateRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to initialize claim in database");
      }

      const claimData = await claimCreateRes.json();
      const newClaimId = String(claimData.claim?.id);
      setClaimId(newClaimId);

      // 2. Upload documents via multipart form
      const formData = new FormData();
      if (claimForm?.file) {
        formData.append("claim_form", claimForm.file);
      }
      for (let i = 0; i < evidenceFiles.length; i++) {
        const ev = evidenceFiles[i];
        if (ev.file) {
          const fieldName = `${ev.category || "bill"}_${i}`;
          formData.append(fieldName, ev.file);
          formData.append(`${fieldName}_category`, ev.category || "other");
        }
      }

      // If files exist to upload
      if (formData.entries().next().value) {
        const uploadRes = await fetch(`/api/claims/${newClaimId}/documents`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          console.warn("[Document upload warning]", errData);
        }
      }

      // 3. Trigger processing engine asynchronously
      fetch(`/api/claims/${newClaimId}/process`, { method: "POST" }).catch(console.error);

      setIsSubmitting(false);
      setSuccessModalOpen(true);
      if (onSubmitSuccess) {
        onSubmitSuccess(newClaimId);
      }
    } catch (err: any) {
      console.error("[Claim submission error]", err);
      setErrorMsg(err.message || "Submission failed. Please check network connection.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section
        id="claim-submit-bar"
        className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs w-full transition-all"
      >
        {/* Header Row */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
              ✓
            </div>
            <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-slate-900 uppercase ml-2.5">
              REVIEW &amp; SUBMIT
            </span>
          </div>

          {showStageBadge && (
            <div className="border border-emerald-300 bg-emerald-50 text-emerald-700 font-mono text-[11px] font-bold px-3 py-0.5 rounded-md">
              {stageBadge}
            </div>
          )}
        </div>

        {/* Error Alert if Submission Failed */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Summary */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 mb-6">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Beneficiary</span>
            <span className="font-semibold text-slate-900 font-sans">
              {member?.name || "—"} ({member?.memberId || "—"})
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Policy</span>
            <span className="font-semibold text-slate-900 font-mono">
              {policy?.name ? `${policy.name} (${policy.policyNo})` : "—"}
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Documents Attached</span>
            <span className="font-semibold text-slate-900 font-mono">
              {(claimForm ? 1 : 0) + evidenceFiles.length} file(s)
            </span>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between gap-3">
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

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isReady || isSubmitting}
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3 bg-[#064E3B] hover:bg-[#04382a] text-white border-2 border-[#022c22] rounded-md font-bold text-sm shadow-tactile hover:translate-y-[1px] active:shadow-tactile-pressed transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing &amp; Submitting…</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Claim</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Submission Success Modal */}
      {successModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 font-sans">Claim Successfully Filed</h3>
              <p className="text-sm text-slate-600 mt-1">
                Your statutory claim reference is{" "}
                <span className="font-mono font-bold text-slate-900">#{claimId}</span>. The evidence reasoning pipeline has been triggered.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-3">
              <Link
                href={`/portal/claims/${claimId}/result`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-[#064E3B] text-white border-2 border-[#022c22] text-xs font-bold shadow-tactile hover:translate-y-[1px] active:shadow-tactile-pressed transition-all"
              >
                <FileCheck className="w-4 h-4" />
                <span>View Live Adjudication Result →</span>
              </Link>
              <Link
                href={dashboardUrl}
                className="px-4 py-2.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer text-center"
              >
                {dashboardLabel}
              </Link>
              <button
                type="button"
                onClick={() => setSuccessModalOpen(false)}
                className="px-4 py-2 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-semibold transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
