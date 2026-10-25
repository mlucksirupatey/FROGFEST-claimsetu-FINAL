"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Mail,
  Hash,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { signIn } from "next-auth/react";

export function InsurerRegisterForm() {
  const router = useRouter();
  const [institutionName, setInstitutionName] = useState("");
  const [corporateEmail, setCorporateEmail] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [niaLicense, setNiaLicense] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [certified, setCertified] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("CREATING INSTITUTIONAL ACCOUNT...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certified) {
      setErrorMessage("Please certify statutory authorization under Section 24 of the Nepal Insurance Act, 2079 to proceed.");
      return;
    }
    setIsLoading(true);
    setLoadingStatus("CREATING INSTITUTIONAL ACCOUNT...");
    setErrorMessage(null);

    try {
      // 1. Transactional registration API
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "institutional",
          email: corporateEmail.trim().toLowerCase(),
          password,
          institution_name: institutionName.trim(),
          pan_number: panNumber.trim(),
          nia_license_number: niaLicense.trim(),
        }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) {
        setErrorMessage(regData.error || "Registration failed. Please check inputs.");
        setIsLoading(false);
        return;
      }

      // 2. Immediately sign in to establish JWT session
      setLoadingStatus("AUTHENTICATING SESSION...");
      const signInRes = await signIn("credentials", {
        email: corporateEmail.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        router.push("/login");
      } else {
        setLoadingStatus("REDIRECTING TO PROFILE...");
        router.refresh();
        router.push("/insurer/profile");
      }
    } catch {
      setErrorMessage("Network error occurred during registration. Please verify connection.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[580px] bg-white border-[2.5px] border-black shadow-[8px_8px_0px_0px_#000000] p-7 sm:p-10 transition-all">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-mono font-bold uppercase tracking-wider mb-2.5">
          <Building2 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
          <span>INSTITUTIONAL ENROLLMENT GATEWAY</span>
        </div>
        <h1 className="text-2xl sm:text-[27px] font-black text-black tracking-tight leading-tight">
          Register Institutional Account
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
          Enter institutional credentials and authorized underwriter details for automated claim adjudication access.
        </p>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3.5 bg-red-50 border-2 border-red-500 text-red-900 text-xs font-mono font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Institution Name */}
        <div>
          <label
            htmlFor="ins-name"
            className="block text-[11px] font-mono font-bold text-black uppercase tracking-wider mb-1.5"
          >
            INSTITUTION NAME <span className="text-red-500 font-bold ml-0.5">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Building2 className="w-4 h-4" />
            </span>
            <input
              id="ins-name"
              type="text"
              required
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="e.g. Shikhar Insurance or SALICO Insurance"
              disabled={isLoading}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono text-slate-900 bg-white border-[1.5px] border-slate-400 rounded-none focus:outline-none focus:border-black transition-colors placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Corporate Email */}
        <div>
          <label
            htmlFor="ins-email"
            className="block text-[11px] font-mono font-bold text-black uppercase tracking-wider mb-1.5"
          >
            CORPORATE EMAIL <span className="text-red-500 font-bold ml-0.5">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              id="ins-email"
              type="email"
              required
              value={corporateEmail}
              onChange={(e) => setCorporateEmail(e.target.value)}
              placeholder="admin@himalayanins.com.np"
              disabled={isLoading}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono text-slate-900 bg-white border-[1.5px] border-slate-400 rounded-none focus:outline-none focus:border-black transition-colors placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* 2-Column Row: PAN & NIA License */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Corporate PAN Number */}
          <div>
            <label
              htmlFor="ins-pan"
              className="block text-[11px] font-mono font-bold text-black uppercase tracking-wider mb-1.5"
            >
              CORPORATE PAN <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </span>
              <input
                id="ins-pan"
                type="text"
                required
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)}
                placeholder="300184912"
                disabled={isLoading}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono text-slate-900 bg-white border-[1.5px] border-slate-400 rounded-none focus:outline-none focus:border-black transition-colors placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* NIA License Number */}
          <div>
            <label
              htmlFor="ins-license"
              className="block text-[11px] font-mono font-bold text-black uppercase tracking-wider mb-1.5"
            >
              NIA LICENSE NO. <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <input
                id="ins-license"
                type="text"
                required
                value={niaLicense}
                onChange={(e) => setNiaLicense(e.target.value)}
                placeholder="NIA-LIC-2024-884"
                disabled={isLoading}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono text-slate-900 bg-white border-[1.5px] border-slate-400 rounded-none focus:outline-none focus:border-black transition-colors placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="ins-password"
            className="block text-[11px] font-mono font-bold text-black uppercase tracking-wider mb-1.5"
          >
            PASSWORD <span className="text-red-500 font-bold ml-0.5">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              id="ins-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••••"
              disabled={isLoading}
              className="w-full pl-10 pr-10 py-2.5 text-sm font-mono text-slate-900 bg-white border-[1.5px] border-slate-400 rounded-none focus:outline-none focus:border-black transition-colors placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-black transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Statutory Certification Checkbox */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={certified}
              onChange={(e) => setCertified(e.target.checked)}
              disabled={isLoading}
              className="mt-0.5 h-4 w-4 rounded-none border-[1.5px] border-black text-black focus:ring-0 cursor-pointer accent-black disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-xs text-slate-600 font-mono leading-relaxed">
              I certify that this institutional registration is authorized by the insurance board under Section 24 of the Nepal Insurance Act.
            </span>
          </label>
        </div>

        {/* Submit Button with Loading Indicator */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-[#064E3B] hover:bg-[#043e2f] active:bg-[#022e23] active:translate-x-[1px] active:translate-y-[1px] text-white border-[2px] border-black rounded-none shadow-[4px_4px_0px_0px_#000000] active:shadow-none transition-all flex items-center justify-center gap-2 font-mono font-bold text-sm tracking-wide uppercase cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 stroke-[2.5] animate-spin shrink-0" />
                <span>{loadingStatus}</span>
              </>
            ) : (
              <>
                <span>COMPLETE INSTITUTIONAL REGISTRATION</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Footer / Switch to Sign In */}
      <div className="mt-8 pt-6 flex justify-center border-t-[1.5px] border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-500">
        <div>
          <span>Already have institutional credentials?</span>{" "}
          <Link href="/login" className="text-black font-bold underline hover:text-[#064E3B] transition-colors">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}

