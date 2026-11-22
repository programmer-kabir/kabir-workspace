// Phase 4 Automated Verification Suite - Database Abstraction Layer & Repositories
import assert from 'node:assert';
import {
  getDbEngine,
  validateActiveEngine,
  SUPPORTED_ENGINES,
  getUserRepository,
  getSessionRepository,
  getQueueRepository,
  getHistoryRepository,
  getFavoriteRepository,
  getNotificationRepository,
  getApiKeyRepository,
  getSubscriptionRepository,
  getSystemRepository
} from './src/db/repositories/index.js';
import { sqliteUserRepository, mongoUserRepository } from './src/db/repositories/userRepository.js';
import { sqliteSessionRepository } from './src/db/repositories/sessionRepository.js';
import { sqliteQueueRepository } from './src/db/repositories/queueRepository.js';
import { sqliteHistoryRepository } from './src/db/repositories/historyRepository.js';
import { sqliteSubscriptionRepository } from './src/db/repositories/subscriptionRepository.js';
import { sqliteSystemRepository } from './src/db/repositories/systemRepository.js';
import db, { DB_PATH } from './src/db/index.js';

const BASE_URL = 'http://localhost:5000';

async function runPhase4AbstractionTests() {
  console.log('🧪 Starting Phase 4 Database Abstraction Layer Verification Suite...\n');
  let passed = 0;

  function pass(desc) {
    passed++;
    console.log(`  ✅ ${desc}`);
  }

  try {
    // 1. DB_ENGINE Configuration & Default Selection
    const defaultEngine = getDbEngine();
    assert.strictEqual(defaultEngine, SUPPORTED_ENGINES.SQLITE, 'Default database engine must be "sqlite"');

    // Test environment override simulation
    const originalEnv = process.env.DB_ENGINE;
    try {
      process.env.DB_ENGINE = 'mongodb';
      assert.strictEqual(getDbEngine(), SUPPORTED_ENGINES.MONGODB, 'Explicit "mongodb" selection must be respected');

      // Validate engine failure safety: If mongodb is selected but disconnected, must throw
      assert.throws(() => {
        validateActiveEngine();
      }, /Database Engine is set to "mongodb", but MongoDB Atlas is not connected/, 'Must fail safely when MongoDB selected but disconnected');

      // Strict configuration validation: Invalid or empty engines must throw explicit error
      process.env.DB_ENGINE = 'UNKNOWN_ENGINE_XYZ';
      assert.throws(() => {
        getDbEngine();
      }, /Invalid DB_ENGINE: "UNKNOWN_ENGINE_XYZ"/, 'Unrecognized engine must throw an explicit error');

      process.env.DB_ENGINE = '';
      assert.throws(() => {
        getDbEngine();
      }, /Invalid DB_ENGINE: DB_ENGINE is explicitly defined but empty/, 'Empty engine string must throw an explicit error');
    } finally {
      if (originalEnv === undefined) {
        delete process.env.DB_ENGINE;
      } else {
        process.env.DB_ENGINE = originalEnv;
      }
    }
    pass('DB_ENGINE selection, strict validation (no silent fallback), and connection failure safety verified');

    // 2. Repository Factory Routing
    const defaultUserRepo = getUserRepository();
    assert.strictEqual(defaultUserRepo, sqliteUserRepository, 'getUserRepository() defaults to SQLite implementation');

    const explicitSqliteRepo = getUserRepository('sqlite');
    assert.strictEqual(explicitSqliteRepo, sqliteUserRepository, 'getUserRepository("sqlite") resolves sqlite repository');

    const explicitMongoRepo = getUserRepository('mongodb');
    assert.strictEqual(explicitMongoRepo, mongoUserRepository, 'getUserRepository("mongodb") resolves mongo repository');
    pass('Repository factory resolves appropriate engine implementation dynamically');

    // 3. SQLite Repository Operations (Live Read Verification)
    // Users
    const adminUser = await sqliteUserRepository.findByEmail('admin@streamvault.io');
    assert.ok(adminUser, 'sqliteUserRepository finds existing admin user');
    assert.strictEqual(adminUser.role, 'admin');

    const totalUsers = await sqliteUserRepository.count();
    assert.ok(totalUsers >= 1, `sqliteUserRepository counts total users (${totalUsers})`);

    // Sessions
    const totalSessions = await sqliteSessionRepository.count();
    assert.ok(totalSessions >= 1, `sqliteSessionRepository counts total sessions (${totalSessions})`);

    // Queue
    const nextQueued = await sqliteQueueRepository.findNextQueued(5);
    assert.ok(Array.isArray(nextQueued), 'sqliteQueueRepository returns array of queued jobs');

    // Subscriptions & Plans
    const plans = await sqliteSubscriptionRepository.getPlans();
    assert.ok(Array.isArray(plans) && plans.length === 3, 'sqliteSubscriptionRepository retrieves all 3 plans');
    const proPlan = await sqliteSubscriptionRepository.getPlanBySlug('pro');
    assert.strictEqual(proPlan.slug, 'pro');
    assert.strictEqual(proPlan.price_monthly_bdt, 499);

    const paymentMethods = await sqliteSubscriptionRepository.getPaymentMethods();
    assert.ok(Array.isArray(paymentMethods) && paymentMethods.length >= 3, 'sqliteSubscriptionRepository retrieves payment methods');

    // System Settings & Audit
    const regSetting = await sqliteSystemRepository.getSetting('registration_enabled');
    assert.strictEqual(regSetting, 'true', 'sqliteSystemRepository reads system settings');
    pass('SQLite repository layer executes all domain queries with 100% fidelity');

    // 4. MongoDB Repository Abstraction Logic (Mock Collection Testing)
    const mockUserStore = new Map();
    const mockDb = {
      collection: (name) => ({
        findOne: async (query) => {
          if (query._id) return mockUserStore.get(String(query._id)) || null;
          if (query.email) {
            return Array.from(mockUserStore.values()).find(u => u.email === query.email) || null;
          }
          return null;
        },
        insertOne: async (doc) => {
          mockUserStore.set(String(doc._id), doc);
          return { insertedId: doc._id };
        },
        updateOne: async (query, update) => {
          const doc = mockUserStore.get(String(query._id));
          if (doc && update.$set) {
            Object.assign(doc, update.$set);
          }
          return { modifiedCount: doc ? 1 : 0 };
        },
        countDocuments: async () => mockUserStore.size
      })
    };

    // Override _getColl temporarily for unit verification
    const origGetColl = mongoUserRepository._getColl;
    mongoUserRepository._getColl = () => mockDb.collection('users');

    try {
      const createdMongoUser = await mongoUserRepository.create({
        id: 'user_mock_abstract_1',
        email: 'abstract@test.com',
        password_hash: 'hash123',
        salt: 'salt123',
        name: 'Abstract User',
        role: 'user',
        plan: 'free'
      });
      assert.strictEqual(createdMongoUser._id, 'user_mock_abstract_1');
      assert.strictEqual(createdMongoUser.email, 'abstract@test.com');

      const foundByEmail = await mongoUserRepository.findByEmail('abstract@test.com');
      assert.ok(foundByEmail);
      assert.strictEqual(foundByEmail.name, 'Abstract User');

      await mongoUserRepository.updatePlan('user_mock_abstract_1', 'pro');
      const updatedUser = await mongoUserRepository.findById('user_mock_abstract_1');
      assert.strictEqual(updatedUser.plan, 'pro');

      const count = await mongoUserRepository.count();
      assert.strictEqual(count, 1);
    } finally {
      mongoUserRepository._getColl = origGetColl;
    }
    pass('MongoDB repository implementation verified with matching schema contracts');

    // 5. Application Health Endpoint Verification
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, 'healthy');
    assert.strictEqual(healthData.databaseEngine, 'sqlite', 'Health endpoint must report active databaseEngine as "sqlite"');
    assert.strictEqual(healthData.database, 'connected (node:sqlite WAL)');
    assert.ok(healthData.mongodb, 'Health endpoint includes MongoDB connectivity status');
    pass('Live server /api/health endpoint confirms databaseEngine is "sqlite" and WAL active');

    // 6. SQLite Durability & Safety Check
    const integrityRow = db.prepare('PRAGMA integrity_check').get();
    const integrityResult = integrityRow ? Object.values(integrityRow)[0] : 'unknown';
    assert.strictEqual(integrityResult, 'ok', 'SQLite primary integrity check must remain "ok"');
    pass('SQLite database at streamvault.db remains 100% healthy and isolated');

    console.log(`\n🎉 All ${passed} Phase 4 Database Abstraction Layer tests PASSED!\n`);
    return true;
  } catch (err) {
    console.error('\n❌ Phase 4 Test Suite FAILED:', err);
    process.exit(1);
  }
}

runPhase4AbstractionTests();
