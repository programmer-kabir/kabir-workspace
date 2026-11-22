import { generateToken, sha256, generateId } from '../utils/crypto.js';
import { getApiKeyRepository } from '../db/repositories/apiKeyRepository.js';
import { getUserRepository } from '../db/repositories/userRepository.js';
import { getSubscriptionRepository } from '../db/repositories/subscriptionRepository.js';
import { getSystemRepository } from '../db/repositories/systemRepository.js';

/**
 * Create a new API Key for a user
 */
export async function createApiKey({ userId, name, expiresAt = null }) {
  if (!userId) throw new Error('User ID is required.');
  const keyName = (name || 'Default API Key').trim();

  const userRepo = getUserRepository();
  const apiKeyRepo = getApiKeyRepository();
  const systemRepo = getSystemRepository();

  const user = await userRepo.findById(userId);
  if (!user) throw new Error('User not found.');
  if (user.is_banned === 1 || user.is_banned === true) throw new Error('Account suspended.');

  // Check key limit by plan
  let maxKeys = 2;
  let defaultQuota = 1000;
  if (user.plan === 'enterprise') {
    maxKeys = 50;
    defaultQuota = 500000;
  } else if (user.plan === 'pro') {
    maxKeys = 10;
    defaultQuota = 25000;
  }

  const currentKeysCount = await apiKeyRepo.countActiveKeysByUserId(userId);

  if (currentKeysCount >= maxKeys) {
    throw new Error(`Your ${user.plan} plan allows up to ${maxKeys} active API keys. Please revoke an existing key to create a new one.`);
  }

  // Generate standard secure API Key: sk_live_<48 hex chars>
  const randomEntropy = generateToken(24);
  const rawKey = `sk_live_${randomEntropy}`;
  const keyHash = sha256(rawKey);
  const keyId = generateId('key');
  const now = new Date().toISOString();

  // Prefix mask: sk_live_a1b2...9f8e
  const keyPrefix = `sk_live_${randomEntropy.slice(0, 4)}...${randomEntropy.slice(-4)}`;

  await apiKeyRepo.createKey({
    id: keyId,
    user_id: userId,
    name: keyName,
    key_prefix: keyPrefix,
    key_hash: keyHash,
    status: 'active',
    is_enabled: 1,
    monthly_quota: defaultQuota,
    requests_this_month: 0,
    expires_at: expiresAt || null,
    created_at: now
  });

  await systemRepo.logActivity(userId, 'api_key_created', { keyId, name: keyName, keyPrefix });

  return {
    rawKey, // Returned ONLY ONCE upon creation
    key: {
      id: keyId,
      name: keyName,
      keyPrefix,
      status: 'active',
      isEnabled: true,
      monthlyQuota: defaultQuota,
      requestsThisMonth: 0,
      expiresAt: expiresAt || null,
      createdAt: now
    }
  };
}

/**
 * Get all API keys for a user (masked)
 */
export async function getUserApiKeys(userId) {
  const apiKeyRepo = getApiKeyRepository();
  const keys = await apiKeyRepo.findByUserId(userId);

  return keys.map((k) => ({
    id: k.id || k._id,
    name: k.name,
    keyPrefix: k.key_prefix,
    status: k.status,
    isEnabled: k.is_enabled === 1 || k.is_enabled === true,
    monthlyQuota: k.monthly_quota,
    requestsThisMonth: k.requests_this_month,
    lastUsedAt: k.last_used_at,
    lastUsedIp: k.last_used_ip,
    expiresAt: k.expires_at,
    createdAt: k.created_at
  }));
}

/**
 * Toggle enable/disable status
 */
export async function toggleApiKey(userId, keyId, isEnabled) {
  const apiKeyRepo = getApiKeyRepository();
  const systemRepo = getSystemRepository();

  const success = await apiKeyRepo.toggleKeyStatus(keyId, userId, isEnabled);
  if (!success) {
    throw new Error('API key not found or unauthorized.');
  }

  await systemRepo.logActivity(userId, 'api_key_toggled', { keyId, isEnabled });
  return { success: true };
}

/**
 * Revoke an API key permanently
 */
export async function revokeApiKey(userId, keyId) {
  const apiKeyRepo = getApiKeyRepository();
  const systemRepo = getSystemRepository();

  const success = await apiKeyRepo.revokeKey(keyId, userId);
  if (!success) {
    throw new Error('API key not found or unauthorized.');
  }

  await systemRepo.logActivity(userId, 'api_key_revoked', { keyId });
  return { success: true };
}

/**
 * Delete an API key
 */
export async function deleteApiKey(userId, keyId) {
  const apiKeyRepo = getApiKeyRepository();
  const systemRepo = getSystemRepository();

  const success = await apiKeyRepo.deleteKey(keyId, userId);
  if (!success) {
    throw new Error('API key not found or unauthorized.');
  }

  await systemRepo.logActivity(userId, 'api_key_deleted', { keyId });
  return { success: true };
}

/**
 * Regenerate an API key (generates new raw secret, resets prefix and enables)
 */
export async function regenerateApiKey(userId, keyId) {
  const apiKeyRepo = getApiKeyRepository();
  const systemRepo = getSystemRepository();

  const existing = await apiKeyRepo.findKeyByIdAndUserId(keyId, userId);
  if (!existing) {
    throw new Error('API key not found or unauthorized.');
  }

  const randomEntropy = generateToken(24);
  const rawKey = `sk_live_${randomEntropy}`;
  const keyHash = sha256(rawKey);
  const keyPrefix = `sk_live_${randomEntropy.slice(0, 4)}...${randomEntropy.slice(-4)}`;

  const success = await apiKeyRepo.regenerateKey(keyId, userId, keyPrefix, keyHash);
  if (!success) {
    throw new Error('API key not found or unauthorized.');
  }

  await systemRepo.logActivity(userId, 'api_key_regenerated', { keyId, keyPrefix });

  return {
    rawKey, // Returned ONLY ONCE
    keyPrefix
  };
}

/**
 * Authenticate incoming raw API key
 */
export async function validateApiKey(rawKey, ipAddress = null) {
  if (!rawKey || typeof rawKey !== 'string' || !rawKey.startsWith('sk_live_')) {
    return { valid: false, error: 'Invalid API key format. Expected sk_live_...' };
  }

  const keyHash = sha256(rawKey.trim());
  const apiKeyRepo = getApiKeyRepository();
  const userRepo = getUserRepository();
  const subRepo = getSubscriptionRepository();

  const row = await apiKeyRepo.findByHash(keyHash);

  if (!row) {
    return { valid: false, error: 'API key not recognized or invalid.' };
  }

  if (row.is_banned === 1 || row.is_banned === true) {
    return { valid: false, error: 'Account has been suspended.' };
  }

  if (row.status === 'revoked') {
    return { valid: false, error: 'This API key has been revoked.' };
  }

  if (row.is_enabled === 0 || row.is_enabled === false) {
    return { valid: false, error: 'This API key is currently disabled.' };
  }

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { valid: false, error: 'This API key has expired.' };
  }

  // Update last used timestamp & IP asynchronously/safely
  try {
    await apiKeyRepo.updateUsage(row.id || row._id, ipAddress || null);
  } catch (e) {
    // Non-blocking
  }

  // Dynamic subscription expiration check for API user
  let activePlan = row.plan;
  if (activePlan !== 'free' && row.role !== 'admin') {
    const validSub = await subRepo.findActiveSubscription(row.user_id);

    if (!validSub) {
      await userRepo.updatePlan(row.user_id, 'free');
      activePlan = 'free';
    }
  }

  return {
    valid: true,
    key: {
      id: row.id || row._id,
      name: row.name,
      prefix: row.key_prefix,
      monthlyQuota: row.monthly_quota,
      requestsThisMonth: row.requests_this_month
    },
    user: {
      id: row.user_id,
      email: row.email,
      name: row.user_name || row.name,
      role: row.role,
      plan: activePlan
    }
  };
}
