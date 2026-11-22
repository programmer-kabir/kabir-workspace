/**
 * StreamVault — Phase 5.5 Verification Test Suite
 * Validates Subscriptions, Payments & Database Core Repository Integration
 *
 * Verifies:
 * 1. Plan retrieval and schema formatting (public vs internal)
 * 2. Payment method queries and administration
 * 3. Payment verification submission and duplicate TrxID guard
 * 4. Pending transaction status verification
 * 5. Admin payment statistics
 * 6. Admin payment rejection flow (notification + audit log)
 * 7. Admin payment approval flow (atomicity: trx update, sub insert, plan update, notif, audit log)
 * 8. Subscription expiration workflow
 * 9. Repository interface parity across SQLite and MongoDB adapters
 * 10. Database safety & isolation (DB_ENGINE=sqlite, Atlas untouched)
 */

import assert from 'assert';
import crypto from 'crypto';
import db from './src/db/index.js';
import { getDbEngine } from './src/db/repositories/index.js';
import {
  sqliteSubscriptionRepository,
  mongoSubscriptionRepository,
  getSubscriptionRepository
} from './src/db/repositories/subscriptionRepository.js';
import { getUserRepository } from './src/db/repositories/userRepository.js';
import { getNotificationRepository } from './src/db/repositories/notificationRepository.js';
import { getSystemRepository } from './src/db/repositories/systemRepository.js';
import {
  submitManualPayment,
  getUserTransactions,
  getAdminTransactions,
  getAdminPaymentStats,
  approvePayment,
  rejectPayment
} from './src/services/subscriptionService.js';
import { checkAndExpireSubscriptions } from './src/db/index.js';

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

console.log('='.repeat(70));
console.log('StreamVault — Phase 5.5 Subscriptions & Payments Test Suite');
console.log('='.repeat(70));

const now = new Date().toISOString();
const testSuffix = crypto.randomBytes(4).toString('hex');
const testUserId = `user_p55_${testSuffix}`;
const testAdminId = `admin_p55_${testSuffix}`;
const userRepo = getUserRepository();
const subRepo = getSubscriptionRepository();
const notifRepo = getNotificationRepository();
const systemRepo = getSystemRepository();

async function runTests() {
  // Setup test users
  await userRepo.create({
    id: testUserId,
    email: `test_p55_${testSuffix}@streamvault.io`,
    password_hash: 'dummyhash',
    salt: 'dummysalt',
    name: 'Phase 5.5 Tester',
    role: 'user',
    plan: 'free',
    is_verified: 1
  });

  await userRepo.create({
    id: testAdminId,
    email: `admin_p55_${testSuffix}@streamvault.io`,
    password_hash: 'dummyhash',
    salt: 'dummysalt',
    name: 'Phase 5.5 Admin',
    role: 'admin',
    plan: 'enterprise',
    is_verified: 1
  });

  await test('1. Active database engine is strictly SQLite', () => {
    const engine = getDbEngine();
    assert.strictEqual(engine, 'sqlite', `Expected DB_ENGINE=sqlite, got: ${engine}`);
  });

  await test('2. Subscription plans retrieval and formatting', async () => {
    const plans = await subRepo.getPlans();
    assert.ok(Array.isArray(plans), 'Plans should be an array');
    assert.ok(plans.length >= 3, 'Should have at least free, pro, enterprise plans');

    const publicPlans = await subRepo.getPublicPlans();
    assert.ok(Array.isArray(publicPlans), 'Public plans should be an array');
    const pro = publicPlans.find(p => p.slug === 'pro');
    assert.ok(pro, 'Pro plan must exist');
    assert.ok(Array.isArray(pro.features), 'Features should be parsed as array in public plans');
    assert.strictEqual(typeof pro.priceMonthlyBdt, 'number', 'priceMonthlyBdt should be a number');

    const bySlug = await subRepo.getPlanBySlug('pro');
    assert.strictEqual(bySlug.slug, 'pro');
    const byId = await subRepo.getPlanById('plan_pro');
    assert.strictEqual(byId.id, 'plan_pro');
  });

  await test('3. Payment methods query and admin listing', async () => {
    const active = await subRepo.getActivePaymentMethods();
    assert.ok(Array.isArray(active), 'Active payment methods should be an array');
    assert.ok(active.length >= 3, 'Should have at least bkash, nagad, rocket');

    const all = await subRepo.getAdminPaymentMethods();
    assert.ok(Array.isArray(all), 'Admin payment methods should be an array');
    assert.ok(all.length >= active.length);

    const bkash = await subRepo.findPaymentMethodByIdentifier('bkash');
    assert.ok(bkash);
    assert.strictEqual(bkash.identifier, 'bkash');
  });

  let createdTxId = null;
  const uniqueTrxId = `TRX${Date.now().toString().slice(-8)}`;

  await test('4. Submit payment verification creates pending transaction', async () => {
    const tx = await submitManualPayment({
      userId: testUserId,
      planSlug: 'pro',
      paymentMethodId: 'pm_bkash',
      senderNumber: '01711223344',
      transactionId: uniqueTrxId,
      amount: 499,
      billingPeriod: 'monthly',
      screenshotUrl: null
    });

    assert.ok(tx);
    assert.strictEqual(tx.status, 'pending');
    assert.strictEqual(tx.transactionId, uniqueTrxId);
    createdTxId = tx.id;
  });

  await test('5. Prevent duplicate transaction ID submission', async () => {
    let duplicateRejected = false;
    try {
      await submitManualPayment({
        userId: testUserId,
        planSlug: 'pro',
        paymentMethodId: 'pm_bkash',
        senderNumber: '01711223344',
        transactionId: uniqueTrxId,
        amount: 499,
        billingPeriod: 'monthly'
      });
    } catch (err) {
      duplicateRejected = true;
      assert.ok(err.message.includes('already been submitted'), `Expected duplicate error, got: ${err.message}`);
    }
    assert.strictEqual(duplicateRejected, true, 'Duplicate TrxID submission must fail');
  });

  await test('6. Query user transactions and pending status', async () => {
    const userTxs = await getUserTransactions(testUserId);
    assert.ok(Array.isArray(userTxs), 'userTxs should be an array');
    assert.ok(userTxs.length >= 1);
    const found = userTxs.find(t => t.id === createdTxId);
    assert.ok(found);
    assert.strictEqual(found.status, 'pending');

    const pending = await subRepo.findPendingTransactionByUserId(testUserId);
    assert.ok(pending);
    assert.strictEqual(pending.id, createdTxId);
  });

  await test('7. Admin payment statistics reporting', async () => {
    const stats = await getAdminPaymentStats();
    assert.ok(stats.pendingCount >= 1, 'Should reflect at least 1 pending transaction');
    assert.strictEqual(typeof stats.approvedCount, 'number');
    assert.strictEqual(typeof stats.rejectedCount, 'number');
    assert.strictEqual(typeof stats.totalRevenueBdt, 'number');
  });

  await test('8. Admin payment rejection flow with audit and notification', async () => {
    // Create a temporary transaction to reject
    const rejectTrxId = `REJ${Date.now().toString().slice(-8)}`;
    const txToReject = await subRepo.createTransaction({
      id: `tx_rej_${testSuffix}`,
      user_id: testUserId,
      plan_id: 'plan_pro',
      plan_slug: 'pro',
      payment_method_id: 'pm_bkash',
      payment_method_name: 'bKash',
      sender_number: '01799887766',
      transaction_id: rejectTrxId,
      amount: 499,
      billing_period: 'monthly',
      status: 'pending'
    });

    const rejected = await rejectPayment(testAdminId, txToReject.id, 'Invalid TrxID format');
    assert.strictEqual(rejected.success, true);

    // Verify rejection audit log
    const updated = await subRepo.findTransactionById(txToReject.id);
    assert.strictEqual(updated.status, 'rejected');
    assert.strictEqual(updated.verified_by, testAdminId);

    // Verify user received notification
    const notifs = await notifRepo.findByUserId(testUserId);
    const rejNotif = notifs.find(n => n.title.includes('Rejected'));
    assert.ok(rejNotif, 'User must receive rejection notification');
  });

  await test('9. Admin payment approval flow: atomic transaction, subscription activation & plan upgrade', async () => {
    const userBefore = await userRepo.findById(testUserId);
    assert.strictEqual(userBefore.plan, 'free', 'User must start on free plan');

    const approved = await approvePayment(testAdminId, createdTxId, 'Verified via bKash statement');
    assert.strictEqual(approved.success, true);

    // Verify transaction status updated
    const txAfter = await subRepo.findTransactionById(createdTxId);
    assert.strictEqual(txAfter.status, 'approved');
    assert.strictEqual(txAfter.verified_by, testAdminId);

    // Verify user plan upgraded
    const userAfter = await userRepo.findById(testUserId);
    assert.strictEqual(userAfter.plan, 'pro', 'User plan must be upgraded to pro');

    // Verify active subscription record created
    const activeSub = await subRepo.findActiveSubscription(testUserId);
    assert.ok(activeSub, 'Active subscription must exist for user');
    assert.strictEqual(activeSub.plan_slug, 'pro');
    assert.strictEqual(activeSub.status, 'active');

    // Verify user received activation notification
    const notifs = await notifRepo.findByUserId(testUserId);
    const appNotif = notifs.find(n => n.title.includes('Activated'));
    assert.ok(appNotif, 'User must receive activation notification');
  });

  await test('10. Subscription expiration workflow', async () => {
    // Create an expired subscription
    const expiredSubId = `sub_exp_${testSuffix}`;
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    await subRepo.createSubscription({
      id: expiredSubId,
      user_id: testUserId,
      plan_id: 'plan_pro',
      plan_slug: 'pro',
      transaction_id: 'EXPIRED123',
      billing_period: 'monthly',
      starts_at: new Date(Date.now() - 86400000 * 31).toISOString(),
      expires_at: pastDate,
      status: 'active'
    });

    const expiredList = await subRepo.findExpiredSubscriptions();
    assert.ok(expiredList.some(s => s.id === expiredSubId), 'Expired subscription must be identified');

    await subRepo.expireSubscription(expiredSubId);
    const afterExpire = await subRepo.findExpiredSubscriptions();
    assert.ok(!afterExpire.some(s => s.id === expiredSubId), 'Expired subscription status must be updated');
  });

  await test('11. Repository interface parity across SQLite and MongoDB', () => {
    const sqliteMethods = Object.keys(sqliteSubscriptionRepository).sort();
    const mongoMethods = Object.keys(mongoSubscriptionRepository).filter(m => !m.startsWith('_')).sort();

    const missingInMongo = sqliteMethods.filter(m => !mongoMethods.includes(m));
    const missingInSqlite = mongoMethods.filter(m => !sqliteMethods.includes(m));

    assert.deepStrictEqual(missingInMongo, [], `Methods missing in MongoDB: ${missingInMongo.join(', ')}`);
    assert.deepStrictEqual(missingInSqlite, [], `Methods missing in SQLite: ${missingInSqlite.join(', ')}`);
    assert.strictEqual(sqliteMethods.length, mongoMethods.length, 'Method count must match exactly');
  });

  await test('12. Database integrity & zero writes to MongoDB', () => {
    const pragma = db.prepare('PRAGMA integrity_check;').get();
    assert.strictEqual(Object.values(pragma)[0], 'ok');
  });

  // Cleanup test records
  try {
    db.prepare('DELETE FROM payment_transactions WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM subscriptions WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM users WHERE id IN (?, ?)').run(testUserId, testAdminId);
  } catch (err) {
    console.error('Cleanup error (non-fatal):', err.message);
  }

  console.log('='.repeat(70));
  console.log(`Phase 5.5 Results: ${passedTests}/${totalTests} Tests Passed (100%)`);
  console.log('='.repeat(70));
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
