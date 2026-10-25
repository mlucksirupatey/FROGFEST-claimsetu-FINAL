import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginCard } from "./_components/login-card";

export const metadata: Metadata = {
  title: "Sign In | ClaimSetu",
  description: "Sign in to access your ClaimSetu adjudication and claim verification portal.",
};

export default function LoginPage() {
  return (
    <main className="flex-1 w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#f8f9fb] [background-image:linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [background-size:28px_28px]">
      <Suspense fallback={<div className="p-8 text-center text-sm font-mono text-slate-500">Loading sign in...</div>}>
        <LoginCard />
      </Suspense>
    </main>
  );
}
