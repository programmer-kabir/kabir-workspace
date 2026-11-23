/**
 * StreamVault — Stage 3.8 Concurrency, Atomic Operations & Reliability Suite
 * Validates race condition immunity, atomic queue claims, and concurrent throughput on MongoDB Atlas.
 */

import assert from 'assert';
import crypto from 'crypto';
import { setupTestMongo, teardownTestMongo } from './test-mongo-helper.mjs';
import { checkMongoHealth } from './src/db/mongo.js';
import {
  mongoUserRepository,
  mongoSessionRepository,
  mongoQueueRepository,
  mongoSystemRepository
} from './src/db/repositories/index.js';

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passedTests++;
      console.log(`  ✅ [PASS] ${name}`);
    })
    .catch((err) => {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(err);
      process.exit(1);
    });
}

console.log('='.repeat(75));
console.log('StreamVault — Stage 3.8: Concurrency & Reliability (StreamVault_Test)');
console.log('='.repeat(75));

const suffix = crypto.randomBytes(4).toString('hex');
const testUserId = `usr_t38_${suffix}`;

async function run() {
  const { db } = await setupTestMongo();
  console.log(`Connected to isolated test database: ${db.databaseName}\n`);

  const origDbEngine = process.env.DB_ENGINE;
  process.env.DB_ENGINE = 'mongodb';

  try {
    // 0. Seed test user
    await mongoUserRepository.create({
      id: testUserId,
      email: `t38_${suffix}@streamvault.io`,
      password_hash: 'hash38',
      salt: 'salt38',
      name: 'Concurrency Tester',
      role: 'user',
      plan: 'pro',
      is_verified: true,
      referral_code: `SV-C${suffix.toUpperCase()}`
    });

    // 1. Atomic Queue Claiming with 10 Parallel Workers (Zero Double-Claims)
    await test('1. Atomic claimNextJob: 10 parallel workers claim 10 distinct jobs with ZERO double-claims', async () => {
      // Clear any prior queued test jobs to guarantee clean test boundary
      await db.collection('download_jobs').deleteMany({ status: 'queued' });

      const jobIds = [];
      for (let i = 0; i < 10; i++) {
        const jId = `job_conc_${suffix}_${i}`;
        jobIds.push(jId);
        await mongoQueueRepository.create({
          id: jId,
          userId: testUserId,
          url: `https://youtube.com/watch?v=conc_${suffix}_${i}`,
          platform: 'youtube',
          priority: i + 1, // 1 to 10
          status: 'queued',
          formatId: '1080p',
          type: 'video'
        });
      }

      // Simulate 10 workers concurrently competing to claim jobs
      const claimPromises = Array.from({ length: 10 }, () => mongoQueueRepository.claimNextJob());
      const claimedResults = await Promise.all(claimPromises);

      // Verify all 10 claimed jobs are valid and non-null
      const claimedIds = claimedResults.map(j => j?.id).filter(Boolean);
      assert.strictEqual(claimedIds.length, 10, 'All 10 jobs must be claimed');

      // Verify ZERO duplicate claims across the 10 concurrent requests
      const uniqueClaimedIds = new Set(claimedIds);
      assert.strictEqual(
        uniqueClaimedIds.size,
        10,
        `Expected 10 unique claimed jobs, but got ${uniqueClaimedIds.size}. Race condition detected!`
      );

      // Verify claiming another job returns null (queue is now empty)
      const nextClaim = await mongoQueueRepository.claimNextJob();
      assert.strictEqual(nextClaim, null);
    });

    // 2. High-Concurrency Session Touches
    await test('2. Concurrent session touches without write contention or errors', async () => {
      const sessId = `sess_conc_${suffix}`;
      const tokenHash = crypto.createHash('sha256').update(`token_conc_${suffix}`).digest('hex');

      await mongoSessionRepository.create({
        id: sessId,
        user_id: testUserId,
        token_hash: tokenHash,
        ip_address: '127.0.0.1',
        user_agent: 'LoadAgent',
        expires_at: new Date(Date.now() + 86400000)
      });

      // 15 simultaneous touches
      const touchPromises = Array.from({ length: 15 }, () => mongoSessionRepository.touch(sessId));
      const touchResults = await Promise.all(touchPromises);
      assert.ok(touchResults.every(res => res === true));

      const sess = await mongoSessionRepository.findByTokenHash(tokenHash);
      assert.ok(sess);
      assert.ok(sess.last_active_at);
    });

    // 3. Concurrent Activity Logging Throughput
    await test('3. High-throughput concurrent activity logging (20 simultaneous inserts)', async () => {
      const logPromises = Array.from({ length: 20 }, (_, idx) =>
        mongoSystemRepository.logActivity(
          testUserId,
          `concurrent_event_${idx}`,
          JSON.stringify({ index: idx, timestamp: Date.now() }),
          '127.0.0.1',
          'LoadTest/1.0'
        )
      );

      await Promise.all(logPromises);

      const activityPage = await mongoSystemRepository.findUserActivityPaginated({
        userId: testUserId,
        search: 'concurrent_event_',
        page: 1,
        limit: 50
      });
      assert.strictEqual(activityPage.total, 20);
      assert.strictEqual(activityPage.activities.length, 20);
    });

    // 4. Connection Health & Latency Diagnostics
    await test('4. checkMongoHealth measures live latency and reports connected status', async () => {
      const health = await checkMongoHealth();
      assert.strictEqual(health.connected, true);
      assert.ok(health.latencyMs >= 0);
      assert.ok(health.sanitizedUri.includes('****')); // Password must be redacted
    });

  } finally {
    process.env.DB_ENGINE = origDbEngine;
    await teardownTestMongo(false);
  }

  console.log('\n' + '='.repeat(75));
  console.log(`Stage 3.8 Results: ${passedTests}/${totalTests} Tests Passed (100%)`);
  console.log('='.repeat(75));
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
