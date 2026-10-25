"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, AlertCircle, Loader2, ShieldCheck, User } from "lucide-react";

export function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [email, setEmail] = useState("admin@himalayanins.com.np");
  const [password, setPassword] = useState("devpassword123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("AUTHENTICATING...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fillDemoAccount = (role: "institutional" | "policyholder") => {
    if (isLoading) return;
    setErrorMessage(null);
    if (role === "institutional") {
      setEmail("admin@himalayanins.com.np");
      setPassword("devpassword123");
    } else {
      setEmail("aarav.sharma@nepalmail.np");
      setPassword("devpassword123");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadingStatus("VERIFYING CREDENTIALS...");
    setErrorMessage(null);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage("Invalid credentials. Please verify your email and password.");
        setIsLoading(false);
        return;
      }

      setLoadingStatus("ESTABLISHING SESSION...");

      // Fetch user role from session endpoint to route cleanly
      const meRes = await fetch("/api/auth/me");
      const data = await meRes.json();
      const userRole = data?.user?.role;
      const isInsurer = userRole === "institutional" || userRole === "insurer";

      setLoadingStatus("REDIRECTING TO PORTAL...");
      router.refresh();

      if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
        router.push(callbackUrl);
      } else if (isInsurer) {
        router.push("/insurer");
      } else {
        router.push("/portal");
      }
    } catch {
      setErrorMessage("Authentication failed. Please check network connection.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[520px] bg-white border-[2.5px] border-black rounded-none shadow-[7px_7px_0px_0px_#000000] p-7 sm:p-10 transition-all">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-300 text-[#064E3B] text-[11px] font-mono font-bold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
          <span>SECURE SYSTEM AUTHENTICATION</span>
        </div>
        <h1 className="text-3xl font-black text-black tracking-tight">
          Sign In
        </h1>
        <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed">
          Enter your credentials to access your adjudication and claim verification portal.
        </p>
      </div>

      {/* Demo Account Quick-Fill Buttons */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">
          QUICK-FILL TEST ACCOUNTS
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillDemoAccount("institutional")}
            disabled={isLoading}
            className={`py-1.5 px-2.5 text-xs font-mono font-bold border border-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              email === "admin@himalayanins.com.np"
                ? "bg-slate-900 text-white shadow-[2px_2px_0px_0px_#000000]"
                : "bg-slate-100 text-slate-800 hover:bg-slate-200"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ShieldCheck className="w-3 h-3 shrink-0" />
            <span>INSTITUTION</span>
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount("policyholder")}
            disabled={isLoading}
            className={`py-1.5 px-2.5 text-xs font-mono font-bold border border-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              email === "aarav.sharma@nepalmail.np"
                ? "bg-slate-900 text-white shadow-[2px_2px_0px_0px_#000000]"
                : "bg-slate-100 text-slate-800 hover:bg-slate-200"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <User className="w-3 h-3 shrink-0" />
            <span>POLICYHOLDER</span>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t-[2px] border-black my-5" />

      {/* Error Notice */}
      {errorMessage && (
        <div className="mb-5 p-3.5 bg-red-50 border-2 border-red-500 text-red-900 text-xs font-mono font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-2"
          >
            EMAIL ADDRESS
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </span>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@claimsetu.np"
              required
              disabled={isLoading}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono text-slate-900 bg-white border-[1.5px] border-slate-400 rounded-none focus:outline-none focus:border-black transition-colors placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-2"
          >
            PASSWORD
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={isLoading}
              className="w-full pl-10 pr-10 py-2.5 text-sm font-mono text-slate-900 bg-white border-[1.5px] border-slate-400 rounded-none focus:outline-none focus:border-black transition-colors placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-black transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button with Dynamic Loading State */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-6 py-3.5 px-4 bg-[#064E3B] hover:bg-[#043e2f] active:bg-[#022e23] text-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000000] transition-all flex items-center justify-center gap-2.5 font-mono font-bold text-sm tracking-wider uppercase cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 stroke-[2.5] animate-spin shrink-0" />
              <span>{loadingStatus}</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span>CONTINUE TO PORTAL</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5] shrink-0" />
            </>
          )}
        </button>
      </form>

      {/* Bottom Divider */}
      <div className="border-t-[2px] border-black my-6" />

      {/* Register Footer */}
      <div className="text-center text-xs sm:text-sm text-slate-600 font-medium">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-bold text-slate-900 underline underline-offset-4 hover:text-[#064E3B] transition-colors"
        >
          Register here
        </Link>
      </div>
    </div>
  );
}
