import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserSessions,
  revokeSession,
  changePassword,
  requestPasswordReset,
  resetPasswordWithToken,
  getLoginHistory
} from '../services/authService.js';
import { authenticateUser } from '../middleware/auth.js';
import {
  authEndpointLimiter,
  checkAccountLockout,
  validatePasswordStrength
} from '../middleware/authRateLimiter.js';

const router = express.Router();

/**
 * POST /api/auth/register
 */
router.post('/register', authEndpointLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    const pwdCheck = validatePasswordStrength(password);
    if (!pwdCheck.valid) {
      return res.status(400).json({ success: false, error: pwdCheck.error });
    }

    const user = await registerUser({ email, password, name });
    
    // Automatically log in after registration
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const session = await loginUser({ email, password, ipAddress, userAgent });

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', authEndpointLimiter, checkAccountLockout, async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const session = await loginUser({ email, password, ipAddress, userAgent });
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', authenticateUser, async (req, res) => {
  try {
    await logoutUser(req.token);
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', authenticateUser, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
      sessionId: req.sessionId
    }
  });
});

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', authEndpointLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const result = await requestPasswordReset(email);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', authEndpointLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const pwdCheck = validatePasswordStrength(newPassword);
    if (!pwdCheck.valid) {
      return res.status(400).json({ success: false, error: pwdCheck.error });
    }

    const result = await resetPasswordWithToken(token, newPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/change-password
 */
router.post('/change-password', authenticateUser, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const pwdCheck = validatePasswordStrength(newPassword);
    if (!pwdCheck.valid) {
      return res.status(400).json({ success: false, error: pwdCheck.error });
    }

    await changePassword(req.user.id, oldPassword, newPassword);
    res.json({ success: true, message: 'Password updated successfully. Other sessions have been revoked.' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/sessions
 */
router.get('/sessions', authenticateUser, async (req, res) => {
  try {
    const sessions = await getUserSessions(req.user.id, req.sessionId);
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/auth/sessions/:sessionId
 */
router.delete('/sessions/:sessionId', authenticateUser, async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (sessionId === req.sessionId) {
      return res.status(400).json({ success: false, error: 'Cannot revoke current active session. Use logout instead.' });
    }
    await revokeSession(req.user.id, sessionId);
    res.json({ success: true, message: 'Session revoked successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/login-history
 */
router.get('/login-history', authenticateUser, async (req, res) => {
  try {
    const history = await getLoginHistory(req.user.id);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
