import db from '../index.js';
import { getMongoDb } from '../mongo.js';
import { COLLECTIONS } from '../mongoSchemas.js';
import { getDbEngine, SUPPORTED_ENGINES } from './index.js';

// SQLite Implementation
export const sqliteQueueRepository = {
  async create(job) {
    const now = job.created_at || new Date().toISOString();
    db.prepare(`
      INSERT INTO download_jobs (
        id, user_id, url, platform, format_id, type, quality, title, thumbnail, duration,
        status, progress, priority, attempts, max_attempts, error_message, file_size, direct_url,
        created_at, started_at, completed_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      job.id,
      job.user_id || null,
      job.url,
      job.platform || 'generic',
      job.format_id || null,
      job.type || 'video',
      job.quality || null,
      job.title || null,
      job.thumbnail || null,
      job.duration || null,
      job.status || 'queued',
      job.progress || 0,
      job.priority || 1,
      job.attempts || 0,
      job.max_attempts || 3,
      job.error_message || null,
      job.file_size || null,
      job.direct_url || null,
      now,
      job.started_at || null,
      job.completed_at || null,
      now
    );
    return this.findById(job.id);
  },

  async findById(id) {
    return db.prepare('SELECT * FROM download_jobs WHERE id = ?').get(id) || null;
  },

  async findDuplicate(url) {
    return db.prepare("SELECT * FROM download_jobs WHERE url = ? AND status IN ('queued', 'processing') LIMIT 1").get(url) || null;
  },

  async findNextQueued(limit = 1) {
    return db.prepare("SELECT * FROM download_jobs WHERE status = 'queued' ORDER BY priority DESC, created_at ASC LIMIT ?").all(limit);
  },

  async findStaleProcessing() {
    return db.prepare("SELECT * FROM download_jobs WHERE status = 'processing'").all();
  },

  async findByUserId(userId) {
    return db.prepare('SELECT * FROM download_jobs WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  },

  async updateStatus(id, status, errorMessage = null) {
    const now = new Date().toISOString();
    let query = 'UPDATE download_jobs SET status = ?, updated_at = ?';
    const params = [status, now];

    if (errorMessage !== null) {
      query += ', error_message = ?';
      params.push(errorMessage);
    }
    if (status === 'processing') {
      query += ', started_at = COALESCE(started_at, ?)';
      params.push(now);
    }
    if (status === 'completed' || status === 'failed') {
      query += ', completed_at = ?';
      params.push(now);
    }

    query += ' WHERE id = ?';
    params.push(id);

    db.prepare(query).run(...params);
    return this.findById(id);
  },

  async updateProgress(id, progress) {
    const now = new Date().toISOString();
    db.prepare('UPDATE download_jobs SET progress = ?, updated_at = ? WHERE id = ?').run(progress, now, id);
    return this.findById(id);
  },

  async countActiveUserJobs(userId) {
    if (!userId) return 0;
    return db.prepare("SELECT COUNT(*) as count FROM download_jobs WHERE user_id = ? AND status IN ('queued', 'processing')").get(userId).count;
  },

  async getQueueStats() {
    const queued = db.prepare("SELECT COUNT(*) as count FROM download_jobs WHERE status = 'queued'").get().count;
    const processing = db.prepare("SELECT COUNT(*) as count FROM download_jobs WHERE status = 'processing'").get().count;
    const failed = db.prepare("SELECT COUNT(*) as count FROM download_jobs WHERE status = 'failed'").get().count;
    const completed = db.prepare("SELECT COUNT(*) as count FROM download_jobs WHERE status = 'completed'").get().count;
    return {
      queuedJobs: queued,
      processingJobs: processing,
      failedJobs: failed,
      completedJobs: completed
    };
  },

  async claimNextJob() {
    const nextJob = db.prepare(`
      SELECT * FROM download_jobs
      WHERE status = 'queued'
      ORDER BY priority DESC, created_at ASC
      LIMIT 1
    `).get();

    if (!nextJob) return null;

    const startedAt = new Date().toISOString();
    const res = db.prepare(`
      UPDATE download_jobs
      SET status = 'processing', started_at = ?, progress = 10, attempts = attempts + 1, updated_at = ?
      WHERE id = ? AND status = 'queued'
    `).run(startedAt, startedAt, nextJob.id);

    if (res.changes === 0) return null;
    return this.findById(nextJob.id);
  },

  async findExistingJob(url, userId = null) {
    return db.prepare(`
      SELECT * FROM download_jobs
      WHERE url = ? 
        AND (user_id = ? OR (user_id IS NULL AND ? IS NULL))
        AND (
          status IN ('queued', 'processing')
          OR (status = 'completed' AND datetime(completed_at, '+15 minutes') >= datetime('now'))
        )
      ORDER BY created_at DESC
      LIMIT 1
    `).get(url, userId, userId) || null;
  },

  async findUserJobsPaginated(userId, { status = null, limit = 20, offset = 0 } = {}) {
    let query = 'SELECT * FROM download_jobs WHERE user_id = ?';
    const params = [userId];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const jobs = db.prepare(query).all(...params);
    const countRow = db.prepare('SELECT COUNT(*) as total FROM download_jobs WHERE user_id = ?').get(userId);

    return {
      jobs,
      total: countRow ? countRow.total : 0,
      limit,
      offset
    };
  },

  async recoverStaleJobs() {
    const staleJobs = db.prepare(`
      SELECT id, attempts, max_attempts FROM download_jobs WHERE status = 'processing'
    `).all();

    for (const job of staleJobs) {
      const now = new Date().toISOString();
      if (job.attempts < job.max_attempts) {
        db.prepare(`
          UPDATE download_jobs
          SET status = 'queued', attempts = attempts + 1, updated_at = ?
          WHERE id = ?
        `).run(now, job.id);
      } else {
        db.prepare(`
          UPDATE download_jobs
          SET status = 'failed', error_message = 'Job interrupted by server restart', updated_at = ?
          WHERE id = ?
        `).run(now, job.id);
      }
    }
    return staleJobs.length;
  },

  async updateJob(id, fields) {
    const now = new Date().toISOString();
    const setClauses = ['updated_at = ?'];
    const params = [now];

    for (const [key, val] of Object.entries(fields)) {
      setClauses.push(`${key} = ?`);
      params.push(val);
    }
    params.push(id);

    db.prepare(`UPDATE download_jobs SET ${setClauses.join(', ')} WHERE id = ?`).run(...params);
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

    const now = new Date().toISOString();
    db.prepare(`UPDATE download_jobs SET status = 'paused', updated_at = ? WHERE id = ?`).run(now, id);
    return this.findById(id);
  },

  async resumeJob(id, userId = null) {
    const job = await this.findById(id);
    if (!job) throw new Error('Job not found.');
    if (userId && job.user_id !== userId) throw new Error('Unauthorized to modify this job.');

    if (job.status !== 'paused' && job.status !== 'failed') {
      throw new Error(`Cannot resume job in status '${job.status}'.`);
    }

    const now = new Date().toISOString();
    db.prepare(`UPDATE download_jobs SET status = 'queued', error_message = NULL, updated_at = ? WHERE id = ?`).run(now, id);
    return this.findById(id);
  },

  async cancelJob(id, userId = null) {
    const job = await this.findById(id);
    if (!job) throw new Error('Job not found.');
    if (userId && job.user_id !== userId) throw new Error('Unauthorized to modify this job.');

    const now = new Date().toISOString();
    db.prepare(`UPDATE download_jobs SET status = 'cancelled', updated_at = ? WHERE id = ?`).run(now, id);
    return this.findById(id);
  },

  async retryJob(id, userId = null) {
    const job = await this.findById(id);
    if (!job) throw new Error('Job not found.');
    if (userId && job.user_id !== userId) throw new Error('Unauthorized to modify this job.');

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE download_jobs
      SET status = 'queued', attempts = 0, error_message = NULL, progress = 0, updated_at = ?
      WHERE id = ?
    `).run(now, id);
    return this.findById(id);
  }
};

// MongoDB Implementation
export const mongoQueueRepository = {
  _getColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.DOWNLOAD_JOBS);
  },

  async create(job) {
    const now = job.created_at ? new Date(job.created_at) : new Date();
    const doc = {
      _id: String(job.id),
      user_id: job.user_id ? String(job.user_id) : null,
      url: String(job.url),
      platform: String(job.platform || 'generic'),
      format_id: job.format_id || null,
      type: job.type || 'video',
      quality: job.quality || null,
      title: job.title || null,
      thumbnail: job.thumbnail || null,
      duration: job.duration || null,
      status: job.status || 'queued',
      progress: job.progress || 0,
      priority: job.priority || 1,
      attempts: job.attempts || 0,
      max_attempts: job.max_attempts || 3,
      error_message: job.error_message || null,
      file_size: job.file_size || null,
      direct_url: job.direct_url || null,
      created_at: now,
      started_at: job.started_at ? new Date(job.started_at) : null,
      completed_at: job.completed_at ? new Date(job.completed_at) : null,
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
      completedJobs: completed
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

export function getQueueRepository(engine = null) {
  const active = engine || getDbEngine();
  return active === SUPPORTED_ENGINES.MONGODB ? mongoQueueRepository : sqliteQueueRepository;
}
