import crypto from 'node:crypto';
import { getMongoDb } from '../mongo.js';
import { COLLECTIONS } from '../mongoSchemas.js';

// MongoDB Implementation
export const mongoQueueRepository = {
  _getColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.DOWNLOAD_JOBS);
  },

  async create(job) {
    const now = (job.created_at || job.createdAt) ? new Date(job.created_at || job.createdAt) : new Date();
    const jobId = job.id || ('job_' + crypto.randomUUID());
    const userId = job.user_id || job.userId;
    const formatId = job.format_id || job.formatId;
    const maxAttempts = job.max_attempts || job.maxAttempts || 3;
    const errorMessage = job.error_message || job.errorMessage || null;
    const fileSize = job.file_size || job.fileSize || null;
    const directUrl = job.direct_url || job.directUrl || null;
    const startedAt = job.started_at || job.startedAt;
    const completedAt = job.completed_at || job.completedAt;

    const doc = {
      _id: String(jobId),
      user_id: userId ? String(userId) : null,
      url: String(job.url),
      platform: String(job.platform || 'generic'),
      format_id: formatId || null,
      type: job.type || 'video',
      quality: job.quality || null,
      title: job.title || null,
      thumbnail: job.thumbnail || null,
      duration: job.duration || null,
      status: job.status || 'queued',
      progress: job.progress || 0,
      priority: job.priority || 1,
      attempts: job.attempts || 0,
      max_attempts: maxAttempts,
      error_message: errorMessage,
      file_size: fileSize,
      direct_url: directUrl,
      created_at: now,
      started_at: startedAt ? new Date(startedAt) : null,
      completed_at: completedAt ? new Date(completedAt) : null,
      updated_at: now
    };
    await this._getColl().insertOne(doc);
    return { ...doc, id: doc._id };
  },

  async findById(id) {
    const doc = await this._getColl().findOne({ _id: String(id) });
    if (!doc) return null;
    return { ...doc, id: doc._id };
  },

  async findDuplicate(url) {
    const doc = await this._getColl().findOne({
      url: String(url),
      status: { $in: ['queued', 'processing'] }
    });
    if (!doc) return null;
    return { ...doc, id: doc._id };
  },

  async findNextQueued(limit = 1) {
    const docs = await this._getColl().find({ status: 'queued' })
      .sort({ priority: -1, created_at: 1 })
      .limit(limit)
      .toArray();
    return docs.map(d => ({ ...d, id: d._id }));
  },

  async findStaleProcessing() {
    const docs = await this._getColl().find({ status: 'processing' }).toArray();
    return docs.map(d => ({ ...d, id: d._id }));
  },

  async findByUserId(userId) {
    const docs = await this._getColl().find({ user_id: String(userId) })
      .sort({ created_at: -1 })
      .toArray();
    return docs.map(d => ({ ...d, id: d._id }));
  },

  async updateStatus(id, status, errorMessage = null) {
    const now = new Date();
    const $set = { status, updated_at: now };

    if (errorMessage !== null) $set.error_message = errorMessage;
    if (status === 'completed' || status === 'failed') $set.completed_at = now;

    await this._getColl().updateOne({ _id: String(id) }, { $set });
    return this.findById(id);
  },

  async updateProgress(id, progress) {
    const now = new Date();
    await this._getColl().updateOne(
      { _id: String(id) },
      { $set: { progress, updated_at: now } }
    );
    return this.findById(id);
  },

  async countActiveUserJobs(userId) {
    if (!userId) return 0;
    return this._getColl().countDocuments({
      user_id: String(userId),
      status: { $in: ['queued', 'processing'] }
    });
  },

  async getQueueStats() {
    const [queued, processing, failed, completed] = await Promise.all([
      this._getColl().countDocuments({ status: 'queued' }),
      this._getColl().countDocuments({ status: 'processing' }),
      this._getColl().countDocuments({ status: 'failed' }),
      this._getColl().countDocuments({ status: 'completed' })
    ]);
    return {
      queuedJobs: queued,
      processingJobs: processing,
      failedJobs: failed,
      completedJobs: completed,
      totalJobs: queued + processing + failed + completed
    };
  },

  async claimNextJob() {
    const now = new Date();
    const result = await this._getColl().findOneAndUpdate(
      { status: 'queued' },
      {
        $set: {
          status: 'processing',
          started_at: now,
          progress: 10,
          updated_at: now
        },
        $inc: { attempts: 1 }
      },
      {
        sort: { priority: -1, created_at: 1 },
        returnDocument: 'after'
      }
    );
    if (!result) return null;
    return { ...result, id: result._id };
  },

  async findExistingJob(url, userId = null) {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const userFilter = userId ? { user_id: String(userId) } : { user_id: null };
    const doc = await this._getColl().findOne({
      url: String(url),
      ...userFilter,
      $or: [
        { status: { $in: ['queued', 'processing'] } },
        { status: 'completed', completed_at: { $gte: fifteenMinutesAgo } }
      ]
    }, { sort: { created_at: -1 } });
    if (!doc) return null;
    return { ...doc, id: doc._id };
  },

  async findUserJobsPaginated(userId, { status = null, limit = 20, offset = 0 } = {}) {
    const filter = { user_id: String(userId) };
    if (status && status !== 'all') {
      filter.status = status;
    }
    const total = await this._getColl().countDocuments({ user_id: String(userId) });
    const docs = await this._getColl().find(filter)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return {
      jobs: docs.map(d => ({ ...d, id: d._id })),
      total,
      limit,
      offset
    };
  },

  async recoverStaleJobs() {
    const staleDocs = await this._getColl().find({ status: 'processing' }).toArray();
    const now = new Date();
    for (const job of staleDocs) {
      if ((job.attempts || 0) < (job.max_attempts || 3)) {
        await this._getColl().updateOne(
          { _id: job._id },
          { $set: { status: 'queued', updated_at: now }, $inc: { attempts: 1 } }
        );
      } else {
        await this._getColl().updateOne(
          { _id: job._id },
          { $set: { status: 'failed', error_message: 'Job interrupted by server restart', updated_at: now } }
        );
      }
    }
    return staleDocs.length;
  },

  async updateJob(id, fields) {
    const now = new Date();
    const $set = { ...fields, updated_at: now };
    if ($set.completed_at) {
      $set.completed_at = $set.completed_at instanceof Date ? $set.completed_at : new Date($set.completed_at);
    }
    if ($set.started_at) {
      $set.started_at = $set.started_at instanceof Date ? $set.started_at : new Date($set.started_at);
    }
    if ($set.created_at) {
      $set.created_at = $set.created_at instanceof Date ? $set.created_at : new Date($set.created_at);
    }
    await this._getColl().updateOne({ _id: String(id) }, { $set });
    return this.findById(id);
  },

  async pauseJob(id, userId = null) {
    const job = await this.findById(id);
    if (!job) throw new Error('Job not found.');
    if (userId && job.user_id !== userId) throw new Error('Unauthorized to modify this job.');

    if (job.status === 'completed') {
      return { ...job, isAlreadyCompleted: true, message: 'Job has already finished processing.' };
    }

    if (job.status !== 'queued' && job.status !== 'processing') {
      throw new Error(`Cannot pause job in status '${job.status}'.`);
    }

    const now = new Date();
    await this._getColl().updateOne({ _id: String(id) }, { $set: { status: 'paused', updated_at: now } });
    return this.findById(id);
  },

  async resumeJob(id, userId = null) {
    const job = await this.findById(id);
    if (!job) throw new Error('Job not found.');
    if (userId && job.user_id !== userId) throw new Error('Unauthorized to modify this job.');

    if (job.status !== 'paused' && job.status !== 'failed') {
      throw new Error(`Cannot resume job in status '${job.status}'.`);
    }

    const now = new Date();
    await this._getColl().updateOne({ _id: String(id) }, { $set: { status: 'queued', error_message: null, updated_at: now } });
    return this.findById(id);
  },

  async cancelJob(id, userId = null) {
    const job = await this.findById(id);
    if (!job) throw new Error('Job not found.');
    if (userId && job.user_id !== userId) throw new Error('Unauthorized to modify this job.');

    const now = new Date();
    await this._getColl().updateOne({ _id: String(id) }, { $set: { status: 'cancelled', updated_at: now } });
    return this.findById(id);
  },

  async retryJob(id, userId = null) {
    const job = await this.findById(id);
    if (!job) throw new Error('Job not found.');
    if (userId && job.user_id !== userId) throw new Error('Unauthorized to modify this job.');

    const now = new Date();
    await this._getColl().updateOne({ _id: String(id) }, {
      $set: { status: 'queued', attempts: 0, error_message: null, progress: 0, updated_at: now }
    });
    return this.findById(id);
  }
};

export function getQueueRepository() {
  return mongoQueueRepository;
}

export default mongoQueueRepository;
