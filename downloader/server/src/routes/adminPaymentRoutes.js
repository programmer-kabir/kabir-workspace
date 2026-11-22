import express from 'express';
import {
  getAdminPaymentStats,
  getAdminTransactions,
  approvePayment,
  rejectPayment,
  getAdminPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
} from '../services/subscriptionService.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Strict security: All admin payment routes require authenticated Administrator role
router.use(authenticateUser);
router.use(requireAdmin);

/**
 * GET /api/admin/payments/stats
 * Financial overview: pending, approved, rejected, total revenue in BDT
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getAdminPaymentStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/payments/transactions
 * List all manual payment submissions with search & filters
 */
router.get('/transactions', async (req, res) => {
  try {
    const { status = 'all', search = '', page = 1, limit = 20 } = req.query;
    const result = await getAdminTransactions({
      status: String(status),
      search: String(search),
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 20))
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/payments/transactions/:id/approve
 * Manually verify payment & immediately activate user plan
 */
router.post('/transactions/:id/approve', async (req, res) => {
  try {
    const { adminNote } = req.body;
    const result = await approvePayment(req.user.id, req.params.id, adminNote);
    res.json({ success: true, message: result.message, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/payments/transactions/:id/reject
 * Reject payment with mandatory reason and notify user
 */
router.post('/transactions/:id/reject', async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        error: 'A reason for payment rejection is required so the user knows what went wrong.'
      });
    }
    const result = await rejectPayment(req.user.id, req.params.id, rejectionReason);
    res.json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/payments/methods
 * List all configured payment methods (active and disabled)
 */
router.get('/methods', async (req, res) => {
  try {
    const methods = await getAdminPaymentMethods();
    res.json({ success: true, data: methods });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/payments/methods
 * Create custom payment gateway / wallet
 */
router.post('/methods', async (req, res) => {
  try {
    const { name, identifier, accountNumber, accountType, instructions, isEnabled } = req.body;
    const created = await createPaymentMethod({
      name,
      identifier,
      accountNumber,
      accountType,
      instructions,
      isEnabled
    });
    res.status(201).json({
      success: true,
      message: `Payment method '${created.name}' created successfully.`,
      data: created
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/admin/payments/methods/:id
 * Update payment method details
 */
router.put('/methods/:id', async (req, res) => {
  try {
    const { name, accountNumber, accountType, instructions, isEnabled } = req.body;
    await updatePaymentMethod(req.params.id, {
      name,
      accountNumber,
      accountType,
      instructions,
      isEnabled
    });
    res.json({ success: true, message: 'Payment method updated successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/admin/payments/methods/:id
 * Delete custom payment method
 */
router.delete('/methods/:id', async (req, res) => {
  try {
    await deletePaymentMethod(req.params.id);
    res.json({ success: true, message: 'Payment method deleted successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
