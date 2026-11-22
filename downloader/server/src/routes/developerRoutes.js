import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { getApiKeyRepository } from '../db/repositories/apiKeyRepository.js';
import {
  createApiKey,
  getUserApiKeys,
  toggleApiKey,
  revokeApiKey,
  regenerateApiKey,
  deleteApiKey
} from '../services/apiKeyService.js';
import {
  createWebhook,
  getUserWebhooks,
  updateWebhook,
  deleteWebhook,
  getWebhookDeliveries,
  sendTestWebhook,
  retryWebhookDelivery
} from '../services/webhookService.js';

const router = express.Router();

// All /api/developer routes require user authentication
router.use(authenticateUser);

// ------------------- API Keys -------------------
router.get('/keys', async (req, res) => {
  try {
    const keys = await getUserApiKeys(req.user.id);
    res.json({ success: true, data: keys });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/keys', async (req, res) => {
  try {
    const { name, expiresAt } = req.body;
    const result = await createApiKey({
      userId: req.user.id,
      name,
      expiresAt
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/keys/:id/toggle', async (req, res) => {
  try {
    const { isEnabled } = req.body;
    await toggleApiKey(req.user.id, req.params.id, isEnabled);
    res.json({ success: true, message: `API key ${isEnabled ? 'enabled' : 'disabled'}.` });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/keys/:id/regenerate', async (req, res) => {
  try {
    const result = await regenerateApiKey(req.user.id, req.params.id);
    res.json({ success: true, data: result, message: 'API key regenerated successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/keys/:id', async (req, res) => {
  try {
    await deleteApiKey(req.user.id, req.params.id);
    res.json({ success: true, message: 'API key deleted successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ------------------- Developer Stats & Analytics -------------------
router.get('/stats', async (req, res) => {
  try {
    const apiKeyRepo = getApiKeyRepository();
    const stats = await apiKeyRepo.getUserDeveloperStats(req.user.id, req.user.plan);
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------- API Request Logs -------------------
router.get('/logs', async (req, res) => {
  try {
    const apiKeyRepo = getApiKeyRepository();
    const result = await apiKeyRepo.findLogsPaginated({
      userId: req.user.id,
      endpoint: req.query.endpoint,
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ------------------- Webhooks -------------------
router.get('/webhooks', async (req, res) => {
  try {
    const webhooks = await getUserWebhooks(req.user.id);
    res.json({ success: true, data: webhooks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/webhooks', async (req, res) => {
  try {
    const { name, url, events } = req.body;
    const webhook = await createWebhook({
      userId: req.user.id,
      name,
      url,
      events
    });
    res.status(201).json({ success: true, data: webhook });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/webhooks/:id', async (req, res) => {
  try {
    const { name, url, events, isActive } = req.body;
    await updateWebhook({
      userId: req.user.id,
      webhookId: req.params.id,
      name,
      url,
      events,
      isActive
    });
    res.json({ success: true, message: 'Webhook updated successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/webhooks/:id', async (req, res) => {
  try {
    await deleteWebhook(req.user.id, req.params.id);
    res.json({ success: true, message: 'Webhook deleted successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/webhooks/:id/test', async (req, res) => {
  try {
    const result = await sendTestWebhook(req.user.id, req.params.id);
    res.json({ success: true, data: result, message: 'Test webhook ping delivered.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/webhooks/:id/deliveries', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const result = await getWebhookDeliveries(req.user.id, req.params.id, page, limit);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/webhooks/deliveries/:id/retry', async (req, res) => {
  try {
    const result = await retryWebhookDelivery(req.user.id, req.params.id);
    res.json({ success: true, data: result, message: 'Webhook delivery retried.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
