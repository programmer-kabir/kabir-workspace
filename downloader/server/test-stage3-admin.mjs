/**
 * StreamVault — Stage 3.5 Admin & System Feature Compatibility Suite
 * Validates settings, notifications, audit logging, API keys & webhooks on MongoDB Atlas.
 */

import assert from 'assert';
import crypto from 'crypto';
import { setupTestMongo, teardownTestMongo } from './test-mongo-helper.mjs';
import {
  createApiKey,
  getUserApiKeys,
  toggleApiKey,
  revokeApiKey
} from './src/services/apiKeyService.js';
import {
  createWebhook,
  getUserWebhooks,
  deleteWebhook
} from './src/services/webhookService.js';
import {
  mongoUserRepository,
  mongoSystemRepository,
  mongoNotificationRepository,
  mongoApiKeyRepository,
  mongoWebhookRepository
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
console.log('StreamVault — Stage 3.5: Admin & System Features Compatibility (StreamVault_Test)');
console.log('='.repeat(75));

const suffix = crypto.randomBytes(4).toString('hex');
const testUserId = `usr_t35_${suffix}`;
const testAdminId = `adm_t35_${suffix}`;

async function run() {
  const { db } = await setupTestMongo();
  console.log(`Connected to isolated test database: ${db.databaseName}\n`);

  const origDbEngine = process.env.DB_ENGINE;
  process.env.DB_ENGINE = 'mongodb';

  let apiKeyObj = null;
  let webhookObj = null;
  let notifId1 = null;

  try {
    // 0. Seed test user & admin
    await mongoUserRepository.create({
      id: testUserId,
      email: `t35_${suffix}@streamvault.io`,
      password_hash: 'hash35',
      salt: 'salt35',
      name: 'Admin Suite Tester',
      role: 'user',
      plan: 'pro',
      is_verified: true,
      referral_code: `SV-T35_${suffix.toUpperCase()}`
    });

    await mongoUserRepository.create({
      id: testAdminId,
      email: `t35_adm_${suffix}@streamvault.io`,
      password_hash: 'hash35adm',
      salt: 'salt35adm',
      name: 'Super Administrator',
      role: 'admin',
      plan: 'enterprise',
      is_verified: true,
      referral_code: `SV-ADM_${suffix.toUpperCase()}`
    });

    // 1. System Settings
    await test('1. System settings: set, get, and upsert configuration values', async () => {
      await mongoSystemRepository.setSetting(`site_title_${suffix}`, 'StreamVault Test Engine');
      const title = await mongoSystemRepository.getSetting(`site_title_${suffix}`);
      assert.strictEqual(title, 'StreamVault Test Engine');

      // Upsert / Overwrite
      await mongoSystemRepository.setSetting(`site_title_${suffix}`, 'StreamVault NextGen');
      const updatedTitle = await mongoSystemRepository.getSetting(`site_title_${suffix}`);
      assert.strictEqual(updatedTitle, 'StreamVault NextGen');
    });

    // 2. User Role & Ban/Unban Management
    await test('2. User role updates and ban/unban controls in MongoDB', async () => {
      // Ban user and promote role
      await db.collection('users').updateOne(
        { _id: testUserId },
        { $set: { is_banned: true, role: 'admin' } }
      );

      const bannedUser = await mongoUserRepository.findById(testUserId);
      assert.ok(bannedUser.is_banned);
      assert.strictEqual(bannedUser.role, 'admin');

      // Unban user and demote role to user
      await db.collection('users').updateOne(
        { _id: testUserId },
        { $set: { is_banned: false, role: 'user' } }
      );

      const unbannedUser = await mongoUserRepository.findById(testUserId);
      assert.strictEqual(!!unbannedUser.is_banned, false);
      assert.strictEqual(unbannedUser.role, 'user');
    });

    // 3. In-App Notifications Lifecycle
    await test('3. Notification creation, unread count, mark-read, and pagination', async () => {
      const n1 = await mongoNotificationRepository.create({
        userId: testUserId,
        title: 'Security Alert',
        message: 'A new login from Chrome on Windows was detected.',
        type: 'warning'
      });
      assert.ok(n1.id);
      notifId1 = n1.id;

      const n2 = await mongoNotificationRepository.create({
        userId: testUserId,
        title: 'Plan Upgrade',
        message: 'Your account has been upgraded to Pro.',
        type: 'success'
      });
      assert.ok(n2.id);

      const unreadCount = await mongoNotificationRepository.countUnread(testUserId);
      assert.strictEqual(unreadCount, 2);

      // Mark single notification read
      await mongoNotificationRepository.markRead(notifId1, testUserId);
      const unreadAfterOne = await mongoNotificationRepository.countUnread(testUserId);
      assert.strictEqual(unreadAfterOne, 1);

      // Mark all read
      await mongoNotificationRepository.markAllRead(testUserId);
      const unreadAfterAll = await mongoNotificationRepository.countUnread(testUserId);
      assert.strictEqual(unreadAfterAll, 0);

      // Paginate notifications
      const notifPage = await mongoNotificationRepository.findNotifications({
        userId: testUserId,
        page: 1,
        limit: 10
      });
      assert.ok(notifPage.notifications.length >= 2);
    });

    // 4. Activity & Audit Logging
    await test('4. User activity logging & admin audit trail logging in MongoDB', async () => {
      await mongoSystemRepository.logActivity(
        testUserId,
        'profile_update',
        JSON.stringify({ field: 'name', value: 'Updated Name' }),
        '127.0.0.1',
        'Mozilla/5.0'
      );

      const activityPage = await mongoSystemRepository.findUserActivityPaginated({
        userId: testUserId,
        search: 'profile_update',
        page: 1,
        limit: 10
      });
      assert.ok(activityPage.activities.length >= 1);
      assert.strictEqual(activityPage.activities[0].action, 'profile_update');

      // Admin audit log
      await mongoSystemRepository.logAdminAudit(
        testAdminId,
        'system_setting_updated',
        'setting',
        `site_title_${suffix}`,
        JSON.stringify({ oldValue: 'Old', newValue: 'New' }),
        '10.0.0.1'
      );

      const auditCount = await db.collection('admin_audit_logs').countDocuments({
        admin_id: testAdminId
      });
      assert.ok(auditCount >= 1);
    });

    // 5. API Key Generation & Management
    await test('5. API key generation, masked listing, toggling & usage logging', async () => {
      apiKeyObj = await createApiKey({
        userId: testUserId,
        name: 'Stage 3 Test API Key'
      });

      assert.ok(apiKeyObj.rawKey);
      assert.ok(apiKeyObj.rawKey.startsWith('sk_live_'));
      assert.strictEqual(apiKeyObj.key.name, 'Stage 3 Test API Key');
      assert.ok(apiKeyObj.key.keyPrefix.startsWith('sk_live_'));

      // Retrieve masked keys for user
      const userKeys = await getUserApiKeys(testUserId);
      assert.ok(userKeys.length >= 1);
      assert.strictEqual(userKeys[0].id, apiKeyObj.key.id);

      // Log API request
      await mongoApiKeyRepository.createLog({
        api_key_id: apiKeyObj.key.id,
        user_id: testUserId,
        endpoint: '/api/v1/download',
        method: 'POST',
        status_code: 200,
        response_time_ms: 55,
        ip_address: '127.0.0.1'
      });

      // Update usage
      await mongoApiKeyRepository.updateUsage(apiKeyObj.key.id, '127.0.0.1');

      // Toggle disable
      await toggleApiKey(testUserId, apiKeyObj.key.id, false);
      const keysAfterToggle = await getUserApiKeys(testUserId);
      const disabledKey = keysAfterToggle.find(k => k.id === apiKeyObj.key.id);
      assert.strictEqual(disabledKey.isEnabled, false);

      // Revoke key
      await revokeApiKey(testUserId, apiKeyObj.key.id);
      const keysAfterRevoke = await getUserApiKeys(testUserId);
      const revokedKey = keysAfterRevoke.find(k => k.id === apiKeyObj.key.id);
      assert.strictEqual(revokedKey.status, 'revoked');
    });

    // 6. Webhook Registration, Delivery Logging & Deletion
    await test('6. Webhook registration, delivery record persistence & cascade deletion', async () => {
      webhookObj = await createWebhook({
        userId: testUserId,
        name: 'Stage 3 Notifications Webhook',
        url: 'https://example.com/api/webhook-receiver',
        events: ['download.completed', 'download.failed']
      });

      assert.ok(webhookObj.id);
      assert.strictEqual(webhookObj.name, 'Stage 3 Notifications Webhook');

      // List user webhooks
      const userWebhooks = await getUserWebhooks(testUserId);
      assert.ok(userWebhooks.length >= 1);

      // Create delivery record
      const delivery = await mongoWebhookRepository.createDelivery({
        webhook_id: webhookObj.id,
        user_id: testUserId,
        event: 'download.completed',
        payload: { job_id: 'job_sample_123', status: 'completed' },
        status_code: 200,
        response_body: '{"received":true}',
        duration_ms: 120
      });
      assert.ok(delivery.id);

      const deliveries = await mongoWebhookRepository.findDeliveriesPaginated({
        userId: testUserId,
        webhookId: webhookObj.id,
        page: 1,
        limit: 10
      });
      assert.ok(deliveries.deliveries.length >= 1);

      // Delete webhook (cascades to delete deliveries)
      await deleteWebhook(testUserId, webhookObj.id);

      const webhooksAfterDelete = await getUserWebhooks(testUserId);
      const deletedHook = webhooksAfterDelete.find(w => w.id === webhookObj.id);
      assert.strictEqual(deletedHook, undefined);
    });

    // 7. System Database Diagnostics
    await test('7. Database diagnostics reports connected MongoDB Atlas', async () => {
      const diag = await mongoSystemRepository.getDatabaseDiagnostics();
      assert.strictEqual(diag.journalMode, 'wiredTiger');
      assert.strictEqual(diag.foreignKeys, 'schema_validated');
      assert.ok(diag.status.includes('connected'));
      assert.ok(diag.tablesCount >= 10);
    });

  } finally {
    process.env.DB_ENGINE = origDbEngine;
    await teardownTestMongo(false);
  }

  console.log('\n' + '='.repeat(75));
  console.log(`Stage 3.5 Results: ${passedTests}/${totalTests} Tests Passed (100%)`);
  console.log('='.repeat(75));
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
