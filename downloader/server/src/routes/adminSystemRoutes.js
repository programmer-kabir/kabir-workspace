import express from 'express';
import os from 'os';
import { systemRepository, queueRepository, userRepository } from '../db/repositories/index.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser);
router.use(requireAdmin);

/**
 * GET /api/admin/system/diagnostics
 * Detailed operational and infrastructure diagnostics
 */
router.get('/diagnostics', async (req, res) => {
  try {
    // 1. Database metrics via repository abstraction
    const databaseMetrics = await systemRepository.getDatabaseDiagnostics();

    // 2. Queue engine diagnostics via queue repository
    const queueMetrics = await queueRepository.getQueueStats();

    // 3. User & Subscription diagnostics via user repository
    const totalUsers = await userRepository.count();
    const activeSubscribers = await userRepository.countActiveSubscribers();

    // 4. Memory & Runtime metrics
    const memory = process.memoryUsage();

    res.json({
      success: true,
      data: {
        server: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch,
          cpuCount: os.cpus().length,
          freeMemoryMb: Math.round(os.freemem() / (1024 * 1024)),
          totalMemoryMb: Math.round(os.totalmem() / (1024 * 1024))
        },
        memory: {
          rssMb: Math.round(memory.rss / (1024 * 1024)),
          heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
          heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024))
        },
        database: databaseMetrics,
        queue: queueMetrics,
        users: {
          totalUsers,
          activeSubscribers
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/system/backup
 * Informational endpoint for MongoDB Atlas Continuous Cloud Backups
 */
router.post('/backup', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'StreamVault runs on MongoDB Atlas with continuous automated cloud backups enabled.',
      data: {
        backupType: 'cloud_automated',
        provider: 'MongoDB Atlas',
        status: 'active',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/system/backups
 * List cloud backup status
 */
router.get('/backups', (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        {
          id: 'atlas-continuous-backup',
          type: 'cloud_continuous',
          provider: 'MongoDB Atlas',
          status: 'active',
          retention: 'continuous point-in-time recovery'
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
