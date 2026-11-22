import assert from 'assert';
import { sqliteUserRepository, mongoUserRepository, getUserRepository } from './src/db/repositories/userRepository.js';
import { sqliteSessionRepository, mongoSessionRepository, getSessionRepository } from './src/db/repositories/sessionRepository.js';
import { sqliteSystemRepository, mongoSystemRepository, getSystemRepository } from './src/db/repositories/systemRepository.js';
import {
  registerUser,
  loginUser,
  validateSession,
  logoutUser,
  getUserSessions,
  revokeSession,
  changePassword,
  requestPasswordReset,
  resetPasswordWithToken,
  getLoginHistory
} from './src/services/authService.js';
import { validatePasswordStrength, checkAccountLockout } from './src/middleware/authRateLimiter.js';
import db from './src/db/index.js';

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

console.log('\n--- Starting Phase 5.3 Verification Suite (Auth, Security & Sessions) ---');

// 1. Password strength validator
await test('validatePasswordStrength checks requirements', () => {
  assert.strictEqual(validatePasswordStrength('short').valid, false);
  assert.strictEqual(validatePasswordStrength('alllettersnocap').valid, false);
  assert.strictEqual(validatePasswordStrength('12345678').valid, false);
  assert.strictEqual(validatePasswordStrength('SecureP@ss123').valid, true);
});

// 2. Dual parity method existence checks
await test('Dual Parity: UserRepository methods match', () => {
  const methods = ['findById', 'findByEmail', 'create', 'updatePlan', 'updateName', 'setRole', 'count', 'updatePassword', 'getUserStats', 'createPasswordReset', 'findValidPasswordReset', 'markPasswordResetUsed', 'countActiveSubscribers'];
  for (const m of methods) {
    assert.strictEqual(typeof sqliteUserRepository[m], 'function', `sqliteUserRepository missing ${m}`);
    assert.strictEqual(typeof mongoUserRepository[m], 'function', `mongoUserRepository missing ${m}`);
  }
});

await test('Dual Parity: SessionRepository methods match', () => {
  const methods = ['findByTokenHash', 'create', 'findByUserId', 'deleteById', 'deleteByUserIdExcept', 'deleteExpired', 'count', 'touch', 'deleteByTokenHash', 'deleteByIdAndUserId', 'deleteByUserId'];
  for (const m of methods) {
    assert.strictEqual(typeof sqliteSessionRepository[m], 'function', `sqliteSessionRepository missing ${m}`);
    assert.strictEqual(typeof mongoSessionRepository[m], 'function', `mongoSessionRepository missing ${m}`);
  }
});

await test('Dual Parity: SystemRepository methods match', () => {
  const methods = ['getSetting', 'setSetting', 'recordLogin', 'countFailedLoginsSince', 'findLastLoginSuccess', 'findLastLoginFailure', 'logActivity', 'logAdminAudit', 'getDatabaseDiagnostics', 'getLoginHistory', 'findUserActivityPaginated'];
  for (const m of methods) {
    assert.strictEqual(typeof sqliteSystemRepository[m], 'function', `sqliteSystemRepository missing ${m}`);
    assert.strictEqual(typeof mongoSystemRepository[m], 'function', `mongoSystemRepository missing ${m}`);
  }
});

// 3. User registration lifecycle
const testEmail = `phase53_${Date.now()}@testvault.local`;
const testPassword = 'Password123!';
let createdUser = null;
let activeToken = null;
let activeSessionId = null;

await test('registerUser registers a new account', async () => {
  createdUser = await registerUser({
    email: testEmail,
    password: testPassword,
    name: 'Phase 53 Tester'
  });

  assert.ok(createdUser.id);
  assert.strictEqual(createdUser.email, testEmail);
  assert.strictEqual(createdUser.plan, 'free');
  assert.ok(createdUser.referralCode);
});

await test('registerUser prevents duplicate email registration', async () => {
  let threw = false;
  try {
    await registerUser({
      email: testEmail,
      password: testPassword,
      name: 'Duplicate'
    });
  } catch (err) {
    threw = true;
    assert.ok(err.message.includes('already exists'));
  }
  assert.ok(threw, 'Should reject duplicate email');
});

// 4. Login and Session Token lifecycle
await test('loginUser validates credentials and returns session token', async () => {
  const session = await loginUser({
    email: testEmail,
    password: testPassword,
    ipAddress: '127.0.0.1',
    userAgent: 'Phase5-Test-Runner'
  });

  assert.ok(session.token);
  assert.strictEqual(session.user.id, createdUser.id);
  activeToken = session.token;
});

await test('validateSession retrieves active user session', async () => {
  const validation = await validateSession(activeToken);
  assert.ok(validation);
  assert.strictEqual(validation.user.id, createdUser.id);
  assert.strictEqual(validation.user.email, testEmail);
  activeSessionId = validation.sessionId;
});

await test('getUserSessions returns session list', async () => {
  const sessions = await getUserSessions(createdUser.id, activeSessionId);
  assert.ok(Array.isArray(sessions));
  const current = sessions.find(s => s.isCurrent);
  assert.ok(current, 'Should find current active session');
  assert.strictEqual(current.id, activeSessionId);
});

// 5. Failed Logins & Brute-force Lockout Protection
await test('loginUser rejects wrong password and logs failure', async () => {
  let threw = false;
  try {
    await loginUser({
      email: testEmail,
      password: 'WrongPassword999!',
      ipAddress: '127.0.0.1',
      userAgent: 'Phase5-Test-Runner'
    });
  } catch (err) {
    threw = true;
    assert.ok(err.message.includes('Invalid email or password'));
  }
  assert.ok(threw);

  const history = await getLoginHistory(createdUser.id, 5);
  assert.ok(history.length >= 1);
  assert.strictEqual(history[0].status, 'failed');
});

await test('checkAccountLockout middleware triggers lockout after 5 failures', async () => {
  const systemRepo = getSystemRepository();
  const testLockoutEmail = `lockout_${Date.now()}@testvault.local`;

  // Record 5 failed logins
  for (let i = 0; i < 5; i++) {
    await systemRepo.recordLogin({
      email: testLockoutEmail,
      ipAddress: '127.0.0.1',
      userAgent: 'Attacker',
      status: 'failed'
    });
  }

  const req = { body: { email: testLockoutEmail } };
  let statusSet = null;
  let jsonResponse = null;
  const res = {
    status(code) { statusSet = code; return this; },
    json(obj) { jsonResponse = obj; }
  };
  let nextCalled = false;

  await checkAccountLockout(req, res, () => { nextCalled = true; });

  assert.strictEqual(statusSet, 429, 'Should respond with 429');
  assert.strictEqual(jsonResponse.code, 'ACCOUNT_TEMPORARILY_LOCKED');
  assert.strictEqual(nextCalled, false, 'Should not proceed to next handler');
});

// 6. Password Change and Session Invalidation
await test('changePassword updates password and invalidates active session', async () => {
  const newPassword = 'NewSecretPassword456!';
  await changePassword(createdUser.id, testPassword, newPassword);

  // Active session should now be invalidated
  const validation = await validateSession(activeToken);
  assert.strictEqual(validation, null, 'Old session must be deleted upon password change');

  // Login with new password should succeed
  const newSession = await loginUser({
    email: testEmail,
    password: newPassword,
    ipAddress: '127.0.0.1',
    userAgent: 'Phase5-Test-Runner'
  });
  assert.ok(newSession.token);
  activeToken = newSession.token;
});

// 7. Password Reset Token flow
await test('requestPasswordReset & resetPasswordWithToken work end-to-end', async () => {
  const resetReq = await requestPasswordReset(testEmail);
  assert.ok(resetReq.success);
  assert.ok(resetReq.resetToken);

  const finalPassword = 'FinalResetPassword789!';
  const resetRes = await resetPasswordWithToken(resetReq.resetToken, finalPassword);
  assert.ok(resetRes.success);

  // Login with final reset password
  const session = await loginUser({
    email: testEmail,
    password: finalPassword,
    ipAddress: '127.0.0.1'
  });
  assert.ok(session.token);
  activeToken = session.token;
});

// 8. User Stats & Activity Pagination
await test('UserRepository.getUserStats returns expected structure', async () => {
  const userRepo = getUserRepository();
  const stats = await userRepo.getUserStats(createdUser.id, 'free');
  assert.ok(typeof stats.totalDownloads === 'number');
  assert.ok(typeof stats.quota.daily === 'number');
  assert.ok(Array.isArray(stats.downloadTrend));
  assert.strictEqual(stats.downloadTrend.length, 7);
});

await test('SystemRepository.findUserActivityPaginated returns paginated results', async () => {
  const systemRepo = getSystemRepository();
  const act = await systemRepo.findUserActivityPaginated({ userId: createdUser.id, page: 1, limit: 10 });
  assert.ok(Array.isArray(act.activities));
  assert.ok(act.total >= 1);
  assert.strictEqual(act.page, 1);
});

// 9. Logout and Session Revocation
await test('logoutUser invalidates token', async () => {
  await logoutUser(activeToken);
  const validation = await validateSession(activeToken);
  assert.strictEqual(validation, null);
});

// Cleanup test user
db.prepare('DELETE FROM sessions WHERE user_id = ?').run(createdUser.id);
db.prepare('DELETE FROM login_history WHERE user_id = ?').run(createdUser.id);
db.prepare('DELETE FROM user_activity WHERE user_id = ?').run(createdUser.id);
db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(createdUser.id);
db.prepare('DELETE FROM users WHERE id = ?').run(createdUser.id);

console.log(`\nPhase 5.3 Test Summary: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
