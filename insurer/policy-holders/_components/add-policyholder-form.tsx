"use client";

import React, { useState, useTransition } from "react";
import { UserPlus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { registerPolicyHolderAction } from "@/actions/insurer-policy-holders";

interface AddPolicyholderFormProps {
  onSuccess?: () => void;
}

export function AddPolicyholderForm({ onSuccess }: AddPolicyholderFormProps) {
  const [memberId, setMemberId] = useState("");
  const [name, setName] = useState("");
  const [policyPin, setPolicyPin] = useState("POL-SHK-781");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId.trim() || !name.trim() || !policyPin.trim()) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        const res = await registerPolicyHolderAction({
          memberId: memberId.trim(),
          name: name.trim(),
          policyCodeOrId: policyPin.trim(),
        });

        if (!res.success) {
          setErrorMessage(res.error || "Failed to register policyholder.");
          return;
        }

        setSuccessMessage(`Successfully registered ${res.member?.name} (${res.member?.memberId}).`);
        handleClear();
        if (onSuccess) onSuccess();

        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (err: any) {
        setErrorMessage(err.message || "An unexpected error occurred.");
      }
    });
  };

  const handleClear = () => {
    setMemberId("");
    setName("");
    setPolicyPin("POL-SHK-781");
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
          <UserPlus className="w-5 h-5 text-slate-700" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Add Policyholder Manually
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register an individual beneficiary into the company database
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form Row */}
      <form onSubmit={handleRegister}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Member ID */}
          <div>
            <label
              htmlFor="manual-member-id"
              className="block font-mono text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Member ID <span className="text-rose-500">*</span>
            </label>
            <input
              id="manual-member-id"
              type="text"
              required
              value={memberId}
              onChange={(e) => setMemberId(e.target.value.toUpperCase())}
              placeholder="e.g. MEM-2024-001"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-2xs placeholder:text-slate-400 transition-all uppercase"
            />
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="manual-name"
              className="block font-mono text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="manual-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ram Bahadur Shrestha"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-sans text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-2xs placeholder:text-slate-400 transition-all"
            />
          </div>

          {/* Policy Identifier / PIN */}
          <div>
            <label
              htmlFor="manual-policy-pin"
              className="block font-mono text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Policy Code or ID <span className="text-rose-500">*</span>
            </label>
            <input
              id="manual-policy-pin"
              type="text"
              required
              value={policyPin}
              onChange={(e) => setPolicyPin(e.target.value.toUpperCase())}
              placeholder="e.g. POL-SHK-781 or 1"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-2xs placeholder:text-slate-400 transition-all uppercase"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-5">
          <button
            type="submit"
            disabled={isPending || !memberId.trim() || !name.trim() || !policyPin.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#064E3B] hover:bg-[#04382a] text-white border-2 border-[#022c22] rounded-md font-bold text-xs shadow-tactile hover:translate-y-[1px] active:shadow-tactile-pressed transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            <span>{isPending ? "Registering..." : "Register Policyholder"}</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-bold text-xs shadow-2xs hover:translate-y-[1px] transition-all cursor-pointer"
          >
            <span>Clear Form</span>
          </button>
        </div>
      </form>
    </section>
  );
}
