import { generateToken, generateId, hmacSha256 } from '../utils/crypto.js';
import { getWebhookRepository } from '../db/repositories/webhookRepository.js';
import { getUserRepository } from '../db/repositories/userRepository.js';
import { getSystemRepository } from '../db/repositories/systemRepository.js';
import http from 'http';
import https from 'https';
import { URL } from 'url';

/**
 * SSRF Protection Validator
 */
export function isSafeWebhookUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: 'URL protocol must be HTTP or HTTPS.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block loopback & local names
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return { safe: false, reason: 'Destination cannot be localhost, Loopback (127.0.0.1), or an internal hostname (SSRF Protection).' };
    }

    // Check IPv4 private and link-local ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    if (match) {
      const [_, b1, b2] = match.map(Number);

      // 127.0.0.0/8 (Loopback)
      if (b1 === 127) return { safe: false, reason: 'Loopback IP address is forbidden.' };
      // 10.0.0.0/8 (Private)
      if (b1 === 10) return { safe: false, reason: 'Private network IP range (10.0.0.0/8) is forbidden.' };
      // 172.16.0.0/12 (Private)
      if (b1 === 172 && b2 >= 16 && b2 <= 31) return { safe: false, reason: 'Private network IP range (172.16.0.0/12) is forbidden.' };
      // 192.168.0.0/16 (Private)
      if (b1 === 192 && b2 === 168) return { safe: false, reason: 'Private network IP range (192.168.0.0/16) is forbidden.' };
      // 169.254.0.0/16 (Link-local & Cloud Metadata 169.254.169.254)
      if (b1 === 169 && b2 === 254) return { safe: false, reason: 'Link-local/Cloud Metadata IP (169.254.0.0/16) is forbidden.' };
      // 0.0.0.0/8
      if (b1 === 0) return { safe: false, reason: 'Invalid destination IP (0.0.0.0).' };
    }

    return { safe: true };
  } catch (err) {
    return { safe: false, reason: 'Malformed URL: ' + err.message };
  }
}

/**
 * Create a new Webhook endpoint
 */
export async function createWebhook({ userId, name, url, events }) {
  if (!userId) throw new Error('User ID is required.');
  if (!url) throw new Error('Destination URL is required.');

  const checkSafety = isSafeWebhookUrl(url);
  if (!checkSafety.safe) {
    throw new Error(`Invalid webhook URL: ${checkSafety.reason}`);
  }

  const userRepo = getUserRepository();
  const webhookRepo = getWebhookRepository();
  const systemRepo = getSystemRepository();

  const user = await userRepo.findById(userId);
  if (!user) throw new Error('User not found.');

  // Plan limits
  let maxWebhooks = 2;
  if (user.plan === 'enterprise') maxWebhooks = 50;
  else if (user.plan === 'pro') maxWebhooks = 10;

  const currentCount = await webhookRepo.countWebhooksByUserId(userId);
  if (currentCount >= maxWebhooks) {
    throw new Error(`Your ${user.plan} plan allows up to ${maxWebhooks} webhook subscriptions.`);
  }

  const webhookId = generateId('wh');
  const secret = `whsec_${generateToken(24)}`;
  const now = new Date().toISOString();
  const eventList = Array.isArray(events) && events.length > 0 ? events : ['*'];

  await webhookRepo.createWebhook({
    id: webhookId,
    user_id: userId,
    name: (name || 'Webhook Endpoint').trim(),
    url: url.trim(),
    secret,
    events: eventList,
    is_active: 1,
    created_at: now,
    updated_at: now
  });

  await systemRepo.logActivity(userId, 'webhook_created', { webhookId, name, url });

  return {
    id: webhookId,
    name,
    url,
    secret, // Returned upon creation for user to configure verification
    events: eventList,
    isActive: true,
    createdAt: now
  };
}

/**
 * Get all user webhooks
 */
export async function getUserWebhooks(userId) {
  const webhookRepo = getWebhookRepository();
  const hooks = await webhookRepo.findWebhooksByUserId(userId);

  return hooks.map((h) => ({
    id: h.id || h._id,
    name: h.name,
    url: h.url,
    secretMasked: `${h.secret.slice(0, 10)}...${h.secret.slice(-4)}`,
    secret: h.secret,
    events: Array.isArray(h.events) ? h.events : JSON.parse(h.events || '["*"]'),
    isActive: h.is_active === 1 || h.is_active === true,
    createdAt: h.created_at,
    updatedAt: h.updated_at
  }));
}

/**
 * Update a webhook
 */
export async function updateWebhook({ userId, webhookId, name, url, events, isActive }) {
  const webhookRepo = getWebhookRepository();
  const systemRepo = getSystemRepository();

  const hook = await webhookRepo.findWebhookByIdAndUserId(webhookId, userId);
  if (!hook) throw new Error('Webhook not found or unauthorized.');

  if (url) {
    const safety = isSafeWebhookUrl(url);
    if (!safety.safe) throw new Error(`Invalid webhook URL: ${safety.reason}`);
  }

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (url !== undefined) updates.url = url;
  if (events !== undefined) updates.events = events;
  if (isActive !== undefined) updates.is_active = typeof isActive === 'boolean' ? (isActive ? 1 : 0) : isActive;

  await webhookRepo.updateWebhook(webhookId, updates);
  await systemRepo.logActivity(userId, 'webhook_updated', { webhookId });
  return { success: true };
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(userId, webhookId) {
  const webhookRepo = getWebhookRepository();
  const systemRepo = getSystemRepository();

  const existing = await webhookRepo.findWebhookByIdAndUserId(webhookId, userId);
  if (!existing) throw new Error('Webhook not found or unauthorized.');

  const success = await webhookRepo.deleteWebhook(webhookId);
  if (!success) throw new Error('Webhook not found or unauthorized.');

  await systemRepo.logActivity(userId, 'webhook_deleted', { webhookId });
  return { success: true };
}

/**
 * Get deliveries for a user / webhook
 */
export async function getWebhookDeliveries(userId, webhookId = null, page = 1, limit = 20) {
  const webhookRepo = getWebhookRepository();
  return await webhookRepo.findDeliveriesPaginated({ userId, webhookId, page, limit });
}

/**
 * Dispatch an event to all subscribed webhooks for a user
 */
export async function dispatchWebhookEvent(userId, eventName, dataPayload) {
  if (!userId) return;

  try {
    const webhookRepo = getWebhookRepository();
    const activeHooks = await webhookRepo.findActiveWebhooksByUserId(userId);

    for (const hook of activeHooks) {
      const subscribedEvents = Array.isArray(hook.events) ? hook.events : JSON.parse(hook.events || '["*"]');
      if (subscribedEvents.includes('*') || subscribedEvents.includes(eventName)) {
        await deliverWebhook(hook, eventName, dataPayload);
      }
    }
  } catch (err) {
    console.error('Webhook dispatch error:', err.message);
  }
}

/**
 * Perform single delivery HTTP POST with HMAC signature
 */
async function deliverWebhook(hook, eventName, dataPayload, existingDeliveryId = null) {
  const deliveryId = existingDeliveryId || generateId('del');
  const now = new Date().toISOString();
  const webhookRepo = getWebhookRepository();

  const fullPayload = {
    id: deliveryId,
    event: eventName,
    created_at: now,
    data: dataPayload
  };

  const payloadString = JSON.stringify(fullPayload);
  const signature = hmacSha256(hook.secret, payloadString);

  if (!existingDeliveryId) {
    await webhookRepo.createDeliveryRecord({
      id: deliveryId,
      webhook_id: hook.id || hook._id,
      user_id: hook.user_id,
      event: eventName,
      payload: payloadString,
      attempt: 1,
      max_attempts: 3,
      status: 'pending',
      created_at: now
    });
  }

  // Execute HTTP Request with 5-second timeout
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(hook.url);
      const isHttps = parsedUrl.protocol === 'https:';
      const transport = isHttps ? https : http;

      const req = transport.request(
        parsedUrl,
        {
          method: 'POST',
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payloadString),
            'X-StreamVault-Signature': `sha256=${signature}`,
            'X-StreamVault-Event': eventName,
            'X-StreamVault-Delivery': deliveryId,
            'User-Agent': 'StreamVault-Webhook-Dispatcher/1.0'
          }
        },
        (res) => {
          let resData = '';
          res.on('data', (chunk) => (resData += chunk));
          res.on('end', async () => {
            const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
            const deliveredAt = new Date().toISOString();

            try {
              await webhookRepo.updateDeliveryResult(deliveryId, {
                response_status: res.statusCode,
                response_body: resData.slice(0, 1000),
                status: isSuccess ? 'success' : 'failed',
                delivered_at: deliveredAt
              });
            } catch (e) {
              console.error('Failed to update delivery result:', e.message);
            }

            resolve({ success: isSuccess, statusCode: res.statusCode });
          });
        }
      );

      req.on('timeout', async () => {
        req.destroy();
        try {
          await webhookRepo.updateDeliveryResult(deliveryId, {
            status: 'failed',
            error_message: 'Request timed out after 5000ms'
          });
        } catch (e) {}
        resolve({ success: false, error: 'Timed out' });
      });

      req.on('error', async (err) => {
        try {
          await webhookRepo.updateDeliveryResult(deliveryId, {
            status: 'failed',
            error_message: err.message
          });
        } catch (e) {}
        resolve({ success: false, error: err.message });
      });

      req.write(payloadString);
      req.end();
    } catch (err) {
      webhookRepo.updateDeliveryResult(deliveryId, {
        status: 'failed',
        error_message: err.message
      }).catch(() => {});
      resolve({ success: false, error: err.message });
    }
  });
}

/**
 * Send test ping to verify a webhook
 */
export async function sendTestWebhook(userId, webhookId) {
  const webhookRepo = getWebhookRepository();
  const hook = await webhookRepo.findWebhookByIdAndUserId(webhookId, userId);
  if (!hook) throw new Error('Webhook not found or unauthorized.');

  const result = await deliverWebhook(hook, 'ping', {
    message: 'Hello from StreamVault Developer Webhooks!',
    timestamp: new Date().toISOString(),
    endpoint: hook.url
  });

  return result;
}

/**
 * Retry a failed delivery
 */
export async function retryWebhookDelivery(userId, deliveryId) {
  const webhookRepo = getWebhookRepository();
  const delivery = await webhookRepo.findDeliveryByIdAndUserId(deliveryId, userId);
  if (!delivery) throw new Error('Delivery record not found or unauthorized.');

  const hook = await webhookRepo.findWebhookById(delivery.webhook_id);
  if (!hook) throw new Error('Parent webhook no longer exists.');

  await webhookRepo.incrementDeliveryAttempt(deliveryId);

  const payload = typeof delivery.payload === 'string' ? JSON.parse(delivery.payload) : delivery.payload;
  const result = await deliverWebhook(hook, delivery.event, payload.data || payload, deliveryId);
  return result;
}
