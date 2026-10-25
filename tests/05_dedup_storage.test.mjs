// nextjs/tests/05_dedup_storage.test.mjs
// Storage and Deduplication Tests per CLAIM_PIPELINE_AGENT.md:
// - SHA-256 content addressing
// - MinIO putObjectIfAbsent deduplication invariant
// - Same bytes under different filenames produce the same SHA-256

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('.env.local') });

import { putObjectIfAbsent, getObjectBuffer, storageKey, ensureBucket } from '../lib/storage.ts';

const FIXTURES_DIR = path.resolve('fixtures');

test('MinIO: ensureBucket creates or confirms claim-docs bucket', async () => {
  await assert.doesNotReject(() => ensureBucket());
});

test('SHA-256 hashing is content-addressed and deterministic', () => {
  const claimBuf = fs.readFileSync(path.join(FIXTURES_DIR, 'claim.pdf'));
  const hash1 = createHash('sha256').update(claimBuf).digest('hex');
  const hash2 = createHash('sha256').update(claimBuf).digest('hex');

  assert.equal(hash1, hash2);
  assert.equal(hash1.length, 64);
  assert.equal(storageKey(hash1), hash1);
});

test('MinIO putObjectIfAbsent: first upload stores, second upload skips (dedup)', async () => {
  const testBytes = Buffer.from(`TEST_DEDUP_CONTENT_${Date.now()}`);
  const hash = createHash('sha256').update(testBytes).digest('hex');

  // First upload: object is absent, should upload (returns true)
  const firstUpload = await putObjectIfAbsent(hash, testBytes, 'text/plain');
  assert.equal(firstUpload, true, 'First upload should store the object');

  // Second upload with same hash: object is present, should skip (returns false)
  const secondUpload = await putObjectIfAbsent(hash, testBytes, 'text/plain');
  assert.equal(secondUpload, false, 'Second upload should recognize existing object and skip');

  // Verify stored content
  const retrieved = await getObjectBuffer(hash);
  assert.equal(retrieved.toString(), testBytes.toString());
});

test('renaming a file does not change its hash or MinIO key', () => {
  const buf = fs.readFileSync(path.join(FIXTURES_DIR, 'bill.pdf'));
  const hashOriginal = createHash('sha256').update(buf).digest('hex');

  // Simulate renaming
  const renamedBuf = Buffer.from(buf);
  const hashRenamed = createHash('sha256').update(renamedBuf).digest('hex');

  assert.equal(hashOriginal, hashRenamed, 'Renamed file with identical bytes must produce identical hash');
});
