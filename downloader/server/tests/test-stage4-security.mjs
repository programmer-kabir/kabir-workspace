/**
 * StreamVault — Stage 4: Security & Data Isolation Testing (MongoDB)
 * Verifies RBAC, cross-user isolation, banned user blocking, SSRF protection,
 * and credential sanitization against StreamVault_Stage4_Test
 */

import { createStage4TestServer } from './test-stage4-helper.mjs';
import { getHistoryRepository } from '../src/db/repositories/historyRepository.js';
import { getNotificationRepository } from '../src/db/repositories/notificationRepository.js';
import { getQueueRepository } from '../src/db/repositories/queueRepository.js';
import { getUserRepository } from '../src/db/repositories/userRepository.js';

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
  console.log('  STAGE 4.4: SECURITY & DATA ISOLATION TESTING (MONGODB)');
  console.log('='.repeat(70));

  const { baseUrl, close } = await createStage4TestServer();
  console.log(`[SEC-HARNESS] Connected to ${baseUrl} -> MongoDB StreamVault_Stage4_Test\n`);

  try {
    // ----------------------------------------------------
    // 1. CREDENTIAL SANITIZATION & LEAKAGE CHECK
    // ----------------------------------------------------
    console.log('--- 1. Credential Sanitization & Secret Redaction ---');
    const userEmailA = `sec_a_${Date.now()}@streamvault.test`;
    const regARes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Alpha', email: userEmailA, password: 'Password123!' })
    });
    const regAJson = await regARes.json();
    const tokenA = (regAJson.data && regAJson.data.token) || regAJson.token;
    const userA = (regAJson.data && regAJson.data.user) || regAJson.user;
    const userAId = userA.id || userA._id;

    assert(!('password_hash' in userA) && !('salt' in userA), 'Registration response redacts password_hash and salt');

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const meJson = await meRes.json();
    const meUser = (meJson.data && meJson.data.user) || meJson.user;
    assert(!('password_hash' in meUser) && !('salt' in meUser), 'GET /api/auth/me redacts password_hash and salt');

    const profileRes = await fetch(`${baseUrl}/api/user/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const profileJson = await profileRes.json();
    const profUser = profileJson.data || profileJson.user;
    assert(!('password_hash' in profUser) && !('salt' in profUser), 'GET /api/user/profile redacts password_hash and salt');

    // ----------------------------------------------------
    // 2. UNAUTHORIZED & INVALID TOKEN REJECTION (401)
    // ----------------------------------------------------
    console.log('\n--- 2. Unauthorized & Tampered Token Rejection ---');
    const noTokenRes = await fetch(`${baseUrl}/api/user/profile`);
    assert(noTokenRes.status === 401, 'Request without token returns 401 Unauthorized');

    const tamperedRes = await fetch(`${baseUrl}/api/user/profile`, {
      headers: { Authorization: 'Bearer invalid_tampered_token_99999' }
    });
    assert(tamperedRes.status === 401, 'Request with tampered token returns 401 Unauthorized');

    // ----------------------------------------------------
    // 3. ROLE-BASED ACCESS CONTROL (403 FORBIDDEN)
    // ----------------------------------------------------
    console.log('\n--- 3. Role-Based Access Control (RBAC) ---');
    const adminStatsRes = await fetch(`${baseUrl}/api/admin/payments/stats`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(adminStatsRes.status === 403, 'Regular user cannot access admin payment stats (403 Forbidden)');

    const adminDiagRes = await fetch(`${baseUrl}/api/admin/system/diagnostics`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(adminDiagRes.status === 403, 'Regular user cannot access admin diagnostics (403 Forbidden)');

    const adminApproveRes = await fetch(`${baseUrl}/api/admin/payments/transactions/dummy_id/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ adminNote: 'Hacked' })
    });
    assert(adminApproveRes.status === 403, 'Regular user cannot approve transactions (403 Forbidden)');

    // ----------------------------------------------------
    // 4. CROSS-USER DATA ISOLATION (ZERO DATA BLEED)
    // ----------------------------------------------------
    console.log('\n--- 4. Cross-User Data Isolation ---');
    const userEmailB = `sec_b_${Date.now()}@streamvault.test`;
    const regBRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User Beta', email: userEmailB, password: 'Password123!' })
    });
    const regBJson = await regBRes.json();
    const tokenB = (regBJson.data && regBJson.data.token) || regBJson.token;
    const userBId = (regBJson.data && regBJson.data.user?.id) || regBJson.user?.id;

    // 4.1 Queue Job Isolation
    const queueRepo = getQueueRepository();
    const jobA = await queueRepo.create({
      userId: userAId,
      url: `https://youtube.com/watch?v=privA_${Date.now()}`,
      status: 'queued'
    });
    const jobAId = jobA.id || jobA._id;

    // User B tries to cancel User A's job
    const cancelBRes = await fetch(`${baseUrl}/api/queue/${jobAId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(cancelBRes.status === 400 || cancelBRes.status === 403, 'User B cannot cancel User A queue job (400/403)');

    // 4.2 Download History Isolation
    const histRepo = getHistoryRepository();
    const histA = await histRepo.create({
      userId: userAId,
      url: 'https://youtube.com/watch?v=secret_video_a',
      title: 'Secret Video of User A',
      status: 'completed'
    });
    const histAId = String(histA.id || histA._id);

    // User B attempts to read User A's history record
    const histBGetRes = await fetch(`${baseUrl}/api/history/${histAId}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(histBGetRes.status === 404, 'User B cannot read User A history record (404 Not Found)');

    // User B attempts to delete User A's history record
    const histBDelRes = await fetch(`${baseUrl}/api/history/${histAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const histCheckA = await histRepo.findByIdAndUserId(histAId, userAId);
    assert(histCheckA !== null, 'User B delete attempt did not remove User A history item');

    // 4.3 Favorites Isolation
    const favARes = await fetch(`${baseUrl}/api/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        url: 'https://youtube.com/watch?v=fav_a_secret',
        title: 'Fav A'
      })
    });
    const favAJson = await favARes.json();
    const favAId = (favAJson.data && (favAJson.data.id || favAJson.data._id)) || favAJson.favorite?.id;

    // User B lists favorites
    const favBListRes = await fetch(`${baseUrl}/api/favorites`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const favBListJson = await favBListRes.json();
    const favBItems = (favBListJson.data && favBListJson.data.favorites) || favBListJson.favorites || favBListJson.data;
    assert(!favBItems.some(f => (f.id || f._id) === favAId), 'User A favorite is invisible to User B');

    // 4.4 Notifications Isolation
    const notifRepo = getNotificationRepository();
    const notifA = await notifRepo.create({
      userId: userAId,
      title: 'Confidential Notification',
      message: 'Sensitive message for User A only'
    });
    const notifAId = notifA.id || String(notifA._id);

    const notifBListRes = await fetch(`${baseUrl}/api/notifications`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const notifBListJson = await notifBListRes.json();
    const notifBItems = (notifBListJson.data && notifBListJson.data.notifications) || notifBListJson.notifications || notifBListJson.data;
    assert(!notifBItems.some(n => (n.id || n._id) === notifAId), 'User A notification is invisible to User B');

    // 4.5 Developer Keys & Webhooks Isolation
    const keyARes = await fetch(`${baseUrl}/api/developer/keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ name: 'Key A' })
    });
    const keyAJson = await keyARes.json();
    const keyAId = (keyAJson.data && (keyAJson.data.key?.id || keyAJson.data.apiKey?.id)) || keyAJson.apiKey?.id;

    const keyBListRes = await fetch(`${baseUrl}/api/developer/keys`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const keyBListJson = await keyBListRes.json();
    const keyBItems = keyBListJson.data || keyBListJson.apiKeys;
    assert(!keyBItems.some(k => (k.id || k._id) === keyAId), 'User A API key is invisible to User B');

    // ----------------------------------------------------
    // 5. BANNED USER ENFORCEMENT
    // ----------------------------------------------------
    console.log('\n--- 5. Banned User Immediate Enforcement ---');
    const userRepo = getUserRepository();
    const bannedUserEmail = `banned_${Date.now()}@streamvault.test`;
    const regBanRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Banned Person', email: bannedUserEmail, password: 'Password123!' })
    });
    const regBanJson = await regBanRes.json();
    const bannedToken = (regBanJson.data && regBanJson.data.token) || regBanJson.token;
    const bannedUserId = (regBanJson.data && regBanJson.data.user?.id) || regBanJson.user?.id;

    // Apply ban in MongoDB
    await userRepo.update(bannedUserId, { is_banned: true });

    // 5.1 Subsequent requests with active session token must be blocked immediately
    const bannedReqRes = await fetch(`${baseUrl}/api/user/profile`, {
      headers: { Authorization: `Bearer ${bannedToken}` }
    });
    assert(bannedReqRes.status === 401 || bannedReqRes.status === 403, 'Banned user session token immediately blocked (401/403)');

    // 5.2 Subsequent login attempt must be rejected
    const bannedLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: bannedUserEmail, password: 'Password123!' })
    });
    assert(bannedLoginRes.status === 401 || bannedLoginRes.status === 403, 'Banned user login rejected (401/403)');

    // ----------------------------------------------------
    // 6. SSRF WEBHOOK VALIDATION
    // ----------------------------------------------------
    console.log('\n--- 6. SSRF Protection & Dangerous URL Rejection ---');
    const ssrfTargets = [
      { url: 'http://127.0.0.1:8080/hook', label: '127.0.0.1 (Loopback)' },
      { url: 'http://localhost:5000/api', label: 'localhost' },
      { url: 'http://10.0.0.1/admin', label: '10.0.0.1 (Private 10/8)' },
      { url: 'http://192.168.1.1/router', label: '192.168.1.1 (Private 192.168/16)' },
      { url: 'http://169.254.169.254/latest/meta-data', label: '169.254.169.254 (Cloud Metadata)' },
      { url: 'file:///etc/passwd', label: 'file:// protocol' },
      { url: 'ftp://ftp.example.com/test', label: 'ftp:// protocol' }
    ];

    for (const target of ssrfTargets) {
      const ssrfRes = await fetch(`${baseUrl}/api/developer/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`
        },
        body: JSON.stringify({
          name: 'SSRF Attack Probe',
          url: target.url
        })
      });
      assert(ssrfRes.status === 400, `SSRF webhook destination rejected: ${target.label} (400 Bad Request)`);
    }

    // Valid public URL accepted
    const validWhRes = await fetch(`${baseUrl}/api/developer/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: 'Valid Public Webhook',
        url: 'https://example.com/webhook/receive'
      })
    });
    assert(validWhRes.status === 201 || validWhRes.status === 200, 'Valid public HTTPS webhook URL accepted');

    console.log('\n' + '='.repeat(70));
    console.log(`  STAGE 4.4 SECURITY & DATA ISOLATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('='.repeat(70) + '\n');

  } finally {
    await close();
  }
}

run().then(() => {
  if (failed > 0) process.exit(1);
  process.exit(0);
}).catch(err => {
  console.error('\nFatal security test execution error:', err);
  process.exit(1);
});
