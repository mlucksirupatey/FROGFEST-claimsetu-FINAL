"use client";

import React, { useState, useTransition } from "react";
import { DashboardHeader } from "./dashboard-header";
import { KpiMetricCards } from "./kpi-metric-cards";
import { ClaimsQueueTable } from "./claims-queue-table";
import { DashboardFooter } from "./dashboard-footer";
import type { InsurerDashboardData } from "@/actions/insurer-dashboard";
import { getDashboardDataAction } from "@/actions/insurer-dashboard";

interface InsurerDashboardProps {
  initialData?: InsurerDashboardData;
  onOpenMobileSidebar?: () => void;
}

export function InsurerDashboard({
  initialData,
  onOpenMobileSidebar,
}: InsurerDashboardProps) {
  const [data, setData] = useState<InsurerDashboardData | undefined>(initialData);
  const [, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const fresh = await getDashboardDataAction();
        setData(fresh);
      } catch (err) {
        console.error("Failed to refresh dashboard data:", err);
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen bg-[#F3F4F6] text-slate-800">
      {/* Top Header Area from Stitch */}
      <DashboardHeader onOpenMobileSidebar={onOpenMobileSidebar} />

      {/* Main Dashboard Canvas */}
      <main className="px-6 sm:px-8 py-8 space-y-8 flex-1 max-w-7xl w-full mx-auto">
        {/* 3 KPI Cards */}
        <KpiMetricCards kpis={data?.kpis} />

        {/* Active Claims Queue Data Table */}
        <ClaimsQueueTable claims={data?.claims} />
      </main>

      {/* Institutional Footer */}
      <DashboardFooter />
    </div>
  );
}
