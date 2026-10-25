import type { Metadata } from "next";
import { RegistrationGateways } from "./_components/registration-gateways";

export const metadata: Metadata = {
  title: "Register | ClaimSetu Gateways",
  description:
    "Choose your ClaimSetu registration gateway: Direct Policyholder reimbursement or Insurer/TPA adjudication cockpit.",
};

export default function RegisterPage() {
  return (
    <main className="flex-1 w-full flex items-center justify-center p-4 sm:p-6 md:p-10 lg:p-12 bg-[#f8f9fb] [background-image:linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] [background-size:28px_28px]">
      <RegistrationGateways />
    </main>
  );
}

