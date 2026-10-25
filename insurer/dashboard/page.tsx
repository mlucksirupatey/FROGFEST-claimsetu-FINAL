import React from "react";
import type { Metadata } from "next";
import { getDashboardDataAction } from "@/actions/insurer-dashboard";
import { InsurerDashboard } from "../_components/insurer-dashboard";

export const metadata: Metadata = {
  title: "Insurer Adjudication Dashboard | ClaimSetu",
  description: "Real-time AI claim adjudication, STP verification queue, and automated policy validation.",
};

export default async function InsurerDashboardRoutePage() {
  try {
    const initialData = await getDashboardDataAction();
    return <InsurerDashboard initialData={initialData} />;
  } catch (err) {
    console.error("InsurerDashboardRoutePage SSR load error:", err);
    return <InsurerDashboard />;
  }
}
