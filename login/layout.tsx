import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthHeader } from "@/components/shared/auth-header";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If already authenticated, redirect away from login to their role's cockpit
  if (session?.user) {
    const role = String(session.user.role || "").toLowerCase();
    const isInstitutional = role === "institutional" || role === "insurer";
    redirect(isInstitutional ? "/insurer" : "/portal");
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f8f9fb]">
      <AuthHeader />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
