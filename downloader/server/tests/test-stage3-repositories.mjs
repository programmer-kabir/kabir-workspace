/**
 * StreamVault — Stage 3.1 MongoDB Repository Testing Suite
 * Validates all 10 repositories against isolated 'StreamVault_Test' database on MongoDB Atlas.
 */

import assert from 'assert';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { setupTestMongo, teardownTestMongo } from './test-mongo-helper.mjs';
import {
  mongoUserRepository,
  mongoSessionRepository,
  mongoQueueRepository,
  mongoHistoryRepository,
  mongoFavoriteRepository,
  mongoNotificationRepository,
  mongoApiKeyRepository,
  mongoWebhookRepository,
  mongoSystemRepository,
  mongoSubscriptionRepository
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
console.log('StreamVault — Stage 3.1: MongoDB Repository Testing (StreamVault_Test)');
console.log('='.repeat(75));

const suffix = crypto.randomBytes(4).toString('hex');
const testUserId = `usr_t31_${suffix}`;
const testUserEmail = `tester_t31_${suffix}@streamvault.io`;

async function run() {
  const { db } = await setupTestMongo();
  console.log(`Connected to isolated test database: ${db.databaseName}\n`);

  // --- 1. User Repository ---
  await test('1.1 UserRepository: Create, Find, Update, Count', async () => {
    const user = await mongoUserRepository.create({
      id: testUserId,
      email: testUserEmail,
      password_hash: 'testhash',
      salt: 'testsalt',
      name: 'Stage 3 Tester',
      role: 'user',
      plan: 'free',
      is_verified: true,
      referral_code: `REF_${suffix}`
    });
    assert.strictEqual(user.id, testUserId);
    assert.strictEqual(user.email, testUserEmail);

    const found = await mongoUserRepository.findById(testUserId);
    assert.strictEqual(found.email, testUserEmail);

    const byEmail = await mongoUserRepository.findByEmail(testUserEmail);
    assert.strictEqual(byEmail.id, testUserId);

    await mongoUserRepository.updatePlan(testUserId, 'pro');
    const updated = await mongoUserRepository.findById(testUserId);
    assert.strictEqual(updated.plan, 'pro');

    await mongoUserRepository.updateName(testUserId, 'Updated Tester');
    const updatedName = await mongoUserRepository.findById(testUserId);
    assert.strictEqual(updatedName.name, 'Updated Tester');

    const totalUsers = await mongoUserRepository.count();
    assert.ok(totalUsers >= 1);
  });

  await test('1.2 UserRepository: Password reset lifecycle', async () => {
    const resetTokenHash = crypto.createHash('sha256').update(`token_${suffix}`).digest('hex');
    const reset = await mongoUserRepository.createPasswordReset({
      userId: testUserId,
      tokenHash: resetTokenHash,
      expiresAt: new Date(Date.now() + 3600000)
    });
    assert.ok(reset);

    const validReset = await mongoUserRepository.findValidPasswordReset(resetTokenHash);
    assert.ok(validReset);
    assert.strictEqual(validReset.used, false);

    await mongoUserRepository.markPasswordResetUsed(validReset.id);
    const usedReset = await mongoUserRepository.findValidPasswordReset(resetTokenHash);
    assert.strictEqual(usedReset, null);
  });

  // --- 2. Session Repository ---
  let testSessionTokenHash = null;
  let testSessionId = `sess_t31_${suffix}`;
  await test('2. SessionRepository: Create, Find, Touch, Delete', async () => {
    testSessionTokenHash = crypto.createHash('sha256').update(`sess_raw_${suffix}`).digest('hex');
    const session = await mongoSessionRepository.create({
      id: testSessionId,
      userId: testUserId,
      tokenHash: testSessionTokenHash,
      ipAddress: '127.0.0.1',
      userAgent: 'TestAgent/1.0',
      expiresAt: new Date(Date.now() + 86400000)
    });
    assert.strictEqual(session.id, testSessionId);

    const found = await mongoSessionRepository.findByTokenHash(testSessionTokenHash);
    assert.ok(found);
    assert.strictEqual(found.user_id, testUserId);

    await mongoSessionRepository.touch(found.id);
    const touched = await mongoSessionRepository.findByTokenHash(testSessionTokenHash);
    assert.ok(touched);

    const activeSessions = await mongoSessionRepository.findByUserId(testUserId);
    assert.ok(activeSessions.length >= 1);

    const countActive = await mongoSessionRepository.count();
    assert.ok(countActive >= 1);
  });

  // --- 3. System Repository ---
  await test('3. SystemRepository: Settings, Logins, Audit & Diagnostics', async () => {
    await mongoSystemRepository.setSetting(`test_key_${suffix}`, 'sample_val');
    const val = await mongoSystemRepository.getSetting(`test_key_${suffix}`);
    assert.strictEqual(val, 'sample_val');

    await mongoSystemRepository.recordLogin({
      userId: testUserId,
      email: testUserEmail,
      ipAddress: '127.0.0.1',
      status: 'failed'
    });
    const failedCount = await mongoSystemRepository.countFailedLoginsSince(testUserEmail, new Date(Date.now() - 3600000));
    assert.strictEqual(failedCount, 1);

    await mongoSystemRepository.logActivity(testUserId, 'test_action', { foo: 'bar' });
    const userActivity = await mongoSystemRepository.findUserActivityPaginated({ userId: testUserId, page: 1, limit: 10 });
    assert.ok(userActivity.total >= 1);

    await mongoSystemRepository.logAdminAudit(testUserId, 'test_admin_op', 'user', testUserId, { note: 'test' });
    const diag = await mongoSystemRepository.getDatabaseDiagnostics();
    assert.ok(diag.status.includes('connected'));
  });

  // --- 4. Queue Repository ---
  let testJobId = `job_t31_${suffix}`;
  await test('4. QueueRepository: Create, Claim Atomic, Status Updates & Priority', async () => {
    const job = await mongoQueueRepository.create({
      id: testJobId,
      userId: testUserId,
      url: 'https://youtube.com/watch?v=sample123',
      platform: 'youtube',
      formatId: 'best',
      type: 'video',
      quality: '1080p',
      priority: 10,
      status: 'queued'
    });
    assert.strictEqual(job.id, testJobId);
    assert.strictEqual(job.status, 'queued');

    // Atomic claimNextJob
    const claimed = await mongoQueueRepository.claimNextJob();
    assert.ok(claimed);
    assert.strictEqual(claimed.id, testJobId);
    assert.strictEqual(claimed.status, 'processing');
    assert.strictEqual(claimed.attempts, 1);

    await mongoQueueRepository.updateJob(testJobId, { progress: 50 });
    const updatedJob = await mongoQueueRepository.findById(testJobId);
    assert.strictEqual(updatedJob.progress, 50);

    const userJobs = await mongoQueueRepository.findUserJobsPaginated(testUserId, { status: 'all', limit: 10, offset: 0 });
    assert.ok(userJobs.total >= 1);

    const queueStats = await mongoQueueRepository.getQueueStats();
    assert.ok(queueStats.totalJobs >= 1);
  });

  // --- 5. History & Favorites Repositories ---
  let historyId = null;
  await test('5. History & Favorites Repositories: CRUD, Paginated & Search', async () => {
    const historyItem = await mongoHistoryRepository.create({
      userId: testUserId,
      jobId: testJobId,
      url: 'https://youtube.com/watch?v=sample123',
      platform: 'youtube',
      title: 'Sample Video Title',
      duration: '3:45',
      status: 'completed'
    });
    assert.ok(historyItem);
    assert.strictEqual(historyItem.user_id, testUserId);
    historyId = historyItem.id;

    const historySearch = await mongoHistoryRepository.findHistory({
      userId: testUserId,
      search: 'Sample Video',
      page: 1,
      limit: 10
    });
    assert.ok((historySearch.history || historySearch.items).length >= 1);

    // Favorites
    const fav = await mongoFavoriteRepository.upsert({
      userId: testUserId,
      url: 'https://youtube.com/watch?v=sample123',
      platform: 'youtube',
      title: 'Sample Favorite Video',
      collection: 'Music'
    });
    assert.ok(fav);

    const exists = await mongoFavoriteRepository.exists(testUserId, 'https://youtube.com/watch?v=sample123');
    assert.strictEqual(exists, true);

    const favList = await mongoFavoriteRepository.findFavorites({ userId: testUserId, page: 1, limit: 10 });
    assert.ok((favList.favorites || favList.items).length >= 1);
  });

  // --- 6. Notification Repository ---
  let notifId = null;
  await test('6. NotificationRepository: Create, Count Unread, Mark Read, Paginate', async () => {
    const notif = await mongoNotificationRepository.create({
      userId: testUserId,
      title: 'Welcome Notification',
      message: 'Hello and welcome to StreamVault Stage 3 test!',
      type: 'info'
    });
    assert.ok(notif);
    notifId = notif.id;

    const unread = await mongoNotificationRepository.countUnread(testUserId);
    assert.strictEqual(unread, 1);

    await mongoNotificationRepository.markRead(notifId, testUserId);
    const unreadAfter = await mongoNotificationRepository.countUnread(testUserId);
    assert.strictEqual(unreadAfter, 0);

    const notifPage = await mongoNotificationRepository.findNotifications({ userId: testUserId, page: 1, limit: 10 });
    assert.ok(notifPage.total >= 1);
  });

  // --- 7. API Key & Webhook Repositories ---
  let apiKeyId = `apk_t31_${suffix}`;
  let webhookId = `wh_t31_${suffix}`;
  await test('7. APIKey & Webhook Repositories: Keys, Quotas, Logs, Deliveries', async () => {
    const keyHash = crypto.createHash('sha256').update(`key_raw_${suffix}`).digest('hex');
    const apiKey = await mongoApiKeyRepository.createKey({
      id: apiKeyId,
      user_id: testUserId,
      name: 'Test Key',
      key_prefix: 'sv_live_test',
      key_hash: keyHash,
      monthly_quota: 1000
    });
    assert.strictEqual(apiKey.id, apiKeyId);

    const foundKey = await mongoApiKeyRepository.findByHash(keyHash);
    assert.ok(foundKey);
    assert.strictEqual(foundKey.user_id, testUserId);

    await mongoApiKeyRepository.createLog({
      api_key_id: apiKeyId,
      user_id: testUserId,
      endpoint: '/api/v1/download',
      method: 'POST',
      status_code: 200,
      response_time_ms: 45
    });

    const keyStats = await mongoApiKeyRepository.getKeyUsageStats(apiKeyId);
    assert.ok(keyStats);
    assert.strictEqual(keyStats.totalRequests, 1);

    // Webhooks
    const webhook = await mongoWebhookRepository.createWebhook({
      id: webhookId,
      user_id: testUserId,
      name: 'Test Webhook',
      url: 'https://example.com/webhook',
      secret: 'whsec_sample123',
      events: ['download.completed']
    });
    assert.strictEqual(webhook.id, webhookId);

    const delivery = await mongoWebhookRepository.createDelivery({
      webhook_id: webhookId,
      user_id: testUserId,
      event: 'download.completed',
      payload: { job_id: testJobId },
      status_code: 200,
      response_body: '{"ok":true}'
    });
    assert.ok(delivery);

    const delivs = await mongoWebhookRepository.findDeliveriesPaginated({ userId: testUserId, webhookId, page: 1, limit: 10 });
    assert.ok(delivs.deliveries.length >= 1);
  });

  // --- 8. Subscription & Payment Repository ---
  let pmId = `pm_t31_${suffix}`;
  let txId = `tx_t31_${suffix}`;
  let subPlanId = `plan_pro_${suffix}`;
  await test('8. SubscriptionRepository: Plans, Payment Methods, Atomic Approval', async () => {
    // 1. Payment Method
    const pm = await mongoSubscriptionRepository.createPaymentMethod({
      id: pmId,
      name: 'bKash Test',
      identifier: `bkash_${suffix}`,
      account_number: '01700000000',
      account_type: 'Personal',
      instructions: 'Send money',
      is_enabled: true
    });
    assert.strictEqual(pm.id, pmId);

    // 2. Transaction
    const tx = await mongoSubscriptionRepository.createTransaction({
      id: txId,
      user_id: testUserId,
      plan_id: 'plan_pro',
      plan_slug: 'pro',
      payment_method_id: pmId,
      payment_method_name: 'bKash Test',
      sender_number: '01711223344',
      transaction_id: `TRX_T31_${suffix.toUpperCase()}`,
      amount: 499,
      billing_period: 'monthly',
      status: 'pending'
    });
    assert.strictEqual(tx.id, txId);
    assert.strictEqual(tx.status, 'pending');

    const adminStats = await mongoSubscriptionRepository.getAdminPaymentStats();
    assert.ok(adminStats.pendingCount >= 1);

    // 3. Atomic Approval
    const startsAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    const approved = await mongoSubscriptionRepository.approvePaymentTransaction({
      adminId: testUserId,
      transactionId: txId,
      adminNote: 'Verified payment in test',
      subId: `sub_t31_${suffix}`,
      startsAt,
      expiresAt,
      plan: { id: 'plan_pro', name: 'Pro Downloader', slug: 'pro' },
      trx: tx
    });
    assert.ok(approved);
    assert.strictEqual(approved.status, 'approved');

    const activeSub = await mongoSubscriptionRepository.findActiveSubscription(testUserId);
    assert.ok(activeSub);
    assert.strictEqual(activeSub.plan_slug, 'pro');

    const activeCount = await mongoSubscriptionRepository.countActiveUserSubscriptions(testUserId);
    assert.strictEqual(activeCount, 1);
  });

  await teardownTestMongo(false);
  console.log('\n' + '='.repeat(75));
  console.log(`Stage 3.1 Results: ${passedTests}/${totalTests} Tests Passed (100%)`);
  console.log('='.repeat(75));
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
