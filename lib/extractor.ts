// lib/extractor.ts
// LLM-powered structured data extraction from claim documents.
// Uses @google/genai SDK with Zod structured output.
// The LLM is an EXTRACTOR, not an adjudicator.

import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({ apiKey });
}

function getExtractionModel() {
  return process.env.EXTRACTION_MODEL || 'gemini-3.5-flash';
}

// ── Zod schemas for each document type ──

const LineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().nullish().transform(v => v ?? null),
  unit_price: z.number().nullish().transform(v => v ?? null),
  claimed_amount: z.number().nullish().transform(v => v ?? null),
  raw_text: z.string().nullish().transform(v => v ?? null),
});

const BillExtractionSchema = z.object({
  doc_type: z.literal('bill'),
  hospital_name: z.string().nullish().transform(v => v ?? null),
  bill_number: z.string().nullish().transform(v => v ?? null),
  bill_date: z.string().nullish().transform(v => v ?? null),
  patient_name: z.string().nullish().transform(v => v ?? null),
  line_items: z.array(LineItemSchema).nullish().transform(v => v ?? []),
  declared_total: z.number().nullish().transform(v => v ?? null),
  computed_line_item_total: z.number().nullish().transform(v => v ?? null),
  discrepancy: z.boolean().nullish().transform(v => v ?? null),
  raw_unresolved: z.array(z.string()).nullish().transform(v => v ?? []),
});

const ClaimFormExtractionSchema = z.object({
  doc_type: z.literal('claim'),
  patient_name: z.string().nullish().transform(v => v ?? null),
  patient_age: z.number().nullish().transform(v => v ?? null),
  patient_sex: z.string().nullish().transform(v => v ?? null),
  policy_number: z.string().nullish().transform(v => v ?? null),
  sum_insured: z.number().nullish().transform(v => v ?? null),
  inception_date: z.string().nullish().transform(v => v ?? null),
  admission_date: z.string().nullish().transform(v => v ?? null),
  discharge_date: z.string().nullish().transform(v => v ?? null),
  admission_reason: z.string().nullish().transform(v => v ?? null),
  hospital_name: z.string().nullish().transform(v => v ?? null),
  treatment_country: z.string().nullish().transform(v => v ?? null),
  diagnoses: z.array(z.string()).nullish().transform(v => v ?? []),
  procedures: z.array(z.string()).nullish().transform(v => v ?? []),
  raw_unresolved: z.array(z.string()).nullish().transform(v => v ?? []),
});

const DischargeSummaryExtractionSchema = z.object({
  doc_type: z.literal('discharge_summary'),
  patient_name: z.string().nullish().transform(v => v ?? null),
  admission_date: z.string().nullish().transform(v => v ?? null),
  discharge_date: z.string().nullish().transform(v => v ?? null),
  hospital_name: z.string().nullish().transform(v => v ?? null),
  diagnoses: z.array(z.string()).nullish().transform(v => v ?? []),
  procedures: z.array(z.string()).nullish().transform(v => v ?? []),
  treatment_summary: z.string().nullish().transform(v => v ?? null),
  raw_unresolved: z.array(z.string()).nullish().transform(v => v ?? []),
});

const PrescriptionExtractionSchema = z.object({
  doc_type: z.literal('prescription'),
  patient_name: z.string().nullish().transform(v => v ?? null),
  prescriber_name: z.string().nullish().transform(v => v ?? null),
  prescription_date: z.string().nullish().transform(v => v ?? null),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string().nullish().transform(v => v ?? null),
    frequency: z.string().nullish().transform(v => v ?? null),
    duration: z.string().nullish().transform(v => v ?? null),
  })).nullish().transform(v => v ?? []),
  raw_unresolved: z.array(z.string()).nullish().transform(v => v ?? []),
});

export type BillExtraction = z.infer<typeof BillExtractionSchema>;
export type ClaimFormExtraction = z.infer<typeof ClaimFormExtractionSchema>;
export type DischargeSummaryExtraction = z.infer<typeof DischargeSummaryExtractionSchema>;
export type PrescriptionExtraction = z.infer<typeof PrescriptionExtractionSchema>;
export type DocumentExtraction =
  | BillExtraction
  | ClaimFormExtraction
  | DischargeSummaryExtraction
  | PrescriptionExtraction;

// ── Zod-to-Gemini schema helpers ──

function zodToGeminiSchema(docType: string): Record<string, any> {
  // Return the JSON schema that Gemini uses for structured output
  const schemas: Record<string, any> = {
    bill: {
      type: Type.OBJECT,
      properties: {
        doc_type: { type: Type.STRING },
        hospital_name: { type: Type.STRING, nullable: true },
        bill_number: { type: Type.STRING, nullable: true },
        bill_date: { type: Type.STRING, nullable: true },
        patient_name: { type: Type.STRING, nullable: true },
        line_items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              quantity: { type: Type.NUMBER, nullable: true },
              unit_price: { type: Type.NUMBER, nullable: true },
              claimed_amount: { type: Type.NUMBER, nullable: true },
              raw_text: { type: Type.STRING, nullable: true },
            },
            required: ['description'],
          },
        },
        declared_total: { type: Type.NUMBER, nullable: true },
        computed_line_item_total: { type: Type.NUMBER, nullable: true },
        discrepancy: { type: Type.BOOLEAN, nullable: true },
        raw_unresolved: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['doc_type', 'line_items', 'raw_unresolved'],
    },
    claim: {
      type: Type.OBJECT,
      properties: {
        doc_type: { type: Type.STRING },
        patient_name: { type: Type.STRING, nullable: true },
        patient_age: { type: Type.NUMBER, nullable: true },
        patient_sex: { type: Type.STRING, nullable: true },
        policy_number: { type: Type.STRING, nullable: true },
        sum_insured: { type: Type.NUMBER, nullable: true },
        inception_date: { type: Type.STRING, nullable: true },
        admission_date: { type: Type.STRING, nullable: true },
        discharge_date: { type: Type.STRING, nullable: true },
        admission_reason: { type: Type.STRING, nullable: true },
        hospital_name: { type: Type.STRING, nullable: true },
        treatment_country: { type: Type.STRING, nullable: true },
        diagnoses: { type: Type.ARRAY, items: { type: Type.STRING } },
        procedures: { type: Type.ARRAY, items: { type: Type.STRING } },
        raw_unresolved: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['doc_type', 'diagnoses', 'procedures', 'raw_unresolved'],
    },
    discharge_summary: {
      type: Type.OBJECT,
      properties: {
        doc_type: { type: Type.STRING },
        patient_name: { type: Type.STRING, nullable: true },
        admission_date: { type: Type.STRING, nullable: true },
        discharge_date: { type: Type.STRING, nullable: true },
        hospital_name: { type: Type.STRING, nullable: true },
        diagnoses: { type: Type.ARRAY, items: { type: Type.STRING } },
        procedures: { type: Type.ARRAY, items: { type: Type.STRING } },
        treatment_summary: { type: Type.STRING, nullable: true },
        raw_unresolved: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['doc_type', 'diagnoses', 'procedures', 'raw_unresolved'],
    },
    prescription: {
      type: Type.OBJECT,
      properties: {
        doc_type: { type: Type.STRING },
        patient_name: { type: Type.STRING, nullable: true },
        prescriber_name: { type: Type.STRING, nullable: true },
        prescription_date: { type: Type.STRING, nullable: true },
        medications: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              dosage: { type: Type.STRING, nullable: true },
              frequency: { type: Type.STRING, nullable: true },
              duration: { type: Type.STRING, nullable: true },
            },
            required: ['name'],
          },
        },
        raw_unresolved: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['doc_type', 'medications', 'raw_unresolved'],
    },
  };

  return schemas[docType] || schemas.claim;
}

function getZodSchema(docType: string) {
  const map: Record<string, z.ZodSchema> = {
    bill: BillExtractionSchema,
    claim: ClaimFormExtractionSchema,
    discharge_summary: DischargeSummaryExtractionSchema,
    prescription: PrescriptionExtractionSchema,
  };
  return map[docType] || ClaimFormExtractionSchema;
}

// ── Extraction prompt ──

const EXTRACTION_SYSTEM_PROMPT = `You are a medical document data extractor for a health insurance claims processing system in Nepal.

CRITICAL RULES:
1. Extract ONLY facts present in the source document.
2. Do NOT invent or fabricate missing values. Use null for missing fields.
3. Use empty arrays [] for structured values not found in the document.
4. Preserve uncertain or ambiguous text in the raw_unresolved array.
5. Do NOT infer policy coverage, approval status, or claim decisions.
6. Do NOT calculate a final claim decision.
7. If a bill lists "Surgery and anesthesia: NPR 51,000" keep it as ONE combined line item. Do NOT split into guessed amounts.
8. Retain BOTH the declared_total from the document AND the computed_line_item_total (sum of individual items). Set discrepancy=true if they differ.
9. Amounts should be in numeric form (e.g., 50000, not "NPR 50,000").
10. Dates should be in YYYY-MM-DD format when possible, or the original text if ambiguous.
11. For bill line items, claimed_amount MUST be the line item total (from the Total column, or quantity * unit_price). Do NOT omit or leave claimed_amount as null when an amount or unit_price is available.`;

/**
 * Extract structured data from a claim document's raw text.
 * The LLM is an extractor, not an adjudicator.
 */
export async function extractDocumentToStructuredData(params: {
  rawText: string;
  docType: string;
  documentId: number;
  claimId: number;
}): Promise<DocumentExtraction> {
  const { rawText, docType, documentId, claimId } = params;

  const userPrompt = `Extract structured data from this ${docType.replace('_', ' ')} document.

Document ID: ${documentId}
Claim ID: ${claimId}
Document Type: ${docType}

--- BEGIN DOCUMENT TEXT ---
${rawText}
--- END DOCUMENT TEXT ---

Extract all facts into the structured JSON format. Follow the extraction rules strictly.`;

  const genai = getGenAI();
  const model = getExtractionModel();

  const candidateModels = [model, 'gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  const uniqueModels = Array.from(new Set(candidateModels));

  let lastError: any = null;
  let response: any = null;

  for (const m of uniqueModels) {
    try {
      response = await genai.models.generateContent({
        model: m,
        contents: userPrompt,
        config: {
          systemInstruction: EXTRACTION_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: zodToGeminiSchema(docType),
          temperature: 0.1,
        },
      });
      if (response && response.text) {
        break;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Extraction with ${m} failed (${err.message}). Trying next model...`);
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  if (!response || !response.text) {
    throw new Error(`LLM returned empty response for document ${documentId}: ${lastError?.message || 'Unknown error'}`);
  }
  const text = response.text;

  const parsed = JSON.parse(text);

  // Validate with Zod
  const schema = getZodSchema(docType);
  const validated = schema.parse(parsed) as DocumentExtraction;

  // Post-processing for bills: compute line item total and check discrepancy
  if (docType === 'bill' && 'line_items' in validated) {
    const bill = validated as BillExtraction;
    for (const item of bill.line_items) {
      if ((item.claimed_amount === null || item.claimed_amount === undefined) && item.unit_price !== null && item.unit_price !== undefined) {
        item.claimed_amount = (item.quantity ?? 1) * item.unit_price;
      }
    }
    const computedTotal = bill.line_items.reduce(
      (sum, item) => sum + (item.claimed_amount || 0),
      0
    );
    bill.computed_line_item_total = computedTotal;
    if (bill.declared_total !== null && bill.declared_total !== computedTotal) {
      bill.discrepancy = true;
    }
  }

  return validated as DocumentExtraction;
}
