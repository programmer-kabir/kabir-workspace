import { generateId } from '../utils/crypto.js';
import { extractMediaInfo } from './extractor.js';
import { detectPlatform, isValidHttpUrl } from '../utils/platformDetector.js';
import { dispatchWebhookEvent } from './webhookService.js';
import { getQueueRepository } from '../db/repositories/queueRepository.js';
import { getHistoryRepository } from '../db/repositories/historyRepository.js';
import { getNotificationRepository } from '../db/repositories/notificationRepository.js';
import { getSubscriptionRepository } from '../db/repositories/subscriptionRepository.js';
import { getSystemRepository } from '../db/repositories/systemRepository.js';
import { EventEmitter } from 'events';

export const queueEvents = new EventEmitter();
queueEvents.setMaxListeners(100);

let activeJobsCount = 0;
const MAX_CONCURRENT_JOBS = 3;
let queueInterval = null;
let isShuttingDown = false;

/**
 * Returns whether queue engine is shutting down
 */
export function isQueueShuttingDown() {
  return isShuttingDown;
}

/**
 * Pauses the queue engine and stops polling/claiming jobs for graceful shutdown
 */
export function pauseQueueEngine() {
  isShuttingDown = true;
  if (queueInterval) {
    clearInterval(queueInterval);
    queueInterval = null;
  }
}

/**
 * Awaits completion of in-flight jobs up to a given timeout (ms)
 */
export async function waitForActiveJobs(timeoutMs = 10000) {
  const start = Date.now();
  while (activeJobsCount > 0 && Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 200));
  }
  return { drained: activeJobsCount === 0, remainingJobs: activeJobsCount };
}

/**
 * Reset stale processing jobs from previous server run
 */
export async function recoverStaleJobs() {
  const queueRepo = getQueueRepository();
  const count = await queueRepo.recoverStaleJobs();
  if (count > 0) {
    console.log(`🔄 Recovered ${count} interrupted queue jobs.`);
  }
}

/**
 * Validate that user has not exceeded their daily or monthly download quotas
 */
export async function checkUserDownloadQuota(userId, userPlan = 'free', requestedCount = 1) {
  if (!userId) {
    return;
  }

  let dailyQuota = 15;
  let monthlyQuota = 250;
  if (userPlan === 'enterprise') {
    dailyQuota = 5000;
    monthlyQuota = 50000;
  } else if (userPlan === 'pro') {
    dailyQuota = 150;
    monthlyQuota = 3000;
  }

  try {
    const subRepo = getSubscriptionRepository();
    const planRow = await subRepo.getPlanBySlug(userPlan);
    if (planRow) {
      dailyQuota = planRow.daily_download_quota;
      monthlyQuota = planRow.monthly_download_quota;
    }
  } catch {
    // Use fallback defaults
  }

  const historyRepo = getHistoryRepository();
  const queueRepo = getQueueRepository();

  const todayStart = new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z';
  const todayUsed = await historyRepo.countSince(userId, todayStart);
  const activeQueued = await queueRepo.countActiveUserJobs(userId);

  if (todayUsed + activeQueued + requestedCount - 1 >= dailyQuota) {
    const err = new Error(`Daily download quota exceeded for your ${userPlan.toUpperCase()} plan (${dailyQuota} downloads/day). Upgrade your subscription to increase your limit.`);
    err.code = 'DAILY_DOWNLOAD_QUOTA_EXCEEDED';
    throw err;
  }

  const monthStart = new Date().toISOString().slice(0, 7) + '-01T00:00:00.000Z';
  const monthUsed = await historyRepo.countSince(userId, monthStart);

  if (monthUsed + activeQueued + requestedCount - 1 >= monthlyQuota) {
    const err = new Error(`Monthly download quota exceeded for your ${userPlan.toUpperCase()} plan (${monthlyQuota} downloads/month). Upgrade your subscription to increase your limit.`);
    err.code = 'MONTHLY_DOWNLOAD_QUOTA_EXCEEDED';
    throw err;
  }
}

/**
 * Add a new job to the queue
 */
export async function addJobToQueue({ url, userId = null, userPlan = 'free', formatId = null, type = 'video', quality = null }) {
  if (!url || typeof url !== 'string') {
    throw new Error('Valid video URL is required.');
  }

  const cleanUrl = url.trim();

  // Enforce atomic user quota check
  await checkUserDownloadQuota(userId, userPlan, 1);

  const queueRepo = getQueueRepository();

  // Duplicate detection: check if in queue, processing, or completed within last 15 minutes
  const existing = await queueRepo.findExistingJob(cleanUrl, userId);

  if (existing) {
    const isCompleted = existing.status === 'completed';
    return {
      job: existing,
      isDuplicate: true,
      message: isCompleted
        ? 'This URL was recently processed and is ready for instant download.'
        : 'This URL is already in your processing queue.'
    };
  }

  const platform = detectPlatform(cleanUrl);
  const jobId = generateId('job');
  const now = new Date().toISOString();

  // Calculate priority based on subscription plan
  let priority = 1;
  if (userPlan === 'enterprise') priority = 10;
  else if (userPlan === 'pro') priority = 5;

  const createdJob = await queueRepo.create({
    id: jobId,
    user_id: userId,
    url: cleanUrl,
    platform: platform.name,
    format_id: formatId,
    type,
    quality,
    status: 'queued',
    progress: 0,
    priority,
    attempts: 0,
    max_attempts: 3,
    created_at: now,
    updated_at: now
  });

  if (userId) {
    const systemRepo = getSystemRepository();
    await systemRepo.logActivity(userId, 'download_request', { url: cleanUrl, platform: platform.name, formatId });
    dispatchWebhookEvent(userId, 'download.queued', {
      job_id: jobId,
      url: cleanUrl,
      platform: platform.name,
      type
    });
  }

  // Trigger worker loop
  triggerWorker();

  queueEvents.emit('job_created', createdJob);

  return {
    job: createdJob,
    isDuplicate: false,
    message: 'Job successfully added to queue.'
  };
}

/**
 * Get job by ID
 */
export async function getJobById(jobId) {
  const queueRepo = getQueueRepository();
  return await queueRepo.findById(jobId);
}

/**
 * Get user jobs with status filters and pagination
 */
export async function getUserJobs({ userId, status = null, limit = 20, offset = 0 }) {
  const queueRepo = getQueueRepository();
  return await queueRepo.findUserJobsPaginated(userId, { status, limit, offset });
}

/**
 * Pause job
 */
export async function pauseJob(jobId, userId = null) {
  const queueRepo = getQueueRepository();
  const updated = await queueRepo.pauseJob(jobId, userId);
  queueEvents.emit('job_updated', updated);
  return updated;
}

/**
 * Resume job
 */
export async function resumeJob(jobId, userId = null) {
  const queueRepo = getQueueRepository();
  const updated = await queueRepo.resumeJob(jobId, userId);
  triggerWorker();
  queueEvents.emit('job_updated', updated);
  return updated;
}

/**
 * Cancel job
 */
export async function cancelJob(jobId, userId = null) {
  const queueRepo = getQueueRepository();
  const updated = await queueRepo.cancelJob(jobId, userId);

  if (updated && updated.user_id) {
    dispatchWebhookEvent(updated.user_id, 'download.cancelled', {
      job_id: jobId,
      url: updated.url
    });
  }

  queueEvents.emit('job_updated', updated);
  return updated;
}

/**
 * Retry failed job
 */
export async function retryJob(jobId, userId = null) {
  const queueRepo = getQueueRepository();
  const updated = await queueRepo.retryJob(jobId, userId);
  triggerWorker();
  queueEvents.emit('job_updated', updated);
  return updated;
}

/**
 * Background Queue Worker Loop
 */
export async function triggerWorker() {
  if (isShuttingDown || activeJobsCount >= MAX_CONCURRENT_JOBS) return;

  const queueRepo = getQueueRepository();
  const nextJob = await queueRepo.claimNextJob();

  if (!nextJob) return;

  activeJobsCount++;
  queueEvents.emit('job_updated', nextJob);

  if (nextJob.user_id) {
    dispatchWebhookEvent(nextJob.user_id, 'download.started', {
      job_id: nextJob.id,
      url: nextJob.url,
      platform: nextJob.platform
    });
  }

  processJob(nextJob).finally(() => {
    activeJobsCount--;
    triggerWorker(); // Process next job in line
  });
}

/**
 * Process a single download job
 */
async function processJob(job) {
  const queueRepo = getQueueRepository();
  try {
    // Stage 1: Extract media info & formats
    await queueRepo.updateProgress(job.id, 35);
    queueEvents.emit('job_progress', { id: job.id, progress: 35, status: 'processing' });

    const mediaInfo = await extractMediaInfo(job.url);

    // Stage 2: Resolve target format
    await queueRepo.updateProgress(job.id, 70);
    queueEvents.emit('job_progress', { id: job.id, progress: 70, status: 'processing' });

    const chosenFormat = mediaInfo.videoFormats.find((f) => f.formatId === job.format_id) || mediaInfo.videoFormats[0];
    const completedAt = new Date().toISOString();

    const title = mediaInfo.title || 'Untitled Video';
    const thumbnail = mediaInfo.thumbnail;
    const duration = mediaInfo.duration;
    const fileSize = chosenFormat?.size || null;

    const completedJob = await queueRepo.updateJob(job.id, {
      status: 'completed',
      progress: 100,
      title,
      thumbnail,
      duration,
      file_size: fileSize,
      completed_at: completedAt
    });

    // Save into persistent download history if user was authenticated
    if (job.user_id) {
      const historyRepo = getHistoryRepository();
      const notifRepo = getNotificationRepository();
      const systemRepo = getSystemRepository();

      await historyRepo.create({
        user_id: job.user_id,
        job_id: job.id,
        url: job.url,
        platform: mediaInfo.platform?.name || job.platform,
        title,
        thumbnail,
        format_id: job.format_id || 'best',
        type: job.type,
        resolution: chosenFormat?.resolution || 'HD',
        file_size: fileSize,
        duration,
        created_at: completedAt
      });

      // Create completion notification
      await notifRepo.create({
        user_id: job.user_id,
        title: 'Download Ready',
        message: `"${title.slice(0, 45)}..." has finished processing and is ready to download.`,
        type: 'success',
        is_read: 0,
        link: `/api/download?url=${encodeURIComponent(job.url)}&formatId=${encodeURIComponent(job.format_id || '')}&type=${job.type}`,
        created_at: completedAt
      });

      await systemRepo.logActivity(job.user_id, 'download_completed', { title, url: job.url, format: job.format_id });

      dispatchWebhookEvent(job.user_id, 'download.completed', {
        job_id: job.id,
        url: job.url,
        title,
        thumbnail,
        duration,
        format_id: job.format_id,
        file_size: fileSize
      });
    }

    queueEvents.emit('job_completed', completedJob);
  } catch (error) {
    console.error(`Queue job ${job.id} failed:`, error.message);
    const now = new Date().toISOString();
    const currentAttempts = job.attempts || 1;

    let failedJob;
    if (currentAttempts < (job.max_attempts || 3)) {
      // Re-queue with incremented attempt
      failedJob = await queueRepo.updateJob(job.id, {
        status: 'queued',
        progress: 0,
        error_message: `Attempt ${currentAttempts} failed: ${error.message}. Retrying...`
      });
    } else {
      // Mark permanently failed
      failedJob = await queueRepo.updateJob(job.id, {
        status: 'failed',
        progress: 0,
        error_message: error.message
      });

      if (job.user_id) {
        const notifRepo = getNotificationRepository();
        const systemRepo = getSystemRepository();

        await notifRepo.create({
          user_id: job.user_id,
          title: 'Download Failed',
          message: `Failed to process "${job.url}": ${error.message}`,
          type: 'error',
          is_read: 0,
          created_at: now
        });

        await systemRepo.logActivity(job.user_id, 'download_failed', { url: job.url, error: error.message });

        dispatchWebhookEvent(job.user_id, 'download.failed', {
          job_id: job.id,
          url: job.url,
          error: error.message
        });
      }
    }

    queueEvents.emit('job_failed', failedJob);
  }
}

/**
 * Bulk Add Jobs to Queue
 */
export async function bulkAddJobs({ urls, userId = null, userPlan = 'free', type = 'video', quality = null }) {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error('Please provide an array of URLs to download.');
  }

  // Quota checks based on plan
  let maxBulkLimit = 5;
  if (userPlan === 'enterprise') maxBulkLimit = 100;
  else if (userPlan === 'pro') maxBulkLimit = 25;

  if (urls.length > maxBulkLimit) {
    throw new Error(`Your plan allows submitting up to ${maxBulkLimit} URLs at a time. Upgrade to increase this limit.`);
  }

  // Pre-validate download quota capacity for bulk submissions
  await checkUserDownloadQuota(userId, userPlan, urls.length);

  const results = [];
  let addedCount = 0;
  let duplicateCount = 0;
  let invalidCount = 0;

  for (const rawUrl of urls) {
    const trimmed = (rawUrl || '').trim();
    if (!trimmed) continue;

    if (!isValidHttpUrl(trimmed)) {
      results.push({
        url: trimmed,
        valid: false,
        error: 'Invalid URL format (must begin with http:// or https://)'
      });
      invalidCount++;
      continue;
    }

    try {
      const res = await addJobToQueue({
        url: trimmed,
        userId,
        userPlan,
        type,
        quality
      });

      if (res.isDuplicate) duplicateCount++;
      else addedCount++;

      results.push({
        url: trimmed,
        valid: true,
        isDuplicate: res.isDuplicate,
        job: res.job,
        message: res.message
      });
    } catch (err) {
      results.push({
        url: trimmed,
        valid: false,
        error: err.message
      });
      invalidCount++;
    }
  }

  if (userId && (addedCount > 0 || duplicateCount > 0)) {
    const systemRepo = getSystemRepository();
    const notifRepo = getNotificationRepository();

    await systemRepo.logActivity(userId, 'bulk_download', {
      totalSubmitted: urls.length,
      added: addedCount,
      duplicates: duplicateCount,
      invalid: invalidCount
    });

    await notifRepo.create({
      user_id: userId,
      title: 'Bulk Queue Started',
      message: `Submitted ${urls.length} URLs: ${addedCount} queued, ${duplicateCount} already in queue.`,
      type: 'info',
      is_read: 0,
      created_at: new Date().toISOString()
    });
  }

  return {
    summary: {
      total: urls.length,
      added: addedCount,
      duplicates: duplicateCount,
      invalid: invalidCount
    },
    results
  };
}

/**
 * Bulk Cancel Jobs
 */
export async function bulkCancelJobs(jobIds, userId = null) {
  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    throw new Error('Please provide job IDs to cancel.');
  }

  const cancelled = [];
  for (const id of jobIds) {
    try {
      const job = await cancelJob(id, userId);
      cancelled.push(job);
    } catch {
      // Ignore not found or unauthorized for individual IDs
    }
  }

  return { cancelledCount: cancelled.length, jobs: cancelled };
}

/**
 * Bulk Retry Failed Jobs
 */
export async function bulkRetryJobs(jobIds, userId = null) {
  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    throw new Error('Please provide job IDs to retry.');
  }

  const retried = [];
  for (const id of jobIds) {
    try {
      const job = await retryJob(id, userId);
      retried.push(job);
    } catch {
      // Ignore not found or unauthorized
    }
  }

  return { retriedCount: retried.length, jobs: retried };
}

/**
 * Initialize Queue Engine
 */
export async function initQueueEngine() {
  isShuttingDown = false;
  await recoverStaleJobs();

  // Run periodic worker trigger every 5 seconds to catch any newly queued jobs
  if (queueInterval) clearInterval(queueInterval);
  queueInterval = setInterval(() => {
    triggerWorker();
  }, 5000);

  console.log('✅ Background Persistent Queue Engine initialized.');
}
