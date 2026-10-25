// nextjs/tests/03_aggregator.test.mjs
// Unit tests for deterministic Claim JSON aggregation per CLAIM_PIPELINE_AGENT.md:
// - Aggregates multiple per-document extractions into unified Claim JSON
// - Deduplicates diagnoses and procedures (set union)
// - Preserves declared_total and computes line-item total
// - Flags date conflicts (ADMISSION_DATE_CONFLICT) without silent overwrite
// - Never fabricates missing values

import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateClaimData } from '../lib/aggregator.ts';

test('aggregates claim, discharge summary, and bill into unified Claim JSON', () => {
  const extractions = [
    {
      documentId: 10,
      docType: 'claim',
      data: {
        doc_type: 'claim',
        patient_name: 'Ram Bahadur Thapa',
        patient_age: 45,
        patient_sex: 'Male',
        policy_number: 'HIC-99821',
        sum_insured: null,
        inception_date: null,
        admission_date: '2083-05-10',
        discharge_date: '2083-05-12',
        admission_reason: 'Acute Appendicitis',
        hospital_name: 'Kathmandu City Hospital',
        treatment_country: 'Nepal',
        diagnoses: ['Acute Appendicitis'],
        procedures: ['Emergency Laparoscopic Appendectomy'],
        raw_unresolved: [],
      },
    },
    {
      documentId: 11,
      docType: 'discharge_summary',
      data: {
        doc_type: 'discharge_summary',
        patient_name: 'Ram Bahadur Thapa',
        admission_date: '2083-05-10',
        discharge_date: '2083-05-12',
        hospital_name: 'Kathmandu City Hospital',
        diagnoses: ['Acute Appendicitis'],
        procedures: ['Emergency Laparoscopic Appendectomy'],
        treatment_summary: 'Laparoscopic appendectomy performed successfully.',
        raw_unresolved: [],
      },
    },
    {
      documentId: 12,
      docType: 'bill',
      data: {
        doc_type: 'bill',
        hospital_name: 'Kathmandu City Hospital',
        bill_number: 'INV-1021',
        bill_date: '2083-05-12',
        patient_name: 'Ram Bahadur Thapa',
        line_items: [
          { description: 'ER Charge', quantity: 1, unit_price: 3000, claimed_amount: 3000, raw_text: null },
          { description: 'Surgery Fee', quantity: 1, unit_price: 45000, claimed_amount: 45000, raw_text: null },
          { description: 'Room Charge', quantity: 2, unit_price: 5000, claimed_amount: 10000, raw_text: null },
          { description: 'Pharmacy', quantity: 2, unit_price: 3500, claimed_amount: 7000, raw_text: null },
        ],
        declared_total: 65000,
        computed_line_item_total: 65000,
        discrepancy: false,
        raw_unresolved: [],
      },
    },
  ];

  const aggregated = aggregateClaimData(extractions);

  // Demographics
  assert.equal(aggregated.patient.name, 'Ram Bahadur Thapa');
  assert.equal(aggregated.patient.age, 45);
  assert.equal(aggregated.patient.sex, 'Male');

  // Policy & Hospitalization
  assert.equal(aggregated.policy.policy_number, 'HIC-99821');
  assert.equal(aggregated.hospitalization.admission_date, '2083-05-10');
  assert.equal(aggregated.hospitalization.discharge_date, '2083-05-12');
  assert.equal(aggregated.hospitalization.hospital_name, 'Kathmandu City Hospital');

  // Diagnoses and Procedures (deduplicated)
  assert.deepEqual(aggregated.diagnoses, ['Acute Appendicitis']);
  assert.deepEqual(aggregated.procedures, ['Emergency Laparoscopic Appendectomy']);

  // Financials
  assert.equal(aggregated.line_items.length, 4);
  assert.equal(aggregated.declared_total, 65000);
  assert.equal(aggregated.computed_line_item_total, 65000);
  assert.equal(aggregated.bill_discrepancy, false);

  // Traceability
  assert.equal(aggregated.source_documents.length, 3);
  assert.deepEqual(
    aggregated.source_documents.map(d => d.document_id),
    [10, 11, 12]
  );
  assert.equal(aggregated.extraction_flags.length, 0);
});

test('detects conflicting admission dates and preserves conflict in extraction_flags', () => {
  const conflictingExtractions = [
    {
      documentId: 1,
      docType: 'claim',
      data: {
        doc_type: 'claim',
        patient_name: 'Patient A',
        patient_age: null,
        patient_sex: null,
        policy_number: null,
        sum_insured: null,
        inception_date: null,
        admission_date: '2083-05-11', // Claim says 11th
        discharge_date: '2083-05-15',
        admission_reason: null,
        hospital_name: null,
        treatment_country: null,
        diagnoses: [],
        procedures: [],
        raw_unresolved: [],
      },
    },
    {
      documentId: 2,
      docType: 'discharge_summary',
      data: {
        doc_type: 'discharge_summary',
        patient_name: 'Patient A',
        admission_date: '2083-05-10', // Discharge says 10th
        discharge_date: '2083-05-15',
        hospital_name: null,
        diagnoses: [],
        procedures: [],
        treatment_summary: null,
        raw_unresolved: [],
      },
    },
  ];

  const aggregated = aggregateClaimData(conflictingExtractions);

  // Discharge summary is prioritized for the resolved field
  assert.equal(aggregated.hospitalization.admission_date, '2083-05-10');

  // Conflict MUST be flagged explicitly per CLAIM_PIPELINE_AGENT.md
  assert.ok(
    aggregated.extraction_flags.some(f => f.includes('ADMISSION_DATE_CONFLICT')),
    'Must include ADMISSION_DATE_CONFLICT in extraction_flags'
  );
  assert.ok(
    aggregated.extraction_flags.some(f => f.includes('2083-05-10') && f.includes('2083-05-11')),
    'Conflict flag must mention both dates'
  );
});

test('flags bill total discrepancy when declared_total differs from line items', () => {
  const discrepancyExtractions = [
    {
      documentId: 3,
      docType: 'bill',
      data: {
        doc_type: 'bill',
        hospital_name: 'Hospital B',
        bill_number: 'B-99',
        bill_date: null,
        patient_name: 'Patient B',
        line_items: [
          { description: 'Bed charge', quantity: 1, unit_price: 2000, claimed_amount: 2000, raw_text: null },
          { description: 'Doctor fee', quantity: 1, unit_price: 3000, claimed_amount: 3000, raw_text: null },
        ],
        declared_total: 6000, // Declared 6000, but sum is 5000!
        computed_line_item_total: 5000,
        discrepancy: true,
        raw_unresolved: [],
      },
    },
  ];

  const aggregated = aggregateClaimData(discrepancyExtractions);

  assert.equal(aggregated.declared_total, 6000);
  assert.equal(aggregated.computed_line_item_total, 5000);
  assert.equal(aggregated.bill_discrepancy, true);
  assert.ok(
    aggregated.extraction_flags.some(f => f.includes('BILL_TOTAL_DISCREPANCY')),
    'Must flag BILL_TOTAL_DISCREPANCY'
  );
});
