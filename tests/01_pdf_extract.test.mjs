// nextjs/tests/01_pdf_extract.test.mjs
// Test PDF text extraction on the real PDF files:
// 1. Claim Form.pdf
// 2. Discharge Summary.pdf
// 3. Hospital Invoice.pdf
// 4. Doctor's Prescription Temp.pdf

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { extractPdfText, extractText } from '../lib/pdf-extract.ts';

const FIXTURES_DIR = path.resolve('fixtures');

test('extractPdfText on Claim Form.pdf', async () => {
  const buf = fs.readFileSync(path.join(FIXTURES_DIR, 'claim.pdf'));
  const res = await extractPdfText(buf);

  assert.equal(res.method, 'pdf-parse');
  assert.ok(res.rawText.length > 500, `Expected rawText length > 500, got ${res.rawText.length}`);
  assert.ok(res.rawText.includes('Ram Bahadur Thapa'), 'Should contain claimant name');
  assert.ok(res.rawText.includes('Acute Appendicitis'), 'Should contain diagnosis');
  assert.ok(res.rawText.includes('65,000'), 'Should contain total requested amount');
  assert.ok(res.rawText.includes('HIC-99821'), 'Should contain policy number');
});

test('extractPdfText on Discharge Summary.pdf', async () => {
  const buf = fs.readFileSync(path.join(FIXTURES_DIR, 'discharge_summary.pdf'));
  const res = await extractPdfText(buf);

  assert.equal(res.method, 'pdf-parse');
  assert.ok(res.rawText.length > 500, `Expected rawText length > 500, got ${res.rawText.length}`);
  assert.ok(res.rawText.includes('Ram Bahadur Thapa'), 'Should contain patient name');
  assert.ok(res.rawText.includes('2083'), 'Should contain Nepali date year 2083');
  assert.ok(res.rawText.includes('Appendectomy'), 'Should contain procedure name');
  assert.ok(res.rawText.includes('KATHMANDU CITY HOSPITAL'), 'Should contain hospital name');
});

test('extractPdfText on Hospital Invoice.pdf', async () => {
  const buf = fs.readFileSync(path.join(FIXTURES_DIR, 'bill.pdf'));
  const res = await extractPdfText(buf);

  assert.equal(res.method, 'pdf-parse');
  assert.ok(res.rawText.length > 200, `Expected rawText length > 200, got ${res.rawText.length}`);
  assert.ok(res.rawText.includes('INV-1021'), 'Should contain invoice number');
  assert.ok(res.rawText.includes('Surgery Fee'), 'Should contain line item');
  assert.ok(res.rawText.includes('65,000'), 'Should contain total amount');
});

test('extractPdfText on Doctor Prescription Temp.pdf (blank template)', async () => {
  const buf = fs.readFileSync(path.join(FIXTURES_DIR, 'prescription.pdf'));
  const res = await extractPdfText(buf);

  assert.equal(res.method, 'pdf-parse');
  assert.ok(res.rawText.length > 50, `Expected rawText length > 50, got ${res.rawText.length}`);
  assert.ok(res.rawText.includes('Kathmandu City Hospital') || res.rawText.includes('Sikot'), 'Should contain hospital name or location');
});

test('extractText router dispatches correctly by mime type', async () => {
  const pdfBuf = fs.readFileSync(path.join(FIXTURES_DIR, 'claim.pdf'));
  const res = await extractText(pdfBuf, 'application/pdf', 'claim.pdf');
  assert.equal(res.method, 'pdf-parse');

  await assert.rejects(
    () => extractText(pdfBuf, 'text/plain', 'claim.txt'),
    /Unsupported file type/
  );
});
