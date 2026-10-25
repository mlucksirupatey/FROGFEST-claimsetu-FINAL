// lib/reasoning/types.ts
// Zod schemas and TypeScript interfaces for post-deterministic claims reasoning layer.
// Adheres to CLAIM_REASONING_AGENT.md specifications.

import { z } from 'zod';

export interface FrozenEvidence {
  evidence_id: string; // e.g. "E1", "E2"
  chunk_id: number;
  clause_ref: string | null;
  section_title: string | null;
  page_start: number | null;
  page_end: number | null;
  source_document: string;
  similarity: number;
  text: string;
  query?: string;
}

export const ReasoningFindingSchema = z.object({
  finding_id: z.string(), // "F1", "F2", etc.
  code: z.string(),
  item: z.string(),
  deterministic_status: z.string(), // 'passed' | 'failed' | 'needs_review'
  assessment: z.string(), // 'supported' | 'contradicted' | 'ambiguous' | 'insufficient_evidence'
  explanation: z.string(),
  claim_facts: z.array(z.string()).default([]),
  evidence_refs: z.array(z.string()).default([]),
  review_required: z.boolean().default(false),
  quote: z.string().nullish().transform(v => v ?? null),
});

export const CrossDocumentIssueSchema = z.object({
  issue: z.string(),
  assessment: z.string(), // 'consistent' | 'inconsistent' | 'unresolved'
  explanation: z.string(),
  evidence_refs: z.array(z.string()).default([]),
});

export const FinancialImpactItemSchema = z.object({
  item_id: z.string(),
  claimed_amount: z.number().nullish().transform(v => v ?? null),
  allowed_amount: z.number().nullish().transform(v => v ?? null),
  difference: z.number().nullish().transform(v => v ?? null),
  basis: z.string(),
  evidence_refs: z.array(z.string()).default([]),
});

export const ReasoningAnalysisSchema = z.object({
  report_title: z.string().default('Health Claim Analysis Report'),
  analysis_status: z.string().default('complete'), // 'complete' | 'insufficient_evidence' | 'partial'
  deterministic_disposition: z.string(), // 'passed' | 'failed' | 'needs_review'
  executive_assessment: z.string(),
  claim_context: z.object({
    claim_id: z.union([z.string(), z.number()]),
    policy_id: z.union([z.string(), z.number()]),
    hospital: z.string().nullish().transform(v => v ?? null),
    admission_date: z.string().nullish().transform(v => v ?? null),
    discharge_date: z.string().nullish().transform(v => v ?? null),
    claimed_amount: z.number().nullish().transform(v => v ?? null),
  }),
  findings: z.array(ReasoningFindingSchema).default([]),
  cross_document_analysis: z.array(CrossDocumentIssueSchema).default([]),
  financial_impact: z.array(FinancialImpactItemSchema).default([]),
  open_questions: z.array(z.string()).default([]),
  human_review_actions: z.array(z.string()).default([]),
  operational_conclusion: z.string(),
  summary_report: z.string(),
});

export type ReasoningFinding = z.infer<typeof ReasoningFindingSchema>;
export type CrossDocumentIssue = z.infer<typeof CrossDocumentIssueSchema>;
export type FinancialImpactItem = z.infer<typeof FinancialImpactItemSchema>;
export type ReasoningAnalysis = z.infer<typeof ReasoningAnalysisSchema>;

export interface CitationDetail {
  chunk_id: number;
  clause_ref: string | null;
  section_title: string | null;
  page_start: number | null;
  page_end: number | null;
  source_document: string;
  similarity: number;
}

export interface ReasoningResult {
  success: boolean;
  claimId: number;
  disposition: 'passed' | 'failed' | 'needs_review';
  structured_analysis: ReasoningAnalysis;
  full_report_markdown: string;
  summary_report_markdown: string;
  frozen_evidence: FrozenEvidence[];
  citation_map: Record<string, CitationDetail>;
  model_metadata: {
    model: string;
    timestamp: string;
    call_budget: number;
  };
  deterministic_eval?: any;
  persisted: boolean;
}
