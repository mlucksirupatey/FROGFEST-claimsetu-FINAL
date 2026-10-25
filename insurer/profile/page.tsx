import React from "react";
import type { Metadata } from "next";
import { getInsurerProfileAction } from "@/actions/insurer-profile";
import { InsurerProfileClient } from "./_components/insurer-profile-client";

export const metadata: Metadata = {
  title: "Institutional Profile | ClaimSetu",
  description: "Manage institutional credentials, NIA licensing, and authorized claims officer profile.",
};

export default async function InsurerProfilePage() {
  try {
    const profile = await getInsurerProfileAction();
    return <InsurerProfileClient initialProfile={profile} />;
  } catch (err) {
    console.error("InsurerProfilePage SSR error:", err);
    return <InsurerProfileClient initialProfile={null} />;
  }
}
