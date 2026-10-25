"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, UserPlus } from "lucide-react";

export function RegisterCard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate registration and redirect to login
    setTimeout(() => {
      router.push("/login");
    }, 400);
  };

  return (
    <div className="w-full max-w-[520px] bg-white border-[2.5px] border-black rounded-none shadow-[7px_7px_0px_0px_#000000] p-7 sm:p-10 transition-all">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-black tracking-tight">
          Register
        </h1>
        <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed">
          Create credentials to access the ClaimSetu adjudication and claim verification network.
        </p>
      </div>

      {/* Top Divider */}
      <div className="border-t-[2px] border-black my-6" />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-2"
          >
            OFFICER / FULL NAME
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <User className="w-4 h-4" />
            </span>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Rajesh K. Shrestha"
              required
              className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono text-slate-900 bg-white border-[1.5px] border-slate-400 rounded-none focus:outline-none focus:border-black transition-colors placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-2"
          >
            OFFICIAL EMAIL
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
              placeholder="officer@claimsetu.np"
              required
              className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono text-slate-900 bg-white border-[1.5px] border-slate-400 rounded-none focus:outline-none focus:border-black transition-colors placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Password */}
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
              placeholder="Create strong password"
              required
              className="w-full pl-10 pr-10 py-2.5 text-sm font-mono text-slate-900 bg-white border-[1.5px] border-slate-400 rounded-none focus:outline-none focus:border-black transition-colors placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-black transition-colors cursor-pointer"
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-6 py-3 px-4 bg-[#064E3B] hover:bg-[#043e2f] active:bg-[#022e23] text-white border-2 border-black rounded-none shadow-[4px_4px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#000000] transition-all flex items-center justify-center gap-2.5 font-mono font-bold text-sm tracking-wider uppercase cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>{isLoading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </form>

      {/* Bottom Divider */}
      <div className="border-t-[2px] border-black my-6" />

      {/* Login Footer */}
      <div className="text-center text-xs sm:text-sm text-slate-600 font-medium">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-slate-900 underline underline-offset-2 hover:text-emerald-800 transition-colors"
        >
          Sign in here
        </Link>
      </div>
    </div>
  );
}
