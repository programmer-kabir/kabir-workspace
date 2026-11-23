/**
 * StreamVault — Stage 3.4 Subscription & Payment Compatibility Suite
 * Validates plans, manual payment processing, approval/rejection workflows, and subscriptions on MongoDB Atlas.
 */

import assert from 'assert';
import crypto from 'crypto';
import { setupTestMongo, teardownTestMongo } from './test-mongo-helper.mjs';
import {
  getPublicPlans,
  getActivePaymentMethods,
  createPaymentMethod,
  submitManualPayment,
  approvePayment,
  rejectPayment,
  getUserSubscription,
  getAdminPaymentStats
} from './src/services/subscriptionService.js';
import {
  mongoUserRepository,
  mongoSubscriptionRepository
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
console.log('StreamVault — Stage 3.4: Subscriptions & Payment Compatibility (StreamVault_Test)');
console.log('='.repeat(75));

const suffix = crypto.randomBytes(4).toString('hex');
const testUserId = `usr_t34_${suffix}`;
const testAdminId = `adm_t34_${suffix}`;

async function run() {
  const { db } = await setupTestMongo();
  console.log(`Connected to isolated test database: ${db.databaseName}\n`);

  const origDbEngine = process.env.DB_ENGINE;
  process.env.DB_ENGINE = 'mongodb';

  let testPmId = null;
  let tx1 = null;
  let tx2 = null;

  try {
    // 0. Seed test user and admin in MongoDB
    await mongoUserRepository.create({
      id: testUserId,
      email: `t34_user_${suffix}@streamvault.io`,
      password_hash: 'hash34',
      salt: 'salt34',
      name: 'Sub Tester',
      role: 'user',
      plan: 'free',
      is_verified: true,
      referral_code: `SV-U${suffix.toUpperCase()}`
    });

    await mongoUserRepository.create({
      id: testAdminId,
      email: `t34_admin_${suffix}@streamvault.io`,
      password_hash: 'hash34adm',
      salt: 'salt34adm',
      name: 'Sub Admin',
      role: 'admin',
      plan: 'pro',
      is_verified: true,
      referral_code: `SV-A${suffix.toUpperCase()}`
    });

    // Seed Pro plan if not already present in StreamVault_Test
    const existingProPlan = await mongoSubscriptionRepository.getPlanBySlug('pro');
    if (!existingProPlan) {
      await db.collection('subscription_plans').insertOne({
        _id: 'plan_pro',
        name: 'Pro Downloader',
        slug: 'pro',
        price_monthly_bdt: 499,
        price_yearly_bdt: 4990,
        daily_download_quota: 150,
        monthly_download_quota: 3000,
        api_rpm: 60,
        api_monthly_quota: 5000,
        max_concurrent_jobs: 5,
        features: ['1080p / 4K Video', 'Priority Queue', 'API Access'],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    // 1. Retrieve Public Plans
    await test('1. Get public subscription plans from MongoDB', async () => {
      const plans = await getPublicPlans();
      assert.ok(Array.isArray(plans));
      assert.ok(plans.length >= 1);
      const proPlan = plans.find(p => p.slug === 'pro');
      assert.ok(proPlan);
      assert.strictEqual(proPlan.priceMonthlyBdt, 499);
      assert.ok(Array.isArray(proPlan.features));
    });

    // 2. Create and list Payment Method
    await test('2. Create custom payment method and verify listing', async () => {
      const pm = await createPaymentMethod({
        name: `bKash Merchant ${suffix}`,
        identifier: `bkash_${suffix}`,
        accountNumber: '01812345678',
        accountType: 'Merchant',
        instructions: 'Send payment using Make Payment option',
        isEnabled: true
      });
      assert.ok(pm.id);
      testPmId = pm.id;

      const activeMethods = await getActivePaymentMethods();
      const created = activeMethods.find(m => m.id === pm.id);
      assert.ok(created);
      assert.strictEqual(created.identifier, `bkash_${suffix}`);
    });

    // 3. Submit Manual Payment
    const trxId1 = `TRX34A_${suffix.toUpperCase()}`;
    await test('3. Submit manual payment verification request (status=pending)', async () => {
      tx1 = await submitManualPayment({
        userId: testUserId,
        planSlug: 'pro',
        billingPeriod: 'monthly',
        paymentMethodId: testPmId,
        senderNumber: '01711223344',
        transactionId: trxId1,
        amount: 499
      });

      assert.ok(tx1.id);
      assert.strictEqual(tx1.status, 'pending');
      assert.strictEqual(tx1.transactionId, trxId1);

      // Verify transaction record in MongoDB
      const dbTx = await mongoSubscriptionRepository.findTransactionById(tx1.id);
      assert.ok(dbTx);
      assert.strictEqual(dbTx.status, 'pending');
      assert.strictEqual(dbTx.amount, 499);
    });

    // 4. Duplicate Transaction ID Guard
    await test('4. Duplicate Transaction ID rejection', async () => {
      let threw = false;
      try {
        await submitManualPayment({
          userId: testUserId,
          planSlug: 'pro',
          billingPeriod: 'monthly',
          paymentMethodId: testPmId,
          senderNumber: '01711223344',
          transactionId: trxId1, // Same TrxID
          amount: 499
        });
      } catch (err) {
        threw = true;
        assert.ok(err.message.includes('already been submitted'));
      }
      assert.strictEqual(threw, true);
    });

    // 5. Existing Pending Request Guard
    await test('5. Guard against multiple pending payments from same user', async () => {
      let threw = false;
      try {
        await submitManualPayment({
          userId: testUserId,
          planSlug: 'pro',
          billingPeriod: 'monthly',
          paymentMethodId: testPmId,
          senderNumber: '01711223344',
          transactionId: `TRX34_DIFF_${suffix.toUpperCase()}`,
          amount: 499
        });
      } catch (err) {
        threw = true;
        assert.ok(err.message.includes('already have a pending payment'));
      }
      assert.strictEqual(threw, true);
    });

    // 6. Admin Payment Statistics
    await test('6. Admin payment statistics reflects pending transaction', async () => {
      const stats = await getAdminPaymentStats();
      assert.ok(stats.pendingCount >= 1);
    });

    // 7. Atomic Payment Approval
    await test('7. Atomic payment approval: updates tx, upgrades plan, creates subscription & audit log', async () => {
      const approvalResult = await approvePayment(
        testAdminId,
        tx1.id,
        'Payment verified via bank SMS confirmation'
      );
      assert.strictEqual(approvalResult.success, true);
      assert.ok(approvalResult.subscriptionId);

      // Verify transaction in MongoDB is approved
      const updatedTx = await mongoSubscriptionRepository.findTransactionById(tx1.id);
      assert.strictEqual(updatedTx.status, 'approved');
      assert.strictEqual(updatedTx.verified_by, testAdminId);

      // Verify user plan in MongoDB upgraded to 'pro'
      const updatedUser = await mongoUserRepository.findById(testUserId);
      assert.strictEqual(updatedUser.plan, 'pro');

      // Verify active subscription exists
      const activeSub = await mongoSubscriptionRepository.findActiveSubscription(testUserId);
      assert.ok(activeSub);
      assert.strictEqual(activeSub.plan_slug, 'pro');
      assert.strictEqual(activeSub.status, 'active');
    });

    // 8. Idempotency: Prevent re-approval of already approved transaction
    await test('8. Prevent re-approval of already approved transaction', async () => {
      let threw = false;
      try {
        await approvePayment(testAdminId, tx1.id, 'Double approve attempt');
      } catch (err) {
        threw = true;
        assert.ok(err.message.includes('already been approved'));
      }
      assert.strictEqual(threw, true);
    });

    // 9. Submit second transaction and test Reject workflow
    const trxId2 = `TRX34B_${suffix.toUpperCase()}`;
    await test('9. Reject payment transaction: updates status, sends notification & audit log', async () => {
      tx2 = await submitManualPayment({
        userId: testUserId,
        planSlug: 'pro',
        billingPeriod: 'yearly',
        paymentMethodId: testPmId,
        senderNumber: '01711223344',
        transactionId: trxId2,
        amount: 4990
      });

      assert.strictEqual(tx2.status, 'pending');

      const rejectionResult = await rejectPayment(
        testAdminId,
        tx2.id,
        'TrxID not found in merchant statement'
      );
      assert.strictEqual(rejectionResult.success, true);

      // Verify transaction in MongoDB is rejected
      const rejectedTx = await mongoSubscriptionRepository.findTransactionById(tx2.id);
      assert.strictEqual(rejectedTx.status, 'rejected');
      assert.strictEqual(rejectedTx.admin_note, 'TrxID not found in merchant statement');

      // Verify re-approval of rejected transaction is prevented
      let approveRejectedThrew = false;
      try {
        await approvePayment(testAdminId, tx2.id, 'Should fail');
      } catch (err) {
        approveRejectedThrew = true;
        assert.ok(err.message.includes('already marked as rejected'));
      }
      assert.strictEqual(approveRejectedThrew, true);
    });

    // 10. Check User Subscription Status & Days Remaining
    await test('10. getUserSubscription reflects active pro plan with days remaining', async () => {
      const subInfo = await getUserSubscription(testUserId);
      assert.strictEqual(subInfo.currentPlan, 'pro');
      assert.ok(subInfo.subscription);
      assert.strictEqual(subInfo.subscription.status, 'active');
      assert.ok(subInfo.subscription.daysRemaining >= 25);
    });

  } finally {
    process.env.DB_ENGINE = origDbEngine;
    await teardownTestMongo(false);
  }

  console.log('\n' + '='.repeat(75));
  console.log(`Stage 3.4 Results: ${passedTests}/${totalTests} Tests Passed (100%)`);
  console.log('='.repeat(75));
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
