import express from 'express';
import {
  getPublicPlans,
  getActivePaymentMethods,
  submitManualPayment,
  getUserTransactions,
  getUserSubscription
} from '../services/subscriptionService.js';
import { authenticateUser, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/subscriptions/plans
 * Public endpoint to view all available subscription tiers
 */
router.get('/plans', optionalAuth, async (req, res) => {
  try {
    const plans = await getPublicPlans();
    res.json({
      success: true,
      data: plans,
      userPlan: req.user?.plan || 'free'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/subscriptions/payment-methods
 * Public/authenticated endpoint to fetch active mobile wallets (bKash, Nagad, Rocket)
 */
router.get('/payment-methods', async (req, res) => {
  try {
    const methods = await getActivePaymentMethods();
    res.json({ success: true, data: methods });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/subscriptions/my-subscription
 * Authenticated: returns current user plan, days left, pending payment status
 */
router.get('/my-subscription', authenticateUser, async (req, res) => {
  try {
    const subscription = await getUserSubscription(req.user.id);
    res.json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/subscriptions/my-transactions
 * Authenticated: returns user's manual payment transaction history
 */
router.get('/my-transactions', authenticateUser, async (req, res) => {
  try {
    const transactions = await getUserTransactions(req.user.id);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/subscriptions/checkout
 * Authenticated: submits manual payment details (TrxID, sender number, amount, plan)
 */
router.post('/checkout', authenticateUser, async (req, res) => {
  try {
    const {
      planSlug,
      billingPeriod,
      paymentMethodId,
      senderNumber,
      transactionId,
      amount,
      screenshotUrl
    } = req.body;

    const result = await submitManualPayment({
      userId: req.user.id,
      planSlug,
      billingPeriod,
      paymentMethodId,
      senderNumber,
      transactionId,
      amount,
      screenshotUrl
    });

    res.status(201).json({
      success: true,
      message: 'Payment verification request submitted successfully. Pending Admin review.',
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
