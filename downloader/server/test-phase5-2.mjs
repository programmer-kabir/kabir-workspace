import assert from 'assert';
import { sqliteApiKeyRepository, mongoApiKeyRepository, getApiKeyRepository } from './src/db/repositories/apiKeyRepository.js';
import { sqliteWebhookRepository, mongoWebhookRepository, getWebhookRepository } from './src/db/repositories/webhookRepository.js';
import {
  createApiKey,
  getUserApiKeys,
  toggleApiKey,
  revokeApiKey,
  regenerateApiKey,
  deleteApiKey,
  validateApiKey
} from './src/services/apiKeyService.js';
import {
  createWebhook,
  getUserWebhooks,
  updateWebhook,
  deleteWebhook,
  getWebhookDeliveries,
  sendTestWebhook,
  retryWebhookDelivery,
  isSafeWebhookUrl
} from './src/services/webhookService.js';
import { getMongoDb } from './src/db/mongo.js';

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

console.log('\n--- Starting Phase 5.2 Verification Suite ---');

// 1. SSRF URL Protection
await test('SSRF Protection blocks localhost and private IPs', () => {
  assert.strictEqual(isSafeWebhookUrl('http://localhost:3000/webhook').safe, false);
  assert.strictEqual(isSafeWebhookUrl('http://127.0.0.1:8080/wh').safe, false);
  assert.strictEqual(isSafeWebhookUrl('http://10.0.0.5/api').safe, false);
  assert.strictEqual(isSafeWebhookUrl('http://192.168.1.1/webhook').safe, false);
  assert.strictEqual(isSafeWebhookUrl('http://169.254.169.254/metadata').safe, false);
  assert.strictEqual(isSafeWebhookUrl('ftp://example.com/wh').safe, false);
  assert.strictEqual(isSafeWebhookUrl('https://example.com/api/webhook').safe, true);
});

// 2. Dual Parity - API Key Repository interface check
await test('Dual Parity: sqliteApiKeyRepository & mongoApiKeyRepository have matching methods', () => {
  const methods = [
    'createKey', 'findByHash', 'findByUserId', 'updateUsage', 'createLog',
    'getLogsByUserId', 'countActiveKeysByUserId', 'findKeyByIdAndUserId',
    'toggleKeyStatus', 'revokeKey', 'deleteKey', 'regenerateKey',
    'getKeyUsageStats', 'getUserDeveloperStats', 'findLogsPaginated'
  ];
  for (const m of methods) {
    assert.strictEqual(typeof sqliteApiKeyRepository[m], 'function', `sqliteApiKeyRepository missing ${m}`);
    assert.strictEqual(typeof mongoApiKeyRepository[m], 'function', `mongoApiKeyRepository missing ${m}`);
  }
});

// 3. Dual Parity - Webhook Repository interface check
await test('Dual Parity: sqliteWebhookRepository & mongoWebhookRepository have matching methods', () => {
  const methods = [
    'createWebhook', 'findWebhookById', 'findWebhooksByUserId', 'countWebhooksByUserId',
    'updateWebhook', 'deleteWebhook', 'findActiveWebhooksForEvent', 'createDelivery',
    'getDeliveriesByWebhookId', 'findWebhookByIdAndUserId', 'findActiveWebhooksByUserId',
    'findDeliveriesPaginated', 'findDeliveryByIdAndUserId', 'incrementDeliveryAttempt',
    'createDeliveryRecord', 'updateDeliveryResult'
  ];
  for (const m of methods) {
    assert.strictEqual(typeof sqliteWebhookRepository[m], 'function', `sqliteWebhookRepository missing ${m}`);
    assert.strictEqual(typeof mongoWebhookRepository[m], 'function', `mongoWebhookRepository missing ${m}`);
  }
});

// 4. API Key Service CRUD & Lifecycle with SQLite
const testUserId = 'test-phase5-user-' + Date.now();
let createdRawKey = null;
let createdKeyId = null;

// Ensure test user exists in SQLite with an active subscription
import db from './src/db/index.js';
db.prepare(`
  INSERT OR IGNORE INTO users (id, email, password_hash, salt, name, role, plan, created_at, updated_at)
  VALUES (?, ?, 'hash', 'salt', 'Phase 5 Tester', 'user', 'pro', datetime('now'), datetime('now'))
`).run(testUserId, `${testUserId}@example.com`);

db.prepare(`
  INSERT OR REPLACE INTO subscriptions (id, user_id, plan_id, plan_slug, billing_period, starts_at, expires_at, status, created_at, updated_at)
  VALUES ('sub-' || ?, ?, 'plan_pro', 'pro', 'monthly', datetime('now'), datetime('now', '+30 days'), 'active', datetime('now'), datetime('now'))
`).run(testUserId, testUserId);

await test('apiKeyService.createApiKey creates active key with quota', async () => {
  const res = await createApiKey({ userId: testUserId, name: 'Phase 5 Key' });
  assert.ok(res.rawKey, 'Raw key should be returned');
  assert.ok(res.rawKey.startsWith('sk_live_'), 'Key prefix should be sk_live_');
  assert.strictEqual(res.key.name, 'Phase 5 Key');
  assert.strictEqual(res.key.monthlyQuota, 25000); // Pro plan default
  createdRawKey = res.rawKey;
  createdKeyId = res.key.id;
});

await test('apiKeyService.getUserApiKeys returns list of user keys', async () => {
  const keys = await getUserApiKeys(testUserId);
  assert.ok(Array.isArray(keys));
  const found = keys.find(k => k.id === createdKeyId);
  assert.ok(found, 'Created key should be in user keys list');
  assert.strictEqual(found.isEnabled, true);
});

await test('apiKeyService.validateApiKey authenticates valid key', async () => {
  const auth = await validateApiKey(createdRawKey, '127.0.0.1');
  assert.strictEqual(auth.valid, true);
  assert.strictEqual(auth.user.id, testUserId);
  assert.strictEqual(auth.user.plan, 'pro');
});

await test('apiKeyService.toggleApiKey disables and re-enables key', async () => {
  await toggleApiKey(testUserId, createdKeyId, false);
  const authDisabled = await validateApiKey(createdRawKey, '127.0.0.1');
  assert.strictEqual(authDisabled.valid, false);
  assert.strictEqual(authDisabled.error, 'This API key is currently disabled.');

  await toggleApiKey(testUserId, createdKeyId, true);
  const authEnabled = await validateApiKey(createdRawKey, '127.0.0.1');
  assert.strictEqual(authEnabled.valid, true);
});

await test('apiKeyService.regenerateApiKey invalidates old key and gives new raw key', async () => {
  const regen = await regenerateApiKey(testUserId, createdKeyId);
  assert.ok(regen.rawKey);
  assert.notStrictEqual(regen.rawKey, createdRawKey);

  // Old key should fail
  const oldAuth = await validateApiKey(createdRawKey);
  assert.strictEqual(oldAuth.valid, false);

  // New key should succeed
  const newAuth = await validateApiKey(regen.rawKey);
  assert.strictEqual(newAuth.valid, true);
  createdRawKey = regen.rawKey;
});

await test('apiKeyRepository stats and pagination methods return expected format', async () => {
  const repo = getApiKeyRepository();
  const stats = await repo.getUserDeveloperStats(testUserId, 'pro');
  assert.ok(typeof stats.totalRequests === 'number');
  assert.ok(Array.isArray(stats.usageTrend));
  assert.strictEqual(stats.usageTrend.length, 7);
  assert.strictEqual(stats.plan, 'pro');

  const logs = await repo.findLogsPaginated({ userId: testUserId, page: 1, limit: 10 });
  assert.ok(Array.isArray(logs.logs));
  assert.ok(typeof logs.total === 'number');

  const keyUsage = await repo.getKeyUsageStats(createdKeyId);
  assert.ok(typeof keyUsage.todayCount === 'number');
  assert.ok(typeof keyUsage.totalRequests === 'number');
});

await test('apiKeyService.revokeApiKey permanently revokes key', async () => {
  await revokeApiKey(testUserId, createdKeyId);
  const auth = await validateApiKey(createdRawKey);
  assert.strictEqual(auth.valid, false);
  assert.strictEqual(auth.error, 'This API key has been revoked.');
});

await test('apiKeyService.deleteApiKey removes key record', async () => {
  await deleteApiKey(testUserId, createdKeyId);
  const keys = await getUserApiKeys(testUserId);
  const found = keys.find(k => k.id === createdKeyId);
  assert.strictEqual(found, undefined);
});

// 5. Webhook Service CRUD & Lifecycle with SQLite
let createdWhId = null;

await test('webhookService.createWebhook creates active webhook', async () => {
  const wh = await createWebhook({
    userId: testUserId,
    name: 'Deploy Hook',
    url: 'https://example.com/api/webhook',
    events: ['download.completed', 'download.failed']
  });
  assert.ok(wh.id);
  assert.strictEqual(wh.name, 'Deploy Hook');
  assert.strictEqual(wh.url, 'https://example.com/api/webhook');
  assert.deepStrictEqual(wh.events, ['download.completed', 'download.failed']);
  assert.ok(wh.secret.startsWith('whsec_'));
  createdWhId = wh.id;
});

await test('webhookService.getUserWebhooks returns webhook list', async () => {
  const hooks = await getUserWebhooks(testUserId);
  assert.ok(Array.isArray(hooks));
  const found = hooks.find(h => h.id === createdWhId);
  assert.ok(found);
  assert.strictEqual(found.isActive, true);
});

await test('webhookService.updateWebhook modifies endpoint settings', async () => {
  await updateWebhook({
    userId: testUserId,
    webhookId: createdWhId,
    name: 'Updated Hook Name',
    isActive: false
  });
  const hooks = await getUserWebhooks(testUserId);
  const found = hooks.find(h => h.id === createdWhId);
  assert.strictEqual(found.name, 'Updated Hook Name');
  assert.strictEqual(found.isActive, false);
});

await test('webhookRepository delivery records & pagination', async () => {
  const whRepo = getWebhookRepository();
  const delivery = await whRepo.createDeliveryRecord({
    id: 'test-del-' + Date.now(),
    webhook_id: createdWhId,
    user_id: testUserId,
    event: 'download.completed',
    payload: { jobId: 'job-123', status: 'completed' },
    attempt: 1,
    max_attempts: 3,
    status: 'pending'
  });
  assert.ok(delivery);

  await whRepo.updateDeliveryResult(delivery.id, {
    response_status: 200,
    response_body: '{"ok":true}',
    status: 'success',
    delivered_at: new Date().toISOString()
  });

  const paginated = await whRepo.findDeliveriesPaginated({ userId: testUserId, webhookId: createdWhId, page: 1, limit: 10 });
  assert.strictEqual(paginated.deliveries.length >= 1, true);
  assert.strictEqual(paginated.total >= 1, true);
  assert.strictEqual(paginated.deliveries[0].status, 'success');
});

await test('webhookService.deleteWebhook deletes webhook record', async () => {
  await deleteWebhook(testUserId, createdWhId);
  const hooks = await getUserWebhooks(testUserId);
  const found = hooks.find(h => h.id === createdWhId);
  assert.strictEqual(found, undefined);
});

// Cleanup test user and subscription
db.prepare('DELETE FROM subscriptions WHERE user_id = ?').run(testUserId);
db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);

console.log(`\nPhase 5.2 Test Summary: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
