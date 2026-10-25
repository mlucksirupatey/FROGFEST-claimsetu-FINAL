import React from "react";
import type { Metadata } from "next";
import { getDashboardDataAction } from "@/actions/insurer-dashboard";
import { InsurerDashboard } from "./_components/insurer-dashboard";

export const metadata: Metadata = {
  title: "Insurer Adjudication Portal | ClaimSetu",
  description: "Statutory claim adjudication queue and underwriter analytics.",
};

export default async function InsurerPage() {
  try {
    const initialData = await getDashboardDataAction();
    return <InsurerDashboard initialData={initialData} />;
  } catch (err) {
    console.error("InsurerPage SSR load error:", err);
    return <InsurerDashboard />;
  }
}

