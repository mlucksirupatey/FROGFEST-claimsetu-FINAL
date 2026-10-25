"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { PortalTopBar } from "../../_components/portal-top-bar";
import { PortalFooter } from "../../_components/portal-footer";
import {
  User,
  Mail,
  ShieldCheck,
  Building2,
  FileText,
  CreditCard,
  LogOut,
  Edit3,
  Save,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import type { PolicyholderProfileData } from "@/actions/portal-profile";
import { updatePolicyholderProfileAction } from "@/actions/portal-profile";

interface PolicyholderProfileClientProps {
  initialProfile: PolicyholderProfileData | null;
}

export function PolicyholderProfileClient({
  initialProfile,
}: PolicyholderProfileClientProps) {
  const [name, setName] = useState(initialProfile?.fullName || "Verified Policyholder");
  const [email] = useState(initialProfile?.email || "member@claimsetu.np");
  const [memberId] = useState(initialProfile?.memberId || "MEM-000-NP");
  const [underwriter] = useState(
    initialProfile?.underwriterDisplay || "ClaimSetu Insurer"
  );
  const [panId, setPanId] = useState(initialProfile?.panId || "PAN-0000");

  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    setName(initialProfile?.fullName || "Verified Policyholder");
    setPanId(initialProfile?.panId || "PAN-0000");
    setIsEditing(false);
    setErrorMessage(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Full legal name cannot be blank.");
      return;
    }
    if (!panId.trim()) {
      setErrorMessage("Citizenship / PAN ID cannot be blank.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await updatePolicyholderProfileAction({
          fullName: name.trim(),
          panId: panId.trim(),
        });

        if (!res.success) {
          setErrorMessage(res.error || "Failed to update profile details.");
          return;
        }

        if (res.profile) {
          setName(res.profile.fullName);
          setPanId(res.profile.panId);
        }

        setIsEditing(false);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      } catch (err: any) {
        setErrorMessage(err.message || "An unexpected error occurred while saving.");
      }
    });
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased text-slate-800">
      {/* Top Bar with Dynamic User Info */}
      <PortalTopBar userName={name} userEmail={email} />

      <main className="w-full pt-28 pb-12 bg-[#F8FAFC] flex-1">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 space-y-6">
          {/* Back link */}
          <div>
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-600 hover:text-[#064E3B] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>BACK TO DASHBOARD</span>
            </Link>
          </div>

          {/* Success Notification */}
          {savedSuccess && (
            <div className="p-3.5 bg-emerald-50 border-2 border-emerald-600 shadow-[3px_3px_0px_0px_#064E3B] text-emerald-900 text-xs font-mono font-bold flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Policyholder profile details updated successfully.</span>
              </div>
              <span className="text-[10px] text-emerald-700">NIA SEC 123 SYNCED</span>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border-2 border-red-500 text-red-900 text-xs font-mono font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Main Profile Card */}
          <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-10">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="relative w-20 h-20 rounded-full border-2 border-slate-200 overflow-hidden shrink-0 bg-emerald-50 flex items-center justify-center font-bold text-2xl text-[#064E3B] font-mono">
                  {name.charAt(0)}
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px] font-semibold">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Verified Policyholder</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {name}
                  </h1>
                  <p className="text-xs font-mono text-slate-500">
                    {email}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 font-mono font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isPending}
                      className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 font-mono font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isPending}
                      className="px-4 py-2 bg-[#064E3B] hover:bg-[#044e3b] text-white rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 font-mono font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-75"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Form Details */}
            <form onSubmit={handleSave} className="mt-8 space-y-5">
              {/* Full Legal Name */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Legal Name {isEditing && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm font-mono rounded-lg border transition-colors ${
                      isEditing
                        ? "bg-white border-slate-400 text-slate-900 focus:outline-hidden focus:border-[#064E3B] shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-800 cursor-not-allowed"
                    }`}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-200 bg-slate-50 text-slate-800 cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-[11px] font-mono text-slate-400">
                  Email is linked to statutory sign-in identity.
                </p>
              </div>

              {/* Member Id & Citizenship */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Member Id
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <CreditCard className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      disabled
                      value={memberId}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-200 bg-slate-50 text-slate-800 cursor-not-allowed font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Citizenship / NIN / PAN {isEditing && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <FileText className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      disabled={!isEditing}
                      value={panId}
                      onChange={(e) => setPanId(e.target.value)}
                      className={`w-full pl-10 pr-3.5 py-2.5 text-sm font-mono rounded-lg border transition-colors ${
                        isEditing
                          ? "bg-white border-slate-400 text-slate-900 focus:outline-hidden focus:border-[#064E3B] shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-800 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Underwriting Insurer */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Underwriting Insurer &amp; Policy
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    disabled
                    value={underwriter}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-200 bg-slate-50 text-slate-800 cursor-not-allowed"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-3 px-4 bg-[#064E3B] hover:bg-[#044e3b] text-white rounded-lg shadow-sm font-mono font-bold text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-75"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Updated Profile Details</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isPending}
                    className="py-3 px-5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-xs font-mono font-bold text-xs uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>

            {/* Logout Action Bar */}
            <div className="border-t border-slate-200 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-end gap-4">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full sm:w-auto px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of Account</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <PortalFooter />
    </div>
  );
}
