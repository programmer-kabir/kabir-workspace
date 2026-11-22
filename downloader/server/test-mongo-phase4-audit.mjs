// Phase 4 Final Verification & Gap Audit Automated Test Suite
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

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
  getSystemRepository,
  getWebhookRepository,
  userRepository,
  sessionRepository,
  queueRepository,
  historyRepository,
  favoriteRepository,
  notificationRepository,
  apiKeyRepository,
  subscriptionRepository,
  systemRepository,
  webhookRepository
} from './src/db/repositories/index.js';

import { sqliteUserRepository, mongoUserRepository } from './src/db/repositories/userRepository.js';
import { sqliteSessionRepository, mongoSessionRepository } from './src/db/repositories/sessionRepository.js';
import { sqliteQueueRepository, mongoQueueRepository } from './src/db/repositories/queueRepository.js';
import { sqliteHistoryRepository, mongoHistoryRepository } from './src/db/repositories/historyRepository.js';
import { sqliteFavoriteRepository, mongoFavoriteRepository } from './src/db/repositories/favoriteRepository.js';
import { sqliteNotificationRepository, mongoNotificationRepository } from './src/db/repositories/notificationRepository.js';
import { sqliteApiKeyRepository, mongoApiKeyRepository } from './src/db/repositories/apiKeyRepository.js';
import { sqliteSubscriptionRepository, mongoSubscriptionRepository } from './src/db/repositories/subscriptionRepository.js';
import { sqliteSystemRepository, mongoSystemRepository } from './src/db/repositories/systemRepository.js';
import { sqliteWebhookRepository, mongoWebhookRepository } from './src/db/repositories/webhookRepository.js';

const BASE_URL = 'http://localhost:5000';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runAuditTests() {
  console.log('🧪 Starting Phase 4 Final Verification & Gap Audit Test Suite...\n');
  let testCount = 0;
  let passCount = 0;

  function test(name, fn) {
    testCount++;
    try {
      fn();
      passCount++;
      console.log(`  ✅ [PASS] ${name}`);
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  async function testAsync(name, fn) {
    testCount++;
    try {
      await fn();
      passCount++;
      console.log(`  ✅ [PASS] ${name}`);
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
      throw err;
    }
  }

  // ==========================================
  // Section 1: Configuration Validation Audit
  // ==========================================
  console.log('--- 1. Configuration Validation ---');
  const originalDbEngine = process.env.DB_ENGINE;

  test('Config: Unset DB_ENGINE defaults to "sqlite"', () => {
    delete process.env.DB_ENGINE;
    assert.strictEqual(getDbEngine(), SUPPORTED_ENGINES.SQLITE);
  });

  test('Config: Explicit "sqlite" selects "sqlite"', () => {
    process.env.DB_ENGINE = 'sqlite';
    assert.strictEqual(getDbEngine(), SUPPORTED_ENGINES.SQLITE);
    process.env.DB_ENGINE = '  SQLITE  ';
    assert.strictEqual(getDbEngine(), SUPPORTED_ENGINES.SQLITE);
  });

  test('Config: Explicit "mongodb" selects "mongodb"', () => {
    process.env.DB_ENGINE = 'mongodb';
    assert.strictEqual(getDbEngine(), SUPPORTED_ENGINES.MONGODB);
    process.env.DB_ENGINE = '  MongoDB  ';
    assert.strictEqual(getDbEngine(), SUPPORTED_ENGINES.MONGODB);
  });

  test('Config: Explicit empty string throws explicit error (no silent fallback)', () => {
    process.env.DB_ENGINE = '';
    assert.throws(() => getDbEngine(), /Invalid DB_ENGINE: DB_ENGINE is explicitly defined but empty/);
    process.env.DB_ENGINE = '   ';
    assert.throws(() => getDbEngine(), /Invalid DB_ENGINE: DB_ENGINE is explicitly defined but empty/);
  });

  test('Config: Explicit invalid values (postgres, mysql, invalid) throw explicit error', () => {
    process.env.DB_ENGINE = 'postgres';
    assert.throws(() => getDbEngine(), /Invalid DB_ENGINE: "postgres"/);
    process.env.DB_ENGINE = 'mysql';
    assert.throws(() => getDbEngine(), /Invalid DB_ENGINE: "mysql"/);
    process.env.DB_ENGINE = 'invalid_engine';
    assert.throws(() => getDbEngine(), /Invalid DB_ENGINE: "invalid_engine"/);
  });

  test('Config: MongoDB selected but disconnected fails explicitly with no silent fallback', () => {
    process.env.DB_ENGINE = 'mongodb';
    assert.throws(() => {
      validateActiveEngine();
    }, /Database Engine is set to "mongodb", but MongoDB Atlas is not connected/);
  });

  // Restore DB_ENGINE
  if (originalDbEngine === undefined) {
    delete process.env.DB_ENGINE;
  } else {
    process.env.DB_ENGINE = originalDbEngine;
  }

  // ==========================================
  // Section 2: Repository CRUD & Interface Parity
  // ==========================================
  console.log('\n--- 2. Repository Interface & Entity Coverage ---');

  test('Parity: UserRepository method signatures match', () => {
    const methods = ['findById', 'findByEmail', 'create', 'updatePlan', 'updateName', 'setRole', 'count', 'createPasswordReset', 'findValidPasswordReset', 'markPasswordResetUsed'];
    for (const m of methods) {
      assert.strictEqual(typeof sqliteUserRepository[m], 'function', `sqliteUserRepository has ${m}`);
      assert.strictEqual(typeof mongoUserRepository[m], 'function', `mongoUserRepository has ${m}`);
    }
  });

  test('Parity: SessionRepository method signatures match', () => {
    const methods = ['findByTokenHash', 'create', 'findByUserId', 'deleteById', 'deleteByUserIdExcept', 'deleteExpired', 'count'];
    for (const m of methods) {
      assert.strictEqual(typeof sqliteSessionRepository[m], 'function', `sqliteSessionRepository has ${m}`);
      assert.strictEqual(typeof mongoSessionRepository[m], 'function', `mongoSessionRepository has ${m}`);
    }
  });

  test('Parity: QueueRepository method signatures match', () => {
    const methods = ['create', 'findById', 'findDuplicate', 'findNextQueued', 'findStaleProcessing', 'findByUserId', 'updateStatus', 'updateProgress', 'countActiveUserJobs'];
    for (const m of methods) {
      assert.strictEqual(typeof sqliteQueueRepository[m], 'function', `sqliteQueueRepository has ${m}`);
      assert.strictEqual(typeof mongoQueueRepository[m], 'function', `mongoQueueRepository has ${m}`);
    }
  });

  test('Parity: HistoryRepository method signatures match', () => {
    const methods = ['create', 'findByUserId', 'countSince', 'deleteById'];
    for (const m of methods) {
      assert.strictEqual(typeof sqliteHistoryRepository[m], 'function', `sqliteHistoryRepository has ${m}`);
      assert.strictEqual(typeof mongoHistoryRepository[m], 'function', `mongoHistoryRepository has ${m}`);
    }
  });

  test('Parity: FavoriteRepository method signatures match', () => {
    const methods = ['create', 'findByUserId', 'findByUserAndUrl', 'deleteById'];
    for (const m of methods) {
      assert.strictEqual(typeof sqliteFavoriteRepository[m], 'function', `sqliteFavoriteRepository has ${m}`);
      assert.strictEqual(typeof mongoFavoriteRepository[m], 'function', `mongoFavoriteRepository has ${m}`);
    }
  });

  test('Parity: NotificationRepository method signatures match', () => {
    const methods = ['create', 'findByUserId', 'countUnread', 'markRead', 'markAllRead'];
    for (const m of methods) {
      assert.strictEqual(typeof sqliteNotificationRepository[m], 'function', `sqliteNotificationRepository has ${m}`);
      assert.strictEqual(typeof mongoNotificationRepository[m], 'function', `mongoNotificationRepository has ${m}`);
    }
  });

  test('Parity: ApiKeyRepository method signatures match', () => {
    const methods = ['createKey', 'findByHash', 'findByUserId', 'updateUsage', 'createLog', 'getLogsByUserId'];
    for (const m of methods) {
      assert.strictEqual(typeof sqliteApiKeyRepository[m], 'function', `sqliteApiKeyRepository has ${m}`);
      assert.strictEqual(typeof mongoApiKeyRepository[m], 'function', `mongoApiKeyRepository has ${m}`);
    }
  });

  test('Parity: SubscriptionRepository method signatures match', () => {
    const methods = ['getPlans', 'getPlanBySlug', 'getPaymentMethods', 'createTransaction', 'findTransactionById', 'updateTransactionStatus', 'createSubscription', 'findActiveSubscription'];
    for (const m of methods) {
      assert.strictEqual(typeof sqliteSubscriptionRepository[m], 'function', `sqliteSubscriptionRepository has ${m}`);
      assert.strictEqual(typeof mongoSubscriptionRepository[m], 'function', `mongoSubscriptionRepository has ${m}`);
    }
  });

  test('Parity: SystemRepository method signatures match', () => {
    const methods = ['getSetting', 'setSetting', 'recordLogin', 'countFailedLoginsSince', 'findLastLoginSuccess', 'findLastLoginFailure', 'logActivity', 'logAdminAudit'];
    for (const m of methods) {
      assert.strictEqual(typeof sqliteSystemRepository[m], 'function', `sqliteSystemRepository has ${m}`);
      assert.strictEqual(typeof mongoSystemRepository[m], 'function', `mongoSystemRepository has ${m}`);
    }
  });

  test('Parity: WebhookRepository method signatures match', () => {
    const methods = ['createWebhook', 'findWebhookById', 'findWebhooksByUserId', 'countWebhooksByUserId', 'updateWebhook', 'deleteWebhook', 'findActiveWebhooksForEvent', 'createDelivery', 'getDeliveriesByWebhookId'];
    for (const m of methods) {
      assert.strictEqual(typeof sqliteWebhookRepository[m], 'function', `sqliteWebhookRepository has ${m}`);
      assert.strictEqual(typeof mongoWebhookRepository[m], 'function', `mongoWebhookRepository has ${m}`);
    }
  });

  // ==========================================
  // Section 3: Live SQLite Query Execution via Repositories
  // ==========================================
  console.log('\n--- 3. Live SQLite Repository Query Execution ---');

  await testAsync('Live SQLite: Admin user lookup & count', async () => {
    const admin = await userRepository.findByEmail('admin@streamvault.io');
    assert.ok(admin, 'Admin user must exist in SQLite');
    assert.strictEqual(admin.email, 'admin@streamvault.io');
    assert.strictEqual(admin.role, 'admin');

    const total = await userRepository.count();
    assert.ok(total >= 1, 'Total users count >= 1');
  });

  await testAsync('Live SQLite: Subscription plans & payment methods query', async () => {
    const plans = await subscriptionRepository.getPlans();
    assert.strictEqual(plans.length, 3, 'Must return 3 active subscription plans');
    const slugs = plans.map(p => p.slug).sort();
    assert.deepStrictEqual(slugs, ['enterprise', 'free', 'pro']);

    const methods = await subscriptionRepository.getPaymentMethods();
    assert.ok(methods.length >= 3, 'Must return active payment methods');
  });

  await testAsync('Live SQLite: Password reset repository query', async () => {
    const reset = await userRepository.findValidPasswordReset('non_existent_hash');
    assert.strictEqual(reset, null, 'Non-existent token hash returns null');
  });

  await testAsync('Live SQLite: Webhook repository query', async () => {
    const webhooks = await webhookRepository.findWebhooksByUserId('user_non_existent');
    assert.deepStrictEqual(webhooks, [], 'Non-existent user has empty webhooks array');
  });

  await testAsync('Live SQLite: System settings & audit lookup', async () => {
    const reg = await systemRepository.getSetting('registration_enabled');
    assert.strictEqual(reg, 'true');
    const failedLogins = await systemRepository.countFailedLoginsSince('admin@streamvault.io', new Date(0));
    assert.ok(typeof failedLogins === 'number');
  });

  // ==========================================
  // Section 4: Health Diagnostics
  // ==========================================
  console.log('\n--- 4. Live Server Health Diagnostics ---');

  await testAsync('Live Server: /api/health confirms SQLite active and WAL active', async () => {
    const { status, data } = await fetchJson(`${BASE_URL}/api/health`);
    assert.strictEqual(status, 200);
    assert.strictEqual(data.status, 'healthy');
    assert.strictEqual(data.databaseEngine, 'sqlite');
    assert.ok(data.database.includes('node:sqlite WAL'));
  });

  // ==========================================
  // Section 5: Physical Database Safety & Checksum
  // ==========================================
  console.log('\n--- 5. Physical SQLite Database Safety ---');

  test('Physical: streamvault.db integrity check passes and tables intact', () => {
    const dbPath = path.resolve(process.cwd(), 'server', 'data', 'streamvault.db');
    assert.ok(fs.existsSync(dbPath), 'Database file exists');

    const sqlite = new DatabaseSync(dbPath, { readOnly: true });
    const check = sqlite.prepare('PRAGMA integrity_check;').get();
    assert.strictEqual(check.integrity_check, 'ok');

    const count = sqlite.prepare('SELECT COUNT(*) as c FROM users').get().c;
    assert.ok(count > 0, 'Users table contains records');
    sqlite.close();
  });

  console.log(`\n🎉 All ${passCount}/${testCount} Phase 4 Audit Verification tests PASSED!\n`);
}

runAuditTests().catch(err => {
  console.error('\n❌ Audit test execution failed:', err);
  process.exit(1);
});
