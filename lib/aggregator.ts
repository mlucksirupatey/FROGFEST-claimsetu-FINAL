// lib/aggregator.ts
// Deterministic aggregation of per-document extraction results into unified Claim JSON.
// No LLM calls — purely mechanical field merging with conflict detection.

import type {
  BillExtraction,
  ClaimFormExtraction,
  DischargeSummaryExtraction,
  PrescriptionExtraction,
  DocumentExtraction,
} from './extractor';

export interface AggregatedClaim {
  patient: {
    name: string | null;
    age: number | null;
    sex: string | null;
  };
  policy: {
    policy_number: string | null;
    sum_insured: number | null;
    inception_date: string | null;
  };
  hospitalization: {
    admission_date: string | null;
    discharge_date: string | null;
    reason: string | null;
    hospital_name: string | null;
    treatment_country: string | null;
  };
  diagnoses: string[];
  procedures: string[];
  prescriptions: Array<{
    name: string;
    dosage: string | null;
    frequency: string | null;
    duration: string | null;
  }>;
  line_items: Array<{
    description: string;
    quantity: number | null;
    unit_price: number | null;
    claimed_amount: number | null;
    raw_text: string | null;
    source_doc_type: string;
  }>;
  declared_total: number | null;
  computed_line_item_total: number | null;
  bill_discrepancy: boolean;
  source_documents: Array<{
    document_id: number;
    doc_type: string;
  }>;
  extraction_flags: string[];
}

/**
 * Aggregate multiple per-document extraction results into a single Claim JSON.
 *
 * Priority for conflicting fields:
 *   1. discharge_summary (most authoritative medical source)
 *   2. claim_form (patient-declared)
 *   3. bill
 *   4. prescription
 *
 * Conflicts are flagged in extraction_flags, never silently resolved.
 */
export function aggregateClaimData(
  extractions: Array<{ documentId: number; docType: string; data: DocumentExtraction }>
): AggregatedClaim {
  const flags: string[] = [];

  // Separate by type
  const claims = extractions.filter(e => e.docType === 'claim') as Array<{ documentId: number; docType: string; data: ClaimFormExtraction }>;
  const discharges = extractions.filter(e => e.docType === 'discharge_summary') as Array<{ documentId: number; docType: string; data: DischargeSummaryExtraction }>;
  const bills = extractions.filter(e => e.docType === 'bill') as Array<{ documentId: number; docType: string; data: BillExtraction }>;
  const prescriptions = extractions.filter(e => e.docType === 'prescription') as Array<{ documentId: number; docType: string; data: PrescriptionExtraction }>;

  // ── Patient ──
  const patientName = firstNonNull([
    discharges[0]?.data.patient_name,
    claims[0]?.data.patient_name,
    bills[0]?.data.patient_name,
    prescriptions[0]?.data.patient_name,
  ]);

  // ── Admission Date (priority: discharge > claim) ──
  const admissionSources: Array<{ source: string; value: string | null }> = [];
  if (discharges[0]?.data.admission_date) admissionSources.push({ source: 'discharge_summary', value: discharges[0].data.admission_date });
  if (claims[0]?.data.admission_date) admissionSources.push({ source: 'claim', value: claims[0].data.admission_date });

  let admissionDate: string | null = null;
  if (admissionSources.length > 0) {
    admissionDate = admissionSources[0].value;
    // Check for conflict
    if (admissionSources.length > 1 && admissionSources[0].value !== admissionSources[1].value) {
      flags.push(`ADMISSION_DATE_CONFLICT: discharge_summary="${admissionSources[0].value}" vs claim="${admissionSources[1].value}"`);
    }
  }

  // ── Discharge Date (priority: discharge > claim) ──
  const dischargeSources: Array<{ source: string; value: string | null }> = [];
  if (discharges[0]?.data.discharge_date) dischargeSources.push({ source: 'discharge_summary', value: discharges[0].data.discharge_date });
  if (claims[0]?.data.discharge_date) dischargeSources.push({ source: 'claim', value: claims[0].data.discharge_date });

  let dischargeDate: string | null = null;
  if (dischargeSources.length > 0) {
    dischargeDate = dischargeSources[0].value;
    if (dischargeSources.length > 1 && dischargeSources[0].value !== dischargeSources[1].value) {
      flags.push(`DISCHARGE_DATE_CONFLICT: discharge_summary="${dischargeSources[0].value}" vs claim="${dischargeSources[1].value}"`);
    }
  }

  // ── Hospital Name ──
  const hospitalName = firstNonNull([
    discharges[0]?.data.hospital_name,
    claims[0]?.data.hospital_name,
    bills[0]?.data.hospital_name,
  ]);

  // ── Diagnoses (union, deduplicated) ──
  const allDiagnoses = new Set<string>();
  for (const d of discharges) d.data.diagnoses.forEach(dx => allDiagnoses.add(dx));
  for (const c of claims) c.data.diagnoses.forEach(dx => allDiagnoses.add(dx));

  // ── Procedures (union, deduplicated) ──
  const allProcedures = new Set<string>();
  for (const d of discharges) d.data.procedures.forEach(p => allProcedures.add(p));
  for (const c of claims) c.data.procedures.forEach(p => allProcedures.add(p));

  // ── Line Items from bills ──
  const lineItems: AggregatedClaim['line_items'] = [];
  let declaredTotal: number | null = null;
  let computedTotal = 0;
  let billDiscrepancy = false;

  for (const b of bills) {
    for (const item of b.data.line_items) {
      const lineItemAmount = (item.claimed_amount !== null && item.claimed_amount !== undefined)
        ? item.claimed_amount
        : ((item.unit_price !== null && item.unit_price !== undefined) ? (item.quantity ?? 1) * item.unit_price : null);

      lineItems.push({
        ...item,
        claimed_amount: lineItemAmount,
        source_doc_type: 'bill',
      });
    }
    if (b.data.declared_total !== null) {
      declaredTotal = (declaredTotal || 0) + b.data.declared_total;
    }
    const lineItemSum = b.data.line_items.reduce((acc, item) => {
      const val = (item.claimed_amount !== null && item.claimed_amount !== undefined)
        ? item.claimed_amount
        : (item.unit_price ? (item.quantity ?? 1) * item.unit_price : 0);
      return acc + (val || 0);
    }, 0);
    const billComputed = (b.data.computed_line_item_total && b.data.computed_line_item_total > 0)
      ? b.data.computed_line_item_total
      : lineItemSum;

    if (billComputed > 0) {
      computedTotal += billComputed;
    }
    if (b.data.discrepancy || (b.data.declared_total !== null && billComputed > 0 && b.data.declared_total !== billComputed)) {
      billDiscrepancy = true;
      flags.push(`BILL_TOTAL_DISCREPANCY: document_id=${b.documentId}`);
    }
  }

  // ── Prescriptions ──
  const meds: AggregatedClaim['prescriptions'] = [];
  for (const p of prescriptions) {
    meds.push(...p.data.medications);
  }

  // ── Unresolved text from all documents ──
  for (const e of extractions) {
    if ('raw_unresolved' in e.data && Array.isArray(e.data.raw_unresolved)) {
      for (const ur of e.data.raw_unresolved) {
        flags.push(`UNRESOLVED_${e.docType.toUpperCase()}: ${ur}`);
      }
    }
  }

  return {
    patient: {
      name: patientName,
      age: claims[0]?.data.patient_age ?? null,
      sex: claims[0]?.data.patient_sex ?? null,
    },
    policy: {
      policy_number: claims[0]?.data.policy_number ?? null,
      sum_insured: claims[0]?.data.sum_insured ?? null,
      inception_date: claims[0]?.data.inception_date ?? null,
    },
    hospitalization: {
      admission_date: admissionDate,
      discharge_date: dischargeDate,
      reason: claims[0]?.data.admission_reason ?? null,
      hospital_name: hospitalName,
      treatment_country: claims[0]?.data.treatment_country ?? null,
    },
    diagnoses: [...allDiagnoses],
    procedures: [...allProcedures],
    prescriptions: meds,
    line_items: lineItems,
    declared_total: declaredTotal,
    computed_line_item_total: computedTotal > 0 ? computedTotal : null,
    bill_discrepancy: billDiscrepancy,
    source_documents: extractions.map(e => ({
      document_id: e.documentId,
      doc_type: e.docType,
    })),
    extraction_flags: flags,
  };
}

function firstNonNull<T>(values: (T | null | undefined)[]): T | null {
  for (const v of values) {
    if (v !== null && v !== undefined) return v;
  }
  return null;
}
