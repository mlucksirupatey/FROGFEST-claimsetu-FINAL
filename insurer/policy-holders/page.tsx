import React from "react";
import { getPolicyHoldersAction } from "@/actions/insurer-policy-holders";
import { PolicyHoldersClient } from "./_components/policy-holders-client";

export default async function InsurerPolicyHoldersPage() {
  try {
    const members = await getPolicyHoldersAction();
    return <PolicyHoldersClient initialRecords={members} />;
  } catch (err) {
    console.error("InsurerPolicyHoldersPage SSR error:", err);
    return <PolicyHoldersClient initialRecords={[]} />;
  }
}
