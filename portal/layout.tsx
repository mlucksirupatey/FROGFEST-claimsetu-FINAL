import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Route protection: require active session
  if (!session?.user) {
    redirect("/login?callbackUrl=/portal");
  }

  // Role protection: require policyholder role
  const role = String(session.user.role || "").toLowerCase();
  const isPolicyholder = role === "policyholder";

  if (!isPolicyholder) {
    if (role === "institutional" || role === "insurer") {
      redirect("/insurer");
    }
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] antialiased text-slate-800 font-sans flex flex-col">
      {children}
    </div>
  );
}
