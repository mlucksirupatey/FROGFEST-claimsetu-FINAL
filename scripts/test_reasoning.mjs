// scripts/test_reasoning.mjs
// CLI script to trigger and inspect the claims reasoning endpoint.
// Usage: node scripts/test_reasoning.mjs [claimId] [--dry-run]

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env.local') });

const claimId = process.argv[2] || '1';
const isDryRun = process.argv.includes('--dry-run') || true;
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function main() {
  console.log(`=== Testing ClaimSetu Reasoning Layer ===`);
  console.log(`Claim ID: ${claimId}`);
  console.log(`Dry Run: ${isDryRun}`);
  console.log(`Target URL: ${baseUrl}/api/claims/${claimId}/reason?dry_run=${isDryRun}\n`);

  const startTime = Date.now();
  const res = await fetch(`${baseUrl}/api/claims/${claimId}/reason?dry_run=${isDryRun}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const duration = Date.now() - startTime;
  console.log(`Response received in ${duration}ms with status: ${res.status}`);

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Error response:', errorText);
    process.exit(1);
  }

  const json = await res.json();
  console.log('\n--- Disposition & Metadata ---');
  console.log(`Authoritative Disposition: ${json.disposition}`);
  console.log(`Evaluation Status: ${json.analysis.analysis_status}`);
  console.log(`Evidence Count: ${json.evidence.length}`);
  console.log(`Persisted to DB: ${json.persisted}`);

  console.log('\n--- Executive Summary ---');
  console.log(json.summaryReport);

  console.log('\n--- Full Operations Report (First 400 chars) ---');
  console.log(json.fullReport.slice(0, 400) + '...\n');
}

main().catch(err => {
  console.error('Fatal error running reasoning script:', err);
  process.exit(1);
});
