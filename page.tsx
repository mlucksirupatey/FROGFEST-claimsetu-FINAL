import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LandingPage } from "./_components/landing-page";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    const role = String(session.user.role || "").toLowerCase();
    if (role === "institutional" || role === "insurer") {
      redirect("/insurer");
    }
    redirect("/portal");
  }

  return <LandingPage />;
}
