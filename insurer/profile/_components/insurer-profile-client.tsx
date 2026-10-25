"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { DashboardFooter } from "@/app/insurer/_components/dashboard-footer";
import {
  Building2,
  Mail,
  User,
  Hash,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  Edit3,
  Save,
  BadgeCheck,
  Briefcase,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { InsurerProfileData } from "@/actions/insurer-profile";
import { updateInsurerProfileAction } from "@/actions/insurer-profile";

interface InsurerProfileClientProps {
  initialProfile: InsurerProfileData | null;
}

export function InsurerProfileClient({
  initialProfile,
}: InsurerProfileClientProps) {
  // Stage 1 (Registration data)
  const [institutionName] = useState(
    initialProfile?.institutionName || "Institutional Partner"
  );
  const [corporateEmail] = useState(
    initialProfile?.email || "admin@himalayanins.com.np"
  );
  const [panNumber] = useState(initialProfile?.panNumber || "300184912");
  const [niaLicense] = useState(
    initialProfile?.niaLicenseNumber || "NIA-LIC-2024-884"
  );

  // Stage 2 (Profile completion data)
  const [officerName, setOfficerName] = useState(
    initialProfile?.fullName || ""
  );
  const [employeeId, setEmployeeId] = useState(
    initialProfile?.employeeId || ""
  );
  const [jobTitle, setJobTitle] = useState(
    initialProfile?.jobTitle || ""
  );

  const [isEditing, setIsEditing] = useState(
    !initialProfile?.fullName || !initialProfile?.employeeId || !initialProfile?.jobTitle
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isComplete, setIsComplete] = useState(
    Boolean(initialProfile?.isComplete)
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res = await updateInsurerProfileAction({
          fullName: officerName.trim(),
          employeeId: employeeId.trim(),
          jobTitle: jobTitle.trim(),
        });

        if (!res.success) {
          setErrorMessage(res.error || "Failed to update profile.");
          return;
        }

        setIsEditing(false);
        setIsComplete(true);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      } catch (err: any) {
        setErrorMessage(err.message || "An unexpected error occurred.");
      }
    });
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Main Workspace Body */}
      <main className="p-4 sm:p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6 flex-1">
        {/* Incomplete Profile Prompt */}
        {!isComplete && (
          <div className="p-4 bg-amber-50 border-[2px] border-amber-600 shadow-[3px_3px_0px_0px_#B45309] text-amber-950 text-xs font-mono font-bold flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <p className="font-black uppercase tracking-wider text-[11px] text-amber-900">
                  STAGE 2 PROFILE INCOMPLETE
                </p>
                <p className="text-[11px] font-normal text-amber-800 mt-0.5">
                  Please complete Officer Name, Employee ID, and Job Title below to finalize statutory NIA credential syncing.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {savedSuccess && (
          <div className="p-3.5 bg-emerald-50 border-[2px] border-emerald-600 shadow-[3px_3px_0px_0px_#064E3B] text-emerald-900 text-xs font-mono font-bold flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Institutional officer credentials updated successfully in database.</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold">NIA SYNC COMPLETED</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 bg-red-50 border-[2px] border-red-600 text-red-900 text-xs font-mono font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Profile Card */}
        <div className="w-full bg-white border-[2.5px] border-black rounded-none shadow-[7px_7px_0px_0px_#000000] p-6 sm:p-10 transition-all">
          {/* Header & Avatar Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b-[2px] border-black">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-none border-[1.5px] border-black overflow-hidden shrink-0 bg-slate-100">
                <Image
                  src="/default-avatar.svg"
                  alt="Default Insurer Profile Avatar"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Identity & Role */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 border border-emerald-400 text-emerald-800 text-[10px] font-mono font-bold uppercase tracking-wider">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>INSTITUTIONAL ADJUDICATOR</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight pt-1">
                  {officerName || "Authorized Claims Officer"}
                </h1>
                <p className="text-xs font-mono text-slate-600 font-medium">
                  {institutionName} • {corporateEmail}
                </p>
                {jobTitle && (
                  <p className="text-xs font-mono text-slate-500 font-bold">
                    {jobTitle} {employeeId ? `(ID: ${employeeId})` : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Edit / Save Toggle Action */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-50 text-black border-[1.5px] border-black rounded-none shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 font-mono font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>EDIT DETAILS</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSave}
                  className="w-full sm:w-auto px-4 py-2 bg-[#064E3B] hover:bg-[#043e2f] text-white border-[1.5px] border-black rounded-none shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 font-mono font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{isPending ? "SAVING..." : "SAVE DETAILS"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Form Fields: Details Taken During Registration & Stage 2 Completion */}
          <form onSubmit={handleSave} className="mt-8 space-y-5">
            {/* Section A: Institutional Identity (Read-only stage 1 registration) */}
            <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-200">
              STAGE 1 — INSTITUTIONAL CREDENTIALS (STATUTORY)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Institution Name */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-black uppercase tracking-wider mb-1.5">
                  INSTITUTION NAME
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    disabled
                    value={institutionName}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono rounded-none border-[1.5px] bg-slate-50 border-slate-300 text-slate-700 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Corporate Email */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-black uppercase tracking-wider mb-1.5">
                  CORPORATE EMAIL
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    disabled
                    value={corporateEmail}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono rounded-none border-[1.5px] bg-slate-50 border-slate-300 text-slate-700 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* PAN / VAT Number */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-black uppercase tracking-wider mb-1.5">
                  CORPORATE PAN
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    disabled
                    value={panNumber}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono rounded-none border-[1.5px] bg-slate-50 border-slate-300 text-slate-700 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* NIA License Number */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-black uppercase tracking-wider mb-1.5">
                  NIA LICENSE NUMBER
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    disabled
                    value={niaLicense}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono rounded-none border-[1.5px] bg-slate-50 border-slate-300 text-slate-700 cursor-not-allowed uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Section B: Officer Specific Profile (Stage 2 completion) */}
            <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider pt-4 pb-1 border-b border-slate-200">
              STAGE 2 — AUTHORIZED ADJUDICATOR OFFICER DETAILS
            </div>

            {/* Officer Name */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-black uppercase tracking-wider mb-1.5">
                OFFICER FULL NAME <span className="text-red-500 font-bold ml-0.5">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="e.g. Rajesh K. Shrestha"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-sm font-mono rounded-none border-[1.5px] transition-colors ${
                    isEditing
                      ? "bg-white border-black text-black focus:outline-none"
                      : "bg-slate-50 border-slate-300 text-slate-800 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Employee ID */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-black uppercase tracking-wider mb-1.5">
                  EMPLOYEE ID <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <BadgeCheck className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-8841"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm font-mono rounded-none border-[1.5px] transition-colors ${
                      isEditing
                        ? "bg-white border-black text-black focus:outline-none"
                        : "bg-slate-50 border-slate-300 text-slate-800 cursor-not-allowed"
                    }`}
                  />
                </div>
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-black uppercase tracking-wider mb-1.5">
                  JOB TITLE / DESIGNATION <span className="text-red-500 font-bold ml-0.5">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    disabled={!isEditing}
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Head of Claims Adjudication"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm font-mono rounded-none border-[1.5px] transition-colors ${
                      isEditing
                        ? "bg-white border-black text-black focus:outline-none"
                        : "bg-slate-50 border-slate-300 text-slate-800 cursor-not-allowed"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Save Button (when editing) */}
            {isEditing && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 px-4 bg-[#064E3B] hover:bg-[#043e2f] text-white border-2 border-black rounded-none shadow-[3px_3px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 font-mono font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isPending ? "SAVING UPDATES..." : "SAVE UPDATED DETAILS"}</span>
                </button>
              </div>
            )}
          </form>

          {/* Bottom Divider */}
          <div className="border-t-[2px] border-black my-8" />

          {/* Sign Out Action Section */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full sm:w-auto px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-800 border-[1.5px] border-red-700 rounded-none font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#991B1B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>SIGN OUT OF PORTAL</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <DashboardFooter />
    </div>
  );
}
