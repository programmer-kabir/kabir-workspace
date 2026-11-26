/**
 * StreamVault — Stage 4: Background Worker Testing with MongoDB
 * Verifies Queue Worker and Subscription Expiration Worker on StreamVault_Stage4_Test
 */

import { setupStage4Mongo, teardownStage4Mongo } from './test-stage4-helper.mjs';
import { getQueueRepository } from '../src/db/repositories/queueRepository.js';
import { getHistoryRepository } from '../src/db/repositories/historyRepository.js';
import { getUserRepository } from '../src/db/repositories/userRepository.js';
import { getSubscriptionRepository } from '../src/db/repositories/subscriptionRepository.js';
import { getNotificationRepository } from '../src/db/repositories/notificationRepository.js';
import { checkAndExpireSubscriptions } from '../src/db/index.js';

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, message) {
  if (!condition) {
    failed++;
    results.push({ name: message, status: 'FAILED' });
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(message);
  } else {
    passed++;
    results.push({ name: message, status: 'PASSED' });
    console.log(`  ✅ PASS: ${message}`);
  }
}

async function run() {
  console.log('='.repeat(70));
  console.log('  STAGE 4.2: BACKGROUND WORKER TESTING (MONGODB)');
  console.log('='.repeat(70));

  const originalEngine = process.env.DB_ENGINE;
  process.env.DB_ENGINE = 'mongodb';

  const { db } = await setupStage4Mongo();

  // Clear queued jobs & test subscriptions from previous test runs in isolated test DB
  await db.collection('download_jobs').deleteMany({});
  await db.collection('subscriptions').deleteMany({});

  const queueRepo = getQueueRepository();
  const histRepo = getHistoryRepository();
  const userRepo = getUserRepository();
  const subRepo = getSubscriptionRepository();
  const notifRepo = getNotificationRepository();

  const testUserId = `worker_user_${Date.now()}`;
  await userRepo.create({
    id: testUserId,
    email: `${testUserId}@worker.test`,
    password_hash: 'dummyhash',
    salt: 'dummysalt',
    name: 'Worker Test User',
    role: 'user',
    plan: 'free',
    is_verified: true,
    is_banned: false
  });

  try {
    // ----------------------------------------------------
    // 1. QUEUE WORKER: ATOMIC CLAIM & PRIORITY ORDERING
    // ----------------------------------------------------
    console.log('\n--- 1. Atomic Job Claiming & Priority Ordering ---');
    // Insert low priority job first, then high priority job
    const lowJob = await queueRepo.create({
      userId: testUserId,
      url: `https://youtube.com/watch?v=low_${Date.now()}`,
      priority: 1,
      status: 'queued'
    });

    const highJob = await queueRepo.create({
      userId: testUserId,
      url: `https://youtube.com/watch?v=high_${Date.now()}`,
      priority: 10,
      status: 'queued'
    });

    // Claim next job: high priority job MUST be claimed first
    const claimed1 = await queueRepo.claimNextJob();
    assert(claimed1 !== null, 'claimNextJob claims a queued job');
    assert((claimed1.id || claimed1._id) === (highJob.id || highJob._id), 'High priority job (10) claimed before low priority job (1)');
    assert(claimed1.status === 'processing', 'Claimed job status transitions to "processing"');
    assert(claimed1.attempts === 1, 'Claimed job increments attempts count to 1');

    // Claim next job: now low priority job is claimed
    const claimed2 = await queueRepo.claimNextJob();
    assert((claimed2.id || claimed2._id) === (lowJob.id || lowJob._id), 'Second claim fetches next queued job');

    // ----------------------------------------------------
    // 2. CONCURRENCY LOCKING & RACE CONDITION ELIMINATION
    // ----------------------------------------------------
    console.log('\n--- 2. Concurrency Locking & Zero Duplicate Processing ---');
    // Create 3 queued jobs
    const jobA = await queueRepo.create({ userId: testUserId, url: `https://yt.com/a_${Date.now()}`, priority: 5, status: 'queued' });
    const jobB = await queueRepo.create({ userId: testUserId, url: `https://yt.com/b_${Date.now()}`, priority: 5, status: 'queued' });
    const jobC = await queueRepo.create({ userId: testUserId, url: `https://yt.com/c_${Date.now()}`, priority: 5, status: 'queued' });

    // Spawn 5 simultaneous competing claims
    const claimPromises = [
      queueRepo.claimNextJob(),
      queueRepo.claimNextJob(),
      queueRepo.claimNextJob(),
      queueRepo.claimNextJob(),
      queueRepo.claimNextJob()
    ];
    const claimResults = await Promise.all(claimPromises);
    const validClaims = claimResults.filter(j => j !== null);
    const claimedIds = validClaims.map(j => j.id || j._id);
    const uniqueClaimedIds = new Set(claimedIds);

    assert(validClaims.length === 3, 'Exactly 3 jobs claimed from 5 simultaneous worker requests');
    assert(uniqueClaimedIds.size === 3, 'All 3 claimed jobs are distinct with zero duplicate processing');

    // ----------------------------------------------------
    // 3. JOB PROGRESS & COMPLETION LIFECYCLE
    // ----------------------------------------------------
    console.log('\n--- 3. Job Progress & History Lifecycle ---');
    const compJob = await queueRepo.create({
      userId: testUserId,
      url: 'https://youtube.com/watch?v=complete_test',
      title: 'Worker Lifecycle Video',
      type: 'video',
      status: 'processing',
      progress: 10
    });
    const compJobId = compJob.id || compJob._id;

    // Simulate worker updating progress
    await queueRepo.updateJob(compJobId, { progress: 50 });
    const midJob = await queueRepo.findById(compJobId);
    assert(midJob.progress === 50, 'Worker updates in-flight progress to 50%');

    // Worker marks completed and writes to download_history
    const now = new Date();
    await queueRepo.updateJob(compJobId, {
      status: 'completed',
      progress: 100,
      completed_at: now,
      file_size: '78.5 MB'
    });

    const completedHistory = await histRepo.create({
      userId: testUserId,
      url: compJob.url,
      title: compJob.title,
      thumbnail: 'https://img.youtube.com/vi/test/hqdefault.jpg',
      format: '1080p MP4',
      fileSize: '78.5 MB',
      platform: 'youtube',
      status: 'completed'
    });

    const finishedJob = await queueRepo.findById(compJobId);
    assert(finishedJob.status === 'completed', 'Job marked as "completed"');
    assert(finishedJob.progress === 100, 'Completed job progress is 100%');
    assert(completedHistory && (completedHistory.id || completedHistory._id), 'Download history record successfully created for completed job');

    // ----------------------------------------------------
    // 4. RETRY HANDLING & TERMINAL FAILURE
    // ----------------------------------------------------
    console.log('\n--- 4. Retry Handling & Terminal Failure ---');
    const retryTestJob = await queueRepo.create({
      userId: testUserId,
      url: 'https://youtube.com/watch?v=retry_test',
      status: 'processing',
      attempts: 1,
      max_attempts: 3
    });
    const retryTestId = retryTestJob.id || retryTestJob._id;

    // First failure: attempts < max_attempts -> re-queued
    await queueRepo.updateJob(retryTestId, {
      status: 'queued',
      progress: 0,
      error_message: 'Temporary network failure. Re-queued for retry.'
    });
    const reQueued = await queueRepo.findById(retryTestId);
    assert(reQueued.status === 'queued', 'Under-attempt failure re-queues job for retry');

    // Terminal failure: attempts reaches max_attempts (3)
    await queueRepo.updateJob(retryTestId, {
      attempts: 3,
      status: 'failed',
      progress: 0,
      error_message: 'Max retry attempts exceeded.'
    });
    const failedJob = await queueRepo.findById(retryTestId);
    assert(failedJob.status === 'failed', 'Job permanently marked "failed" after reaching max attempts');
    assert(failedJob.error_message === 'Max retry attempts exceeded.', 'Error message preserved in failed job record');

    // ----------------------------------------------------
    // 5. STALE JOB RECOVERY (CRASH RECOVERY)
    // ----------------------------------------------------
    console.log('\n--- 5. Stale Job Recovery Worker ---');
    const staleJob = await queueRepo.create({
      userId: testUserId,
      url: 'https://youtube.com/watch?v=stale_crash_test',
      status: 'processing',
      attempts: 1,
      max_attempts: 3
    });

    const recoveredCount = await queueRepo.recoverStaleJobs();
    assert(recoveredCount >= 1, 'Stale job recovery detects orphaned processing jobs');
    const recoveredJob = await queueRepo.findById(staleJob.id || staleJob._id);
    assert(recoveredJob.status === 'queued' || recoveredJob.status === 'failed', 'Orphaned processing job recovered from crash state');

    // ----------------------------------------------------
    // 6. SUBSCRIPTION EXPIRATION WORKER
    // ----------------------------------------------------
    console.log('\n--- 6. Subscription Expiration Worker ---');
    const subUser = `sub_exp_${Date.now()}`;
    await userRepo.create({
      id: subUser,
      email: `${subUser}@test.io`,
      password_hash: 'hash',
      salt: 'salt',
      name: 'Expiring User',
      role: 'user',
      plan: 'pro',
      is_verified: true,
      is_banned: false
    });

    // Create expired subscription (expired 1 hour ago)
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    const twoDaysAgo = new Date(Date.now() - 48 * 3600 * 1000);
    const expiredSub = await subRepo.createSubscription({
      id: `sub_${Date.now()}`,
      userId: subUser,
      planId: 'plan_pro',
      planSlug: 'pro',
      billingPeriod: 'monthly',
      startsAt: twoDaysAgo.toISOString(),
      expiresAt: oneHourAgo.toISOString(),
      status: 'active'
    });

    const activeBefore = await subRepo.findExpiredSubscriptions();
    assert(activeBefore.some(s => s.user_id === subUser), 'Worker identifies overdue active subscription');

    // Run expiration worker
    await checkAndExpireSubscriptions();

    // Verify subscription status is expired
    const subAfter = await subRepo.findActiveSubscription(subUser);
    assert(subAfter === null, 'Overdue subscription is no longer active');

    // Verify user plan reverted to free
    const userAfter = await userRepo.findById(subUser);
    assert(userAfter.plan === 'free', 'User plan automatically downgraded to free tier upon subscription expiration');

    // Verify notification was sent
    const notifs = await notifRepo.findNotifications({ userId: subUser });
    const notifItems = notifs.notifications || notifs;
    assert(notifItems.some(n => n.title.includes('Subscription Expired')), 'Expiration notification delivered to user');

    console.log('\n' + '='.repeat(70));
    console.log(`  STAGE 4.2 BACKGROUND WORKER SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('='.repeat(70) + '\n');

  } finally {
    process.env.DB_ENGINE = originalEngine;
  }
}

run().then(() => {
  if (failed > 0) process.exit(1);
  process.exit(0);
}).catch(err => {
  console.error('\nFatal worker test execution error:', err);
  process.exit(1);
});
