import express from 'express';
import { logUserActivity } from '../db/index.js';
import { historyRepository } from '../db/repositories/index.js';
import { authenticateUser } from '../middleware/auth.js';
import { addJobToQueue } from '../services/queueService.js';

const router = express.Router();

/**
 * GET /api/history
 * Advanced search, filtering, and pagination
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const search = req.query.search || '';
    const platform = req.query.platform || '';
    const type = req.query.type || '';
    const dateFrom = req.query.dateFrom || '';
    const dateTo = req.query.dateTo || '';
    const sort = req.query.sort || 'DESC';

    const data = await historyRepository.findHistory({
      userId,
      search,
      platform,
      type,
      dateFrom,
      dateTo,
      sort,
      page,
      limit
    });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/history/:id
 * Single download record details
 */
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const item = await historyRepository.findByIdAndUserId(req.params.id, req.user.id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Record not found.' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/history/:id/retry
 * Re-queue this URL for download
 */
router.post('/:id/retry', authenticateUser, async (req, res) => {
  try {
    const item = await historyRepository.findByIdAndUserId(req.params.id, req.user.id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Record not found.' });
    }

    const result = await addJobToQueue({
      url: item.url,
      userId: req.user.id,
      userPlan: req.user.plan,
      formatId: item.format_id,
      type: item.type
    });

    logUserActivity(req.user.id, 'history_retry', { id: item.id, url: item.url });

    res.json({
      success: true,
      message: 'Download job re-queued.',
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/history/:id
 * Delete single record
 */
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const deleted = await historyRepository.deleteById(req.params.id, req.user.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Record not found or unauthorized.' });
    }

    logUserActivity(req.user.id, 'history_deleted', { id: req.params.id });

    res.json({ success: true, message: 'Record deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/history/bulk-delete
 * Delete multiple records
 */
router.post('/bulk-delete', authenticateUser, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Please provide an array of IDs to delete.' });
    }

    const changes = await historyRepository.deleteBulk(ids, req.user.id);

    logUserActivity(req.user.id, 'history_bulk_deleted', { count: changes });

    res.json({
      success: true,
      deletedCount: changes,
      message: `Successfully deleted ${changes} records.`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
