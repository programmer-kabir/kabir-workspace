import { validateApiKey } from '../services/apiKeyService.js';
import { getApiKeyRepository } from '../db/repositories/apiKeyRepository.js';
import { getSystemRepository } from '../db/repositories/systemRepository.js';

// Sliding-window in-memory map: keyId -> Array of millisecond timestamps
const rateLimitMap = new Map();

/**
 * Get configured rate limits from system_settings or defaults
 */
async function getLimitsForPlan(plan = 'free') {
  const systemRepo = getSystemRepository();
  const getSetting = async (key, fallback) => {
    try {
      const val = await systemRepo.getSetting(key);
      return val !== null && val !== undefined ? parseInt(val, 10) : fallback;
    } catch {
      return fallback;
    }
  };

  if (plan === 'enterprise') {
    return {
      rpm: await getSetting('api_enterprise_rpm', 600),
      daily: await getSetting('api_enterprise_daily', 20000),
      monthly: await getSetting('api_enterprise_monthly', 500000)
    };
  } else if (plan === 'pro') {
    return {
      rpm: await getSetting('api_pro_rpm', 120),
      daily: await getSetting('api_pro_daily', 2000),
      monthly: await getSetting('api_pro_monthly', 25000)
    };
  } else {
    return {
      rpm: await getSetting('api_free_rpm', 20),
      daily: await getSetting('api_free_daily', 100),
      monthly: await getSetting('api_free_monthly', 1000)
    };
  }
}

/**
 * API Key Authentication & Rate Limiting Middleware
 */
export async function authenticateApiKey(req, res, next) {
  const startTime = Date.now();
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // 1. Extract API Key from headers
  let rawKey = req.headers['x-api-key'];
  if (!rawKey && req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    if (authHeader.startsWith('Bearer ')) {
      rawKey = authHeader.slice(7).trim();
    }
  }

  if (!rawKey) {
    return res.status(401).json({
      success: false,
      error: 'API key is missing. Pass your key in the X-API-Key header or Authorization: Bearer sk_live_...',
      code: 'API_KEY_MISSING'
    });
  }

  // 2. Validate API Key
  const authResult = await validateApiKey(rawKey, ip);
  if (!authResult.valid) {
    return res.status(401).json({
      success: false,
      error: authResult.error,
      code: 'INVALID_API_KEY'
    });
  }

  const { key, user } = authResult;
  req.apiKey = key;
  req.user = user;

  // 3. Rate Limiting Check (Sliding Window RPM)
  const limits = await getLimitsForPlan(user.plan);
  const now = Date.now();
  const windowMs = 60 * 1000;

  let timestamps = rateLimitMap.get(key.id) || [];
  // Filter out timestamps older than 60 seconds
  timestamps = timestamps.filter(t => now - t < windowMs);

  if (timestamps.length >= limits.rpm) {
    const oldestTimestamp = timestamps[0];
    const retryAfter = Math.ceil((windowMs - (now - oldestTimestamp)) / 1000);
    res.setHeader('Retry-After', retryAfter);
    res.setHeader('X-RateLimit-Limit', limits.rpm);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + retryAfter * 1000) / 1000));

    // Log 429
    logApiRequest({
      apiKeyId: key.id,
      userId: user.id,
      endpoint: req.originalUrl || req.url,
      method: req.method,
      statusCode: 429,
      responseTimeMs: Date.now() - startTime,
      ipAddress: ip,
      errorMessage: 'Rate limit exceeded'
    });

    return res.status(429).json({
      success: false,
      error: `Rate limit exceeded. Your ${user.plan} plan allows up to ${limits.rpm} requests per minute.`,
      code: 'RATE_LIMIT_EXCEEDED',
      retry_after: retryAfter
    });
  }

  // 4. Monthly Quota Check
  if (key.requestsThisMonth >= limits.monthly) {
    // Log 429
    logApiRequest({
      apiKeyId: key.id,
      userId: user.id,
      endpoint: req.originalUrl || req.url,
      method: req.method,
      statusCode: 429,
      responseTimeMs: Date.now() - startTime,
      ipAddress: ip,
      errorMessage: 'Monthly quota exhausted'
    });

    return res.status(429).json({
      success: false,
      error: `Monthly API quota exhausted (${limits.monthly} requests). Please upgrade your subscription plan to continue.`,
      code: 'QUOTA_EXHAUSTED'
    });
  }

  // Record timestamp
  timestamps.push(now);
  rateLimitMap.set(key.id, timestamps);

  // Set standard RateLimit response headers
  res.setHeader('X-RateLimit-Limit', limits.rpm);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limits.rpm - timestamps.length));

  // Hook into response completion to record API request log
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logApiRequest({
      apiKeyId: key.id,
      userId: user.id,
      endpoint: req.originalUrl || req.url,
      method: req.method,
      statusCode: res.statusCode,
      responseTimeMs: duration,
      ipAddress: ip,
      errorMessage: res.statusCode >= 400 ? res.statusMessage || null : null
    });
  });

  next();
}

/**
 * Log API request using repository
 */
async function logApiRequest({ apiKeyId, userId, endpoint, method, statusCode, responseTimeMs, ipAddress, errorMessage }) {
  try {
    const apiKeyRepo = getApiKeyRepository();
    await apiKeyRepo.createLog({
      api_key_id: apiKeyId || null,
      user_id: userId || null,
      endpoint: (endpoint || '').slice(0, 255),
      method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      ip_address: ipAddress || null,
      error_message: errorMessage || null
    });
  } catch (err) {
    console.error('Failed to write api_log:', err.message);
  }
}