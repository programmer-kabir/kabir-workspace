/**
 * StreamVault — Stage 4 Test Database Isolation & Server Harness Helper
 * Connects exclusively to 'StreamVault_Stage4_Test' on MongoDB Atlas.
 * Guarantees zero writes to production 'StreamVault' database.
 */

import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { getMongoConfig, setMongoDb } from '../src/db/mongo.js';
import { initMongoCollectionsAndIndexes, SCHEMA_DEFINITIONS, COLLECTIONS } from '../src/db/mongoSchemas.js';
import { hashPassword } from '../src/utils/crypto.js';

// Route imports
import authRoutes from '../src/routes/authRoutes.js';
import queueRoutes from '../src/routes/queueRoutes.js';
import userRoutes from '../src/routes/userRoutes.js';
import historyRoutes from '../src/routes/historyRoutes.js';
import favoriteRoutes from '../src/routes/favoriteRoutes.js';
import notificationRoutes from '../src/routes/notificationRoutes.js';
import apiV1Routes from '../src/routes/apiV1Routes.js';
import developerRoutes from '../src/routes/developerRoutes.js';
import subscriptionRoutes from '../src/routes/subscriptionRoutes.js';
import adminPaymentRoutes from '../src/routes/adminPaymentRoutes.js';
import adminSystemRoutes from '../src/routes/adminSystemRoutes.js';
import { getDbEngine } from '../src/db/repositories/index.js';
import { isMongoConnected } from '../src/db/mongo.js';

export const TEST_DB_NAME = 'StreamVault_Stage4_Test';
let testClient = null;
let testDb = null;

export async function setupStage4Mongo() {
  const config = getMongoConfig();
  if (!config.uri) {
    throw new Error('MONGODB_URI is not configured in environment. Cannot run Stage 4 tests.');
  }

  // Strict safety check: Never target production
  if (TEST_DB_NAME === 'StreamVault' || TEST_DB_NAME.toLowerCase() === 'streamvault') {
    throw new Error('FATAL SAFETY VIOLATION: Test database name cannot be production StreamVault!');
  }

  if (testClient && testDb) {
    setMongoDb(testDb, testClient);
    return { client: testClient, db: testDb };
  }

  testClient = new MongoClient(config.uri, {
    ...config.options,
    maxIdleTimeMS: 30000,
    retryReads: true,
    retryWrites: true
  });
  testClient.on('error', () => {});
  await testClient.connect();
  testDb = testClient.db(TEST_DB_NAME);
  testDb.client = testClient;

  // Initialize schema validators and indexes on StreamVault_Stage4_Test if not present
  const existingCols = await testDb.listCollections().toArray();
  if (existingCols.length < 10) {
    console.log(`[STAGE4-INIT] Initializing schema validators and indexes on ${TEST_DB_NAME}...`);
    await initMongoCollectionsAndIndexes(testDb);
    console.log(`[STAGE4-INIT] Schema validators and indexes initialized.`);
  }

  // Seed baseline subscription plans if not exists
  const plansCol = testDb.collection(COLLECTIONS.SUBSCRIPTION_PLANS);
  const planCount = await plansCol.countDocuments();
  if (planCount === 0) {
    const now = new Date();
    await plansCol.insertMany([
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
        features: ['1080p Video Downloads', '320kbps MP3 Audio', '15 Downloads/Day'],
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
        features: ['4K Ultra HD', 'Priority Queue', '150 Downloads/Day'],
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        _id: 'plan_enterprise',
        name: 'Enterprise Master',
        slug: 'enterprise',
        price_monthly_bdt: 1499,
        price_yearly_bdt: 14990,
        daily_download_quota: 5000,
        monthly_download_quota: 50000,
        api_rpm: 600,
        api_monthly_quota: 500000,
        max_concurrent_jobs: 10,
        features: ['Unlimited 8K Media', 'Immediate Priority', '5000 Downloads/Day'],
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ]);
  }

  // Seed baseline payment methods if not exists
  const pmCol = testDb.collection(COLLECTIONS.PAYMENT_METHODS);
  const pmCount = await pmCol.countDocuments();
  if (pmCount === 0) {
    const now = new Date();
    await pmCol.insertMany([
      {
        _id: 'pm_bkash',
        name: 'bKash',
        identifier: 'bkash',
        account_number: '01712345678',
        account_type: 'Personal',
        instructions: 'Send money to bKash Personal Number: 01712345678 and enter TrxID.',
        is_enabled: true,
        created_at: now,
        updated_at: now
      },
      {
        _id: 'pm_nagad',
        name: 'Nagad',
        identifier: 'nagad',
        account_number: '01812345678',
        account_type: 'Personal',
        instructions: 'Send money to Nagad Personal Number: 01812345678 and enter TrxID.',
        is_enabled: true,
        created_at: now,
        updated_at: now
      }
    ]);
  }

  // Seed default system settings if not exists
  const settingsCol = testDb.collection(COLLECTIONS.SYSTEM_SETTINGS);
  const settingsCount = await settingsCol.countDocuments();
  if (settingsCount === 0) {
    const now = new Date();
    await settingsCol.insertMany([
      { _id: 'maintenance_mode', key: 'maintenance_mode', value: 'false', updated_at: now },
      { _id: 'registration_enabled', key: 'registration_enabled', value: 'true', updated_at: now },
      { _id: 'global_rate_limit', key: 'global_rate_limit', value: '60', updated_at: now },
      { _id: 'max_concurrent_jobs', key: 'max_concurrent_jobs', value: '3', updated_at: now },
      { _id: 'platform_youtube_enabled', key: 'platform_youtube_enabled', value: 'true', updated_at: now },
      { _id: 'platform_tiktok_enabled', key: 'platform_tiktok_enabled', value: 'true', updated_at: now }
    ]);
  }

  // Seed test superadmin if not exists
  const usersCol = testDb.collection(COLLECTIONS.USERS);
  const adminUser = await usersCol.findOne({ email: 'admin@stage4test.io' });
  if (!adminUser) {
    const { hash, salt } = hashPassword('AdminStage4Password123!');
    const now = new Date();
    await usersCol.insertOne({
      _id: 'admin_stage4_test_id',
      email: 'admin@stage4test.io',
      password_hash: hash,
      salt: salt,
      name: 'Stage4 Master Admin',
      role: 'admin',
      plan: 'enterprise',
      is_verified: true,
      is_banned: false,
      two_factor_enabled: false,
      created_at: now,
      updated_at: now
    });
  }

  // Point repository layer MongoDB instance to StreamVault_Stage4_Test
  setMongoDb(testDb, testClient);

  return { client: testClient, db: testDb };
}

/**
 * Creates an isolated Express server bound to StreamVault_Stage4_Test and DB_ENGINE=mongodb
 */
export async function createStage4TestServer() {
  await setupStage4Mongo();

  // Set environment engine to mongodb for this test process
  const originalEngine = process.env.DB_ENGINE;
  process.env.DB_ENGINE = 'mongodb';

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Mount API routes
  app.use('/api/v1', apiV1Routes);
  app.use('/api/auth', authRoutes);
  app.use('/api/queue', queueRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/favorites', favoriteRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/developer', developerRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/admin/payments', adminPaymentRoutes);
  app.use('/api/admin/system', adminSystemRoutes);

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      databaseEngine: getDbEngine(),
      mongodb: isMongoConnected() ? 'connected' : 'disconnected',
      testDb: TEST_DB_NAME,
      timestamp: new Date().toISOString()
    });
  });

  // Listen on ephemeral port (0)
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => {
      resolve(s);
    });
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const close = async () => {
    process.env.DB_ENGINE = originalEngine;
    await new Promise((resolve) => server.close(resolve));
  };

  return { app, server, baseUrl, close };
}

export async function teardownStage4Mongo(drop = false) {
  if (testClient && testDb) {
    if (drop) {
      try {
        await testDb.dropDatabase();
        console.log(`[STAGE4-TEARDOWN] Dropped isolated test database: ${TEST_DB_NAME}`);
      } catch (err) {
        console.error(`[STAGE4-TEARDOWN] Error dropping ${TEST_DB_NAME}:`, err.message);
      }
    }
    await testClient.close();
    testClient = null;
    testDb = null;
    setMongoDb(null, null);
  }
}
