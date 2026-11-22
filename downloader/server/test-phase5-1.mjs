// Phase 5.1 Service Repository Integration Verification Suite
import assert from 'node:assert';
import http from 'node:http';

import {
  favoriteRepository,
  historyRepository,
  notificationRepository,
  systemRepository,
  queueRepository,
  userRepository,
  getDbEngine
} from './src/db/repositories/index.js';

import { sqliteFavoriteRepository, mongoFavoriteRepository } from './src/db/repositories/favoriteRepository.js';
import { sqliteHistoryRepository, mongoHistoryRepository } from './src/db/repositories/historyRepository.js';
import { sqliteNotificationRepository, mongoNotificationRepository } from './src/db/repositories/notificationRepository.js';
import { sqliteQueueRepository, mongoQueueRepository } from './src/db/repositories/queueRepository.js';
import { sqliteUserRepository, mongoUserRepository } from './src/db/repositories/userRepository.js';
import { sqliteSystemRepository, mongoSystemRepository } from './src/db/repositories/systemRepository.js';

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runPhase51Tests() {
  console.log('🧪 Starting Phase 5.1 Service Repository Integration Verification Suite...\n');
  let testCount = 0;
  let passCount = 0;

  function test(desc, fn) {
    testCount++;
    try {
      fn();
      passCount++;
      console.log(`  ✅ [PASS] ${desc}`);
    } catch (err) {
      console.error(`  ❌ [FAIL] ${desc}:`, err.message);
      throw err;
    }
  }

  async function testAsync(desc, fn) {
    testCount++;
    try {
      await fn();
      passCount++;
      console.log(`  ✅ [PASS] ${desc}`);
    } catch (err) {
      console.error(`  ❌ [FAIL] ${desc}:`, err.message);
      throw err;
    }
  }

  // 1. Engine & Repository Parity Check
  console.log('--- 1. Repository Interface Parity Check ---');
  test('Active engine is sqlite (strict safety check)', () => {
    assert.strictEqual(getDbEngine(), 'sqlite');
  });

  test('favoriteRepository parity: findFavorites & upsert exist on both adapters', () => {
    assert.strictEqual(typeof sqliteFavoriteRepository.findFavorites, 'function');
    assert.strictEqual(typeof mongoFavoriteRepository.findFavorites, 'function');
    assert.strictEqual(typeof sqliteFavoriteRepository.upsert, 'function');
    assert.strictEqual(typeof mongoFavoriteRepository.upsert, 'function');
  });

  test('historyRepository parity: findHistory, findByIdAndUserId, deleteBulk exist on both adapters', () => {
    assert.strictEqual(typeof sqliteHistoryRepository.findHistory, 'function');
    assert.strictEqual(typeof mongoHistoryRepository.findHistory, 'function');
    assert.strictEqual(typeof sqliteHistoryRepository.findByIdAndUserId, 'function');
    assert.strictEqual(typeof mongoHistoryRepository.findByIdAndUserId, 'function');
    assert.strictEqual(typeof sqliteHistoryRepository.deleteBulk, 'function');
    assert.strictEqual(typeof mongoHistoryRepository.deleteBulk, 'function');
  });

  test('notificationRepository parity: findNotifications, deleteById, clearAll exist on both adapters', () => {
    assert.strictEqual(typeof sqliteNotificationRepository.findNotifications, 'function');
    assert.strictEqual(typeof mongoNotificationRepository.findNotifications, 'function');
    assert.strictEqual(typeof sqliteNotificationRepository.deleteById, 'function');
    assert.strictEqual(typeof mongoNotificationRepository.deleteById, 'function');
    assert.strictEqual(typeof sqliteNotificationRepository.clearAll, 'function');
    assert.strictEqual(typeof mongoNotificationRepository.clearAll, 'function');
  });

  test('queueRepository & userRepository & systemRepository diagnostics parity', () => {
    assert.strictEqual(typeof sqliteQueueRepository.getQueueStats, 'function');
    assert.strictEqual(typeof mongoQueueRepository.getQueueStats, 'function');
    assert.strictEqual(typeof sqliteUserRepository.countActiveSubscribers, 'function');
    assert.strictEqual(typeof mongoUserRepository.countActiveSubscribers, 'function');
    assert.strictEqual(typeof sqliteSystemRepository.getDatabaseDiagnostics, 'function');
    assert.strictEqual(typeof mongoSystemRepository.getDatabaseDiagnostics, 'function');
  });

  // 2. Auth for Test Users
  console.log('\n--- 2. User Authentication Setup ---');
  const userEmail = `p51_user_${Date.now()}@streamvault.io`;
  const adminEmail = `p51_admin_${Date.now()}@streamvault.io`;
  const password = 'StrongPassword123!';

  let userToken = '';
  let adminToken = '';
  let userId = '';

  await testAsync('Register and login test standard user', async () => {
    const regRes = await request('POST', '/api/auth/register', { email: userEmail, password, name: 'Phase 5.1 User' });
    assert.strictEqual(regRes.status, 201);

    const loginRes = await request('POST', '/api/auth/login', { email: userEmail, password });
    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginRes.body.data?.token);
    userToken = loginRes.body.data.token;
    userId = loginRes.body.data.user.id;
  });

  await testAsync('Register, login test admin user and set admin role', async () => {
    const regRes = await request('POST', '/api/auth/register', { email: adminEmail, password, name: 'Phase 5.1 Admin' });
    assert.strictEqual(regRes.status, 201);

    const loginRes = await request('POST', '/api/auth/login', { email: adminEmail, password });
    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginRes.body.data?.token);
    adminToken = loginRes.body.data.token;
    await userRepository.setRole(loginRes.body.data.user.id, 'admin');
  });

  // 3. Favorite Routes Testing (Repository Integrated)
  console.log('\n--- 3. Migrated favoriteRoutes.js HTTP Integration ---');
  let favoriteId = null;

  await testAsync('POST /api/favorites adds new favorite via favoriteRepository', async () => {
    const res = await request('POST', '/api/favorites', {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Never Gonna Give You Up',
      platform: 'YouTube',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg',
      duration: '3:33',
      collection: 'Music'
    }, userToken);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.id);
    assert.strictEqual(res.body.data.title, 'Never Gonna Give You Up');
    assert.strictEqual(res.body.data.collection, 'Music');
    favoriteId = res.body.data.id;
  });

  await testAsync('POST /api/favorites upserts duplicate URL without error', async () => {
    const res = await request('POST', '/api/favorites', {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Rick Astley Classic',
      collection: 'Favorites 80s'
    }, userToken);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.title, 'Rick Astley Classic');
    assert.strictEqual(res.body.data.collection, 'Favorites 80s');
  });

  await testAsync('GET /api/favorites returns paginated favorites with collections & platforms', async () => {
    const res = await request('GET', '/api/favorites?collection=Favorites 80s', null, userToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.favorites));
    assert.strictEqual(res.body.data.favorites.length, 1);
    assert.ok(res.body.data.collections.includes('Favorites 80s'));
    assert.ok(res.body.data.platforms.includes('YouTube'));
  });

  await testAsync('DELETE /api/favorites/:id removes favorite via favoriteRepository', async () => {
    const res = await request('DELETE', `/api/favorites/${favoriteId}`, null, userToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    const reDelete = await request('DELETE', `/api/favorites/${favoriteId}`, null, userToken);
    assert.strictEqual(reDelete.status, 404);
  });

  // 4. History Routes Testing (Repository Integrated)
  console.log('\n--- 4. Migrated historyRoutes.js HTTP Integration ---');
  let historyRecordId = null;

  await testAsync('Seed history record via historyRepository', async () => {
    const created = await historyRepository.create({
      user_id: userId,
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      platform: 'YouTube',
      title: 'Rick Astley - Never Gonna Give You Up',
      format_id: '18',
      type: 'video',
      status: 'completed'
    });
    assert.ok(created.id);
    historyRecordId = created.id;
  });

  await testAsync('GET /api/history returns history list with platform facets', async () => {
    const res = await request('GET', '/api/history', null, userToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.history));
    assert.ok(res.body.data.history.length >= 1);
    assert.ok(res.body.data.platforms.includes('YouTube'));
  });

  await testAsync('GET /api/history/:id returns specific history item', async () => {
    const res = await request('GET', `/api/history/${historyRecordId}`, null, userToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.title, 'Rick Astley - Never Gonna Give You Up');
  });

  await testAsync('POST /api/history/bulk-delete deletes records via historyRepository', async () => {
    const res = await request('POST', '/api/history/bulk-delete', { ids: [historyRecordId] }, userToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.deletedCount, 1);
  });

  // 5. Notification Routes Testing (Repository Integrated)
  console.log('\n--- 5. Migrated notificationRoutes.js HTTP Integration ---');
  let notif1Id = null;
  let notif2Id = null;

  await testAsync('Seed notifications via notificationRepository', async () => {
    const n1 = await notificationRepository.create({
      user_id: userId,
      title: 'Welcome to StreamVault',
      message: 'Your account is active.',
      type: 'info'
    });
    const n2 = await notificationRepository.create({
      user_id: userId,
      title: 'New Feature Added',
      message: 'Enjoy priority queues.',
      type: 'success'
    });
    notif1Id = n1.id;
    notif2Id = n2.id;
  });

  await testAsync('GET /api/notifications returns unreadCount and notifications list', async () => {
    const res = await request('GET', '/api/notifications', null, userToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.unreadCount >= 2);
    assert.ok(res.body.data.notifications.length >= 2);
  });

  await testAsync('PUT /api/notifications/:id/read marks single notification as read', async () => {
    const res = await request('PUT', `/api/notifications/${notif1Id}/read`, {}, userToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  await testAsync('PUT /api/notifications/read-all marks remaining notifications as read', async () => {
    const res = await request('PUT', '/api/notifications/read-all', {}, userToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    const check = await request('GET', '/api/notifications', null, userToken);
    assert.strictEqual(check.body.data.unreadCount, 0);
  });

  await testAsync('DELETE /api/notifications/clear-all clears all notifications', async () => {
    const res = await request('DELETE', '/api/notifications/clear-all', null, userToken);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.deletedCount >= 2);
  });

  // 6. Admin System Routes Testing (Repository Integrated)
  console.log('\n--- 6. Migrated adminSystemRoutes.js HTTP Integration ---');

  await testAsync('GET /api/admin/system/diagnostics rejects non-admin with 403', async () => {
    const res = await request('GET', '/api/admin/system/diagnostics', null, userToken);
    assert.strictEqual(res.status, 403);
  });

  await testAsync('GET /api/admin/system/diagnostics returns complete diagnostic payload for admin', async () => {
    const res = await request('GET', '/api/admin/system/diagnostics', null, adminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    const { server, memory, database, queue, users } = res.body.data;
    assert.ok(server.uptimeSeconds >= 0);
    assert.ok(memory.rssMb > 0);
    assert.strictEqual(database.journalMode, 'wal');
    assert.strictEqual(database.status, 'connected (WAL)');
    assert.ok(database.tablesCount >= 19);
    assert.ok(typeof queue.queuedJobs === 'number');
    assert.ok(typeof queue.completedJobs === 'number');
    assert.ok(users.totalUsers >= 2);
    assert.ok(typeof users.activeSubscribers === 'number');
  });

  console.log(`\n🎉 All ${passCount}/${testCount} Phase 5.1 Service Repository Integration tests PASSED!\n`);
}

runPhase51Tests().catch(err => {
  console.error('\n❌ Phase 5.1 test execution failed:', err);
  process.exit(1);
});
