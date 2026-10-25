// lib/reasoning/math.ts
// Deterministic financial arithmetic and policy sub-limit calculation.
// Guarantees zero arithmetic hallucination by the LLM: all numbers, limits,
// and excess calculations are computed deterministically in TypeScript.

import type { FinancialImpactItem, FrozenEvidence } from './types.ts';

interface ClaimFactInput {
  line_items?: Array<{
    description: string;
    quantity: number | null;
    unit_price: number | null;
    claimed_amount: number | null;
  }>;
  declared_total?: number | null;
  computed_line_item_total?: number | null;
}

interface HipmlCoverageInput {
  Coverage?: Record<string, {
    included?: boolean;
    'Limit per day'?: number;
    'Limit per claim'?: number;
    'Limit per policy period'?: number;
    type?: string;
  }>;
}

/**
 * Calculates deterministic financial impact items comparing billed line items
 * against policy sub-limits defined in the deterministic HIPML evaluation.
 */
export function calculateDeterministicFinancials(
  claim: ClaimFactInput,
  hipmlResult: HipmlCoverageInput | null | undefined,
  frozenEvidence: FrozenEvidence[] = []
): FinancialImpactItem[] {
  const items: FinancialImpactItem[] = [];
  const coverage = hipmlResult?.Coverage || {};

  const lineItems = claim.line_items || [];

  for (let idx = 0; idx < lineItems.length; idx++) {
    const li = lineItems[idx];
    const desc = li.description.toLowerCase();
    const claimed = li.claimed_amount ?? (li.unit_price ? (li.quantity ?? 1) * li.unit_price : 0);

    // 1. Room / Nursing Charges sub-limit check
    if (desc.includes('room') || desc.includes('bed') || desc.includes('nursing')) {
      const roomRule = coverage['Room and Nursing charges'];
      const limitPerDay = roomRule?.['Limit per day'] ?? 5000;
      const qty = li.quantity ?? 1;
      const allowed = limitPerDay * qty;
      const diff = Math.max(0, claimed - allowed);

      // Match room sub-limit evidence chunk if present
      const roomEvidence = frozenEvidence.filter(e =>
        e.clause_ref?.includes('3.1') ||
        e.section_title?.toLowerCase().includes('room') ||
        e.text.toLowerCase().includes('room')
      ).map(e => e.evidence_id);

      items.push({
        item_id: `item-${idx + 1}-room`,
        claimed_amount: claimed,
        allowed_amount: diff > 0 ? allowed : claimed,
        difference: diff,
        basis: `HIPML Room sub-limit (NPR ${limitPerDay}/day for ${qty} day(s))`,
        evidence_refs: roomEvidence.slice(0, 2),
      });
      continue;
    }

    // 2. ICU Charges sub-limit check
    if (desc.includes('icu') || desc.includes('intensive care')) {
      const icuRule = coverage['ICU charges'];
      const limitPerDay = icuRule?.['Limit per day'] ?? 10000;
      const qty = li.quantity ?? 1;
      const allowed = limitPerDay * qty;
      const diff = Math.max(0, claimed - allowed);

      const icuEvidence = frozenEvidence.filter(e =>
        e.clause_ref?.includes('3.1') ||
        e.text.toLowerCase().includes('icu')
      ).map(e => e.evidence_id);

      items.push({
        item_id: `item-${idx + 1}-icu`,
        claimed_amount: claimed,
        allowed_amount: diff > 0 ? allowed : claimed,
        difference: diff,
        basis: `HIPML ICU sub-limit (NPR ${limitPerDay}/day for ${qty} day(s))`,
        evidence_refs: icuEvidence.slice(0, 2),
      });
      continue;
    }

    // 3. Cataract Procedure sub-limit check
    if (desc.includes('cataract')) {
      const cataractRule = coverage['Cataract'];
      const limitPeriod = cataractRule?.['Limit per policy period'] ?? 40000;
      const diff = Math.max(0, claimed - limitPeriod);

      const cataractEvidence = frozenEvidence.filter(e =>
        e.clause_ref?.includes('4.2') ||
        e.text.toLowerCase().includes('cataract')
      ).map(e => e.evidence_id);

      items.push({
        item_id: `item-${idx + 1}-cataract`,
        claimed_amount: claimed,
        allowed_amount: diff > 0 ? limitPeriod : claimed,
        difference: diff,
        basis: `HIPML Cataract procedure cap (NPR ${limitPeriod} per policy period)`,
        evidence_refs: cataractEvidence.slice(0, 2),
      });
      continue;
    }

    // 4. Default: Standard line item (no sub-limit triggered)
    items.push({
      item_id: `item-${idx + 1}`,
      claimed_amount: claimed,
      allowed_amount: claimed,
      difference: 0,
      basis: 'Admissible under standard surgical / medical care',
      evidence_refs: [],
    });
  }

  return items;
}
