"use client";

import React from "react";
import { RotateCcw } from "lucide-react";

export interface StepLabel {
  id: number;
  title: string;
  label: string;
}

interface ClaimHeaderProps {
  currentStage: number;
  totalStages?: number;
  maxUnlockedStage?: number;
  onSelectStage?: (stage: number) => void;
  onReset?: () => void;
  title?: string;
  subtitle?: string;
  stageLabels?: StepLabel[];
  className?: string;
  containerClassName?: string;
}

const default5StageLabels: StepLabel[] = [
  { id: 1, title: "Member Lookup", label: "01 Member" },
  { id: 2, title: "Policy Selection", label: "02 Policy" },
  { id: 3, title: "Claim Form", label: "03 Claim Form" },
  { id: 4, title: "Supporting Evidence", label: "04 Evidence" },
  { id: 5, title: "Review & Submit", label: "05 Review" },
];

const default4StageLabels: StepLabel[] = [
  { id: 1, title: "Policy Selection", label: "01 Policy" },
  { id: 2, title: "Claim Form", label: "02 Claim Form" },
  { id: 3, title: "Supporting Evidence", label: "03 Evidence" },
  { id: 4, title: "Review & Submit", label: "04 Review" },
];

export function ClaimHeader({
  currentStage,
  totalStages = 5,
  maxUnlockedStage = 1,
  onSelectStage,
  onReset,
  title = "File a Health Insurance Claim",
  subtitle = "Verify membership, choose member's active policy, and upload claims for instant verification.",
  stageLabels,
  className = "",
  containerClassName = "max-w-6xl mx-auto px-6 sm:px-8",
}: ClaimHeaderProps) {
  const steps =
    stageLabels || (totalStages === 4 ? default4StageLabels : default5StageLabels);

  return (
    <header className={`bg-white border-b border-slate-200 shrink-0 ${className}`}>
      <div className={`py-6 ${containerClassName}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
              {title}
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {subtitle}
            </p>
          </div>

          {/* Status Indicators & Reset Action */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                STAGE 0{Math.min(currentStage, totalStages)} OF 0{totalStages}
              </span>
            </div>

            {currentStage > 1 && onReset && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-medium cursor-pointer transition-colors"
                title="Reset to Step 1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Stepper Tabs */}
        <nav
          aria-label="Claim Progress Steps"
          className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto"
        >
          {steps.map((st) => {
            const isCurrent = currentStage === st.id;
            const isCompleted = currentStage > st.id;
            const isUnlocked = st.id <= maxUnlockedStage;

            return (
              <button
                key={st.id}
                type="button"
                disabled={!isUnlocked}
                onClick={() => onSelectStage && onSelectStage(st.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isCurrent
                    ? "bg-slate-900 text-white shadow-2xs"
                    : isCompleted
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{st.label}</span>
                {isCompleted && <span>✓</span>}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
