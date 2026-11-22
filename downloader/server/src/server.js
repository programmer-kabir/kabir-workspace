import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import os from 'os';
import { extractMediaInfo, streamMedia } from './services/extractor.js';
import { isValidHttpUrl, detectPlatform } from './utils/platformDetector.js';
import { initDatabase } from './db/index.js';
import { initQueueEngine } from './services/queueService.js';
import authRoutes from './routes/authRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import userRoutes from './routes/userRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import apiV1Routes from './routes/apiV1Routes.js';
import developerRoutes from './routes/developerRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import adminPaymentRoutes from './routes/adminPaymentRoutes.js';
import adminSystemRoutes from './routes/adminSystemRoutes.js';
import { checkAndExpireSubscriptions } from './db/index.js';
import { connectMongo, isMongoConnected } from './db/mongo.js';
import { getDbEngine } from './db/repositories/index.js';
import { securityHeadersMiddleware, getCorsOptions } from './middleware/securityHeaders.js';
import { validateEnvironment } from './utils/envValidator.js';
import logger from './utils/logger.js';

dotenv.config();

// 0. Runtime Environment Validation
try {
  const envConfig = validateEnvironment();
  if (envConfig.warnings.length > 0) {
    envConfig.warnings.forEach(w => logger.warn(`Environment warning: ${w}`));
  }
} catch (envErr) {
  logger.error('Fatal environment validation error', envErr);
  process.exit(1);
}

// Initialize persistent SQLite Database & Queue Engine
initDatabase();
initQueueEngine();

// Initialize MongoDB Atlas connection if configured (non-blocking)
connectMongo().catch(err => {
  logger.warn(`Non-blocking MongoDB initialization note: ${err.message}`);
});

const app = express();
const PORT = process.env.PORT || 5000;

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// OWASP Production Security Headers
app.use(securityHeadersMiddleware);

// Strict Production CORS Validator
app.use(cors(getCorsOptions()));
app.use(express.json());

// Developer Public REST API v1 (carries its own plan-based sliding-window rate limiter)
app.use('/api/v1', apiV1Routes);

// Basic Rate Limiting for Web Client Endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500, // 500 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please slow down and try again in a minute.' }
});

app.use('/api/', apiLimiter);

// Mount Modular API Routes
app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/user', userRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/developer', developerRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin/payments', adminPaymentRoutes);
app.use('/api/admin/system', adminSystemRoutes);

// Periodic subscription expiration worker (runs every 15 minutes)
setInterval(() => {
  checkAndExpireSubscriptions();
}, 15 * 60 * 1000);

// Root & Health Check Endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  const engine = getDbEngine();
  res.json({
    status: 'healthy',
    service: 'All-in-One Video Downloader Engine & Queue Service',
    databaseEngine: engine,
    database: engine === 'mongodb' ? 'connected (MongoDB Atlas)' : 'connected (node:sqlite WAL)',
    mongodb: isMongoConnected() ? 'connected' : 'unconfigured / disconnected',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Network info for QR Code & Mobile Sync
app.get('/api/network-info', (req, res) => {
  const host = req.headers.host || `localhost:${PORT}`;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const lanIp = getLocalIp();
  res.json({
    lanIp,
    port: PORT,
    isLocal,
    effectiveBaseUrl: isLocal ? `http://${lanIp}:${PORT}` : `${req.protocol}://${host}`
  });
});

// Platform check endpoint (fast pre-validation)
app.post('/api/detect-platform', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  const platform = detectPlatform(url);
  res.json({ platform });
});

// Extract Video Info Endpoint
app.post('/api/extract', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'Please provide a valid video URL.' });
    }

    const trimmedUrl = url.trim();

    if (!isValidHttpUrl(trimmedUrl)) {
      return res.status(400).json({ success: false, error: 'Invalid URL format. URL must start with http:// or https://' });
    }

    const data = await extractMediaInfo(trimmedUrl);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Extract error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Could not fetch video info. Please make sure the link is public and accessible.'
    });
  }
});

// Dedicated Preview Stream Endpoint (inline playback with no attachment header)
app.get('/api/preview', (req, res) => {
  try {
    const { url } = req.query;

    if (!url || !isValidHttpUrl(url)) {
      return res.status(400).send('Valid URL parameter is required.');
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');

    streamMedia({
      url,
      type: 'video',
      res
    });
  } catch (error) {
    console.error('Preview stream error:', error);
    if (!res.headersSent) {
      res.status(500).send('Error streaming preview: ' + error.message);
    }
  }
});

// Download / Stream Media Endpoint
app.get('/api/download', async (req, res) => {
  try {
    const { url, formatId, type = 'video', title = 'video' } = req.query;

    if (!url || !isValidHttpUrl(url)) {
      return res.status(400).send('Valid URL parameter is required.');
    }

    const sanitizedTitle = (title || 'media')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .slice(0, 80) || 'download';

    const ext = type === 'audio' ? 'mp3' : 'mp4';
    const contentType = type === 'audio' ? 'audio/mpeg' : 'video/mp4';

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(sanitizedTitle)}.${ext}"`);
    res.setHeader('Content-Type', contentType);

    streamMedia({
      url,
      formatId,
      type,
      res
    });
  } catch (error) {
    console.error('Download stream error:', error);
    if (!res.headersSent) {
      res.status(500).send('Error streaming media: ' + error.message);
    }
  }
});

// 404 Handler for Unmatched API Endpoints
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Production Error Handler (OWASP recommended: suppresses stack traces)
app.use((err, req, res, next) => {
  logger.error('Unhandled server error', err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });

  if (res.headersSent) {
    return next(err);
  }

  const isProd = process.env.NODE_ENV === 'production';
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: isProd ? 'An internal error occurred. Please contact support if the issue persists.' : (err.message || 'Internal server error')
  });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Video Downloader API & Queue Server running on http://0.0.0.0:${PORT}`);
});
