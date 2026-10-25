// nextjs/lib/auth/types.ts
// Shared user role and profile types adhering to CLAIMSETU_AUTH_IMPLEMENTATION_PLAN.md

export type UserRole = "policyholder" | "institutional";

export interface DbUser {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface PolicyholderProfile {
  user_id: string;
  full_name: string;
  policy_id: number;
  insurance_provider: "salico_micro" | "salico" | "shikhar";
  pan_id: string;
}

export interface InstitutionalProfile {
  user_id: string;
  institution_id: number;
  institution_name?: string;
  pan_number: string;
  nia_license_number: string;
  full_name: string | null;
  employee_id: string | null;
  job_title: string | null;
}
