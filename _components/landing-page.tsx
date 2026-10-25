"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { User, Building2, Check, FileText, Sliders, CheckCircle2 } from "lucide-react";
import { HeroMockup } from "./hero-mockup";

import { AuthHeader } from "@/components/shared/auth-header";

interface LandingPageProps {
  session?: any;
}

export function LandingPage({ session: _session }: LandingPageProps = {}) {
  return (
    <div className="min-h-screen w-full bg-[#F8F9FA] text-[#0F172A] antialiased selection:bg-emerald-100 selection:text-emerald-900 [background-image:radial-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:32px_32px]">
      {/* ==================== 1. TOP NAV ==================== */}
      <AuthHeader />

      {/* ==================== 2. HERO SECTION ==================== */}
      <section className="relative pt-16 pb-12 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto flex flex-col items-center text-center">
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold text-[#0F172A] tracking-[-0.03em] leading-[1.08] max-w-4xl mx-auto mb-6">
          Claims settled in minutes, not weeks.
        </h1>

        {/* Subhead */}
        <p className="text-base sm:text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed mb-8 font-normal">
          ClaimSetu turns Nepal’s paper-heavy claim audits into a deterministic, explainable pipeline. Every decision is traceable to the exact policy clause behind it.
        </p>

        {/* Hero CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <Link
            className="btn-precision text-xs sm:text-sm font-mono font-bold bg-[#064E3B] hover:bg-[#043e2f] active:bg-[#022e23] text-white px-6 py-3 border-[1.5px] border-[#0F172A] shadow-[3px_3px_0px_0px_#0F172A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-2 transition-all cursor-pointer"
            href="/login"
          >
            <span>Sign in&nbsp;</span>
          </Link>
          <Link
            className="btn-precision text-xs sm:text-sm font-mono font-semibold bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-900 px-6 py-3 border-[1.5px] border-[#0F172A] shadow-[3px_3px_0px_0px_#0F172A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-2 transition-all cursor-pointer"
            href="/register"
          >
            <span>Register</span>
          </Link>
        </div>

        {/* HERO MOCKUP (GSAP SCROLL TRIGGER & 3D HOVER) */}
        <HeroMockup />
      </section>

      {/* ==================== 4. DUAL PORTAL ARCHITECTURE ==================== */}
      <section className="py-20 px-6 lg:px-12 max-w-[1440px] mx-auto" id="portals">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white border-[1.5px] border-[#0F172A] font-mono text-[11px] font-bold text-slate-900 tracking-wider uppercase mb-5 shadow-[1.5px_1.5px_0px_0px_#0F172A]">
            DUAL PORTAL ARCHITECTURE
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold text-[#0F172A] tracking-[-0.02em] mb-5">
            One Engine. Tailored Direct Gateways.
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal max-w-2xl mx-auto">
            Whether you are a policyholder submitting raw hospital bills for instant reimbursement or an insurance claims officer managing compliance queues, ClaimSetu gives you dedicated workflows.
          </p>
        </div>

        {/* Two High-Precision Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left Card: For Policyholders */}
          <div className="bg-white border-[2px] border-[#0F172A] rounded-2xl p-8 sm:p-10 shadow-[6px_6px_0px_0px_#0F172A] flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5">
            <div>
              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-emerald-50 text-[#064E3B] border border-emerald-300 font-mono text-[11px] font-bold tracking-wider mb-5">
                <User className="w-3.5 h-3.5" />
                <span>MEMBER REIMBURSEMENT</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mb-3">
                For Policyholders
              </h3>
              <p className="text-slate-600 text-sm sm:text-base font-normal leading-relaxed mb-8">
                Take control of your medical reimbursement without bureaucratic delays or confusing tariff deductions.
              </p>

              {/* Checklist items */}
              <div className="space-y-5 mb-10">
                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded-[4px] border border-emerald-600 bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 text-emerald-700">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <strong className="font-bold text-[#0F172A]">Upload bills &amp; discharge summaries directly:</strong> Supports multi-page phone photos, PDFs, and laboratory slips.
                  </p>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded-[4px] border border-emerald-600 bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 text-emerald-700">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <strong className="font-bold text-[#0F172A]">Real-time OCR extraction in &lt;1 sec:</strong> High-precision text parsing runs before insurer handoff to guarantee completeness.
                  </p>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded-[4px] border border-emerald-600 bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 text-emerald-700">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <strong className="font-bold text-[#0F172A]">Live 5-stage claim status &amp; transparent reason trace:</strong> Know exactly why an item was approved or flagged instantly.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Action Button */}
            <div className="pt-6 border-t border-slate-200">
              <Link
                className="btn-precision w-full inline-flex items-center justify-center gap-2 bg-[#064E3B] hover:bg-[#043e2f] active:bg-[#022e23] text-white font-mono text-xs sm:text-sm font-bold py-3.5 px-6 border-[1.5px] border-[#0F172A] shadow-[3px_3px_0px_0px_#0F172A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none tracking-wider transition-all"
                href="/register/policyholder"
              >
                <span>REGISTER NEW POLICYHOLDER</span>
                <span className="font-mono text-base">→</span>
              </Link>
            </div>
          </div>

          {/* Right Card: For Insurers, TPAs & Adjudicators */}
          <div className="bg-white border-[2px] border-[#0F172A] rounded-2xl p-8 sm:p-10 shadow-[6px_6px_0px_0px_#0F172A] flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5">
            <div>
              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-slate-100 text-slate-800 border border-slate-300 font-mono text-[11px] font-bold tracking-wider mb-5">
                <Building2 className="w-3.5 h-3.5" />
                <span>INSTITUTIONAL COCKPIT</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight mb-3">
                For Insurers, TPAs &amp; Adjudicators
              </h3>
              <p className="text-slate-600 text-sm sm:text-base font-normal leading-relaxed mb-8">
                Streamline claims operations, eliminate manual bill line audit, and maintain full compliance with Nepal Insurance Authority guidelines.
              </p>

              {/* Checklist items */}
              <div className="space-y-5 mb-10">
                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded-[4px] border border-slate-700 bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-800">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <strong className="font-bold text-[#0F172A]">Upload Policyholder Registry (CSV):</strong> Instant automated matching of active policy terms, limits, and deductible conditions.
                  </p>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded-[4px] border border-slate-700 bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-800">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <strong className="font-bold text-[#0F172A]">Review pre-validated structured records:</strong> Replace paper stacks with deterministic ledger audits and item-by-item flags.
                  </p>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded-[4px] border border-slate-700 bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-800">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <strong className="font-bold text-[#0F172A]">Deterministic HIPML engine &amp; statutory 30-day SLA:</strong> Execute Vitraya rule models with pgvector RAG citations to maintain Insurance Act 2079 compliance.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Action Button */}
            <div className="pt-6 border-t border-slate-200">
              <Link
                className="btn-precision w-full inline-flex items-center justify-center gap-2 bg-[#081425] hover:bg-[#030a14] active:bg-[#000000] text-white font-mono text-xs sm:text-sm font-bold py-3.5 px-6 border-[1.5px] border-[#0F172A] shadow-[3px_3px_0px_0px_#0F172A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none tracking-wider transition-all"
                href="/register/insurer"
              >
                <span>REGISTER NEW INSURER</span>
                <span className="font-mono text-base">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 10. ENGINE CAPABILITIES (SPACE ISSUE FIXED: IMMEDIATELY FOLLOWS DUAL PORTALS) ==================== */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto px-4 md:px-6" id="engine-capabilities">
        <div className="flex flex-col items-center text-center">
          <div className="inline-block px-3.5 py-1 bg-white border-2 border-slate-900 font-mono text-xs font-bold text-slate-900 tracking-wider uppercase shadow-[2px_2px_0px_0px_#0F172A]">
            ENGINE CAPABILITIES
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 font-sans tracking-tight mt-4 text-center">
            Precision Instrumentation for Claims Teams
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-center mt-3 text-sm md:text-base leading-relaxed font-sans">
            Empower your adjudication officers and policyholders with deterministic rule engines and transparent AI reasoning traces for every single claim.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {/* Card 1: Multi-Document Ingestion */}
          <div className="bg-white border-2 border-slate-900 shadow-[6px_6px_0px_0px_#0F172A] p-6 sm:p-7 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5">
            <div>
              <div className="w-11 h-11 border-2 border-slate-900 bg-[#E8F5E9] flex items-center justify-center shrink-0 text-[#064E3B]">
                <FileText className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-5 font-sans">
                Multi-Document Ingestion
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mt-3 font-sans">
                Optical ingestion &amp; schema transformation at patient upload. Seamlessly parses discharge summaries, medicine receipts, and itemized bills into validated tabular schemas with zero manual typing.
              </p>
            </div>
            <div className="border-t border-slate-200 pt-4 mt-6 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 uppercase tracking-wide">PIPELINE: OCR_v4.2</span>
              <span className="text-emerald-700 font-bold uppercase tracking-wider">LATENCY &lt; 900MS</span>
            </div>
          </div>

          {/* Card 2: Deterministic Rule Engine */}
          <div className="bg-white border-2 border-slate-900 shadow-[6px_6px_0px_0px_#0F172A] p-6 sm:p-7 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5">
            <div>
              <div className="w-11 h-11 border-2 border-slate-900 bg-[#E8F5E9] flex items-center justify-center shrink-0 text-[#064E3B]">
                <Sliders className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-5 font-sans">
                Deterministic Rule Engine
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mt-3 font-sans">
                Sub-limits, daily room rent caps, NIA exclusions, and policy waiting periods applied with zero probabilistic guesswork. Strictly enforces statutory caps with 100% mathematical auditability.
              </p>
            </div>
            <div className="border-t border-slate-200 pt-4 mt-6 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 uppercase tracking-wide">LOGIC: RULE_EXEC_AST</span>
              <span className="text-emerald-700 font-bold uppercase tracking-wider">ZERO DRIFT</span>
            </div>
          </div>

          {/* Card 3: Audit-Ready Reasoning Trace */}
          <div className="bg-white border-2 border-slate-900 shadow-[6px_6px_0px_0px_#0F172A] p-6 sm:p-7 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5">
            <div>
              <div className="w-11 h-11 border-2 border-slate-900 bg-[#E8F5E9] flex items-center justify-center shrink-0 text-[#064E3B]">
                <CheckCircle2 className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-5 font-sans">
                Audit-Ready Reasoning Trace
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mt-3 font-sans">
                Eliminates dispute ambiguity with transparent deduction memos. Every adjudication flags unauthorized line items (e.g. vitamins, food items) with specific statutory clause references.
              </p>
            </div>
            <div className="border-t border-slate-200 pt-4 mt-6 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 uppercase tracking-wide">EXPORT: NIA_MEMO.JSON</span>
              <span className="text-emerald-700 font-bold uppercase tracking-wider">SHA-256 SIGNED</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER & NIA COMPLIANCE BAR ==================== */}
      <footer className="border-t-[1.5px] border-[#0F172A] bg-white text-xs font-mono text-slate-600">
        {/* Top Footer Links */}
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 overflow-hidden flex items-center justify-center shrink-0">
              <Image
                alt="ClaimSetu Logo"
                className="w-full h-full object-contain"
                src="/claimsetu-logo.webp"
                width={24}
                height={24}
              />
            </div>
            <span className="font-sans font-bold text-slate-900 text-sm">ClaimSetu</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-700">Deterministic Claims Engine for Nepal</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 font-medium text-slate-700">
            <a className="hover:text-emerald-700 transition-colors" href="#">Documentation</a>
            <a className="hover:text-emerald-700 transition-colors" href="#">FHIR Schema</a>
            <a className="hover:text-emerald-700 transition-colors" href="#">Rule Compiler</a>
            <a className="hover:text-emerald-700 transition-colors" href="#">Security Disclosures</a>
          </div>
        </div>

        {/* Mandatory Statutory Bar: Nepal Insurance Authority */}
        <div className="bg-slate-100 border-t border-slate-300 py-3.5 px-6 lg:px-12">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="text-slate-900 font-bold">NIA COMPLIANCE PROTOCOL:</span>
              <span className="">Insurance Act 2079, Section 123</span>
            </div>
            <div>
              <span className="font-medium">© 2026 ClaimSetu Technologies Pvt. Ltd. · Kathmandu, Nepal</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
