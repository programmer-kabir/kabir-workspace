import express from 'express';
import { logUserActivity } from '../db/index.js';
import { favoriteRepository } from '../db/repositories/index.js';
import { authenticateUser } from '../middleware/auth.js';
import { isValidHttpUrl, detectPlatform } from '../utils/platformDetector.js';

const router = express.Router();

/**
 * GET /api/favorites
 * List favorites with optional search, platform & collection filters
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const search = req.query.search || '';
    const platform = req.query.platform || '';
    const collection = req.query.collection || '';

    const data = await favoriteRepository.findFavorites({
      userId,
      search,
      platform,
      collection,
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
 * POST /api/favorites
 * Add or update a favorite URL
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { url, title, platform, thumbnail, duration, collection = 'General' } = req.body;

    if (!url || !isValidHttpUrl(url)) {
      return res.status(400).json({ success: false, error: 'A valid HTTP/HTTPS URL is required.' });
    }

    const detected = detectPlatform(url);
    const resolvedPlatform = platform || detected.name;
    const resolvedTitle = (title || 'Saved Video').trim();
    const cleanCollection = (collection || 'General').trim();

    const saved = await favoriteRepository.upsert({
      userId,
      url: url.trim(),
      platform: resolvedPlatform,
      title: resolvedTitle,
      thumbnail: thumbnail || null,
      duration: duration || null,
      collection: cleanCollection
    });

    logUserActivity(userId, 'favorite_added', { url: url.trim(), title: resolvedTitle, collection: cleanCollection });

    res.status(201).json({
      success: true,
      message: 'Added to favorites.',
      data: saved
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/favorites/:id
 * Remove favorite
 */
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const deleted = await favoriteRepository.deleteById(req.params.id, req.user.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Favorite not found or unauthorized.' });
    }

    logUserActivity(req.user.id, 'favorite_removed', { id: req.params.id });

    res.json({ success: true, message: 'Removed from favorites.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
