// lib/hipml.ts
// Client for the standalone Vitraya HIPML service and Claim-to-HIPML Bridge

const HIPML_BASE_URL = process.env.HIPML_SERVICE_URL || 'http://localhost:3001';

export interface ClaimStructuredData {
  patient?: {
    name?: string;
    age?: number;
    sex?: string;
    country?: string;
    [key: string]: unknown;
  };
  policy?: {
    sumInsured?: number;
    inceptionDate?: string;
    [key: string]: unknown;
  };
  hospitalization?: {
    startDate?: string;
    endDate?: string;
    reason?: string;
    treatmentCountry?: string;
    [key: string]: unknown;
  };
  diagnoses?: string[];
  procedures?: string[];
  submissionDate?: string;
  [key: string]: unknown;
}

export interface HipmlRunResult {
  "Policy Attributes": Array<[string, string | number]>;
  Coverage: Record<string, {
    included: boolean;
    type: "Procedure" | "Service";
    "Limit per claim"?: number;
    "Limit per day"?: number;
    "Limit per policy period"?: number;
    [key: string]: unknown;
  }>;
  Conditions: Record<string, boolean | {
    condition: boolean;
    [key: string]: unknown;
  }>;
}

export interface RetrievalNeed {
  code: string;
  reason: string;
  item: string;
  entities: {
    diagnoses?: string[];
    procedures?: string[];
    services?: string[];
  };
  claimId: number;
  policyId: number;
}

/**
 * Fetch variables required by a policy PML file from the standalone service.
 */
export async function getPolicyVariables(pmlId: string): Promise<string[]> {
  const url = `${HIPML_BASE_URL}/pml/${encodeURIComponent(pmlId)}/variables`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HIPML service error (${res.status}): ${await res.text()}`);
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(`Failed to fetch policy variables: ${JSON.stringify(json.message)}`);
  }
  return json.data.variables;
}

/**
 * Map structured Claim JSON facts into variables specifically required by the PML.
 * Do not send the entire claim JSON, raw OCR, or extra fields.
 */
export function buildHipmlInputs(
  structuredData: ClaimStructuredData,
  requiredVariables?: string[]
): Record<string, unknown> {
  const hosp = structuredData.hospitalization as any;
  const policy = structuredData.policy as any;
  const mapping: Record<string, unknown> = {
    "Sum Insured": structuredData.policy?.sumInsured ?? policy?.sum_insured ?? 500000,
    "Policy inception Date": structuredData.policy?.inceptionDate ?? policy?.inception_date ?? "2080-01-01",
    "Hospitalization start date": structuredData.hospitalization?.startDate ?? hosp?.admission_date,
    "Discharge Date": structuredData.hospitalization?.endDate ?? hosp?.discharge_date,
    "Admission Reason": structuredData.hospitalization?.reason || hosp?.admission_reason || "Illness",
    "Patient Country of Residence": structuredData.patient?.country || (structuredData.patient as any)?.treatment_country || "Nepal",
    "Claim Submission Date": structuredData.submissionDate || (structuredData as any)?.submitted_at || new Date().toISOString().slice(0, 10),
    "Country of Treatment": structuredData.hospitalization?.treatmentCountry || hosp?.treatment_country || "Nepal",
  };

  if (!requiredVariables || requiredVariables.length === 0) {
    return mapping;
  }

  // Filter only to variables explicitly declared in the PML
  const filtered: Record<string, unknown> = {};
  for (const varName of requiredVariables) {
    const val = mapping[varName];
    if (val === undefined || val === null) {
      const err = new Error(`MISSING_HIPML_VARIABLE: ${varName}`);
      (err as any).code = 'MISSING_HIPML_VARIABLE';
      (err as any).variable = varName;
      throw err;
    }
    filtered[varName] = val;
  }
  return filtered;
}

/**
 * Execute deterministic policy evaluation via HIPML service POST /pml/:id/run
 */
export async function runPolicyEvaluation(
  pmlId: string,
  inputs: Record<string, unknown>
): Promise<HipmlRunResult> {
  const url = `${HIPML_BASE_URL}/pml/${encodeURIComponent(pmlId)}/run`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inputs),
  });

  if (!res.ok) {
    throw new Error(`HIPML execution error (${res.status}): ${await res.text()}`);
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(`HIPML run failed: ${JSON.stringify(json.message)}`);
  }
  return json.data as HipmlRunResult;
}

/**
 * Convert flagged / excluded / failed HIPML conditions into structured RetrievalNeed objects
 * for Track B RAG (rag_demo_claim_setu).
 */
export function extractRetrievalNeeds(
  result: HipmlRunResult,
  claimId: number,
  policyId: number,
  claimContext?: {
    diagnoses?: string[];
    procedures?: string[];
    lineItems?: Array<{ description: string; claimed_amount?: number | null }>;
  }
): RetrievalNeed[] {
  const needs: RetrievalNeed[] = [];

  // Check conditions (e.g. Claim Admissibility, Patient Eligibility)
  if (result.Conditions) {
    for (const [condName, condData] of Object.entries(result.Conditions)) {
      const isPassed = condData === true || (typeof condData === 'object' && condData !== null && (condData as any).condition === true);
      if (!isPassed) {
        let code = 'CONDITION_FAILED';
        if (condName === 'Claim Admissibility') code = 'CLAIM_ADMISSIBILITY';
        else if (condName === 'Patient Eligibility') code = 'PATIENT_ELIGIBILITY';
        else code = `CONDITION_FAILED_${condName.toUpperCase().replace(/\s+/g, '_')}`;

        needs.push({
          code,
          reason: `Policy condition '${condName}' evaluated to false. Verification against policy text needed.`,
          item: condName,
          entities: {},
          claimId,
          policyId,
        });
      }
    }
  }

  // Check excluded procedures or services relevant to this claim
  if (result.Coverage) {
    const claimTerms = [
      ...(claimContext?.procedures || []),
      ...(claimContext?.diagnoses || []),
      ...(claimContext?.lineItems?.map(li => li.description) || []),
    ].map(s => s.toLowerCase());

    for (const [itemName, itemCoverage] of Object.entries(result.Coverage)) {
      if (itemCoverage && itemCoverage.included === false) {
        // If claimContext is provided, only flag if relevant to the claim
        const isRelevant = claimTerms.length === 0 || claimTerms.some(term =>
          term.includes(itemName.toLowerCase()) || itemName.toLowerCase().includes(term)
        );

        if (isRelevant) {
          needs.push({
            code: itemCoverage.type === 'Procedure' ? 'COVERAGE_EXCLUSION' : 'EXCLUDED_SERVICE',
            reason: `${itemCoverage.type} '${itemName}' was marked as not covered/excluded in policy.`,
            item: itemName,
            entities: itemCoverage.type === 'Procedure' ? { procedures: [itemName] } : { services: [itemName] },
            claimId,
            policyId,
          });
        }
      }
    }
  }

  return needs;
}
