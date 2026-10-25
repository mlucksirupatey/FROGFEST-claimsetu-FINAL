// nextjs/tests/02_llm_extractor.test.mjs
// LLM structured extraction tests per CLAIM_PIPELINE_AGENT.md:
// - Extracts facts present in source
// - Missing values remain null (no fabricated defaults)
// - Preserves combined line items without guessed splits
// - Retains declared_total & computed_line_item_total, sets discrepancy flag
// - Validates against Zod schema

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// Ensure .env.local is loaded
dotenv.config({ path: path.resolve('.env.local') });

import { extractPdfText } from '../lib/pdf-extract.ts';
import {
  extractDocumentToStructuredData,
} from '../lib/extractor.ts';

const FIXTURES_DIR = path.resolve('fixtures');

test('LLM extraction on real Claim Form.pdf', async () => {
  const buf = fs.readFileSync(path.join(FIXTURES_DIR, 'claim.pdf'));
  const { rawText } = await extractPdfText(buf);

  const extracted = await extractDocumentToStructuredData({
    rawText,
    docType: 'claim',
    documentId: 101,
    claimId: 1,
  });

  assert.equal(extracted.doc_type, 'claim');
  assert.ok(extracted.patient_name?.includes('Ram Bahadur Thapa'), `Expected Ram Bahadur Thapa, got ${extracted.patient_name}`);
  assert.equal(extracted.patient_age, 45);
  assert.ok(extracted.diagnoses.some(d => d.toLowerCase().includes('appendicitis')), 'Should extract Acute Appendicitis');
  assert.ok(extracted.procedures.some(p => p.toLowerCase().includes('appendectomy')), 'Should extract Laparoscopic Appendectomy');
  assert.equal(extracted.policy_number, 'HIC-99821');

  // Verify no fabricated fields (fields not in claim form must be null)
  assert.equal(extracted.sum_insured, null, 'sum_insured should be null when not present in form');
  assert.equal(extracted.inception_date, null, 'inception_date should be null when not present in form');
});

test('LLM extraction on real Discharge Summary.pdf', async () => {
  const buf = fs.readFileSync(path.join(FIXTURES_DIR, 'discharge_summary.pdf'));
  const { rawText } = await extractPdfText(buf);

  const extracted = await extractDocumentToStructuredData({
    rawText,
    docType: 'discharge_summary',
    documentId: 102,
    claimId: 1,
  });

  assert.equal(extracted.doc_type, 'discharge_summary');
  assert.ok(extracted.patient_name?.includes('Ram Bahadur Thapa'));
  assert.ok(extracted.hospital_name?.includes('Kathmandu City Hospital') || extracted.hospital_name?.includes('KATHMANDU'));
  assert.ok(extracted.admission_date?.includes('2083') && extracted.admission_date?.includes('10'), `Admission date should contain 2083-05-10, got ${extracted.admission_date}`);
  assert.ok(extracted.discharge_date?.includes('2083') && extracted.discharge_date?.includes('12'), `Discharge date should contain 2083-05-12, got ${extracted.discharge_date}`);
  assert.ok(extracted.diagnoses.some(d => d.toLowerCase().includes('appendicitis')));
  assert.ok(extracted.procedures.some(p => p.toLowerCase().includes('appendectomy')));
});

test('LLM extraction on real Hospital Invoice.pdf', async () => {
  const buf = fs.readFileSync(path.join(FIXTURES_DIR, 'bill.pdf'));
  const { rawText } = await extractPdfText(buf);

  const extracted = await extractDocumentToStructuredData({
    rawText,
    docType: 'bill',
    documentId: 103,
    claimId: 1,
  });

  assert.equal(extracted.doc_type, 'bill');
  assert.equal(extracted.declared_total, 65000);
  assert.equal(extracted.computed_line_item_total, 65000);
  assert.equal(extracted.discrepancy, false, 'Declared and computed totals should match');
  assert.ok(extracted.line_items.length >= 3, `Expected at least 3 line items, got ${extracted.line_items.length}`);

  // Check specific line items
  const surgeryItem = extracted.line_items.find(i => i.description.toLowerCase().includes('surgery'));
  assert.ok(surgeryItem, 'Should find surgery line item');
  assert.equal(surgeryItem.claimed_amount, 45000);

  const roomItem = extracted.line_items.find(i => i.description.toLowerCase().includes('room'));
  assert.ok(roomItem, 'Should find room charge line item');
  assert.equal(roomItem.claimed_amount, 10000);
});

test('LLM extraction preserves combined line items without guessing split (ambiguous bill)', async () => {
  const ambiguousBillText = `
KATHMANDU MEDICAL CENTER
Invoice: INV-9901
Date: 2026-09-15
Patient: Sita Maya Tamang

Items:
1. Surgery and anesthesia: NPR 51,000
2. Bed Charges (2 days): NPR 6,000

Total: NPR 57,000
`;

  const extracted = await extractDocumentToStructuredData({
    rawText: ambiguousBillText,
    docType: 'bill',
    documentId: 104,
    claimId: 2,
  });

  assert.equal(extracted.doc_type, 'bill');
  assert.equal(extracted.declared_total, 57000);

  // Invariant per CLAIM_PIPELINE_AGENT.md: "Surgery and anesthesia: NPR 51,000" must NOT be split into guessed surgery/anesthesia amounts
  const combinedItem = extracted.line_items.find(i =>
    i.description.toLowerCase().includes('surgery and anesthesia') ||
    (i.description.toLowerCase().includes('surgery') && i.description.toLowerCase().includes('anesthesia'))
  );
  assert.ok(combinedItem, 'Combined surgery and anesthesia charge must be preserved as one item');
  assert.equal(combinedItem.claimed_amount, 51000, 'Combined amount must be 51,000 without guessed split');
});

test('LLM extraction does not fabricate missing values', async () => {
  const sparseDischargeText = `
DISCHARGE NOTE
Patient: Hari Prasad
Diagnosis: Observation only
Discharged in stable condition.
`;

  const extracted = await extractDocumentToStructuredData({
    rawText: sparseDischargeText,
    docType: 'discharge_summary',
    documentId: 105,
    claimId: 3,
  });

  assert.equal(extracted.doc_type, 'discharge_summary');
  // Admission and discharge dates were not in source text: must remain null, NOT today's date!
  assert.equal(extracted.admission_date, null, 'Missing admission date must be null, not fabricated');
  assert.equal(extracted.discharge_date, null, 'Missing discharge date must be null, not fabricated');
  assert.equal(extracted.hospital_name, null, 'Missing hospital name must be null');
});
