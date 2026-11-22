import rateLimit from 'express-rate-limit';
import { getSystemRepository } from '../db/repositories/systemRepository.js';

/**
 * Strict Rate Limiter for Authentication Endpoints (Registration & Login)
 * 15 requests per minute per IP in production; 100 in development/test
 */
export const authEndpointLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 15 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP address. Please wait a minute before trying again.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Account Brute-Force Protection Middleware
 * Checks if an email has 5 consecutive failed login attempts in the last 15 minutes
 */
export async function checkAccountLockout(req, res, next) {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    if (!email) return next();

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const systemRepo = getSystemRepository();

    // Count recent failed attempts for this email
    const failedCount = await systemRepo.countFailedLoginsSince(email, fifteenMinutesAgo);

    // If at least 5 failed attempts in the last 15 minutes, check if the last failure is after the last success
    if (failedCount >= 5) {
      const lastSuccessRow = await systemRepo.findLastLoginSuccess(email, fifteenMinutesAgo);
      const lastFailureRow = await systemRepo.findLastLoginFailure(email, fifteenMinutesAgo);

      // If no success after the failures, enforce temporary lockout
      if (!lastSuccessRow || (lastFailureRow && new Date(lastFailureRow.created_at) > new Date(lastSuccessRow.created_at))) {
        return res.status(429).json({
          success: false,
          error: 'Account temporarily locked due to multiple failed login attempts. Please wait 15 minutes or reset your password.',
          code: 'ACCOUNT_TEMPORARILY_LOCKED'
        });
      }
    }

    next();
  } catch (err) {
    console.error('Lockout check error:', err);
    next();
  }
}

/**
 * Password Strength Validator
 */
export function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required.' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }

  // Must contain at least one digit
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number.' };
  }

  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter.' };
  }

  return { valid: true };
}
