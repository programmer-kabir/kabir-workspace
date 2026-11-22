import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { getUserRepository } from '../db/repositories/userRepository.js';
import { getSystemRepository } from '../db/repositories/systemRepository.js';

const router = express.Router();

/**
 * GET /api/user/stats
 * Real user analytics & quota monitoring
 */
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const userRepo = getUserRepository();
    const stats = await userRepo.getUserStats(req.user.id, req.user.plan || 'free');
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/user/activity
 * Paginated user audit trail
 */
router.get('/activity', authenticateUser, async (req, res) => {
  try {
    const systemRepo = getSystemRepository();
    const result = await systemRepo.findUserActivityPaginated({
      userId: req.user.id,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/user/profile
 */
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const userRepo = getUserRepository();
    const user = await userRepo.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json({
      success: true,
      data: {
        id: user.id || user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        is_verified: user.is_verified,
        referral_code: user.referral_code,
        created_at: user.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/user/profile
 */
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required.' });
    }

    const userRepo = getUserRepository();
    const systemRepo = getSystemRepository();

    await userRepo.updateName(req.user.id, name.trim());
    await systemRepo.logActivity(req.user.id, 'profile_updated', `Name changed to ${name.trim()}`);

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
