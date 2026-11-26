import { hashPassword, verifyPassword, generateToken, sha256, generateId } from '../utils/crypto.js';
import { getUserRepository } from '../db/repositories/userRepository.js';
import { getSessionRepository } from '../db/repositories/sessionRepository.js';
import { getSystemRepository } from '../db/repositories/systemRepository.js';
import { getSubscriptionRepository } from '../db/repositories/subscriptionRepository.js';

const SESSION_LIFETIME_DAYS = 30;

/**
 * Register a new user
 */
export async function registerUser({ email, password, name }) {
  if (!email || !password || !name) {
    throw new Error('Email, password, and name are required.');
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Invalid email address format.');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }

  const userRepo = getUserRepository();
  const systemRepo = getSystemRepository();

  // Check duplicate email
  const existing = await userRepo.findByEmail(cleanEmail);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const { hash, salt } = hashPassword(password);
  const userId = generateId('usr');
  const now = new Date().toISOString();
  const referralCode = `SV-${generateToken(4).toUpperCase()}`;

  await userRepo.create({
    id: userId,
    email: cleanEmail,
    password_hash: hash,
    salt,
    name: name.trim(),
    role: 'user',
    plan: 'free',
    is_verified: 1,
    is_banned: 0,
    referral_code: referralCode,
    created_at: now,
    updated_at: now
  });

  await systemRepo.logActivity(userId, 'register', 'Account created successfully');

  return {
    id: userId,
    email: cleanEmail,
    name: name.trim(),
    role: 'user',
    plan: 'free',
    referralCode
  };
}

/**
 * Log in a user & generate a secure persistent session token
 */
export async function loginUser({ email, password, ipAddress, userAgent }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const userRepo = getUserRepository();
  const systemRepo = getSystemRepository();
  const sessionRepo = getSessionRepository();

  const user = await userRepo.findByEmail(cleanEmail);

  if (!user) {
    await systemRepo.recordLogin({
      userId: null,
      email: cleanEmail,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      status: 'failed'
    });
    throw new Error('Invalid email or password.');
  }

  if (user.is_banned === 1 || user.is_banned === true) {
    await systemRepo.recordLogin({
      userId: user.id,
      email: cleanEmail,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      status: 'failed'
    });
    throw new Error('This account has been suspended. Please contact support.');
  }

  const isValid = verifyPassword(password, user.password_hash, user.salt);
  if (!isValid) {
    await systemRepo.recordLogin({
      userId: user.id,
      email: cleanEmail,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      status: 'failed'
    });
    throw new Error('Invalid email or password.');
  }

  // Parallelize session creation, audit logging, and login history recording
  const rawToken = generateToken(32);
  const tokenHash = sha256(rawToken);
  const sessionId = generateId('sess');

  const expiresDate = new Date();
  expiresDate.setDate(expiresDate.getDate() + SESSION_LIFETIME_DAYS);
  const expiresAt = expiresDate.toISOString();
  const now = new Date().toISOString();

  await Promise.all([
    systemRepo.recordLogin({
      userId: user.id,
      email: cleanEmail,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      status: 'success'
    }),
    sessionRepo.create({
      id: sessionId,
      user_id: user.id,
      token_hash: tokenHash,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      expires_at: expiresAt,
      created_at: now,
      last_active_at: now
    }),
    systemRepo.logActivity(user.id, 'login', 'User signed in', ipAddress, userAgent)
  ]);

  return {
    token: rawToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      isVerified: !!user.is_verified,
      twoFactorEnabled: !!user.two_factor_enabled,
      referralCode: user.referral_code
    }
  };
}

/**
 * Validate a raw session token and return user profile
 */
export async function validateSession(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return null;

  const tokenHash = sha256(rawToken);
  const sessionRepo = getSessionRepository();
  const userRepo = getUserRepository();
  const subRepo = getSubscriptionRepository();

  const session = await sessionRepo.findByTokenHash(tokenHash);

  if (!session) return null;

  if (new Date(session.expires_at) < new Date() || session.is_banned === 1 || session.is_banned === true) {
    // Delete expired or banned session
    await sessionRepo.deleteById(session.id || session._id);
    return null;
  }

  // Update last active timestamp with 5-minute throttling to eliminate redundant write IOPS
  const lastActiveTime = session.last_active_at ? new Date(session.last_active_at).getTime() : 0;
  if (Date.now() - lastActiveTime > 5 * 60 * 1000) {
    await sessionRepo.touch(session.id || session._id);
  }

  // Dynamic subscription expiration verification (real-time enforcement)
  let activePlan = session.plan;
  if (activePlan !== 'free' && session.role !== 'admin') {
    const validSub = await subRepo.findActiveSubscription(session.user_id);

    if (!validSub) {
      await userRepo.updatePlan(session.user_id, 'free');
      await subRepo.expireUserSubscriptions(session.user_id);
      activePlan = 'free';
    }
  }

  return {
    sessionId: session.id || session._id,
    user: {
      id: session.user_id,
      email: session.email,
      name: session.name,
      role: session.role,
      plan: activePlan,
      twoFactorEnabled: !!session.two_factor_enabled,
      referralCode: session.referral_code
    }
  };
}

/**
 * Invalidate a session (Logout)
 */
export async function logoutUser(rawToken) {
  if (!rawToken) return;
  const tokenHash = sha256(rawToken);
  const sessionRepo = getSessionRepository();
  const systemRepo = getSystemRepository();

  const session = await sessionRepo.findByTokenHash(tokenHash);
  if (session) {
    await systemRepo.logActivity(session.user_id, 'logout', 'User logged out');
  }
  await sessionRepo.deleteByTokenHash(tokenHash);
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId, currentSessionId = '') {
  const sessionRepo = getSessionRepository();
  const sessions = await sessionRepo.findByUserId(userId);

  return sessions.map((s) => ({
    id: s.id || s._id,
    ip_address: s.ip_address,
    user_agent: s.user_agent,
    created_at: s.created_at,
    last_active_at: s.last_active_at,
    isCurrent: (s.id || s._id) === currentSessionId
  }));
}

/**
 * Revoke specific session
 */
export async function revokeSession(userId, sessionId) {
  const sessionRepo = getSessionRepository();
  const systemRepo = getSystemRepository();

  await sessionRepo.deleteByIdAndUserId(sessionId, userId);
  await systemRepo.logActivity(userId, 'session_revoked', `Revoked session ${sessionId}`);
}

/**
 * Change password
 */
export async function changePassword(userId, oldPassword, newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }

  const userRepo = getUserRepository();
  const sessionRepo = getSessionRepository();
  const systemRepo = getSystemRepository();

  const user = await userRepo.findById(userId);
  if (!user) throw new Error('User not found.');

  const isValid = verifyPassword(oldPassword, user.password_hash, user.salt);
  if (!isValid) throw new Error('Current password does not match.');

  const { hash, salt } = hashPassword(newPassword);

  await userRepo.updatePassword(userId, hash, salt);

  // Invalidate all other sessions for security
  await sessionRepo.deleteByUserId(userId);
  await systemRepo.logActivity(userId, 'password_change', 'Password changed successfully');
}

/**
 * Request password reset token
 */
export async function requestPasswordReset(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const userRepo = getUserRepository();

  const user = await userRepo.findByEmail(cleanEmail);

  if (!user) {
    // Return silently to avoid email enumeration
    return { success: true, message: 'If an account exists, a reset code has been sent.' };
  }

  const resetToken = generateToken(24);
  const tokenHash = sha256(resetToken);
  const expiresDate = new Date();
  expiresDate.setHours(expiresDate.getHours() + 1); // 1 hour validity

  const now = new Date().toISOString();
  await userRepo.createPasswordReset({
    userId: user.id,
    tokenHash,
    expiresAt: expiresDate.toISOString(),
    createdAt: now
  });

  return {
    success: true,
    resetToken, // In production this is sent via SMTP email; for local testing we return it
    message: 'Password reset token generated successfully.'
  };
}

/**
 * Reset password with token
 */
export async function resetPasswordWithToken(resetToken, newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }

  const tokenHash = sha256(resetToken);
  const userRepo = getUserRepository();
  const sessionRepo = getSessionRepository();

  const resetRow = await userRepo.findValidPasswordReset(tokenHash);

  if (!resetRow) {
    throw new Error('Invalid or expired password reset token.');
  }

  const { hash, salt } = hashPassword(newPassword);

  await userRepo.updatePassword(resetRow.user_id, hash, salt);

  // Mark reset token used and invalidate all sessions
  await userRepo.markPasswordResetUsed(resetRow.id || resetRow._id);
  await sessionRepo.deleteByUserId(resetRow.user_id);

  return { success: true, message: 'Password has been reset successfully. Please log in with your new password.' };
}

/**
 * Get user login history
 */
export async function getLoginHistory(userId, limit = 15) {
  const systemRepo = getSystemRepository();
  return await systemRepo.getLoginHistory(userId, limit);
}
