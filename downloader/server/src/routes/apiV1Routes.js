import express from 'express';
import { authenticateApiKey } from '../middleware/apiAuth.js';
import { getApiKeyRepository } from '../db/repositories/apiKeyRepository.js';
import { extractMediaInfo } from '../services/extractor.js';
import { isValidHttpUrl } from '../utils/platformDetector.js';
import {
  addJobToQueue,
  getJobById,
  getUserJobs,
  cancelJob
} from '../services/queueService.js';

const router = express.Router();

// Enforce API Key authentication on all /api/v1/ routes
router.use(authenticateApiKey);

/**
 * POST /api/v1/extract
 * Extract metadata, available streams and formats for a media URL
 */
router.post('/extract', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !isValidHttpUrl(url.trim())) {
      return res.status(400).json({
        success: false,
        error: 'A valid media URL starting with http:// or https:// is required.',
        code: 'INVALID_URL'
      });
    }

    const data = await extractMediaInfo(url.trim());
    res.json({
      success: true,
      data: {
        id: data.id,
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail,
        duration: data.duration,
        platform: data.platform,
        uploader: data.uploader,
        videoFormats: data.videoFormats,
        audioFormats: data.hasAudioFormats ? (data.bestAudio ? [data.bestAudio] : []) : []
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Media extraction failed.',
      code: 'EXTRACTION_ERROR'
    });
  }
});

/**
 * POST /api/v1/download
 * Submit an extraction/download request into the background queue
 */
router.post('/download', async (req, res) => {
  try {
    const { url, formatId, type = 'video', quality } = req.body;
    if (!url || !isValidHttpUrl(url.trim())) {
      return res.status(400).json({
        success: false,
        error: 'A valid media URL is required.',
        code: 'INVALID_URL'
      });
    }

    const result = await addJobToQueue({
      url: url.trim(),
      userId: req.user.id,
      userPlan: req.user.plan,
      formatId,
      type,
      quality
    });

    res.status(result.isDuplicate ? 200 : 201).json({
      success: true,
      message: result.message,
      isDuplicate: result.isDuplicate,
      data: {
        jobId: result.job.id,
        status: result.job.status,
        priority: result.job.priority,
        url: result.job.url,
        platform: result.job.platform,
        type: result.job.type,
        createdAt: result.job.created_at
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
      code: 'QUEUE_ERROR'
    });
  }
});

/**
 * GET /api/v1/jobs/:jobId
 * Check status, progress, and download link for a job
 */
router.get('/jobs/:jobId', async (req, res) => {
  try {
    const job = await getJobById(req.params.jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found.',
        code: 'NOT_FOUND'
      });
    }

    // Verify ownership
    if (job.user_id && job.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to this job.',
        code: 'FORBIDDEN'
      });
    }

    const downloadUrl = job.status === 'completed'
      ? `/api/download?url=${encodeURIComponent(job.url)}&formatId=${encodeURIComponent(job.format_id || '')}&type=${job.type}`
      : null;

    res.json({
      success: true,
      data: {
        id: job.id,
        url: job.url,
        platform: job.platform,
        title: job.title,
        thumbnail: job.thumbnail,
        duration: job.duration,
        fileSize: job.file_size,
        status: job.status,
        progress: job.progress,
        downloadUrl,
        errorMessage: job.error_message,
        createdAt: job.created_at,
        completedAt: job.completed_at
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/jobs
 * List download jobs belonging to this API user
 */
router.get('/jobs', async (req, res) => {
  try {
    const status = req.query.status || 'all';
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = Math.max(0, parseInt(req.query.offset) || 0);

    const result = await getUserJobs({
      userId: req.user.id,
      status,
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        jobs: result.jobs.map(j => ({
          id: j.id,
          url: j.url,
          platform: j.platform,
          title: j.title,
          status: j.status,
          progress: j.progress,
          downloadUrl: j.status === 'completed'
            ? `/api/download?url=${encodeURIComponent(j.url)}&formatId=${encodeURIComponent(j.format_id || '')}&type=${j.type}`
            : null,
          createdAt: j.created_at
        })),
        total: result.total,
        limit,
        offset
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/jobs/:jobId/cancel
 * Cancel a queued or running job
 */
router.post('/jobs/:jobId/cancel', async (req, res) => {
  try {
    const updated = await cancelJob(req.params.jobId, req.user.id);
    res.json({
      success: true,
      message: 'Job cancelled successfully.',
      data: {
        id: updated.id,
        status: updated.status
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/usage
 * Return API usage statistics and quota information for current key
 */
router.get('/usage', async (req, res) => {
  try {
    const apiKeyId = req.apiKey.id;
    const apiKeyRepo = getApiKeyRepository();
    const stats = await apiKeyRepo.getKeyUsageStats(apiKeyId);

    const monthlyQuota = req.apiKey.monthlyQuota || 1000;
    const requestsThisMonth = req.apiKey.requestsThisMonth || 0;

    res.json({
      success: true,
      data: {
        key: {
          id: req.apiKey.id,
          name: req.apiKey.name,
          prefix: req.apiKey.prefix
        },
        plan: req.user.plan,
        quota: {
          monthlyLimit: monthlyQuota,
          requestsThisMonth,
          remainingMonth: Math.max(0, monthlyQuota - requestsThisMonth),
          requestsToday: stats.todayCount
        },
        performance: {
          totalRequests: stats.totalRequests,
          averageResponseTimeMs: stats.averageResponseTimeMs
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
