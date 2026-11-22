import { generateId } from '../utils/crypto.js';
import { dispatchWebhookEvent } from './webhookService.js';
import { getSubscriptionRepository } from '../db/repositories/subscriptionRepository.js';
import { getUserRepository } from '../db/repositories/userRepository.js';
import { getNotificationRepository } from '../db/repositories/notificationRepository.js';
import { getSystemRepository } from '../db/repositories/systemRepository.js';

/**
 * Validates screenshot URL or data URI to prevent XSS / SSRF / malicious payload injection
 */
export function validateScreenshotUrl(urlStr) {
  if (!urlStr) return null;
  const str = String(urlStr).trim();
  if (!str) return null;

  if (str.length > 2048) {
    throw new Error('Screenshot URL is too long (maximum 2048 characters).');
  }

  // Reject dangerous protocols
  const lower = str.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || lower.startsWith('file:')) {
    throw new Error('Dangerous protocol detected in screenshot URL.');
  }

  if (lower.startsWith('data:')) {
    if (!lower.startsWith('data:image/jpeg;') && !lower.startsWith('data:image/png;') && !lower.startsWith('data:image/webp;')) {
      throw new Error('Only image data URIs (JPEG, PNG, WebP) are allowed for payment screenshots.');
    }
    return str;
  }

  if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
    throw new Error('Screenshot must be a valid HTTP or HTTPS URL or an image data URI.');
  }

  return str;
}

/**
 * Get all active subscription plans for public & checkout
 */
export async function getPublicPlans() {
  const subRepo = getSubscriptionRepository();
  return await subRepo.getPublicPlans();
}

/**
 * Get enabled payment methods for checkout
 */
export async function getActivePaymentMethods() {
  const subRepo = getSubscriptionRepository();
  return await subRepo.getActivePaymentMethods();
}

/**
 * Submit manual payment verification request
 */
export async function submitManualPayment({
  userId,
  planSlug,
  billingPeriod = 'monthly',
  paymentMethodId,
  senderNumber,
  transactionId,
  amount,
  screenshotUrl = null
}) {
  if (!userId) throw new Error('User authentication is required.');
  if (!planSlug || (planSlug !== 'pro' && planSlug !== 'enterprise')) {
    throw new Error('Please select a valid paid plan (Pro or Enterprise).');
  }

  const cleanPeriod = billingPeriod === 'yearly' ? 'yearly' : 'monthly';
  const subRepo = getSubscriptionRepository();
  const notifRepo = getNotificationRepository();
  const systemRepo = getSystemRepository();

  // 1. Validate Plan
  const plan = await subRepo.getPlanBySlug(planSlug);
  if (!plan || !plan.is_active) throw new Error('Selected subscription plan is not available.');

  // Expected amount
  const expectedAmount = cleanPeriod === 'yearly' ? plan.price_yearly_bdt : plan.price_monthly_bdt;
  const numAmount = parseInt(amount, 10);
  if (isNaN(numAmount) || numAmount !== expectedAmount) {
    throw new Error(`Invalid amount. The ${plan.name} (${cleanPeriod}) costs ৳${expectedAmount} BDT. You provided ৳${numAmount}.`);
  }

  // 2. Validate Payment Method
  const method = await subRepo.findPaymentMethodById(paymentMethodId);
  if (!method || !method.is_enabled) throw new Error('Invalid or disabled payment method selected.');

  // 3. Validate Sender Mobile Number
  const cleanSender = (senderNumber || '').trim().replace(/[^0-9]/g, '');
  if (!cleanSender || cleanSender.length < 11 || !cleanSender.startsWith('01')) {
    throw new Error('Please provide a valid 11-digit Bangladesh mobile number (e.g. 017xxxxxxxx).');
  }

  // 4. Validate Transaction ID (TrxID)
  const cleanTrxId = (transactionId || '').trim().toUpperCase();
  if (!cleanTrxId || cleanTrxId.length < 6) {
    throw new Error('Please enter a valid Transaction ID (at least 6 characters from your SMS/app receipt).');
  }

  // Check unique Transaction ID
  const existingTrx = await subRepo.findTransactionByTrxId(cleanTrxId);
  if (existingTrx) {
    throw new Error(`This Transaction ID (${cleanTrxId}) has already been submitted (Status: ${existingTrx.status}). If you think this is an error, please contact support.`);
  }

  // Check if user already has a pending payment for the same plan
  const existingPending = await subRepo.findPendingTransactionByUserId(userId);
  if (existingPending) {
    throw new Error(`You already have a pending payment verification request (TrxID: ${existingPending.transaction_id}). Please wait for Admin review before submitting another request.`);
  }

  const txId = generateId('trx');
  const now = new Date().toISOString();

  await subRepo.createTransaction({
    id: txId,
    user_id: userId,
    plan_id: plan.id,
    plan_slug: plan.slug,
    payment_method_id: method.id,
    payment_method_name: method.name,
    sender_number: cleanSender,
    transaction_id: cleanTrxId,
    amount: expectedAmount,
    billing_period: cleanPeriod,
    status: 'pending',
    screenshot_url: validateScreenshotUrl(screenshotUrl),
    created_at: now,
    updated_at: now
  });

  // Send in-app notification to user
  await notifRepo.create({
    user_id: userId,
    title: 'Payment Submitted',
    message: `Your payment of ৳${expectedAmount} via ${method.name} (TrxID: ${cleanTrxId}) for the ${plan.name} has been submitted. Our team will verify and activate your subscription shortly.`,
    type: 'info',
    is_read: 0,
    created_at: now
  });

  await systemRepo.logActivity(userId, 'payment_submitted', {
    transactionId: cleanTrxId,
    plan: plan.slug,
    method: method.name,
    amount: expectedAmount
  });

  return {
    id: txId,
    transactionId: cleanTrxId,
    planName: plan.name,
    amount: expectedAmount,
    method: method.name,
    status: 'pending',
    message: 'Your payment details have been recorded. Admin will manually verify your Transaction ID and activate your plan.'
  };
}

/**
 * Get user's payment history
 */
export async function getUserTransactions(userId) {
  const subRepo = getSubscriptionRepository();
  return await subRepo.getUserTransactions(userId);
}

/**
 * Get user's active subscription details & days remaining
 */
export async function getUserSubscription(userId) {
  const userRepo = getUserRepository();
  const subRepo = getSubscriptionRepository();

  const user = await userRepo.findById(userId);
  if (!user) throw new Error('User not found.');

  const plan = (await subRepo.getPlanBySlug(user.plan)) || {
    name: 'Free Tier',
    slug: 'free',
    price_monthly_bdt: 0,
    daily_download_quota: 15,
    monthly_download_quota: 250,
    api_rpm: 20,
    api_monthly_quota: 1000,
    max_concurrent_jobs: 1
  };

  const activeSub = await subRepo.findActiveSubscription(userId);
  const pendingPayment = await subRepo.findPendingTransactionByUserId(userId);

  let daysRemaining = null;
  if (activeSub && activeSub.expires_at) {
    const diffMs = new Date(activeSub.expires_at).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  return {
    currentPlan: user.plan,
    planDetails: {
      name: plan.name,
      slug: plan.slug,
      dailyQuota: plan.daily_download_quota,
      monthlyQuota: plan.monthly_download_quota,
      apiRpm: plan.api_rpm,
      apiMonthlyQuota: plan.api_monthly_quota,
      maxConcurrentJobs: plan.max_concurrent_jobs
    },
    subscription: activeSub ? {
      id: activeSub.id,
      billingPeriod: activeSub.billing_period,
      startsAt: activeSub.starts_at,
      expiresAt: activeSub.expires_at,
      daysRemaining,
      status: activeSub.status
    } : null,
    pendingPayment: pendingPayment ? {
      id: pendingPayment.id,
      transactionId: pendingPayment.transaction_id,
      planSlug: pendingPayment.plan_slug,
      methodName: pendingPayment.payment_method_name,
      amount: pendingPayment.amount,
      createdAt: pendingPayment.created_at
    } : null
  };
}

// ------------------- Admin Management Functions -------------------

/**
 * Get all payment methods (Admin)
 */
export async function getAdminPaymentMethods() {
  const subRepo = getSubscriptionRepository();
  return await subRepo.getAdminPaymentMethods();
}

/**
 * Create custom payment method (Admin)
 */
export async function createPaymentMethod({ name, identifier, accountNumber, accountType = 'Personal', instructions, isEnabled = true }) {
  if (!name || !identifier || !accountNumber) {
    throw new Error('Name, identifier, and account number are required.');
  }

  const cleanIdent = identifier.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const subRepo = getSubscriptionRepository();

  const existing = await subRepo.findPaymentMethodByIdentifier(cleanIdent);
  if (existing) {
    throw new Error(`A payment method with identifier '${cleanIdent}' already exists.`);
  }

  const id = generateId('pm');
  return await subRepo.createPaymentMethod({
    id,
    name,
    identifier: cleanIdent,
    account_number: accountNumber,
    account_type: accountType,
    instructions,
    is_enabled: isEnabled
  });
}

/**
 * Update payment method (Admin)
 */
export async function updatePaymentMethod(id, { name, accountNumber, accountType, instructions, isEnabled }) {
  const subRepo = getSubscriptionRepository();
  const existing = await subRepo.findPaymentMethodById(id);
  if (!existing) throw new Error('Payment method not found.');

  await subRepo.updatePaymentMethod(id, {
    name,
    account_number: accountNumber,
    account_type: accountType,
    instructions,
    is_enabled: isEnabled
  });

  return { success: true };
}

/**
 * Delete payment method (Admin)
 */
export async function deletePaymentMethod(id) {
  const subRepo = getSubscriptionRepository();
  const success = await subRepo.deletePaymentMethod(id);
  if (!success) throw new Error('Payment method not found.');
  return { success: true };
}

/**
 * Get payment transactions with pagination & filters (Admin)
 */
export async function getAdminTransactions({ status = 'all', search = '', page = 1, limit = 20 }) {
  const subRepo = getSubscriptionRepository();
  return await subRepo.getAdminTransactions({ status, search, page, limit });
}

/**
 * Get Admin Payment & Revenue Statistics
 */
export async function getAdminPaymentStats() {
  const subRepo = getSubscriptionRepository();
  return await subRepo.getAdminPaymentStats();
}

/**
 * Manually Approve Payment & Activate Subscription (Admin) - Atomic & Idempotent
 */
export async function approvePayment(adminId, transactionId, adminNote = null) {
  const subRepo = getSubscriptionRepository();
  const trx = await subRepo.findTransactionById(transactionId);
  if (!trx) throw new Error('Transaction record not found.');

  if (trx.status === 'approved') {
    throw new Error('This payment transaction has already been approved.');
  }

  if (trx.status === 'rejected') {
    throw new Error('Cannot approve a payment transaction that was already marked as rejected.');
  }

  const plan = await subRepo.getPlanById(trx.plan_id);
  if (!plan) throw new Error('Subscription plan not found.');

  const now = new Date();
  const startsAt = now.toISOString();

  // Expiration calculation: monthly = +30 days, yearly = +365 days
  const expiresDate = new Date();
  if (trx.billing_period === 'yearly') {
    expiresDate.setDate(expiresDate.getDate() + 365);
  } else {
    expiresDate.setDate(expiresDate.getDate() + 30);
  }
  const expiresAt = expiresDate.toISOString();

  const subId = generateId('sub');

  await subRepo.approvePaymentTransaction({
    adminId,
    transactionId: trx.id,
    adminNote,
    subId,
    startsAt,
    expiresAt,
    plan,
    trx
  });

  dispatchWebhookEvent(trx.user_id, 'subscription.activated', {
    user_id: trx.user_id,
    plan: plan.slug,
    billing_period: trx.billing_period,
    starts_at: startsAt,
    expires_at: expiresAt
  });

  return {
    success: true,
    message: `Payment verified. User has been upgraded to ${plan.name}.`,
    subscriptionId: subId,
    expiresAt
  };
}

/**
 * Manually Reject Payment (Admin) - Atomic & Idempotent
 */
export async function rejectPayment(adminId, transactionId, rejectionReason) {
  if (!rejectionReason || !rejectionReason.trim()) {
    throw new Error('Please provide a reason for rejecting this payment.');
  }

  const subRepo = getSubscriptionRepository();
  const trx = await subRepo.findTransactionById(transactionId);
  if (!trx) throw new Error('Transaction record not found.');

  if (trx.status === 'approved') {
    throw new Error('Cannot reject a transaction that has already been approved.');
  }

  if (trx.status === 'rejected') {
    throw new Error('This transaction has already been rejected.');
  }

  const now = new Date().toISOString();

  await subRepo.rejectPaymentTransaction({
    adminId,
    transactionId: trx.id,
    rejectionReason,
    now
  });

  return {
    success: true,
    message: 'Payment rejected and user has been notified.'
  };
}
