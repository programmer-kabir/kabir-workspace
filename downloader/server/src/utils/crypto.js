import crypto from 'node:crypto';

/**
 * Hash a password using native crypto.scrypt
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt
  };
}

/**
 * Verify password against stored hash and salt with constant-time equality
 */
export function verifyPassword(password, storedHash, storedSalt) {
  try {
    const derivedKey = crypto.scryptSync(password, storedSalt, 64);
    const keyBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
    const hashBuffer = Buffer.from(storedHash, 'hex');
    return crypto.timingSafeEqual(keyBuffer, hashBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Generate a random cryptographically secure token
 */
export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a SHA-256 hash of a string (used to safely store session tokens & API keys)
 */
export function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Generate HMAC-SHA256 signature for webhooks
 */
export function hmacSha256(secret, payload) {
  const content = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
  return crypto.createHmac('sha256', secret).update(content).digest('hex');
}

/**
 * Generate a unique UUID-style ID
 */
export function generateId(prefix = '') {
  const rand = crypto.randomUUID();
  return prefix ? `${prefix}_${rand}` : rand;
}
