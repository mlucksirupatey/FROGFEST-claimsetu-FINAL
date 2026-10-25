// nextjs/fixtures/generate-test-pdfs.mts
// Generates simple test PDF fixtures for pipeline testing.
// Run: npx tsx fixtures/generate-test-pdfs.mts

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { writeFileSync, mkdirSync } from 'fs';

async function createTextPdf(lines: string[], filename: string) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]); // A4

  let y = 800;
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: 11, font, color: rgb(0, 0, 0) });
    y -= 18;
  }

  const bytes = await doc.save();
  writeFileSync(filename, bytes);
  console.log(`Created: ${filename}`);
}

async function main() {
  mkdirSync('fixtures', { recursive: true });

  // ── Claim Form ──
  await createTextPdf(
    [
      'HEALTH INSURANCE CLAIM FORM',
      '',
      'Policy Number: POL-2025-001',
      'Sum Insured: NPR 500,000',
      'Policy Inception Date: 2025-01-15',
      '',
      'Patient Name: Ram Bahadur Sharma',
      'Age: 57',
      'Sex: Male',
      'Country of Residence: Nepal',
      '',
      'Hospital: Bir Hospital, Kathmandu',
      'Country of Treatment: Nepal',
      'Admission Date: 2026-09-10',
      'Discharge Date: 2026-09-14',
      'Reason for Admission: Illness',
      '',
      'Primary Diagnosis: Cataract (mature senile cataract, right eye)',
      'Procedures: Phacoemulsification with IOL implantation',
      '',
      'Date of Submission: 2026-09-20',
    ],
    'fixtures/claim.pdf'
  );

  // ── Bill ──
  await createTextPdf(
    [
      'BIR HOSPITAL - PATIENT BILL',
      'Bill No: BH-2026-4521',
      'Date: 2026-09-14',
      '',
      'Patient: Ram Bahadur Sharma',
      '',
      'ITEMIZED CHARGES:',
      '',
      '1. Room and Bed Charges (4 nights x NPR 3,000)     NPR 12,000',
      '2. ICU Charges                                      NPR 0',
      '3. Surgeon Fee                                      NPR 25,000',
      '4. Anaesthesia                                      NPR 8,000',
      '5. Operation Theatre                                NPR 15,000',
      '6. Medicines and Drugs                              NPR 7,500',
      '7. Diagnostic Tests (pre-op blood work, eye exam)   NPR 5,000',
      '8. Nursing Charges                                  NPR 4,000',
      '9. IOL Lens (Intraocular Lens)                      NPR 18,000',
      '',
      'TOTAL: NPR 94,500',
    ],
    'fixtures/bill.pdf'
  );

  // ── Discharge Summary ──
  await createTextPdf(
    [
      'DISCHARGE SUMMARY',
      '',
      'Bir Hospital, Kathmandu',
      '',
      'Patient: Ram Bahadur Sharma',
      'MRN: BH-20260910-1234',
      'Admission Date: 2026-09-10',
      'Discharge Date: 2026-09-14',
      '',
      'Diagnosis:',
      '  - Mature senile cataract, right eye (H25.1)',
      '  - Type 2 Diabetes Mellitus (E11.9) - pre-existing, controlled',
      '',
      'Procedures:',
      '  - Phacoemulsification with posterior chamber IOL implantation (right eye)',
      '',
      'Treatment Summary:',
      '  Patient admitted for elective cataract surgery. Pre-operative assessment',
      '  confirmed mature senile cataract right eye. HbA1c 6.8% (controlled diabetes).',
      '  Surgery performed under local anaesthesia on 2026-09-11. Post-operative',
      '  recovery uneventful. Vision improved to 6/9 on day 3.',
      '',
      'Medications on Discharge:',
      '  Prednisolone eye drops 1% QID x 4 weeks',
      '  Moxifloxacin eye drops QID x 2 weeks',
      '  Nepafenac eye drops TID x 4 weeks',
      '',
      'Follow-up: 1 week post-discharge at Eye OPD',
    ],
    'fixtures/discharge_summary.pdf'
  );

  // ── Prescription ──
  await createTextPdf(
    [
      'PRESCRIPTION',
      '',
      'Bir Hospital Eye OPD',
      'Dr. Anita Joshi, MS Ophthalmology',
      'Date: 2026-09-14',
      '',
      'Patient: Ram Bahadur Sharma, 57/M',
      '',
      'Rx:',
      '1. Tab. Prednisolone Acetate 1% Eye Drops',
      '   Dosage: 1 drop, Frequency: QID (4 times daily)',
      '   Duration: 4 weeks, taper as directed',
      '',
      '2. Moxifloxacin 0.5% Eye Drops',
      '   Dosage: 1 drop, Frequency: QID',
      '   Duration: 2 weeks',
      '',
      '3. Nepafenac 0.1% Eye Drops',
      '   Dosage: 1 drop, Frequency: TID (3 times daily)',
      '   Duration: 4 weeks',
      '',
      '4. Tab. Metformin 500mg (continue existing)',
      '   Dosage: 500mg, Frequency: BD (twice daily)',
      '',
      'Follow-up: 2026-09-21 at Eye OPD',
    ],
    'fixtures/prescription.pdf'
  );

  console.log('\nAll test fixtures generated successfully.');
}

main().catch(console.error);
