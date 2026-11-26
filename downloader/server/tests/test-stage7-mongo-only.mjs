/**
 * StreamVault — Stage 7: MongoDB-Only Master Verification Suite
 * Validates complete SQLite decommissioning and 100% MongoDB Atlas operation.
 * Uses isolated test database: StreamVault_Stage7_Test
 */

import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
dotenv.config({ path: path.resolve(__dirname, '../.env') });
process.env.DB_ENGINE = 'mongodb';

const TEST_DB_NAME = 'StreamVault_Stage7_Test';
const BASE_URI = process.env.MONGODB_URI;

if (!BASE_URI) {
  console.error('❌ MONGODB_URI is required to run Stage 7 verification.');
  process.exit(1);
}

// Adjust URI to target test database
let testUri = BASE_URI;
if (testUri.includes('/StreamVault?')) {
  testUri = testUri.replace('/StreamVault?', `/${TEST_DB_NAME}?`);
} else if (testUri.includes('.mongodb.net/')) {
  testUri = testUri.replace(/\.mongodb\.net\/([^?]*)/, `.mongodb.net/${TEST_DB_NAME}`);
}

console.log('='.repeat(75));
console.log('🚀 STREAMVAULT — STAGE 7: MONGODB-ONLY MASTER VERIFICATION');
console.log('='.repeat(75));
console.log(`Isolated Test Database: ${TEST_DB_NAME}`);
console.log(`Node.js Version: ${process.version}`);
console.log('='.repeat(75));

const results = [];

function recordTest(name, passed, details = '') {
  results.push({ name, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} | ${name}${details ? ` (${details})` : ''}`);
}

let testClient = null;
let testDb = null;

async function runStage7Tests() {
  try {
    // ------------------------------------------------------------------------
    // SECTION 1: ARCHITECTURAL DECOMMISSIONING AUDIT
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 1: SQLite Decommissioning Audit ---');

    // 1.1 Verify no SQLite database file in server/data/
    const dataDir = path.resolve(__dirname, '../data');
    let sqliteDbExists = false;
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir);
      sqliteDbExists = files.some(f => f.startsWith('streamvault.db'));
    }
    recordTest(
      'SQLite File Absence',
      !sqliteDbExists,
      sqliteDbExists ? 'Found streamvault.db in data/' : 'No streamvault.db exists'
    );

    // 1.2 Verify DB_ENGINE environment variable in .env
    const envContent = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf8');
    const dbEngineMatch = envContent.match(/DB_ENGINE\s*=\s*(.+)/);
    const configuredEngine = dbEngineMatch ? dbEngineMatch[1].trim() : 'unset';
    recordTest(
      'Environment DB_ENGINE Setting',
      configuredEngine === 'mongodb',
      `DB_ENGINE is "${configuredEngine}"`
    );

    // 1.3 Verify getDbEngine() rejects SQLite
    const { getDbEngine, SUPPORTED_ENGINES } = await import('../src/db/repositories/index.js');
    recordTest(
      'Repository Layer DB Engine',
      getDbEngine() === SUPPORTED_ENGINES.MONGODB,
      `Active engine: ${getDbEngine()}`
    );

    let rejectedSqlite = false;
    const originalEnv = process.env.DB_ENGINE;
    try {
      process.env.DB_ENGINE = 'sqlite';
      getDbEngine();
    } catch (err) {
      if (err.message.includes('decommissioned')) {
        rejectedSqlite = true;
      }
    } finally {
      process.env.DB_ENGINE = originalEnv;
    }
    recordTest(
      'Runtime SQLite Rejection',
      rejectedSqlite,
      'getDbEngine() throws explicit decommissioned error on DB_ENGINE=sqlite'
    );

    // 1.4 Verify no SQLite imports in db core
    const dbIndexContent = fs.readFileSync(path.resolve(__dirname, '../src/db/index.js'), 'utf8');
    const hasSqliteInIndex = /node:sqlite|DatabaseSync|better-sqlite3/i.test(dbIndexContent);
    recordTest(
      'Core DB Zero SQLite Dependencies',
      !hasSqliteInIndex,
      hasSqliteInIndex ? 'Found SQLite import in src/db/index.js' : 'src/db/index.js is 100% MongoDB'
    );

    // ------------------------------------------------------------------------
    // SECTION 2: ISOLATED MONGODB INITIALIZATION
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 2: MongoDB Atlas Isolated Database Initialization ---');

    // Override MONGODB_DB_NAME for isolated test run
    process.env.MONGODB_DB_NAME = TEST_DB_NAME;

    testClient = new MongoClient(testUri);
    await testClient.connect();
    testDb = testClient.db(TEST_DB_NAME);

    // Drop previous test database if exists
    await testDb.dropDatabase().catch(() => {});

    // Import MongoDB Schema and init collections & indexes
    const { COLLECTIONS, initMongoCollectionsAndIndexes } = await import('../src/db/mongoSchemas.js');
    const initResult = await initMongoCollectionsAndIndexes(testDb);

    recordTest(
      '19 MongoDB Collections Creation',
      initResult.collections.length === 19,
      `${initResult.collections.length} collections created`
    );

    // Verify 57 indexes
    let totalIndexes = 0;
    for (const collName of Object.values(COLLECTIONS)) {
      const idxs = await testDb.collection(collName).indexes();
      totalIndexes += idxs.length;
    }
    recordTest(
      'MongoDB 57 Indexes Verification',
      totalIndexes >= 57,
      `Total verified indexes: ${totalIndexes}`
    );

    // Run initDatabase seeding logic on testDb
    const { hashPassword } = await import('../src/utils/crypto.js');
    const now = new Date();

    // Seed admin
    const { hash, salt } = hashPassword('AdminTestPassword123!');
    await testDb.collection(COLLECTIONS.USERS).insertOne({
      _id: 'admin-master-id',
      email: 'admin@streamvault.io',
      password_hash: hash,
      salt,
      name: 'System Administrator',
      role: 'admin',
      plan: 'enterprise',
      is_verified: true,
      is_banned: false,
      two_factor_secret: null,
      two_factor_enabled: false,
      referral_code: null,
      referred_by: null,
      created_at: now,
      updated_at: now
    });

    // Seed default plans
    const defaultPlans = [
      {
        _id: 'plan_free',
        name: 'Free Tier',
        slug: 'free',
        price_monthly_bdt: 0,
        price_yearly_bdt: 0,
        daily_download_quota: 15,
        monthly_download_quota: 250,
        api_rpm: 20,
        api_monthly_quota: 1000,
        max_concurrent_jobs: 1,
        features: ['1080p Video Downloads', '320kbps MP3 Audio Extraction'],
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        _id: 'plan_pro',
        name: 'Pro Downloader',
        slug: 'pro',
        price_monthly_bdt: 499,
        price_yearly_bdt: 4990,
        daily_download_quota: 150,
        monthly_download_quota: 3000,
        api_rpm: 120,
        api_monthly_quota: 25000,
        max_concurrent_jobs: 3,
        features: ['4K Video Downloads', 'Bulk Downloads', 'High-Speed API'],
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];
    await testDb.collection(COLLECTIONS.SUBSCRIPTION_PLANS).insertMany(defaultPlans);

    // Seed system settings
    await testDb.collection(COLLECTIONS.SYSTEM_SETTINGS).insertMany([
      { _id: 'maintenance_mode', key: 'maintenance_mode', value: 'false', updated_at: now },
      { _id: 'registration_enabled', key: 'registration_enabled', value: 'true', updated_at: now }
    ]);

    // Seed payment methods
    await testDb.collection(COLLECTIONS.PAYMENT_METHODS).insertOne({
      _id: 'pm_bkash',
      name: 'bKash',
      identifier: 'bkash',
      account_number: '01712345678',
      account_type: 'Personal',
      instructions: 'Send money to 01712345678',
      is_enabled: true,
      created_at: now,
      updated_at: now
    });

    recordTest('Default Seeds Insertion', true, 'Admin, plans, settings, and payment methods seeded');

    // ------------------------------------------------------------------------
    // SECTION 3: REPOSITORY CRUD & WORKFLOW EXECUTION
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 3: MongoDB Repository CRUD Workflows ---');

    const {
      mongoUserRepository,
      mongoSessionRepository,
      mongoQueueRepository,
      mongoHistoryRepository,
      mongoFavoriteRepository,
      mongoNotificationRepository,
      mongoApiKeyRepository,
      mongoSubscriptionRepository,
      mongoSystemRepository,
      mongoWebhookRepository
    } = await import('../src/db/repositories/index.js');

    // Bind repos to test database
    const mongoModule = await import('../src/db/mongo.js');
    await mongoModule.connectMongo(testUri, { dbName: TEST_DB_NAME });

    // 3.1 User Management
    const testUserId = 'user_stage7_' + Date.now();
    const createdUser = await mongoUserRepository.create({
      id: testUserId,
      email: 'stage7_user@streamvault.io',
      password_hash: 'hash123',
      salt: 'salt123',
      name: 'Stage 7 User',
      role: 'user',
      plan: 'free',
      is_verified: true,
      is_banned: false
    });
    const fetchedUser = await mongoUserRepository.findById(testUserId);
    recordTest(
      'User Creation & Lookup',
      fetchedUser && fetchedUser.email === 'stage7_user@streamvault.io',
      `User ID: ${testUserId}`
    );

    // 3.2 Session Persistence
    const tokenHash = 'tok_hash_' + Date.now();
    await mongoSessionRepository.create({
      id: 'sess_' + Date.now(),
      user_id: testUserId,
      token_hash: tokenHash,
      ip_address: '127.0.0.1',
      user_agent: 'Stage7-Test-Agent',
      expires_at: new Date(Date.now() + 86400000)
    });
    const fetchedSession = await mongoSessionRepository.findByTokenHash(tokenHash);
    recordTest(
      'Session Creation & User Join',
      fetchedSession && fetchedSession.email === 'stage7_user@streamvault.io',
      `Session associated with ${fetchedSession?.email}`
    );

    // 3.3 Queue Jobs Workflow
    const jobId = 'job_stage7_' + Date.now();
    await mongoQueueRepository.create({
      id: jobId,
      user_id: testUserId,
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      platform: 'youtube',
      format_id: 'mp4-1080p',
      type: 'video',
      quality: '1080p',
      title: 'Rick Astley - Never Gonna Give You Up',
      priority: 5,
      status: 'queued'
    });
    const nextJob = await mongoQueueRepository.findNextQueued(1);
    recordTest(
      'Queue Job Creation & Priority Fetch',
      nextJob.length > 0 && nextJob[0]._id === jobId,
      `Fetched next queued job: ${nextJob[0]?._id}`
    );

    await mongoQueueRepository.updateProgress(jobId, 75);
    await mongoQueueRepository.updateProgress(jobId, 100);
    await mongoQueueRepository.updateStatus(jobId, 'completed');
    const completedJob = await mongoQueueRepository.findById(jobId);
    recordTest(
      'Queue Job Status Transitions',
      completedJob.status === 'completed' && completedJob.progress === 100,
      `Final status: ${completedJob.status}, progress: ${completedJob.progress}%`
    );

    // 3.4 History & Favorites
    const historyEntry = await mongoHistoryRepository.create({
      user_id: testUserId,
      job_id: jobId,
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      platform: 'youtube',
      title: 'Rick Astley - Never Gonna Give You Up',
      format_id: 'mp4-1080p',
      type: 'video',
      resolution: '1080p',
      file_size: 25000000,
      duration: 213,
      status: 'completed'
    });
    const userHistory = await mongoHistoryRepository.findByUserId(testUserId, 10, 0);
    recordTest(
      'Download History Insertion & Pagination',
      userHistory.length === 1 && userHistory[0].title.includes('Rick Astley'),
      `Retrieved ${userHistory.length} history item`
    );

    const favEntry = await mongoFavoriteRepository.create({
      user_id: testUserId,
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      platform: 'youtube',
      title: 'Rick Astley - Never Gonna Give You Up',
      collection: 'Music Videos'
    });
    const isFav = await mongoFavoriteRepository.exists(testUserId, 'https://youtube.com/watch?v=dQw4w9WgXcQ');
    recordTest(
      'Favorites Insertion & Existence Check',
      isFav === true,
      `Collection: ${favEntry.collection}`
    );

    // 3.5 Notifications & Activity
    const notif = await mongoNotificationRepository.create({
      userId: testUserId,
      title: 'Download Complete',
      message: 'Your 1080p video has finished downloading.',
      type: 'success'
    });
    const unreadCount = await mongoNotificationRepository.countUnread(testUserId);
    await mongoNotificationRepository.markAllRead(testUserId);
    const unreadAfter = await mongoNotificationRepository.countUnread(testUserId);
    recordTest(
      'Notification Lifecycle',
      unreadCount === 1 && unreadAfter === 0,
      `Unread before: ${unreadCount}, after: ${unreadAfter}`
    );

    await mongoSystemRepository.logActivity(testUserId, 'test_action', { detail: 'Stage 7' });
    const activity = await mongoSystemRepository.findUserActivityPaginated({ userId: testUserId });
    recordTest(
      'User Activity Audit Logging',
      activity.total >= 1 && activity.activities[0].action === 'test_action',
      `Logged actions: ${activity.total}`
    );

    // 3.6 API Keys & Webhooks
    const apiKeyId = 'key_stage7_' + Date.now();
    await mongoApiKeyRepository.createKey({
      id: apiKeyId,
      user_id: testUserId,
      name: 'Stage 7 Developer Key',
      key_prefix: 'sk_live_stage7',
      key_hash: 'hash_stage7_key_' + Date.now(),
      status: 'active',
      monthly_quota: 5000,
      requests_this_month: 0,
      is_enabled: true
    });
    const fetchedKey = await mongoApiKeyRepository.findKeyByIdAndUserId(apiKeyId, testUserId);
    recordTest(
      'Developer API Key Management',
      fetchedKey && fetchedKey.name === 'Stage 7 Developer Key',
      `Prefix: ${fetchedKey?.key_prefix}`
    );

    const webhookId = 'wh_stage7_' + Date.now();
    await mongoWebhookRepository.createWebhook({
      id: webhookId,
      user_id: testUserId,
      name: 'Stage 7 Webhook',
      url: 'https://webhook.site/test-stage7',
      secret: 'whsec_stage7_secret',
      events: ['download.completed', 'download.failed'],
      is_active: true
    });
    const fetchedWebhook = await mongoWebhookRepository.findWebhookByIdAndUserId(webhookId, testUserId);
    recordTest(
      'Webhook Registration & Secret Storage',
      fetchedWebhook && fetchedWebhook.secret === 'whsec_stage7_secret',
      `Events: ${fetchedWebhook?.events?.join(', ')}`
    );

    // 3.7 Subscriptions & Automatic Expiration
    const subId = 'sub_stage7_' + Date.now();
    const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
    await mongoSubscriptionRepository.createSubscription({
      id: subId,
      user_id: testUserId,
      plan_id: 'plan_pro',
      plan_slug: 'pro',
      billing_period: 'monthly',
      starts_at: new Date(Date.now() - 30 * 86400000),
      expires_at: pastDate,
      status: 'active'
    });
    await mongoUserRepository.updatePlan(testUserId, 'pro');

    // Run expiration check
    const { checkAndExpireSubscriptions } = await import('../src/db/index.js');
    await checkAndExpireSubscriptions();

    const expiredSub = await mongoSubscriptionRepository._getSubsColl().findOne({ _id: subId });
    const revertedUser = await mongoUserRepository.findById(testUserId);
    recordTest(
      'Subscription Expiration & Tier Reversion',
      expiredSub && expiredSub.status === 'expired' && revertedUser.plan === 'free',
      `Sub status: ${expiredSub?.status}, User plan: ${revertedUser.plan}`
    );

    // ------------------------------------------------------------------------
    // SECTION 4: SIMULATED SERVER RESTART & PERSISTENCE VALIDATION
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 4: Process Restart & Data Parity Simulation ---');

    // Disconnect and reconnect to simulate cold boot
    await mongoModule.disconnectMongo();
    await mongoModule.connectMongo(testUri, { dbName: TEST_DB_NAME });

    const persistedUser = await mongoUserRepository.findById(testUserId);
    const persistedJob = await mongoQueueRepository.findById(jobId);
    const persistedHistory = await mongoHistoryRepository.findByUserId(testUserId, 10, 0);

    const restartSuccess = (
      persistedUser &&
      persistedUser.email === 'stage7_user@streamvault.io' &&
      persistedJob &&
      persistedJob.status === 'completed' &&
      persistedHistory.length === 1
    );

    recordTest(
      'Cold Restart Data Persistence',
      restartSuccess,
      'All records safely retained across full connection disconnect and reconnect'
    );

    // Verify zero SQLite files created during tests
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir);
      const residualDb = files.some(f => f.startsWith('streamvault.db'));
      recordTest(
        'Zero SQLite Residuals Post-Execution',
        !residualDb,
        residualDb ? 'WARNING: streamvault.db was re-created!' : 'server/data/ remains 100% SQLite-free'
      );
    } else {
      recordTest('Zero SQLite Residuals Post-Execution', true, 'data/ directory was not created');
    }

    // ------------------------------------------------------------------------
    // SECTION 5: CLEANUP TEST DATABASE
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 5: Test Database Teardown ---');
    await testDb.dropDatabase();
    await mongoModule.disconnectMongo();
    await testClient.close();
    recordTest('Isolated Test Database Teardown', true, `Dropped ${TEST_DB_NAME}`);

  } catch (error) {
    console.error('❌ Critical Test Error:', error);
    recordTest('Critical Test Execution Error', false, error.message);
  } finally {
    if (testClient) {
      try { await testClient.close(); } catch {}
    }
  }

  // ------------------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------------------
  console.log('\n' + '='.repeat(75));
  console.log('STAGE 7 VERIFICATION RESULTS SUMMARY:');
  console.log('='.repeat(75));
  console.table(results);

  const totalPassed = results.filter(r => r.passed).length;
  const totalFailed = results.filter(r => !r.passed).length;
  console.log(`\nTotal Tests: ${results.length} | Passed: ${totalPassed} | Failed: ${totalFailed}`);

  if (totalFailed > 0) {
    console.error('❌ STAGE 7 VERIFICATION FAILED: One or more assertions did not pass.');
    process.exit(1);
  } else {
    console.log('🎉 STAGE 7 PASS — STREAMVAULT IS 100% MONGODB-POWERED.');
    process.exit(0);
  }
}

runStage7Tests();
