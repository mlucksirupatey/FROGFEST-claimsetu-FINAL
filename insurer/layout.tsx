import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { InsurerLayoutClient } from "./_components/insurer-layout-client";

export default async function InsurerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Route protection: require active session
  if (!session?.user) {
    redirect("/login?callbackUrl=/insurer");
  }

  // Role protection: require institutional or insurer role
  const role = String(session.user.role || "").toLowerCase();
  const isInstitutional = role === "institutional" || role === "insurer";

  if (!isInstitutional) {
    if (role === "policyholder") {
      redirect("/portal");
    }
    redirect("/login");
  }

  return <InsurerLayoutClient>{children}</InsurerLayoutClient>;
}
