import { validateSession } from '../services/authService.js';

/**
 * Middleware: Requires a valid authenticated user
 */
export async function authenticateUser(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.query?.token) {
    token = String(req.query.token).trim();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in to access this feature.'
    });
  }

  try {
    const sessionData = await validateSession(token);
    if (!sessionData) {
      return res.status(401).json({
        success: false,
        error: 'Session expired or invalid. Please sign in again.'
      });
    }

    req.user = sessionData.user;
    req.sessionId = sessionData.sessionId;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed: ' + err.message
    });
  }
}

/**
 * Middleware: Optional authentication (attaches user if present, proceeds otherwise)
 */
export async function optionalAuth(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.query?.token) {
    token = String(req.query.token).trim();
  }

  if (token) {
    try {
      const sessionData = await validateSession(token);
      if (sessionData) {
        req.user = sessionData.user;
        req.sessionId = sessionData.sessionId;
        req.token = token;
      }
    } catch (err) {
      // Ignore optional auth error
    }
  }

  next();
}

/**
 * Middleware: Requires Administrator role
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrative privileges required.'
    });
  }
  next();
}

/**
 * Middleware: Plan-gated features
 */
export function requirePlan(requiredPlan = 'pro') {
  const planWeights = { free: 1, pro: 2, enterprise: 3 };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const userWeight = planWeights[req.user.plan] || 1;
    const requiredWeight = planWeights[requiredPlan] || 2;

    if (userWeight < requiredWeight) {
      return res.status(403).json({
        success: false,
        error: `This feature requires a ${requiredPlan.toUpperCase()} subscription. Please upgrade your plan.`
      });
    }

    next();
  };
}
