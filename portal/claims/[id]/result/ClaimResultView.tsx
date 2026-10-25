// nextjs/app/portal/claims/[id]/result/ClaimResultView.tsx
// Interactive Client Component for Claim Adjudication & Reasoning Results with polling and retry
// Adheres strictly to CLAIMSETU_FULL_CLAIM_AUTH_MEMBER_IMPLEMENTATION_PLAN.md Sections 34, 35, 36

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowLeft,
  RotateCcw,
  Shield,
  FileText,
  Bookmark,
  Sparkles,
  HelpCircle,
  Check,
} from "lucide-react";
import { PortalTopBar } from "@/app/portal/_components/portal-top-bar";
import { PortalFooter } from "@/app/portal/_components/portal-footer";

export interface ClaimResultProps {
  initialClaim: {
    claimId: number;
    status: string;
    processingStatus: string;
    submittedAt?: string;
    member: {
      memberId: string;
      name: string;
    };
    policy: {
      id: number;
      name: string;
      issuer: string;
    };
    summary?: string;
    fullReport?: string;
    disposition?: string;
    analysis?: any;
    findings?: any[];
    evidence?: any[];
    citations?: Record<string, any>;
  };
}

export function ClaimResultView({ initialClaim }: ClaimResultProps) {
  const [claim, setClaim] = useState(initialClaim);
  const [isProcessing, setIsProcessing] = useState(
    initialClaim.processingStatus === "processing" || initialClaim.processingStatus === "pending"
  );
  const [isRetrying, setIsRetrying] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "findings" | "evidence" | "report">("summary");

  // Status Polling Effect (Section 32, 36)
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/claims/${claim.claimId}/status`);
        if (!res.ok) return;

        const data = await res.json();

        if (data.status === "completed") {
          // Fetch full cached result
          const fullRes = await fetch(`/api/claims/${claim.claimId}/result`);
          if (fullRes.ok) {
            const fullData = await fullRes.json();
            setClaim(fullData);
          }
          setIsProcessing(false);
          clearInterval(interval);
        } else if (data.status === "failed") {
          setClaim((prev) => ({ ...prev, processingStatus: "failed" }));
          setIsProcessing(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Status poll error:", err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isProcessing, claim.claimId]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const res = await fetch(`/api/claims/${claim.claimId}/process`, {
        method: "POST",
      });
      if (res.ok) {
        setIsProcessing(true);
        setClaim((prev) => ({ ...prev, processingStatus: "processing" }));
      }
    } catch (err) {
      console.error("Retry error:", err);
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusBadge = () => {
    const disp = (claim.disposition || claim.status || "").toUpperCase();

    if (disp.includes("PASS") || disp.includes("APPROV")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>APPROVED DETERMINISTIC</span>
        </span>
      );
    }
    if (disp.includes("FAIL") || disp.includes("REJECT")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>REJECTED DETERMINISTIC</span>
        </span>
      );
    }
    if (disp.includes("REVIEW")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>NEEDS HUMAN REVIEW</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300">
        <Clock className="w-3.5 h-3.5 text-slate-600" />
        <span>UNDER REVIEW</span>
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen bg-[#F8FAFC] antialiased text-slate-800">
      <PortalTopBar />

      <main className="w-full pt-28 pb-16 bg-[#F8FAFC] flex-1">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-6">
          {/* Back link */}
          <div>
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-[#064E3B] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>BACK TO CLAIMS DASHBOARD</span>
            </Link>
          </div>

          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#064E3B] uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    Statutory Adjudication Record
                  </span>
                  <span className="font-mono text-xs text-slate-400">Claim #{claim.claimId}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2 font-sans">
                  Claim Review &amp; Analysis Result
                </h1>
              </div>

              <div className="shrink-0">{getStatusBadge()}</div>
            </div>

            {/* Beneficiary & Policy Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">BENEFICIARY</span>
                <strong className="text-slate-900 font-sans text-sm block mt-0.5">
                  {claim.member?.name}
                </strong>
                <span className="text-slate-600 block mt-0.5">ID: {claim.member?.memberId}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">INSURANCE POLICY</span>
                <strong className="text-slate-900 font-sans text-sm block mt-0.5 truncate">
                  {claim.policy?.name}
                </strong>
                <span className="text-slate-600 block mt-0.5">{claim.policy?.issuer}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[11px]">ENGINE RUNTIME</span>
                <strong className="text-slate-900 font-sans text-sm block mt-0.5">
                  {claim.processingStatus === "completed" ? "Verified Cached Result" : "Processing Live"}
                </strong>
                <span className="text-emerald-700 block mt-0.5">VITRAYA HIPML DETERMINISTIC</span>
              </div>
            </div>
          </div>

          {/* Processing Banner (if in flight) */}
          {isProcessing && (
            <div className="p-6 rounded-xl border border-emerald-200 bg-emerald-50/70 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-950 font-sans">
                    Reasoning &amp; Policy Adjudication in Progress
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Extracting PDF line items, evaluating deterministic HIPML rules, and retrieving RAG policy evidence…
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-800 px-3 py-1 rounded bg-white border border-emerald-200 shrink-0">
                Auto-refreshing…
              </span>
            </div>
          )}

          {/* Failed Banner with Retry */}
          {claim.processingStatus === "failed" && !isProcessing && (
            <div className="p-6 rounded-xl border border-rose-200 bg-rose-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-rose-950 font-sans">Processing Failed</h4>
                  <p className="text-xs text-rose-800 mt-0.5">
                    An error occurred while evaluating this claim against HIPML rules or Gemini reasoning.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isRetrying ? "Retrying…" : "Retry Processing"}</span>
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "summary"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Executive Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("findings")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "findings"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Deterministic Findings ({claim.findings?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("evidence")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "evidence"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Grounded Evidence ({claim.evidence?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("report")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "report"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Full Detailed Report
            </button>
          </div>

          {/* TAB 1: EXECUTIVE SUMMARY */}
          {activeTab === "summary" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base font-sans">
                  <Sparkles className="w-5 h-5 text-emerald-700" />
                  <span>Executive Assessment</span>
                </div>
                <div className="text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-line bg-slate-50/70 p-5 rounded-lg border border-slate-200">
                  {claim.summary || claim.analysis?.executive_assessment || (
                    <span className="text-slate-400 italic">No summary report available yet.</span>
                  )}
                </div>
              </div>

              {/* Financial Impact Breakdown if available */}
              {claim.analysis?.financial_impact?.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm font-sans uppercase tracking-wider">
                    Financial Impact &amp; Sub-Limit Admissibility
                  </h3>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden text-xs">
                    {claim.analysis.financial_impact.map((fi: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-2">
                        <div>
                          <strong className="text-slate-900 block font-mono">{fi.item_id}</strong>
                          <span className="text-slate-600 mt-1 block">{fi.basis}</span>
                        </div>
                        <div className="text-right shrink-0 font-mono">
                          <span className="text-slate-500">Claimed: NPR {fi.claimed_amount ?? "—"}</span>
                          <span className="text-emerald-700 font-bold block">
                            Allowed: NPR {fi.allowed_amount ?? "0"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DETERMINISTIC FINDINGS */}
          {activeTab === "findings" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base font-sans">
                  Deterministic Policy Rule Evaluation
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  Total Items: {claim.findings?.length || 0}
                </span>
              </div>

              {!claim.findings || claim.findings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-mono">
                  No explicit rule violations or findings recorded for this claim.
                </div>
              ) : (
                <div className="space-y-4">
                  {claim.findings.map((f: any, idx: number) => {
                    const isPassed = f.deterministic_status === "passed";
                    const isFailed = f.deterministic_status === "failed";

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          isFailed
                            ? "bg-rose-50/40 border-rose-200"
                            : isPassed
                            ? "bg-emerald-50/40 border-emerald-200"
                            : "bg-amber-50/40 border-amber-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {f.code || f.finding_id}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  isFailed
                                    ? "bg-rose-100 text-rose-800"
                                    : isPassed
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {(f.deterministic_status || "REVIEW").toUpperCase()}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 mt-1 font-sans">
                              {f.item}
                            </h4>
                          </div>

                          {f.evidence_refs?.length > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              {f.evidence_refs.map((ref: string) => (
                                <span
                                  key={ref}
                                  className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-mono font-bold"
                                >
                                  {ref}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-slate-700 mt-2 font-sans leading-relaxed">
                          {f.explanation || f.assessment}
                        </p>

                        {f.quote && (
                          <blockquote className="mt-2.5 pl-3 border-l-2 border-slate-300 text-xs italic text-slate-600 font-serif">
                            &ldquo;{f.quote}&rdquo;
                          </blockquote>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GROUNDED EVIDENCE */}
          {activeTab === "evidence" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-sans">
                    Frozen Policy Evidence &amp; Citations
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Strict citations retrieved via RAG vector search from the statutory policy document.
                  </p>
                </div>
              </div>

              {!claim.evidence || claim.evidence.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-mono">
                  No evidence chunks cited for this claim.
                </div>
              ) : (
                <div className="space-y-4">
                  {claim.evidence.map((ev: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                            {ev.evidence_id || `E${idx + 1}`}
                          </span>
                          <strong className="text-slate-900 font-sans">
                            {ev.section_title || "Policy Section"}
                          </strong>
                        </div>
                        <span className="font-mono text-slate-500">
                          {ev.clause_ref || "Clause Ref"} • Page {ev.page_start ?? "—"}
                        </span>
                      </div>

                      <div className="p-3 rounded-md bg-white border border-slate-200 text-slate-700 font-mono text-xs leading-relaxed">
                        {ev.chunk_text || ev.excerpt || "No chunk text available."}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FULL DETAILED REPORT */}
          {activeTab === "report" && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base font-sans">
                  <FileText className="w-5 h-5 text-emerald-700" />
                  <span>Comprehensive Adjudication Report</span>
                </div>
                <span className="text-xs font-mono text-slate-400">Section 1 to 9 Full Narrative</span>
              </div>

              <div className="p-5 rounded-lg bg-slate-50/50 border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-line overflow-x-auto">
                {claim.fullReport || (
                  <span className="text-slate-400 italic">Report generation pending completion.</span>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <PortalFooter />
    </div>
  );
}
