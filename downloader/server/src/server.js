import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import os from 'os';
import { extractMediaInfo, streamMedia } from './services/extractor.js';
import { isValidHttpUrl, detectPlatform } from './utils/platformDetector.js';

dotenv.config();

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

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Basic Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please slow down and try again in a minute.' }
});

app.use('/api/', apiLimiter);

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

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'All-in-One Video Downloader Engine',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Video Downloader API Server running on http://0.0.0.0:${PORT}`);
});
