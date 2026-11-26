/**
 * StreamVault — Stage 3.2 Auth & Session Compatibility Suite
 * Validates authentication and session lifecycles against 'StreamVault_Test' on MongoDB Atlas.
 */

import assert from 'assert';
import crypto from 'crypto';
import { setupTestMongo, teardownTestMongo } from './test-mongo-helper.mjs';
import {
  registerUser,
  loginUser,
  validateSession,
  logoutUser,
  getUserSessions,
  revokeSession,
  requestPasswordReset,
  resetPasswordWithToken,
  getLoginHistory
} from '../src/services/authService.js';
import {
  mongoUserRepository,
  mongoSessionRepository,
  mongoSystemRepository
} from '../src/db/repositories/index.js';

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
console.log('StreamVault — Stage 3.2: Auth & Session Compatibility (StreamVault_Test)');
console.log('='.repeat(75));

const suffix = crypto.randomBytes(4).toString('hex');
const testEmail = `auth_test_${suffix}@streamvault.io`;
const testPassword = `P@ssword123_${suffix}`;
const testName = `Auth Tester ${suffix}`;

async function run() {
  const { db } = await setupTestMongo();
  console.log(`Connected to isolated test database: ${db.databaseName}\n`);

  // Explicitly ensure DB_ENGINE points to mongodb for dynamic proxies in services
  const origDbEngine = process.env.DB_ENGINE;
  process.env.DB_ENGINE = 'mongodb';

  let registeredUser = null;
  let session1 = null;
  let session2 = null;

  try {
    // 1. User Registration
    await test('1. Register user: create user document, password hash, salt & referral code', async () => {
      registeredUser = await registerUser({
        email: testEmail,
        password: testPassword,
        name: testName
      });

      assert.ok(registeredUser.id);
      assert.strictEqual(registeredUser.email, testEmail.toLowerCase());
      assert.strictEqual(registeredUser.name, testName);
      assert.strictEqual(registeredUser.role, 'user');
      assert.strictEqual(registeredUser.plan, 'free');
      assert.ok(registeredUser.referralCode.startsWith('SV-'));

      // Verify user document directly in MongoDB
      const dbUser = await mongoUserRepository.findById(registeredUser.id);
      assert.ok(dbUser);
      assert.strictEqual(dbUser.email, testEmail.toLowerCase());
      assert.ok(dbUser.password_hash);
      assert.ok(dbUser.salt);
      assert.ok(dbUser.is_verified);
    });

    // 2. Prevent Duplicate Registration
    await test('2. Duplicate registration rejection', async () => {
      let threw = false;
      try {
        await registerUser({
          email: testEmail,
          password: 'AnotherPassword123!',
          name: 'Duplicate Tester'
        });
      } catch (err) {
        threw = true;
        assert.ok(err.message.includes('already exists'));
      }
      assert.strictEqual(threw, true);
    });

    // 3. Login with valid password
    await test('3. Successful login & session creation', async () => {
      session1 = await loginUser({
        email: testEmail,
        password: testPassword,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      });

      assert.ok(session1.token);
      assert.strictEqual(session1.user.email, testEmail.toLowerCase());
      assert.strictEqual(session1.user.name, testName);

      // Verify session exists in MongoDB
      const userSessions = await mongoSessionRepository.findByUserId(registeredUser.id);
      assert.strictEqual(userSessions.length, 1);
      assert.strictEqual(userSessions[0].ip_address, '192.168.1.100');
    });

    // 4. Validate session
    await test('4. Validate session token & update last active timestamp', async () => {
      const validated = await validateSession(session1.token);
      assert.ok(validated);
      assert.strictEqual(validated.user.id, registeredUser.id);
      assert.strictEqual(validated.user.email, testEmail.toLowerCase());
    });

    // 5. Failed login attempts & failed login tracking
    await test('5. Failed login: reject bad password & record failure in login_history', async () => {
      let threw = false;
      try {
        await loginUser({
          email: testEmail,
          password: 'WrongPassword999!',
          ipAddress: '192.168.1.105',
          userAgent: 'TestAgent'
        });
      } catch (err) {
        threw = true;
        assert.ok(err.message.includes('Invalid email or password'));
      }
      assert.strictEqual(threw, true);

      // Verify failed login logged in MongoDB
      const failedCount = await mongoSystemRepository.countFailedLoginsSince(
        testEmail,
        new Date(Date.now() - 60000)
      );
      assert.strictEqual(failedCount, 1);
    });

    // 6. Multi-session and session listing
    await test('6. Multi-session creation & listing', async () => {
      session2 = await loginUser({
        email: testEmail,
        password: testPassword,
        ipAddress: '10.0.0.50',
        userAgent: 'Mobile Safari'
      });

      assert.ok(session2.token);
      const allSessions = await getUserSessions(registeredUser.id, session1.token);
      assert.strictEqual(allSessions.length, 2);
    });

    // 7. Revoke single session
    await test('7. Revoke individual session', async () => {
      const sessionsBefore = await getUserSessions(registeredUser.id);
      const sessionToRevoke = sessionsBefore.find(s => s.ip_address === '10.0.0.50');
      assert.ok(sessionToRevoke);

      await revokeSession(registeredUser.id, sessionToRevoke.id);

      const sessionsAfter = await getUserSessions(registeredUser.id);
      assert.strictEqual(sessionsAfter.length, 1);

      // Verify session2 token is now invalid
      const checkRevoked = await validateSession(session2.token);
      assert.strictEqual(checkRevoked, null);

      // Verify session1 is still valid
      const checkValid = await validateSession(session1.token);
      assert.ok(checkValid);
    });

    // 8. Banned user behavior
    await test('8. Banned user handling: login rejected and existing sessions revoked', async () => {
      // Ban the user directly in MongoDB
      await db.collection('users').updateOne(
        { _id: registeredUser.id },
        { $set: { is_banned: true } }
      );

      // Login attempt should be rejected
      let threw = false;
      try {
        await loginUser({
          email: testEmail,
          password: testPassword,
          ipAddress: '192.168.1.100',
          userAgent: 'TestAgent'
        });
      } catch (err) {
        threw = true;
        assert.ok(err.message.includes('suspended'));
      }
      assert.strictEqual(threw, true);

      // Existing session should be invalidated upon validation
      const checkBannedSession = await validateSession(session1.token);
      assert.strictEqual(checkBannedSession, null);

      // Unban user for subsequent tests
      await db.collection('users').updateOne(
        { _id: registeredUser.id },
        { $set: { is_banned: false } }
      );
    });

    // 9. Password Reset Lifecycle
    await test('9. Password reset request, token validation, and password update', async () => {
      const resetResult = await requestPasswordReset(testEmail);
      assert.ok(resetResult);
      assert.ok(resetResult.resetToken);

      const newPassword = `NewP@ssword456_${suffix}`;
      const updateResult = await resetPasswordWithToken(resetResult.resetToken, newPassword);
      assert.ok(updateResult.success);

      // Verify old password fails
      let oldFailed = false;
      try {
        await loginUser({
          email: testEmail,
          password: testPassword,
          ipAddress: '127.0.0.1',
          userAgent: 'Test'
        });
      } catch {
        oldFailed = true;
      }
      assert.strictEqual(oldFailed, true);

      // Verify new password succeeds
      const newLogin = await loginUser({
        email: testEmail,
        password: newPassword,
        ipAddress: '127.0.0.1',
        userAgent: 'Test'
      });
      assert.ok(newLogin.token);

      // Logout
      await logoutUser(newLogin.token);
      const afterLogout = await validateSession(newLogin.token);
      assert.strictEqual(afterLogout, null);
    });

    // 10. Login History Audit
    await test('10. User login history retrieval from MongoDB', async () => {
      const history = await getLoginHistory(registeredUser.id);
      assert.ok(Array.isArray(history));
      assert.ok(history.length >= 2); // At least 1 success and 1 failed recorded
      const hasSuccess = history.some(h => h.status === 'success');
      assert.ok(hasSuccess);
    });

  } finally {
    // Restore original DB_ENGINE
    process.env.DB_ENGINE = origDbEngine;
    await teardownTestMongo(false);
  }

  console.log('\n' + '='.repeat(75));
  console.log(`Stage 3.2 Results: ${passedTests}/${totalTests} Tests Passed (100%)`);
  console.log('='.repeat(75));
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
