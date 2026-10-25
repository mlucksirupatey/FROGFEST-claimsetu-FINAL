// nextjs/lib/claims/document-classifier.ts
// Heuristic evidence document categorization
// Adheres to CLAIMSETU_FULL_CLAIM_AUTH_MEMBER_IMPLEMENTATION_PLAN.md Sections 17, 18, 19

export type ClaimDocumentType =
  | "claim_form"
  | "bill"
  | "discharge_summary"
  | "prescription"
  | "diagnostic_report"
  | "other";

export function detectDocumentCategory(filename: string): { category: ClaimDocumentType; reason: string } {
  const lower = filename.toLowerCase();

  if (lower.includes("invoice") || lower.includes("bill") || lower.includes("vat") || lower.includes("tax")) {
    return { category: "bill", reason: "Matched billing keywords in filename (invoice/bill/vat/tax)" };
  }
  if (lower.includes("discharge") || lower.includes("summary")) {
    return { category: "discharge_summary", reason: "Matched discharge summary keywords in filename" };
  }
  if (lower.includes("prescription") || lower.includes("rx") || lower.includes("dr") || lower.includes("doctor")) {
    return { category: "prescription", reason: "Matched physician prescription keywords in filename" };
  }
  if (lower.includes("claim_form") || lower.includes("claimform") || lower.includes("claim-form")) {
    return { category: "claim_form", reason: "Matched claim form keywords in filename" };
  }
  if (
    lower.includes("diagnostic") ||
    lower.includes("lab") ||
    lower.includes("pathology") ||
    lower.includes("blood_test") ||
    lower.includes("bloodtest") ||
    lower.includes("biopsy") ||
    lower.includes("xray") ||
    lower.includes("x-ray") ||
    lower.includes("mri") ||
    lower.includes("ct_scan") ||
    lower.includes("ultrasound")
  ) {
    return { category: "diagnostic_report", reason: "Matched diagnostic/lab test keywords in filename" };
  }

  return { category: "other", reason: "Unrecognized filename, defaulted to other" };
}
