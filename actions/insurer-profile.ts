"use server";

import { auth } from "@/auth";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface InsurerProfileData {
  userId: number;
  email: string;
  role: string;
  institutionId: number;
  institutionName: string;
  panNumber: string;
  niaLicenseNumber: string;
  fullName: string;
  employeeId: string;
  jobTitle: string;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateInsurerProfileInput {
  fullName: string;
  employeeId: string;
  jobTitle: string;
}

/**
 * Server Action: Fetches institutional profile directly from PostgreSQL.
 */
export async function getInsurerProfileAction(): Promise<InsurerProfileData | null> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: Active session required");
  }

  const role = String(session.user.role || "").toLowerCase();
  if (role !== "institutional" && role !== "insurer") {
    throw new Error("Forbidden: Institutional account required");
  }

  // Support numeric user id from session
  const userId = session.user.userId || (session.user as any).id;
  const email = session.user.email || "";

  // Query by user id, or fallback to email match
  const res = await query(
    `SELECT u.id, u.email, u.role,
            p.institution_id, i.name AS institution_name,
            p.pan_number, p.nia_license_number,
            p.full_name, p.employee_id, p.job_title,
            p.created_at, p.updated_at
     FROM users u
     JOIN institutional_profile p ON p.user_id = u.id
     JOIN institutions i ON i.id = p.institution_id
     WHERE u.id = $1 OR LOWER(u.email) = LOWER($2)
     LIMIT 1`,
    [userId || -1, email]
  );

  if (res.rows.length === 0) {
    return null;
  }

  const row = res.rows[0];
  const isComplete = Boolean(row.full_name && row.employee_id && row.job_title);

  return {
    userId: Number(row.id),
    email: row.email,
    role: row.role,
    institutionId: Number(row.institution_id),
    institutionName: row.institution_name,
    panNumber: row.pan_number || "",
    niaLicenseNumber: row.nia_license_number || "",
    fullName: row.full_name || "",
    employeeId: row.employee_id || "",
    jobTitle: row.job_title || "",
    isComplete,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

/**
 * Server Action: Updates authorized adjudicator officer credentials (Stage 2 profile).
 */
export async function updateInsurerProfileAction(
  input: UpdateInsurerProfileInput
): Promise<{ success: boolean; error?: string; profile?: InsurerProfileData }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized: Active session required" };
    }

    const role = String(session.user.role || "").toLowerCase();
    if (role !== "institutional" && role !== "insurer") {
      return { success: false, error: "Forbidden: Institutional account required" };
    }

    const fullName = input.fullName?.trim();
    const employeeId = input.employeeId?.trim();
    const jobTitle = input.jobTitle?.trim();

    if (!fullName || !employeeId || !jobTitle) {
      return {
        success: false,
        error: "Officer full name, employee ID, and job title are required.",
      };
    }

    const userId = session.user.userId || (session.user as any).id;
    const email = session.user.email || "";

    // Resolve user ID
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const userRes = await query(
        `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [email]
      );
      if (userRes.rows.length > 0) {
        resolvedUserId = Number(userRes.rows[0].id);
      }
    }

    if (!resolvedUserId) {
      return { success: false, error: "Unable to identify active user session." };
    }

    // Update institutional_profile
    const updateRes = await query(
      `UPDATE institutional_profile
       SET full_name = $1,
           employee_id = $2,
           job_title = $3,
           updated_at = NOW()
       WHERE user_id = $4
       RETURNING user_id, institution_id, full_name, employee_id, job_title, updated_at`,
      [fullName, employeeId, jobTitle, resolvedUserId]
    );

    if (updateRes.rows.length === 0) {
      return { success: false, error: "Institutional profile not found." };
    }

    revalidatePath("/insurer/profile");

    // Fetch refreshed complete profile
    const freshProfile = await getInsurerProfileAction();
    return { success: true, profile: freshProfile || undefined };
  } catch (err: any) {
    console.error("updateInsurerProfileAction error:", err);
    return { success: false, error: err.message || "Failed to update profile." };
  }
}
