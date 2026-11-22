// Phase 5 Automated Test Suite - Production Security, QA, Diagnostics & Reliability
import assert from 'node:assert';
import db from './src/db/index.js';
import { createDatabaseBackup, listDatabaseBackups, verifyDatabaseBackup } from './src/db/backup.js';

const BASE_URL = 'http://localhost:5000';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, ok: res.ok, headers: res.headers, body };
}

async function runPhase5Tests() {
  console.log('🧪 Starting Phase 5 Production Security & QA Verification Suite...\n');
  let passed = 0;

  function pass(desc) {
    passed++;
    console.log(`  ✅ ${desc}`);
  }

  const runId = Date.now();
  const adminEmail = `admin_sec_${runId}@streamvault.com`;
  const userEmail = `user_sec_${runId}@streamvault.com`;
  const strongPassword = `SecPass_${runId}!99`;

  let adminToken = '';
  let userToken = '';
  let userId = '';

  try {
    // 1. OWASP Security Response Headers
    const healthRes = await request('/health');
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthRes.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(healthRes.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.strictEqual(healthRes.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.strictEqual(healthRes.headers.get('x-xss-protection'), '1; mode=block');
    assert.ok(healthRes.headers.get('permissions-policy')?.includes('camera=()'));
    assert.strictEqual(healthRes.headers.get('x-powered-by'), null);
    pass('OWASP defensive security headers verified (nosniff, SAMEORIGIN, no X-Powered-By)');

    // 2. Unmatched API 404 Route Protection
    const notFoundRes = await request('/api/nonexistent-route-for-testing');
    assert.strictEqual(notFoundRes.status, 404);
    assert.strictEqual(notFoundRes.body.success, false);
    assert.ok(notFoundRes.body.error.includes('API route not found'));
    pass('Unmatched API endpoint properly returns structured 404 JSON');

    // 3. Password Strength Enforcement
    const weakPass1 = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: `weak1_${runId}@test.com`, password: 'short', name: 'Weak Pass' })
    });
    assert.strictEqual(weakPass1.status, 400);
    assert.ok(weakPass1.body.error.includes('8 characters'));

    const weakPass2 = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: `weak2_${runId}@test.com`, password: 'allletterslong', name: 'Weak Pass 2' })
    });
    assert.strictEqual(weakPass2.status, 400);
    assert.ok(weakPass2.body.error.includes('number'));

    const weakPass3 = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: `weak3_${runId}@test.com`, password: '1234567890', name: 'Weak Pass 3' })
    });
    assert.strictEqual(weakPass3.status, 400);
    assert.ok(weakPass3.body.error.includes('letter'));
    pass('Password strength validation enforces minimum 8 chars, letters, and numbers');

    // 4. Register Users for Testing
    const regAdmin = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: adminEmail, password: strongPassword, name: 'Admin Sec' })
    });
    assert.strictEqual(regAdmin.status, 201);
    adminToken = regAdmin.body.data.token;
    // Elevate admin
    db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(adminEmail);

    const regUser = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: userEmail, password: strongPassword, name: 'User Sec' })
    });
    assert.strictEqual(regUser.status, 201);
    userToken = regUser.body.data.token;
    userId = regUser.body.data.user.id;
    pass('Admin and test user registered successfully with strong passwords');

    // 5. Account Brute-Force Lockout Protection
    const targetEmail = `brute_victim_${runId}@streamvault.com`;
    // Register victim
    await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: targetEmail, password: strongPassword, name: 'Victim' })
    });

    // Fire 5 failed login attempts
    for (let i = 1; i <= 5; i++) {
      await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: targetEmail, password: 'WrongPassword123' })
      });
    }

    // 6th attempt should trigger 429 Lockout
    const lockedRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: targetEmail, password: 'WrongPassword123' })
    });
    assert.strictEqual(lockedRes.status, 429);
    assert.strictEqual(lockedRes.body.code, 'ACCOUNT_TEMPORARILY_LOCKED');
    pass('Account brute-force lockout triggered after 5 consecutive failed logins (HTTP 429)');

    // 6. Payment Screenshot URL Sanitization
    const pmsRes = await request('/api/subscriptions/payment-methods');
    const paymentMethodId = pmsRes.body.data[0].id;

    const xssScreenshotRes = await request('/api/subscriptions/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        planSlug: 'pro',
        billingPeriod: 'monthly',
        paymentMethodId,
        senderNumber: '01700000001',
        transactionId: `TRX_XSS_${runId}`,
        amount: 499,
        screenshotUrl: 'javascript:alert(document.cookie)'
      })
    });
    assert.strictEqual(xssScreenshotRes.status, 400);
    assert.ok(xssScreenshotRes.body.error.includes('Dangerous protocol') || xssScreenshotRes.body.error.includes('Screenshot'));
    pass('Screenshot URL sanitization blocks dangerous javascript: protocol injection');

    // 7. Payment Submission & Race Condition Defense (Double Approval)
    const validTrxId = `TRX_RACE_${runId}`;
    const submitRes = await request('/api/subscriptions/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        planSlug: 'pro',
        billingPeriod: 'monthly',
        paymentMethodId,
        senderNumber: '01700000002',
        transactionId: validTrxId,
        amount: 499,
        screenshotUrl: 'https://images.unsplash.com/photo-test-receipt.jpg'
      })
    });
    assert.strictEqual(submitRes.status, 201);
    const pendingTrxRecordId = submitRes.body.data.id;

    // First Approval -> Should Succeed
    const approve1 = await request(`/api/admin/payments/transactions/${pendingTrxRecordId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ adminNote: 'Verified receipt' })
    });
    assert.strictEqual(approve1.status, 200);
    assert.strictEqual(approve1.body.success, true);

    // Second Approval on same transaction -> Must Fail Idempotently (already approved)
    const approve2 = await request(`/api/admin/payments/transactions/${pendingTrxRecordId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ adminNote: 'Duplicate approval attempt' })
    });
    assert.strictEqual(approve2.status, 400);
    assert.ok(approve2.body.error.includes('already been approved') || approve2.body.error.includes('race condition prevented'));
    pass('Payment approval race condition prevented: duplicate approval rejected idempotently');

    // Rejecting an already approved payment -> Must Fail
    const rejectApproved = await request(`/api/admin/payments/transactions/${pendingTrxRecordId}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ rejectionReason: 'Cannot reject approved' })
    });
    assert.strictEqual(rejectApproved.status, 400);
    assert.ok(rejectApproved.body.error.includes('already been approved'));
    pass('Integrity guard prevents rejecting an already approved transaction');

    // 8. Payment Rejection Idempotency
    const rejectTrxId = `TRX_REJ_${runId}`;
    const submitRejRes = await request('/api/subscriptions/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        planSlug: 'pro',
        billingPeriod: 'monthly',
        paymentMethodId,
        senderNumber: '01700000003',
        transactionId: rejectTrxId,
        amount: 499
      })
    });
    assert.strictEqual(submitRejRes.status, 201);
    const rejTrxRecordId = submitRejRes.body.data.id;

    // First rejection -> Succeeds
    const rej1 = await request(`/api/admin/payments/transactions/${rejTrxRecordId}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ rejectionReason: 'Invalid transaction ID provided' })
    });
    assert.strictEqual(rej1.status, 200);
    assert.strictEqual(rej1.body.success, true);

    // Second rejection -> Must Fail Idempotently
    const rej2 = await request(`/api/admin/payments/transactions/${rejTrxRecordId}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ rejectionReason: 'Duplicate rejection' })
    });
    assert.strictEqual(rej2.status, 400);
    assert.ok(rej2.body.error.includes('already been rejected') || rej2.body.error.includes('race condition prevented'));

    // Approving an already rejected payment -> Must Fail
    const approveRejected = await request(`/api/admin/payments/transactions/${rejTrxRecordId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ adminNote: 'Cannot approve rejected' })
    });
    assert.strictEqual(approveRejected.status, 400);
    assert.ok(approveRejected.body.error.includes('already marked as rejected'));
    pass('Payment rejection idempotency verified and approval of rejected payment blocked');

    // 9. Daily Download Quota Enforcement
    // Create a user on free plan (daily quota = 15)
    const quotaUserEmail = `quota_user_${runId}@streamvault.com`;
    const quotaUserRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: quotaUserEmail, password: strongPassword, name: 'Quota Tester' })
    });
    const quotaUserToken = quotaUserRes.body.data.token;
    const quotaUserId = quotaUserRes.body.data.user.id;

    // Artificially populate 15 completed downloads for today
    const nowIso = new Date().toISOString();
    const insertHist = db.prepare(`
      INSERT INTO download_history (user_id, job_id, url, platform, title, type, created_at)
      VALUES (?, ?, 'https://youtube.com/watch?v=sample', 'youtube', 'Sample Video', 'video', ?)
    `);

    for (let i = 1; i <= 15; i++) {
      insertHist.run(quotaUserId, `job_quota_${runId}_${i}`, nowIso);
    }

    // Now attempt 16th download -> Should be rejected with HTTP 429
    const overQuotaRes = await request('/api/queue/add', {
      method: 'POST',
      headers: { Authorization: `Bearer ${quotaUserToken}` },
      body: JSON.stringify({
        url: 'https://youtube.com/watch?v=overquota',
        quality: '720p',
        format: 'mp4'
      })
    });
    assert.strictEqual(overQuotaRes.status, 429);
    assert.strictEqual(overQuotaRes.body.code, 'DAILY_DOWNLOAD_QUOTA_EXCEEDED');
    assert.ok(overQuotaRes.body.error.includes('Daily download quota exceeded'));
    pass('Daily download quota strictly enforced at 15 downloads for Free tier (HTTP 429)');

    // 10. Dynamic Subscription Expiration Check on Request
    // Upgrade quota user to pro, but set subscription expires_at to 1 hour ago
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
    db.prepare("UPDATE users SET plan = 'pro' WHERE id = ?").run(quotaUserId);
    db.prepare(`
      INSERT INTO subscriptions (id, user_id, plan_id, plan_slug, transaction_id, billing_period, starts_at, expires_at, status, created_at, updated_at)
      VALUES (?, ?, 'plan_pro', 'pro', 'MANUAL_EXPIRE_TEST', 'monthly', ?, ?, 'active', ?, ?)
    `).run(`sub_exp_${runId}`, quotaUserId, pastDate, pastDate, pastDate, pastDate);

    // Call /api/auth/me -> validateSession should dynamically detect expired subscription and downgrade to free
    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${quotaUserToken}` }
    });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.body.data.user.plan, 'free');
    pass('Expired subscription is dynamically downgraded to Free on request without waiting for cron');

    // 11. Atomic SQLite Backup Engine & PRAGMA Integrity Check
    const backupResult = createDatabaseBackup();
    assert.strictEqual(backupResult.success, true);
    assert.strictEqual(backupResult.integrity, 'ok');
    assert.ok(backupResult.sizeBytes > 0);

    const verified = verifyDatabaseBackup(backupResult.path);
    assert.strictEqual(verified.valid, true);
    assert.strictEqual(verified.integrity, 'ok');
    assert.ok(verified.tablesCount >= 10);

    const backupsList = listDatabaseBackups();
    assert.ok(backupsList.some(b => b.filename === backupResult.filename));
    pass('Atomic SQLite backup created via VACUUM INTO and verified via PRAGMA integrity_check');

    // 12. Admin System Diagnostics & Backup API
    // Non-admin forbidden
    const nonAdminDiag = await request('/api/admin/system/diagnostics', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(nonAdminDiag.status, 403);

    // Admin allowed
    const adminDiag = await request('/api/admin/system/diagnostics', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(adminDiag.status, 200);
    assert.strictEqual(adminDiag.body.success, true);
    assert.ok(adminDiag.body.data.server.uptimeSeconds >= 0);
    assert.ok(adminDiag.body.data.database.tablesCount >= 10);
    assert.strictEqual(adminDiag.body.data.database.journalMode.toLowerCase(), 'wal');
    assert.ok(adminDiag.body.data.users.totalUsers >= 2);

    // Admin trigger on-demand backup API
    const adminBackupRes = await request('/api/admin/system/backup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(adminBackupRes.status, 201);
    assert.strictEqual(adminBackupRes.body.success, true);
    assert.strictEqual(adminBackupRes.body.data.integrity, 'ok');

    // Admin list backups API
    const adminListBackups = await request('/api/admin/system/backups', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(adminListBackups.status, 200);
    assert.ok(Array.isArray(adminListBackups.body.data));
    assert.ok(adminListBackups.body.data.length >= 1);
    pass('Admin system diagnostics and atomic backup API verified with RBAC security');

    // 13. Core Downloader Regression Test (Platform Detection & Extractor)
    const platformsToTest = [
      { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'youtube' },
      { url: 'https://www.tiktok.com/@user/video/1234567890', expected: 'tiktok' },
      { url: 'https://www.facebook.com/watch/?v=123456789', expected: 'facebook' },
      { url: 'https://www.instagram.com/reel/C3zABCDEFGH/', expected: 'instagram' },
      { url: 'https://x.com/status/1234567890123456789', expected: 'twitter' },
      { url: 'https://www.reddit.com/r/videos/comments/xyz123/', expected: 'reddit' }
    ];

    for (const item of platformsToTest) {
      const detectRes = await request('/api/detect-platform', {
        method: 'POST',
        body: JSON.stringify({ url: item.url })
      });
      assert.strictEqual(detectRes.status, 200);
      assert.strictEqual(detectRes.body.platform.id, item.expected);
    }
    pass('Multi-platform URL detection regression verified (YouTube, TikTok, Facebook, Instagram, X, Reddit)');

    console.log(`\n🎉 All ${passed} Phase 5 Security & Production Verification tests PASSED successfully!\n`);
    return true;
  } catch (error) {
    console.error('\n❌ Phase 5 Test Suite FAILED:', error);
    process.exit(1);
  }
}

runPhase5Tests();
