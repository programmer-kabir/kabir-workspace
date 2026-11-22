import assert from 'assert';
import { sqliteQueueRepository, mongoQueueRepository, getQueueRepository } from './src/db/repositories/queueRepository.js';
import {
  addJobToQueue,
  getJobById,
  getUserJobs,
  pauseJob,
  resumeJob,
  cancelJob,
  retryJob,
  bulkAddJobs,
  bulkCancelJobs,
  bulkRetryJobs,
  recoverStaleJobs
} from './src/services/queueService.js';
import db from './src/db/index.js';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    failed++;
  }
}

console.log('\n--- Starting Phase 5.4 Verification Suite (Queue Engine & Background Workers) ---');

// 1. Dual Parity Check
await test('Dual Parity: QueueRepository methods match across SQLite and Mongo', () => {
  const methods = [
    'create', 'findById', 'findDuplicate', 'findNextQueued', 'findStaleProcessing',
    'findByUserId', 'updateStatus', 'updateProgress', 'countActiveUserJobs',
    'getQueueStats', 'claimNextJob', 'findExistingJob', 'findUserJobsPaginated',
    'recoverStaleJobs', 'updateJob', 'pauseJob', 'resumeJob', 'cancelJob', 'retryJob'
  ];
  for (const m of methods) {
    assert.strictEqual(typeof sqliteQueueRepository[m], 'function', `sqliteQueueRepository missing ${m}`);
    assert.strictEqual(typeof mongoQueueRepository[m], 'function', `mongoQueueRepository missing ${m}`);
  }
});

// Setup test user
const testUserId = `queue_test_${Date.now()}`;
db.prepare(`
  INSERT INTO users (id, email, password_hash, salt, name, role, plan, created_at, updated_at)
  VALUES (?, ?, 'hash', 'salt', 'Queue Tester', 'user', 'pro', datetime('now'), datetime('now'))
`).run(testUserId, `${testUserId}@testvault.local`);

// 2. Add Job to Queue & Priority Ordering
let testJobId = null;
await test('addJobToQueue creates queued job with plan priority', async () => {
  const res = await addJobToQueue({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    userId: testUserId,
    userPlan: 'pro',
    formatId: '1080p',
    type: 'video'
  });

  assert.strictEqual(res.isDuplicate, false);
  assert.ok(res.job);
  assert.strictEqual(res.job.status, 'queued');
  assert.strictEqual(res.job.priority, 5); // Pro plan gets priority 5
  testJobId = res.job.id;
});

await test('addJobToQueue detects duplicate in active queue', async () => {
  const res = await addJobToQueue({
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    userId: testUserId,
    userPlan: 'pro'
  });

  assert.strictEqual(res.isDuplicate, true);
  assert.strictEqual(res.job.id, testJobId);
});

// 3. Atomic Claiming Verification
await test('claimNextJob atomically claims highest priority queued job', async () => {
  const queueRepo = getQueueRepository();
  const claimTestId = `claim_test_${Date.now()}`;
  await queueRepo.create({
    id: claimTestId,
    user_id: testUserId,
    url: 'https://example.com/claim-test',
    platform: 'generic',
    status: 'queued',
    priority: 99,
    attempts: 0,
    max_attempts: 3
  });

  const claimed = await queueRepo.claimNextJob();

  assert.ok(claimed, 'Should claim next available queued job');
  assert.strictEqual(claimed.id, claimTestId);
  assert.strictEqual(claimed.status, 'processing');
  assert.strictEqual(claimed.progress, 10);
  assert.strictEqual(claimed.attempts, 1);
});

// 4. Job State Transitions (Pause, Resume, Cancel, Retry)
await test('pauseJob transitions processing/queued job to paused', async () => {
  const paused = await pauseJob(testJobId, testUserId);
  assert.strictEqual(paused.status, 'paused');
});

await test('resumeJob transitions paused job back to queued', async () => {
  const resumed = await resumeJob(testJobId, testUserId);
  assert.strictEqual(resumed.status, 'queued');
});

await test('cancelJob transitions job to cancelled', async () => {
  const cancelled = await cancelJob(testJobId, testUserId);
  assert.strictEqual(cancelled.status, 'cancelled');
});

await test('retryJob resets cancelled/failed job back to queued', async () => {
  const retried = await retryJob(testJobId, testUserId);
  assert.strictEqual(retried.status, 'queued');
  assert.strictEqual(retried.attempts, 0);
  assert.strictEqual(retried.progress, 0);
});

// 5. User Jobs Pagination
await test('getUserJobs returns paginated jobs for user', async () => {
  const userJobs = await getUserJobs({ userId: testUserId, limit: 10, offset: 0 });
  assert.ok(Array.isArray(userJobs.jobs));
  assert.ok(userJobs.total >= 1);
  const found = userJobs.jobs.find(j => j.id === testJobId);
  assert.ok(found);
});

// 6. Stale Processing Jobs Recovery
await test('recoverStaleJobs re-queues interrupted processing jobs', async () => {
  const queueRepo = getQueueRepository();
  // Manually set test job to processing
  await queueRepo.updateJob(testJobId, { status: 'processing', attempts: 1, max_attempts: 3 });

  await recoverStaleJobs();

  const recovered = await getJobById(testJobId);
  assert.strictEqual(recovered.status, 'queued');
  assert.strictEqual(recovered.attempts, 2);
});

// 7. Bulk Operations
await test('bulkAddJobs queues multiple URLs and respects quotas', async () => {
  const urls = [
    'https://www.youtube.com/watch?v=abc111',
    'https://www.youtube.com/watch?v=abc222',
    'https://www.youtube.com/watch?v=abc333'
  ];

  const bulkRes = await bulkAddJobs({
    urls,
    userId: testUserId,
    userPlan: 'pro'
  });

  assert.strictEqual(bulkRes.summary.total, 3);
  assert.strictEqual(bulkRes.summary.added, 3);
  assert.strictEqual(bulkRes.summary.invalid, 0);
});

await test('bulkCancelJobs and bulkRetryJobs handle multiple job IDs', async () => {
  const userJobs = await getUserJobs({ userId: testUserId, limit: 10 });
  const jobIds = userJobs.jobs.map(j => j.id);

  const cancelRes = await bulkCancelJobs(jobIds, testUserId);
  assert.ok(cancelRes.cancelledCount >= 3);

  const retryRes = await bulkRetryJobs(jobIds, testUserId);
  assert.ok(retryRes.retriedCount >= 3);
});

// Cleanup test jobs and user
db.prepare('DELETE FROM download_jobs WHERE user_id = ?').run(testUserId);
db.prepare('DELETE FROM download_history WHERE user_id = ?').run(testUserId);
db.prepare('DELETE FROM notifications WHERE user_id = ?').run(testUserId);
db.prepare('DELETE FROM user_activity WHERE user_id = ?').run(testUserId);
db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);

console.log(`\nPhase 5.4 Test Summary: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
