import express from 'express';
import {
  addJobToQueue,
  getJobById,
  getUserJobs,
  pauseJob,
  resumeJob,
  cancelJob,
  retryJob,
  bulkAddJobs,
  bulkCancelJobs,
  bulkRetryJobs,
  queueEvents
} from '../services/queueService.js';
import { optionalAuth, authenticateUser } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/queue/add
 */
router.post('/add', optionalAuth, async (req, res) => {
  try {
    const { url, formatId, type = 'video', quality } = req.body;
    const userId = req.user ? req.user.id : null;
    const userPlan = req.user ? req.user.plan : 'free';

    const result = await addJobToQueue({
      url,
      userId,
      userPlan,
      formatId,
      type,
      quality
    });

    res.status(result.isDuplicate ? 200 : 201).json({
      success: true,
      ...result
    });
  } catch (error) {
    if (error.code === 'DAILY_DOWNLOAD_QUOTA_EXCEEDED' || error.code === 'MONTHLY_DOWNLOAD_QUOTA_EXCEEDED') {
      return res.status(429).json({ success: false, error: error.message, code: error.code });
    }
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/queue/bulk (Bulk Add Jobs)
 */
router.post('/bulk', optionalAuth, async (req, res) => {
  try {
    const { urls, type = 'video', quality } = req.body;
    const userId = req.user ? req.user.id : null;
    const userPlan = req.user ? req.user.plan : 'free';

    const result = await bulkAddJobs({
      urls,
      userId,
      userPlan,
      type,
      quality
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.code === 'DAILY_DOWNLOAD_QUOTA_EXCEEDED' || error.code === 'MONTHLY_DOWNLOAD_QUOTA_EXCEEDED') {
      return res.status(429).json({ success: false, error: error.message, code: error.code });
    }
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/queue/bulk-cancel
 */
router.post('/bulk-cancel', optionalAuth, async (req, res) => {
  try {
    const { jobIds } = req.body;
    const userId = req.user ? req.user.id : null;
    const result = await bulkCancelJobs(jobIds, userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/queue/bulk-retry
 */
router.post('/bulk-retry', optionalAuth, async (req, res) => {
  try {
    const { jobIds } = req.body;
    const userId = req.user ? req.user.id : null;
    const result = await bulkRetryJobs(jobIds, userId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/queue/list
 */
router.get('/list', authenticateUser, async (req, res) => {
  try {
    const status = req.query.status || 'all';
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;

    const result = await getUserJobs({
      userId: req.user.id,
      status,
      limit,
      offset
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/queue/:jobId
 */
router.get('/:jobId', optionalAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await getJobById(jobId);

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found.' });
    }

    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/queue/:jobId/pause
 */
router.post('/:jobId/pause', optionalAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user ? req.user.id : null;
    const updated = await pauseJob(jobId, userId);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/queue/:jobId/resume
 */
router.post('/:jobId/resume', optionalAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user ? req.user.id : null;
    const updated = await resumeJob(jobId, userId);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/queue/:jobId/cancel
 */
router.post('/:jobId/cancel', optionalAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user ? req.user.id : null;
    const updated = await cancelJob(jobId, userId);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/queue/:jobId/retry
 */
router.post('/:jobId/retry', optionalAuth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user ? req.user.id : null;
    const updated = await retryJob(jobId, userId);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/queue/stream/:jobId (Real-time SSE updates)
 */
router.get('/stream/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const initialJob = await getJobById(jobId);

  if (!initialJob) {
    return res.status(404).json({ success: false, error: 'Job not found.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial state immediately
  res.write(`data: ${JSON.stringify(initialJob)}\n\n`);

  const onProgress = (data) => {
    if (data.id === jobId) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  const onUpdate = (job) => {
    if (job.id === jobId) {
      res.write(`data: ${JSON.stringify(job)}\n\n`);
      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        res.end();
      }
    }
  };

  queueEvents.on('job_progress', onProgress);
  queueEvents.on('job_updated', onUpdate);
  queueEvents.on('job_completed', onUpdate);
  queueEvents.on('job_failed', onUpdate);

  req.on('close', () => {
    queueEvents.off('job_progress', onProgress);
    queueEvents.off('job_updated', onUpdate);
    queueEvents.off('job_completed', onUpdate);
    queueEvents.off('job_failed', onUpdate);
  });
});

export default router;
