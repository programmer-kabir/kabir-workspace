// Phase 4 Automated Test Suite - Subscriptions, Manual Payment Verification & Billing
import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text) };
  } catch {
    return { status: res.status, ok: res.ok, body: text };
  }
}

async function runPhase4Tests() {
  console.log('🧪 Starting Phase 4 End-to-End Verification Suite...\n');
  let passed = 0;

  function pass(desc) {
    passed++;
    console.log(`  ✅ ${desc}`);
  }

  try {
    // 1. Public Plans Retrieval
    const plansRes = await request('/subscriptions/plans');
    assert.strictEqual(plansRes.status, 200);
    assert.strictEqual(plansRes.body.success, true);
    assert.ok(Array.isArray(plansRes.body.data));
    assert.ok(plansRes.body.data.length >= 3);
    const freePlan = plansRes.body.data.find(p => p.slug === 'free');
    const proPlan = plansRes.body.data.find(p => p.slug === 'pro');
    const entPlan = plansRes.body.data.find(p => p.slug === 'enterprise');
    assert.ok(freePlan && proPlan && entPlan);
    assert.strictEqual(freePlan.priceMonthlyBdt, 0);
    assert.strictEqual(proPlan.priceMonthlyBdt, 499);
    assert.strictEqual(proPlan.priceYearlyBdt, 4990);
    assert.strictEqual(entPlan.priceMonthlyBdt, 1499);
    pass('Public subscription plans retrieved (Free: ৳0, Pro: ৳499, Enterprise: ৳1499)');

    // 2. Active Payment Methods Retrieval
    const pmRes = await request('/subscriptions/payment-methods');
    assert.strictEqual(pmRes.status, 200);
    assert.strictEqual(pmRes.body.success, true);
    assert.ok(pmRes.body.data.some(m => m.identifier === 'bkash'));
    assert.ok(pmRes.body.data.some(m => m.identifier === 'nagad'));
    assert.ok(pmRes.body.data.some(m => m.identifier === 'rocket'));
    const bkashMethod = pmRes.body.data.find(m => m.identifier === 'bkash');
    pass(`Active payment methods retrieved (bKash personal number: ${bkashMethod.account_number})`);

    // 3. User Registration & Initial Plan Check
    const uniqueUser1 = `subscriber_${Date.now()}@test.io`;
    const regRes1 = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: uniqueUser1, password: 'Password123!', name: 'Tarek Rahman' })
    });
    assert.strictEqual(regRes1.status, 201);
    const tokenUser1 = regRes1.body.data.token;
    const userId1 = regRes1.body.data.user.id;
    pass('User 1 registered successfully');

    // 4. User Current Subscription Details
    const subRes1 = await request('/subscriptions/my-subscription', {
      headers: { Authorization: `Bearer ${tokenUser1}` }
    });
    assert.strictEqual(subRes1.status, 200);
    assert.strictEqual(subRes1.body.data.currentPlan, 'free');
    assert.strictEqual(subRes1.body.data.subscription, null);
    pass('User initial subscription is Free with no active paid subscription');

    // 5. Checkout Validation: Reject Invalid Plan
    const badPlanRes = await request('/subscriptions/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: JSON.stringify({
        planSlug: 'super_diamond',
        paymentMethodId: bkashMethod.id,
        senderNumber: '01711223344',
        transactionId: 'TX123456',
        amount: 499
      })
    });
    assert.strictEqual(badPlanRes.status, 400);
    assert.ok(badPlanRes.body.error.includes('valid paid plan'));
    pass('Validation: Rejected invalid subscription plan selection');

    // 6. Checkout Validation: Reject Invalid Sender Mobile
    const badMobileRes = await request('/subscriptions/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: JSON.stringify({
        planSlug: 'pro',
        paymentMethodId: bkashMethod.id,
        senderNumber: '12345',
        transactionId: 'TX123456',
        amount: 499
      })
    });
    assert.strictEqual(badMobileRes.status, 400);
    assert.ok(badMobileRes.body.error.includes('11-digit Bangladesh mobile number'));
    pass('Validation: Rejected invalid sender mobile format');

    // 7. Checkout Validation: Reject Incorrect Amount
    const badAmountRes = await request('/subscriptions/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: JSON.stringify({
        planSlug: 'pro',
        billingPeriod: 'monthly',
        paymentMethodId: bkashMethod.id,
        senderNumber: '01711223344',
        transactionId: 'TX123456',
        amount: 100 // Should be 499
      })
    });
    assert.strictEqual(badAmountRes.status, 400);
    assert.ok(badAmountRes.body.error.includes('costs ৳499 BDT'));
    pass('Validation: Rejected payment submission with mismatched amount');

    // 8. Successful Manual Payment Submission
    const validTrxId1 = `TRX_BKASH_${Date.now().toString().slice(-6)}`;
    const checkoutRes = await request('/subscriptions/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: JSON.stringify({
        planSlug: 'pro',
        billingPeriod: 'monthly',
        paymentMethodId: bkashMethod.id,
        senderNumber: '01711223344',
        transactionId: validTrxId1,
        amount: 499
      })
    });
    assert.strictEqual(checkoutRes.status, 201);
    assert.strictEqual(checkoutRes.body.success, true);
    assert.strictEqual(checkoutRes.body.data.status, 'pending');
    assert.strictEqual(checkoutRes.body.data.transactionId, validTrxId1);
    const transactionId1 = checkoutRes.body.data.id;
    pass(`Manual payment submitted successfully (TrxID: ${validTrxId1}, Status: Pending)`);

    // 9. Payment Status Is Pending & Plan Not Activated Automatically
    const subCheckPending = await request('/subscriptions/my-subscription', {
      headers: { Authorization: `Bearer ${tokenUser1}` }
    });
    assert.strictEqual(subCheckPending.body.data.currentPlan, 'free'); // Still free!
    assert.strictEqual(subCheckPending.body.data.pendingPayment.transactionId, validTrxId1);
    pass('Security: Plan remains Free while payment is pending review (no auto-activation)');

    // 10. Prevent Duplicate Transaction ID
    const dupTrxRes = await request('/subscriptions/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: JSON.stringify({
        planSlug: 'pro',
        billingPeriod: 'monthly',
        paymentMethodId: bkashMethod.id,
        senderNumber: '01711223344',
        transactionId: validTrxId1,
        amount: 499
      })
    });
    assert.strictEqual(dupTrxRes.status, 400);
    assert.ok(dupTrxRes.body.error.includes('already been submitted') || dupTrxRes.body.error.includes('already have a pending'));
    pass('Security: Prevented duplicate submission of same Transaction ID');

    // 11. User Transactions History Listing
    const myTrxRes = await request('/subscriptions/my-transactions', {
      headers: { Authorization: `Bearer ${tokenUser1}` }
    });
    assert.strictEqual(myTrxRes.status, 200);
    assert.strictEqual(myTrxRes.body.data.length, 1);
    assert.strictEqual(myTrxRes.body.data[0].transaction_id, validTrxId1);
    assert.strictEqual(myTrxRes.body.data[0].amount, 499);
    pass('User can view payment transaction history with status');

    // 12. Security Check: Non-Admin Cannot Access Admin Payment Endpoints
    const nonAdminStats = await request('/admin/payments/stats', {
      headers: { Authorization: `Bearer ${tokenUser1}` }
    });
    assert.strictEqual(nonAdminStats.status, 403);
    pass('RBAC: Non-admin user blocked from accessing Admin Payment routes (403 Forbidden)');

    // 13. Admin Login & Payment Stats
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@streamvault.io', password: 'AdminPassword123!' })
    });
    assert.strictEqual(adminLoginRes.status, 200);
    const adminToken = adminLoginRes.body.data.token;

    const adminStatsRes = await request('/admin/payments/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(adminStatsRes.status, 200);
    assert.ok(adminStatsRes.body.data.pendingCount >= 1);
    pass(`Admin Payment Stats verified (Pending Payments: ${adminStatsRes.body.data.pendingCount})`);

    // 14. Admin Filter & Search Transactions
    const adminListRes = await request(`/admin/payments/transactions?search=${validTrxId1}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(adminListRes.status, 200);
    assert.strictEqual(adminListRes.body.data.transactions.length, 1);
    assert.strictEqual(adminListRes.body.data.transactions[0].transaction_id, validTrxId1);
    pass('Admin can search and filter transactions by Transaction ID');

    // 15. User 2 - Register & Submit Payment For Rejection Testing
    const uniqueUser2 = `subscriber2_${Date.now()}@test.io`;
    const regRes2 = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: uniqueUser2, password: 'Password123!', name: 'Farhan Kabir' })
    });
    const tokenUser2 = regRes2.body.data.token;
    const fakeTrxId = `TRX_FAKE_${Date.now().toString().slice(-6)}`;
    const checkoutRes2 = await request('/subscriptions/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser2}` },
      body: JSON.stringify({
        planSlug: 'enterprise',
        billingPeriod: 'monthly',
        paymentMethodId: bkashMethod.id,
        senderNumber: '01811223344',
        transactionId: fakeTrxId,
        amount: 1499
      })
    });
    const transactionId2 = checkoutRes2.body.data.id;
    pass('User 2 submitted transaction for rejection verification');

    // 16. Admin Rejects Payment With Custom Reason
    const rejectRes = await request(`/admin/payments/transactions/${transactionId2}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ rejectionReason: 'Transaction ID not found in bKash merchant statement.' })
    });
    assert.strictEqual(rejectRes.status, 200);
    assert.strictEqual(rejectRes.body.success, true);
    pass('Admin rejected invalid transaction with custom reason');

    // 17. Verify User 2 Notification & Transaction Status
    const user2Trx = await request('/subscriptions/my-transactions', {
      headers: { Authorization: `Bearer ${tokenUser2}` }
    });
    assert.strictEqual(user2Trx.body.data[0].status, 'rejected');
    assert.strictEqual(user2Trx.body.data[0].admin_note, 'Transaction ID not found in bKash merchant statement.');

    const user2Notifs = await request('/notifications', {
      headers: { Authorization: `Bearer ${tokenUser2}` }
    });
    const notifs2 = user2Notifs.body.data.notifications || user2Notifs.body.data;
    assert.ok(notifs2.some(n => n.type === 'error' && n.message.includes('bKash merchant statement')));
    pass('User 2 received rejection notification with Admin explanation');

    // 18. Admin Approves User 1 Payment
    const approveRes = await request(`/admin/payments/transactions/${transactionId1}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ adminNote: 'Verified via bKash statement ID #99812' })
    });
    assert.strictEqual(approveRes.status, 200);
    assert.strictEqual(approveRes.body.success, true);
    pass('Admin manually verified and approved User 1 payment');

    // 19. Verify Subscription Activation & User Plan Upgrade
    const subCheckApproved = await request('/subscriptions/my-subscription', {
      headers: { Authorization: `Bearer ${tokenUser1}` }
    });
    assert.strictEqual(subCheckApproved.body.data.currentPlan, 'pro');
    assert.strictEqual(subCheckApproved.body.data.subscription.status, 'active');
    assert.ok(subCheckApproved.body.data.subscription.daysRemaining >= 29);
    assert.strictEqual(subCheckApproved.body.data.pendingPayment, null);
    pass('User 1 upgraded to Pro plan with active 30-day subscription');

    // 20. Verify User 1 Received In-App Notification
    const user1Notifs = await request('/notifications', {
      headers: { Authorization: `Bearer ${tokenUser1}` }
    });
    const notifs1 = user1Notifs.body.data.notifications || user1Notifs.body.data;
    assert.ok(notifs1.some(n => n.type === 'success' && n.title === 'Subscription Activated!'));
    pass('User 1 received Subscription Activated in-app notification');

    // 21. Admin Custom Payment Method Management (CRUD)
    const createPmRes = await request('/admin/payments/methods', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Upay Wallet',
        identifier: 'upay',
        accountNumber: '01899988776',
        accountType: 'Personal',
        instructions: 'Send Money to our Upay number and submit TrxID.'
      })
    });
    assert.strictEqual(createPmRes.status, 201);
    const newPmId = createPmRes.body.data.id;
    pass('Admin created new payment method (Upay)');

    // 22. Admin Updates Payment Method
    const updatePmRes = await request(`/admin/payments/methods/${newPmId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        accountNumber: '01899988000',
        isEnabled: false
      })
    });
    assert.strictEqual(updatePmRes.status, 200);
    pass('Admin updated payment method account number and disabled it');

    // 23. Admin Deletes Custom Payment Method
    const deletePmRes = await request(`/admin/payments/methods/${newPmId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(deletePmRes.status, 200);
    pass('Admin deleted custom payment method successfully');

    // 24. Public Extractor Remains Functional (Zero Regression)
    const extractRes = await request('/extract', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
    });
    assert.strictEqual(extractRes.status, 200);
    assert.strictEqual(extractRes.body.success, true);
    pass('Public /api/extract remains completely functional with zero regressions');

    console.log(`\n========================================`);
    console.log(`Phase 4 Tests Finished: ${passed} passed, 0 failed`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('\n❌ Phase 4 Test Assertion Failed:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

runPhase4Tests();
