import type { DefaultSession } from "next-auth";
import "next-auth/jwt";
import type { UserRole } from "@/lib/auth/types";

declare module "next-auth" {
  interface User {
    id?: string;
    userId?: string;
    role?: UserRole;
  }

  interface Session {
    user: {
      id: string;
      userId: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    email?: string | null;
    role?: UserRole;
  }
}
