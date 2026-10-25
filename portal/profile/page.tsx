import React from "react";
import type { Metadata } from "next";
import { getPolicyholderProfileAction } from "@/actions/portal-profile";
import { PolicyholderProfileClient } from "./_components/policyholder-profile-client";

export const metadata: Metadata = {
  title: "Policyholder Profile | ClaimSetu",
  description:
    "Manage your verified policyholder identity, citizenship credentials, and underwriting policy linkage.",
};

export default async function PolicyholderProfilePage() {
  try {
    const profile = await getPolicyholderProfileAction();
    return <PolicyholderProfileClient initialProfile={profile} />;
  } catch (err) {
    console.error("PolicyholderProfilePage SSR error:", err);
    return <PolicyholderProfileClient initialProfile={null} />;
  }
}
