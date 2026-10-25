import React from "react";
import type { Metadata } from "next";
import { getPoliciesAction } from "@/actions/insurer-policies";
import { PoliciesManagement } from "./_components/policies-management";

export const metadata: Metadata = {
  title: "Underwritten Policies | ClaimSetu",
  description: "Manage health insurance policies, deterministic clauses, and tariff caps.",
};

export default async function InsurerPoliciesPage() {
  try {
    const policies = await getPoliciesAction();
    return <PoliciesManagement initialPolicies={policies} />;
  } catch (err) {
    console.error("InsurerPoliciesPage SSR error:", err);
    return <PoliciesManagement initialPolicies={[]} />;
  }
}

