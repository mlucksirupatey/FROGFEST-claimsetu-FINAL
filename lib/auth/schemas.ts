// nextjs/lib/auth/schemas.ts
// Zod validation schemas for registration and profile updates
// Adheres strictly to CLAIMSETU_AUTH_IMPLEMENTATION_PLAN.md Sections 7.1 & 15

import { z } from "zod";

export const policyholderRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
  member_id: z.string().optional().nullable(),
  full_name: z.string().optional().nullable(),
  policy_id: z.coerce.number().int().positive().optional().nullable(),
  insurance_provider: z.enum(["salico_micro", "salico", "shikhar"]).optional().nullable(),
  pan_id: z.string().optional().nullable(),
});

export const institutionalRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
  institution_name: z.string().min(1).optional().nullable(),
  institution_id: z.coerce.number().int().positive().optional().nullable(),
  pan_number: z.string().min(1),
  nia_license_number: z.string().min(1),
});

export const insurerProfileUpdateSchema = z.object({
  full_name: z.string().min(1),
  employee_id: z.string().min(1),
  job_title: z.string().min(1),
});
