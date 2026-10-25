"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOutPage() {
  useEffect(() => {
    signOut({ callbackUrl: "/" });
  }, []);

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#f8f9fb]">
      <div className="flex flex-col items-center gap-3 p-8 bg-white border-[2.5px] border-black shadow-[6px_6px_0px_0px_#000000] text-center max-w-sm w-full">
        <LogOut className="w-8 h-8 text-[#064E3B] animate-pulse" />
        <h1 className="text-xl font-black text-black tracking-tight">Signing Out</h1>
        <p className="text-xs font-mono text-slate-500">
          Terminating session and redirecting to home page...
        </p>
      </div>
    </main>
  );
}
