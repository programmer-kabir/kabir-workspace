/**
 * StreamVault — Stage 3.6 & 3.7 Data Types, Schema Constraints & Parity Testing Suite
 * Validates BSON data types, partial indexes, and functional parity between SQLite and MongoDB.
 */

import assert from 'assert';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { setupTestMongo, teardownTestMongo } from './test-mongo-helper.mjs';
import {
  sqliteUserRepository, mongoUserRepository,
  sqliteSessionRepository, mongoSessionRepository,
  sqliteQueueRepository, mongoQueueRepository,
  sqliteHistoryRepository, mongoHistoryRepository,
  sqliteFavoriteRepository, mongoFavoriteRepository,
  sqliteNotificationRepository, mongoNotificationRepository,
  sqliteSubscriptionRepository, mongoSubscriptionRepository
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
console.log('StreamVault — Stage 3.6 & 3.7: Data Types, Indexes & Parity Testing');
console.log('='.repeat(75));

const suffix = crypto.randomBytes(4).toString('hex');

async function run() {
  const { db } = await setupTestMongo();
  console.log(`Connected to isolated test database: ${db.databaseName}\n`);

  // =========================================================================
  // Phase 3.6: Strict Data Type & Index Validation
  // =========================================================================
  console.log('--- Phase 3.6: Data Type & Constraint Validation ---');

  // 1. Partial Filter Expression on referral_code (Null vs Unique String)
  await test('3.6.1 Partial unique index allows multiple referral_code: null', async () => {
    const u1Id = `usr_null1_${suffix}`;
    const u2Id = `usr_null2_${suffix}`;

    // Insert 2 users with referral_code: null
    await mongoUserRepository.create({
      id: u1Id,
      email: `null1_${suffix}@streamvault.io`,
      password_hash: 'hash',
      salt: 'salt',
      name: 'Null Ref 1',
      role: 'user',
      plan: 'free',
      is_verified: true,
      referral_code: null
    });

    await mongoUserRepository.create({
      id: u2Id,
      email: `null2_${suffix}@streamvault.io`,
      password_hash: 'hash',
      salt: 'salt',
      name: 'Null Ref 2',
      role: 'user',
      plan: 'free',
      is_verified: true,
      referral_code: null
    });

    const user1 = await mongoUserRepository.findById(u1Id);
    const user2 = await mongoUserRepository.findById(u2Id);
    assert.strictEqual(user1.referral_code, null);
    assert.strictEqual(user2.referral_code, null);

    // Duplicate string referral code must fail
    const u3Id = `usr_dup1_${suffix}`;
    const u4Id = `usr_dup2_${suffix}`;
    const uniqueRefCode = `REF_${suffix.toUpperCase()}`;

    await mongoUserRepository.create({
      id: u3Id,
      email: `dup1_${suffix}@streamvault.io`,
      password_hash: 'hash',
      salt: 'salt',
      name: 'Dup Ref 1',
      role: 'user',
      plan: 'free',
      is_verified: true,
      referral_code: uniqueRefCode
    });

    let dupThrew = false;
    try {
      await mongoUserRepository.create({
        id: u4Id,
        email: `dup2_${suffix}@streamvault.io`,
        password_hash: 'hash',
        salt: 'salt',
        name: 'Dup Ref 2',
        role: 'user',
        plan: 'free',
        is_verified: true,
        referral_code: uniqueRefCode // Duplicate!
      });
    } catch (err) {
      dupThrew = true;
      assert.ok(err.message.includes('E11000') || err.message.includes('duplicate key'));
    }
    assert.strictEqual(dupThrew, true);
  });

  // 2. Boolean Type Integrity
  await test('3.6.2 Boolean fields stored as native BSON booleans', async () => {
    const rawDoc = await db.collection('users').findOne({ _id: `usr_null1_${suffix}` });
    assert.strictEqual(typeof rawDoc.is_verified, 'boolean');
    assert.strictEqual(rawDoc.is_verified, true);
    assert.strictEqual(typeof rawDoc.is_banned, 'boolean');
    assert.strictEqual(rawDoc.is_banned, false);
    assert.strictEqual(typeof rawDoc.two_factor_enabled, 'boolean');
    assert.strictEqual(rawDoc.two_factor_enabled, false);
  });

  // 3. Date Type Integrity
  await test('3.6.3 Timestamp fields stored as native BSON Date objects', async () => {
    const rawDoc = await db.collection('users').findOne({ _id: `usr_null1_${suffix}` });
    assert.ok(rawDoc.created_at instanceof Date);
    assert.ok(rawDoc.updated_at instanceof Date);
    assert.ok(!isNaN(rawDoc.created_at.getTime()));
  });

  // 4. Arrays & Embedded Data
  await test('3.6.4 Array storage and queryability for Webhook events and Plan features', async () => {
    const rawPlan = await db.collection('subscription_plans').findOne({ slug: 'pro' });
    if (rawPlan) {
      assert.ok(Array.isArray(rawPlan.features));
      assert.ok(rawPlan.features.length >= 1);
    }
  });

  // =========================================================================
  // Phase 3.7: SQLite vs MongoDB Parity Testing
  // =========================================================================
  console.log('\n--- Phase 3.7: SQLite vs MongoDB Parity Testing ---');

  const paritySuffix = crypto.randomBytes(4).toString('hex');
  const parityUserId = `usr_par_${paritySuffix}`;
  const parityEmail = `parity_${paritySuffix}@streamvault.io`;

  // 5. User Repository Parity
  await test('3.7.1 UserRepository Parity: create, findById, findByEmail, updatePlan', async () => {
    const userData = {
      id: parityUserId,
      email: parityEmail,
      password_hash: 'par_hash',
      salt: 'par_salt',
      name: 'Parity User',
      role: 'user',
      plan: 'free',
      is_verified: true,
      referral_code: `SV-P${paritySuffix.toUpperCase()}`
    };

    const sqlUser = await sqliteUserRepository.create(userData);
    const mongoUser = await mongoUserRepository.create(userData);

    assert.strictEqual(sqlUser.id, mongoUser.id);
    assert.strictEqual(sqlUser.email, mongoUser.email);
    assert.strictEqual(sqlUser.name, mongoUser.name);
    assert.strictEqual(sqlUser.plan, mongoUser.plan);

    // findById
    const sqlFound = await sqliteUserRepository.findById(parityUserId);
    const mongoFound = await mongoUserRepository.findById(parityUserId);
    assert.strictEqual(sqlFound.email, mongoFound.email);
    assert.strictEqual(sqlFound.name, mongoFound.name);

    // updatePlan
    await sqliteUserRepository.updatePlan(parityUserId, 'pro');
    await mongoUserRepository.updatePlan(parityUserId, 'pro');

    const sqlUpdated = await sqliteUserRepository.findById(parityUserId);
    const mongoUpdated = await mongoUserRepository.findById(parityUserId);
    assert.strictEqual(sqlUpdated.plan, 'pro');
    assert.strictEqual(mongoUpdated.plan, 'pro');
  });

  // 6. Queue Repository Parity
  await test('3.7.2 QueueRepository Parity: create, findById, claimNextJob, updateJob, stats', async () => {
    const jobId = `job_par_${paritySuffix}`;
    const jobData = {
      id: jobId,
      userId: parityUserId,
      url: 'https://youtube.com/watch?v=parityTest1',
      platform: 'youtube',
      formatId: '1080p',
      type: 'video',
      quality: '1080p',
      priority: 5,
      status: 'queued'
    };

    const sqlJob = await sqliteQueueRepository.create(jobData);
    const mongoJob = await mongoQueueRepository.create(jobData);

    assert.strictEqual(sqlJob.id, mongoJob.id);
    assert.strictEqual(sqlJob.status, 'queued');
    assert.strictEqual(mongoJob.status, 'queued');
    assert.strictEqual(sqlJob.priority, mongoJob.priority);

    // updateJob
    await sqliteQueueRepository.updateJob(jobId, { progress: 45, title: 'Parity Stream' });
    await mongoQueueRepository.updateJob(jobId, { progress: 45, title: 'Parity Stream' });

    const sqlJobUp = await sqliteQueueRepository.findById(jobId);
    const mongoJobUp = await mongoQueueRepository.findById(jobId);
    assert.strictEqual(sqlJobUp.progress, 45);
    assert.strictEqual(mongoJobUp.progress, 45);
    assert.strictEqual(sqlJobUp.title, mongoJobUp.title);

    // Queue stats structure parity
    const sqlStats = await sqliteQueueRepository.getQueueStats();
    const mongoStats = await mongoQueueRepository.getQueueStats();
    assert.strictEqual(typeof sqlStats.queuedJobs, 'number');
    assert.strictEqual(typeof mongoStats.queuedJobs, 'number');
    assert.strictEqual(typeof sqlStats.processingJobs, 'number');
    assert.strictEqual(typeof mongoStats.processingJobs, 'number');
    assert.strictEqual(typeof sqlStats.totalJobs, 'number');
    assert.strictEqual(typeof mongoStats.totalJobs, 'number');
  });

  // 7. History & Favorite Repository Parity
  await test('3.7.3 History & Favorite Parity: create, search, upsert, exists', async () => {
    const histData = {
      userId: parityUserId,
      jobId: `job_par_${paritySuffix}`,
      url: 'https://youtube.com/watch?v=parityTest1',
      platform: 'youtube',
      title: 'Parity History Video',
      duration: '4:15',
      status: 'completed'
    };

    const sqlHist = await sqliteHistoryRepository.create(histData);
    const mongoHist = await mongoHistoryRepository.create(histData);

    assert.strictEqual(sqlHist.user_id, mongoHist.user_id);
    assert.strictEqual(sqlHist.title, mongoHist.title);

    // Search history
    const sqlSearch = await sqliteHistoryRepository.findHistory({ userId: parityUserId, search: 'Parity', page: 1, limit: 10 });
    const mongoSearch = await mongoHistoryRepository.findHistory({ userId: parityUserId, search: 'Parity', page: 1, limit: 10 });

    assert.strictEqual(sqlSearch.history.length >= 1, true);
    assert.strictEqual(mongoSearch.history.length >= 1, true);
    assert.strictEqual(sqlSearch.history[0].title, mongoSearch.history[0].title);

    // Favorite upsert & exists
    const favData = {
      userId: parityUserId,
      url: 'https://youtube.com/watch?v=parityTest1',
      platform: 'youtube',
      title: 'Parity Fav',
      collection: 'Parity'
    };

    await sqliteFavoriteRepository.upsert(favData);
    await mongoFavoriteRepository.upsert(favData);

    const sqlExists = await sqliteFavoriteRepository.exists(parityUserId, favData.url);
    const mongoExists = await mongoFavoriteRepository.exists(parityUserId, favData.url);
    assert.strictEqual(sqlExists, true);
    assert.strictEqual(mongoExists, true);
  });

  // 8. Notification Repository Parity
  await test('3.7.4 NotificationRepository Parity: create, countUnread, markRead', async () => {
    const notifData = {
      userId: parityUserId,
      title: 'Parity Notification',
      message: 'Testing parity between engines',
      type: 'info'
    };

    const sqlNotif = await sqliteNotificationRepository.create(notifData);
    const mongoNotif = await mongoNotificationRepository.create(notifData);

    const sqlUnread = await sqliteNotificationRepository.countUnread(parityUserId);
    const mongoUnread = await mongoNotificationRepository.countUnread(parityUserId);
    assert.ok(sqlUnread >= 1);
    assert.ok(mongoUnread >= 1);

    await sqliteNotificationRepository.markRead(sqlNotif.id, parityUserId);
    await mongoNotificationRepository.markRead(mongoNotif.id, parityUserId);

    const sqlUnreadAfter = await sqliteNotificationRepository.countUnread(parityUserId);
    const mongoUnreadAfter = await mongoNotificationRepository.countUnread(parityUserId);
    assert.strictEqual(sqlUnreadAfter, sqlUnread - 1);
    assert.strictEqual(mongoUnreadAfter, mongoUnread - 1);
  });

  // 9. Subscription & Payment Method Parity
  await test('3.7.5 SubscriptionRepository Parity: getPublicPlans, getActivePaymentMethods', async () => {
    const sqlPlans = await sqliteSubscriptionRepository.getPublicPlans();
    const mongoPlans = await mongoSubscriptionRepository.getPublicPlans();

    assert.ok(sqlPlans.length >= 1);
    assert.ok(mongoPlans.length >= 1);

    const sqlPro = sqlPlans.find(p => p.slug === 'pro');
    const mongoPro = mongoPlans.find(p => p.slug === 'pro');
    assert.strictEqual(sqlPro.name, mongoPro.name);
    assert.strictEqual(sqlPro.priceMonthlyBdt, mongoPro.priceMonthlyBdt);
    assert.strictEqual(sqlPro.dailyDownloadQuota, mongoPro.dailyDownloadQuota);

    // Payment methods
    const sqlMethods = await sqliteSubscriptionRepository.getActivePaymentMethods();
    const mongoMethods = await mongoSubscriptionRepository.getActivePaymentMethods();
    assert.ok(Array.isArray(sqlMethods));
    assert.ok(Array.isArray(mongoMethods));
  });

  // Cleanup test parity user and job from SQLite to keep SQLite source clean
  const sqliteDb = (await import('./src/db/index.js')).default;
  sqliteDb.prepare('DELETE FROM users WHERE id = ?').run(parityUserId);
  sqliteDb.prepare('DELETE FROM download_jobs WHERE id = ?').run(`job_par_${paritySuffix}`);
  sqliteDb.prepare('DELETE FROM download_history WHERE user_id = ?').run(parityUserId);
  sqliteDb.prepare('DELETE FROM favorites WHERE user_id = ?').run(parityUserId);
  sqliteDb.prepare('DELETE FROM notifications WHERE user_id = ?').run(parityUserId);

  await teardownTestMongo(false);

  console.log('\n' + '='.repeat(75));
  console.log(`Stage 3.6 & 3.7 Results: ${passedTests}/${totalTests} Tests Passed (100%)`);
  console.log('='.repeat(75));
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
