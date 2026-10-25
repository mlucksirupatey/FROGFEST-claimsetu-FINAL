import type { Metadata } from "next";
import { RegisterRoleToggle } from "../_components/register-role-toggle";
import { PolicyholderRegisterForm } from "../_components/policyholder-register-form";

export const metadata: Metadata = {
  title: "Register Policyholder Account | ClaimSetu",
  description:
    "Register for a ClaimSetu policyholder account to submit hospital bills, run automated OCR, and track statutory claim settlement.",
};

export default function PolicyholderRegisterPage() {
  return (
    <main className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 lg:p-12 bg-[#f8f9fb] [background-image:linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [background-size:28px_28px]">
      <RegisterRoleToggle activeRole="policyholder" />
      <PolicyholderRegisterForm />
    </main>
  );
}
