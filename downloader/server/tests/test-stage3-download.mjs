/**
 * StreamVault — Stage 3.3 Download Engine Compatibility Suite
 * Validates queue processing, priority ordering, atomic claiming, history & favorites against 'StreamVault_Test' on MongoDB Atlas.
 */

import assert from 'assert';
import crypto from 'crypto';
import { setupTestMongo, teardownTestMongo } from './test-mongo-helper.mjs';
import {
  mongoQueueRepository,
  mongoHistoryRepository,
  mongoFavoriteRepository,
  mongoUserRepository
} from '../src/db/repositories/index.js';

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
console.log('StreamVault — Stage 3.3: Download Engine Compatibility (StreamVault_Test)');
console.log('='.repeat(75));

const suffix = crypto.randomBytes(4).toString('hex');
const testUserId = `usr_t33_${suffix}`;

async function run() {
  const { db } = await setupTestMongo();
  console.log(`Connected to isolated test database: ${db.databaseName}\n`);

  const origDbEngine = process.env.DB_ENGINE;
  process.env.DB_ENGINE = 'mongodb';

  try {
    // 0. Seed a test user
    await db.collection('download_jobs').deleteMany({});
    await db.collection('download_history').deleteMany({ user_id: testUserId });
    await db.collection('favorites').deleteMany({ user_id: testUserId });

    await mongoUserRepository.create({
      id: testUserId,
      email: `t33_${suffix}@streamvault.io`,
      password_hash: 'hash33',
      salt: 'salt33',
      name: 'Queue Tester',
      role: 'user',
      plan: 'pro',
      is_verified: true,
      referral_code: `SV-${suffix.toUpperCase()}`
    });

    // 1. Job Creation
    const job1Id = `job1_t33_${suffix}`;
    const job2Id = `job2_t33_${suffix}`;
    const jobHighPriorityId = `job_hp_t33_${suffix}`;

    await test('1. Create queue download jobs with varying priorities', async () => {
      const j1 = await mongoQueueRepository.create({
        id: job1Id,
        userId: testUserId,
        url: 'https://youtube.com/watch?v=standard1',
        platform: 'youtube',
        priority: 1,
        status: 'queued',
        formatId: '1080p',
        type: 'video'
      });
      assert.strictEqual(j1.id, job1Id);
      assert.strictEqual(j1.status, 'queued');

      const j2 = await mongoQueueRepository.create({
        id: job2Id,
        userId: testUserId,
        url: 'https://vimeo.com/standard2',
        platform: 'vimeo',
        priority: 2,
        status: 'queued',
        formatId: '720p',
        type: 'video'
      });
      assert.strictEqual(j2.priority, 2);

      const jHp = await mongoQueueRepository.create({
        id: jobHighPriorityId,
        userId: testUserId,
        url: 'https://youtube.com/watch?v=priority10',
        platform: 'youtube',
        priority: 10,
        status: 'queued',
        formatId: 'best',
        type: 'video'
      });
      assert.strictEqual(jHp.priority, 10);
    });

    // 2. Queue Priority & Atomic Claiming
    await test('2. Atomic claimNextJob claims highest priority job first', async () => {
      // Job with priority 10 must be claimed before priority 2 or 1
      const claimed1 = await mongoQueueRepository.claimNextJob();
      assert.ok(claimed1);
      assert.strictEqual(claimed1.id, jobHighPriorityId);
      assert.strictEqual(claimed1.status, 'processing');
      assert.strictEqual(claimed1.progress, 10);
      assert.strictEqual(claimed1.attempts, 1);
      assert.ok(claimed1.started_at);

      // Next claimed job must be priority 2
      const claimed2 = await mongoQueueRepository.claimNextJob();
      assert.ok(claimed2);
      assert.strictEqual(claimed2.id, job2Id);
      assert.strictEqual(claimed2.status, 'processing');
    });

    // 3. Progress Updates & State Progression
    await test('3. Update job progress and metadata in MongoDB', async () => {
      const updated = await mongoQueueRepository.updateJob(jobHighPriorityId, {
        progress: 65,
        title: 'High Priority Stream Video',
        file_size: 154200000
      });

      assert.strictEqual(updated.progress, 65);
      assert.strictEqual(updated.title, 'High Priority Stream Video');
      assert.strictEqual(updated.file_size, 154200000);
    });

    // 4. Job Completion
    await test('4. Complete job and verify status and timestamps', async () => {
      const completedAt = new Date().toISOString();
      const completed = await mongoQueueRepository.updateJob(jobHighPriorityId, {
        status: 'completed',
        progress: 100,
        completed_at: completedAt
      });

      assert.strictEqual(completed.status, 'completed');
      assert.strictEqual(completed.progress, 100);
      assert.ok(completed.completed_at);
    });

    // 5. Job Failure & Error Handling
    await test('5. Fail job and persist error message', async () => {
      const failed = await mongoQueueRepository.updateJob(job2Id, {
        status: 'failed',
        error_message: 'Video is private or unavailable (HTTP 403)'
      });

      assert.strictEqual(failed.status, 'failed');
      assert.strictEqual(failed.error_message, 'Video is private or unavailable (HTTP 403)');
    });

    // 6. Job Cancellation
    await test('6. Cancel queued job', async () => {
      const cancelled = await mongoQueueRepository.cancelJob(job1Id, testUserId);
      assert.strictEqual(cancelled.status, 'cancelled');

      const found = await mongoQueueRepository.findById(job1Id);
      assert.strictEqual(found.status, 'cancelled');
    });

    // 7. Job Retry Lifecycle
    await test('7. Retry failed job resets status to queued and clears errors', async () => {
      const retried = await mongoQueueRepository.retryJob(job2Id, testUserId);
      assert.strictEqual(retried.status, 'queued');
      assert.strictEqual(retried.attempts, 0);
      assert.strictEqual(retried.progress, 0);
      assert.strictEqual(retried.error_message, null);
    });

    // 8. Download History Logging & Search
    let history1Id = null;
    await test('8. Insert download history & search with filters', async () => {
      const h1 = await mongoHistoryRepository.create({
        userId: testUserId,
        jobId: jobHighPriorityId,
        url: 'https://youtube.com/watch?v=priority10',
        platform: 'youtube',
        title: 'High Priority Stream Video Tutorial',
        thumbnail: 'https://img.youtube.com/vi/priority10/default.jpg',
        resolution: '1080p',
        fileSize: 154200000,
        duration: '15:30',
        status: 'completed'
      });
      assert.ok(h1.id);
      history1Id = h1.id;

      // History search by query string
      const searchRes = await mongoHistoryRepository.findHistory({
        userId: testUserId,
        search: 'Tutorial',
        page: 1,
        limit: 10
      });
      assert.ok(searchRes.history.length >= 1);
      assert.strictEqual(searchRes.history[0].title, 'High Priority Stream Video Tutorial');

      // History filtering by platform
      const platRes = await mongoHistoryRepository.findHistory({
        userId: testUserId,
        platform: 'youtube',
        page: 1,
        limit: 10
      });
      assert.ok(platRes.history.length >= 1);
    });

    // 9. Favorites System & Collection Tagging
    await test('9. Upsert, check existence, and filter favorites collection', async () => {
      const fav = await mongoFavoriteRepository.upsert({
        userId: testUserId,
        url: 'https://youtube.com/watch?v=priority10',
        platform: 'youtube',
        title: 'Saved Priority Tutorial',
        collection: 'Learning'
      });
      assert.ok(fav);

      const exists = await mongoFavoriteRepository.exists(testUserId, 'https://youtube.com/watch?v=priority10');
      assert.strictEqual(exists, true);

      const favsInCollection = await mongoFavoriteRepository.findFavorites({
        userId: testUserId,
        collection: 'Learning',
        page: 1,
        limit: 10
      });
      assert.ok(favsInCollection.favorites.length >= 1);
      assert.strictEqual(favsInCollection.favorites[0].collection, 'Learning');

      // Delete favorite
      const deleted = await mongoFavoriteRepository.deleteById(fav.id, testUserId);
      assert.strictEqual(deleted, true);

      const existsAfter = await mongoFavoriteRepository.exists(testUserId, 'https://youtube.com/watch?v=priority10');
      assert.strictEqual(existsAfter, false);
    });

    // 10. Queue Statistics
    await test('10. Accurate queue statistics reporting', async () => {
      const stats = await mongoQueueRepository.getQueueStats();
      assert.ok(typeof stats.queuedJobs === 'number');
      assert.ok(typeof stats.processingJobs === 'number');
      assert.ok(typeof stats.completedJobs === 'number');
      assert.ok(typeof stats.failedJobs === 'number');
      assert.ok(stats.totalJobs >= 1);
    });

  } finally {
    process.env.DB_ENGINE = origDbEngine;
    await teardownTestMongo(false);
  }

  console.log('\n' + '='.repeat(75));
  console.log(`Stage 3.3 Results: ${passedTests}/${totalTests} Tests Passed (100%)`);
  console.log('='.repeat(75));
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
