// nextjs/tests/04_hipml_mapper.test.mjs
// HIPML variable mapper and evaluation tests per CLAIM_PIPELINE_AGENT.md:
// - Maps Claim JSON to HIPML variables requested by policy PML
// - Fails explicitly with MISSING_HIPML_VARIABLE when required variable is absent (Test 9)
// - Evaluates against live HIPML service (http://localhost:3001)
// - Extracts deterministic findings (RetrievalNeed) from HIPML output

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHipmlInputs,
  getPolicyVariables,
  runPolicyEvaluation,
  extractRetrievalNeeds,
} from '../lib/hipml.ts';

test('buildHipmlInputs maps supported fields correctly for claimsetu-mvp', () => {
  const claimData = {
    patient: { name: 'Ram Bahadur Thapa', country: 'Nepal' },
    policy: { sumInsured: 500000, inceptionDate: '2080-01-01' },
    hospitalization: {
      startDate: '2083-05-10',
      endDate: '2083-05-12',
      reason: 'Acute Appendicitis',
      treatmentCountry: 'Nepal',
    },
    submissionDate: '2083-05-12',
  };

  const requiredVariables = [
    'Sum Insured',
    'Policy inception Date',
    'Hospitalization start date',
    'Discharge Date',
    'Admission Reason',
    'Patient Country of Residence',
    'Claim Submission Date',
    'Country of Treatment',
  ];

  const inputs = buildHipmlInputs(claimData, requiredVariables);

  assert.equal(inputs['Sum Insured'], 500000);
  assert.equal(inputs['Policy inception Date'], '2080-01-01');
  assert.equal(inputs['Hospitalization start date'], '2083-05-10');
  assert.equal(inputs['Discharge Date'], '2083-05-12');
  assert.equal(inputs['Admission Reason'], 'Acute Appendicitis');
  assert.equal(inputs['Patient Country of Residence'], 'Nepal');
  assert.equal(inputs['Claim Submission Date'], '2083-05-12');
  assert.equal(inputs['Country of Treatment'], 'Nepal');
});

test('buildHipmlInputs fails explicitly on missing required variable (Test 9)', () => {
  const claimDataMissingDates = {
    patient: { name: 'Ram Bahadur Thapa', country: 'Nepal' },
    policy: { sumInsured: 500000, inceptionDate: '2080-01-01' },
    hospitalization: {
      // startDate and endDate missing!
      startDate: undefined,
      endDate: undefined,
    },
  };

  const requiredVariables = ['Hospitalization start date', 'Discharge Date'];

  assert.throws(
    () => buildHipmlInputs(claimDataMissingDates, requiredVariables),
    (err) => {
      assert.ok(err instanceof Error);
      assert.equal(err.code, 'MISSING_HIPML_VARIABLE');
      assert.ok(err.message.includes('MISSING_HIPML_VARIABLE'));
      assert.equal(err.variable, 'Hospitalization start date');
      return true;
    },
    'Should throw MISSING_HIPML_VARIABLE error instead of fabricating date'
  );
});

test('live HIPML service: getPolicyVariables returns variables for claimsetu-mvp', async () => {
  const variables = await getPolicyVariables('claimsetu-mvp');
  assert.ok(Array.isArray(variables));
  assert.ok(variables.includes('Sum Insured'));
  assert.ok(variables.includes('Hospitalization start date'));
  assert.ok(variables.includes('Discharge Date'));
});

test('live HIPML service: runPolicyEvaluation evaluates deterministic rules', async () => {
  const inputs = {
    'Sum Insured': 500000,
    'Policy inception Date': '2080-01-01',
    'Hospitalization start date': '2083-05-10',
    'Discharge Date': '2083-05-12',
    'Admission Reason': 'Illness',
    'Patient Country of Residence': 'Nepal',
    'Claim Submission Date': '2083-05-12',
    'Country of Treatment': 'Nepal',
  };

  const result = await runPolicyEvaluation('claimsetu-mvp', inputs);

  assert.ok(result['Policy Attributes']);
  assert.ok(result.Coverage);
  assert.ok(result.Conditions);
  assert.equal(result.Conditions['Patient Eligibility'], true);
  assert.equal(result.Conditions['Claim Admissibility'], true);
});

test('extractRetrievalNeeds produces findings when policy condition fails', () => {
  const mockResult = {
    'Policy Attributes': [],
    Coverage: {},
    Conditions: {
      'Patient Eligibility': true,
      'Claim Admissibility': false, // Condition failed!
    },
  };

  const findings = extractRetrievalNeeds(mockResult, 1, 10);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].code, 'CLAIM_ADMISSIBILITY');
  assert.equal(findings[0].item, 'Claim Admissibility');
  assert.equal(findings[0].claimId, 1);
  assert.equal(findings[0].policyId, 10);
});
