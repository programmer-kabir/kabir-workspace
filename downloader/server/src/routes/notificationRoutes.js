import express from 'express';
import { notificationRepository } from '../db/repositories/index.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Fetch user notifications with unread count
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const unreadOnly = req.query.unreadOnly === 'true';

    const data = await notificationRepository.findNotifications({
      userId,
      unreadOnly,
      page,
      limit
    });

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark single notification as read
 */
router.put('/:id/read', authenticateUser, async (req, res) => {
  try {
    const updated = await notificationRepository.markRead(req.params.id, req.user.id);

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Notification not found or unauthorized.' });
    }

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', authenticateUser, async (req, res) => {
  try {
    const updatedCount = await notificationRepository.markAllRead(req.user.id);

    res.json({
      success: true,
      updatedCount,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/notifications/clear-all
 * Clear all notifications
 */
router.delete('/clear-all', authenticateUser, async (req, res) => {
  try {
    const deletedCount = await notificationRepository.clearAll(req.user.id);

    res.json({
      success: true,
      deletedCount,
      message: 'All notifications cleared.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete single notification
 */
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const deleted = await notificationRepository.deleteById(req.params.id, req.user.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Notification not found or unauthorized.' });
    }

    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
