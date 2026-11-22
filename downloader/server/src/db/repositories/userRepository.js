import db from '../index.js';
import { getMongoDb } from '../mongo.js';
import { ObjectId } from 'mongodb';
import { COLLECTIONS } from '../mongoSchemas.js';
import { getDbEngine, SUPPORTED_ENGINES } from './index.js';

// SQLite Implementation
export const sqliteUserRepository = {
  async findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
  },

  async findByEmail(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    return db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) || null;
  },

  async create(user) {
    const now = user.created_at || new Date().toISOString();
    db.prepare(`
      INSERT INTO users (
        id, email, password_hash, salt, name, role, plan, is_verified, is_banned,
        two_factor_secret, two_factor_enabled, referral_code, referred_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      user.email.trim().toLowerCase(),
      user.password_hash,
      user.salt,
      user.name.trim(),
      user.role || 'user',
      user.plan || 'free',
      user.is_verified ?? 1,
      user.is_banned ?? 0,
      user.two_factor_secret || null,
      user.two_factor_enabled ?? 0,
      user.referral_code || null,
      user.referred_by || null,
      now,
      now
    );
    return this.findById(user.id);
  },

  async updatePlan(id, plan) {
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET plan = ?, updated_at = ? WHERE id = ?').run(plan, now, id);
    return this.findById(id);
  },

  async updateName(id, name) {
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?').run(name.trim(), now, id);
    return this.findById(id);
  },

  async setRole(id, role) {
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, now, id);
    return this.findById(id);
  },

  async count() {
    return db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  },

  async createPasswordReset({ userId, tokenHash, expiresAt, createdAt }) {
    const now = createdAt || new Date().toISOString();
    const res = db.prepare(`
      INSERT INTO password_resets (user_id, token_hash, expires_at, used, created_at)
      VALUES (?, ?, ?, 0, ?)
    `).run(userId, tokenHash, expiresAt, now);
    return db.prepare('SELECT * FROM password_resets WHERE id = ?').get(res.lastInsertRowid);
  },

  async findValidPasswordReset(tokenHash) {
    const now = new Date().toISOString();
    return db.prepare(`
      SELECT * FROM password_resets
      WHERE token_hash = ? AND used = 0 AND expires_at >= ?
      ORDER BY created_at DESC LIMIT 1
    `).get(tokenHash, now) || null;
  },

  async markPasswordResetUsed(id) {
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(id);
    return db.prepare('SELECT * FROM password_resets WHERE id = ?').get(id);
  },

  async countActiveSubscribers() {
    return db.prepare("SELECT COUNT(*) as count FROM users WHERE plan != 'free'").get().count;
  },

  async updatePassword(id, password_hash, salt) {
    const now = new Date().toISOString();
    const res = db.prepare('UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?')
      .run(password_hash, salt, now, id);
    return res.changes > 0;
  },

  async getUserStats(userId, userPlan = 'free') {
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM download_history WHERE user_id = ?').get(userId);
    const totalDownloads = totalRow ? totalRow.count : 0;

    const successRow = db.prepare("SELECT COUNT(*) as count FROM download_jobs WHERE user_id = ? AND status = 'completed'").get(userId);
    const failedRow = db.prepare("SELECT COUNT(*) as count FROM download_jobs WHERE user_id = ? AND status = 'failed'").get(userId);
    const activeRow = db.prepare("SELECT COUNT(*) as count FROM download_jobs WHERE user_id = ? AND status IN ('queued', 'processing')").get(userId);

    let dailyQuota = 15;
    let monthlyQuota = 250;
    if (userPlan === 'enterprise') {
      dailyQuota = 5000;
      monthlyQuota = 50000;
    } else if (userPlan === 'pro') {
      dailyQuota = 150;
      monthlyQuota = 3000;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayUsedRow = db.prepare(`
      SELECT COUNT(*) as count FROM download_history
      WHERE user_id = ? AND created_at >= ?
    `).get(userId, `${todayStr}T00:00:00.000Z`);

    const monthStr = todayStr.slice(0, 7);
    const monthUsedRow = db.prepare(`
      SELECT COUNT(*) as count FROM download_history
      WHERE user_id = ? AND created_at >= ?
    `).get(userId, `${monthStr}-01T00:00:00.000Z`);

    const platformStats = db.prepare(`
      SELECT platform, COUNT(*) as count
      FROM download_history
      WHERE user_id = ?
      GROUP BY platform
      ORDER BY count DESC
      LIMIT 6
    `).all(userId);

    const trendDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayCountRow = db.prepare(`
        SELECT COUNT(*) as count FROM download_history
        WHERE user_id = ? AND created_at >= ? AND created_at < ?
      `).get(userId, `${dateKey}T00:00:00.000Z`, `${dateKey}T23:59:59.999Z`);

      trendDays.push({
        date: dateKey,
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        count: dayCountRow ? dayCountRow.count : 0
      });
    }

    const recentDownloads = db.prepare(`
      SELECT id, title, url, platform, thumbnail, resolution, duration, created_at
      FROM download_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `).all(userId);

    const usedDaily = todayUsedRow ? todayUsedRow.count : 0;
    const usedMonthly = monthUsedRow ? monthUsedRow.count : 0;

    return {
      totalDownloads,
      successfulDownloads: successRow ? successRow.count : 0,
      failedDownloads: failedRow ? failedRow.count : 0,
      activeQueueJobs: activeRow ? activeRow.count : 0,
      plan: userPlan,
      quota: {
        daily: dailyQuota,
        usedDaily,
        remainingDaily: Math.max(0, dailyQuota - usedDaily),
        monthly: monthlyQuota,
        usedMonthly,
        remainingMonthly: Math.max(0, monthlyQuota - usedMonthly)
      },
      platformStats,
      downloadTrend: trendDays,
      recentDownloads
    };
  }
};

// MongoDB Implementation
export const mongoUserRepository = {
  _getColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.USERS);
  },

  async findById(id) {
    const doc = await this._getColl().findOne({ _id: String(id) });
    if (!doc) return null;
    return { ...doc, id: doc._id };
  },

  async findByEmail(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const doc = await this._getColl().findOne({ email: cleanEmail });
    if (!doc) return null;
    return { ...doc, id: doc._id };
  },

  async create(user) {
    const now = user.created_at ? new Date(user.created_at) : new Date();
    const doc = {
      _id: String(user.id),
      email: user.email.trim().toLowerCase(),
      password_hash: user.password_hash,
      salt: user.salt,
      name: user.name.trim(),
      role: user.role || 'user',
      plan: user.plan || 'free',
      is_verified: !!(user.is_verified ?? true),
      is_banned: !!(user.is_banned ?? false),
      two_factor_secret: user.two_factor_secret || null,
      two_factor_enabled: !!(user.two_factor_enabled ?? false),
      referral_code: user.referral_code || null,
      referred_by: user.referred_by || null,
      created_at: now,
      updated_at: now
    };
    await this._getColl().insertOne(doc);
    return { ...doc, id: doc._id };
  },

  async updatePlan(id, plan) {
    const now = new Date();
    await this._getColl().updateOne(
      { _id: String(id) },
      { $set: { plan, updated_at: now } }
    );
    return this.findById(id);
  },

  async updateName(id, name) {
    const now = new Date();
    await this._getColl().updateOne(
      { _id: String(id) },
      { $set: { name: name.trim(), updated_at: now } }
    );
    return this.findById(id);
  },

  async setRole(id, role) {
    const now = new Date();
    await this._getColl().updateOne(
      { _id: String(id) },
      { $set: { role, updated_at: now } }
    );
    return this.findById(id);
  },

  async count() {
    return this._getColl().countDocuments();
  },

  _getResetColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.PASSWORD_RESETS);
  },

  async createPasswordReset({ userId, tokenHash, expiresAt, createdAt }) {
    const now = createdAt ? new Date(createdAt) : new Date();
    const exp = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    const doc = {
      _id: new ObjectId(),
      user_id: String(userId),
      token_hash: String(tokenHash),
      expires_at: exp,
      used: false,
      created_at: now
    };
    await this._getResetColl().insertOne(doc);
    return { ...doc, id: doc._id.toString() };
  },

  async findValidPasswordReset(tokenHash) {
    const now = new Date();
    const doc = await this._getResetColl().findOne({
      token_hash: String(tokenHash),
      used: false,
      expires_at: { $gte: now }
    });
    if (!doc) return null;
    return { ...doc, id: doc._id.toString() };
  },

  async markPasswordResetUsed(id) {
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: String(id) };
    await this._getResetColl().updateOne(filter, { $set: { used: true } });
    const doc = await this._getResetColl().findOne(filter);
    return doc ? { ...doc, id: doc._id.toString() } : null;
  },

  async countActiveSubscribers() {
    return this._getColl().countDocuments({ plan: { $ne: 'free' } });
  },

  async updatePassword(id, password_hash, salt) {
    const now = new Date();
    const res = await this._getColl().updateOne(
      { _id: String(id) },
      { $set: { password_hash, salt, updated_at: now } }
    );
    return res.matchedCount > 0;
  },

  async getUserStats(userId, userPlan = 'free') {
    const userIdStr = String(userId);
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');

    const historyColl = mdb.collection(COLLECTIONS.DOWNLOAD_HISTORY);
    const jobsColl = mdb.collection(COLLECTIONS.DOWNLOAD_JOBS);

    const totalDownloads = await historyColl.countDocuments({ user_id: userIdStr });
    const successfulDownloads = await jobsColl.countDocuments({ user_id: userIdStr, status: 'completed' });
    const failedDownloads = await jobsColl.countDocuments({ user_id: userIdStr, status: 'failed' });
    const activeQueueJobs = await jobsColl.countDocuments({
      user_id: userIdStr,
      status: { $in: ['queued', 'processing'] }
    });

    let dailyQuota = 15;
    let monthlyQuota = 250;
    if (userPlan === 'enterprise') {
      dailyQuota = 5000;
      monthlyQuota = 50000;
    } else if (userPlan === 'pro') {
      dailyQuota = 150;
      monthlyQuota = 3000;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
    const monthStr = todayStr.slice(0, 7);
    const monthStart = new Date(`${monthStr}-01T00:00:00.000Z`);

    const usedDaily = await historyColl.countDocuments({
      user_id: userIdStr,
      $or: [
        { created_at: { $gte: todayStart } },
        { created_at: { $gte: `${todayStr}T00:00:00.000Z` } }
      ]
    });

    const usedMonthly = await historyColl.countDocuments({
      user_id: userIdStr,
      $or: [
        { created_at: { $gte: monthStart } },
        { created_at: { $gte: `${monthStr}-01T00:00:00.000Z` } }
      ]
    });

    const platformAgg = await historyColl.aggregate([
      { $match: { user_id: userIdStr } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]).toArray();
    const platformStats = platformAgg.map(p => ({ platform: p._id, count: p.count }));

    const trendDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayStart = new Date(`${dateKey}T00:00:00.000Z`);
      const dayEnd = new Date(`${dateKey}T23:59:59.999Z`);

      const count = await historyColl.countDocuments({
        user_id: userIdStr,
        $or: [
          { created_at: { $gte: dayStart, $lte: dayEnd } },
          { created_at: { $gte: `${dateKey}T00:00:00.000Z`, $lte: `${dateKey}T23:59:59.999Z` } }
        ]
      });

      trendDays.push({
        date: dateKey,
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        count
      });
    }

    const recentDocs = await historyColl.find({ user_id: userIdStr })
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();
    const recentDownloads = recentDocs.map(d => ({
      id: d._id.toString(),
      title: d.title,
      url: d.url,
      platform: d.platform,
      thumbnail: d.thumbnail,
      resolution: d.resolution,
      duration: d.duration,
      created_at: d.created_at
    }));

    return {
      totalDownloads,
      successfulDownloads,
      failedDownloads,
      activeQueueJobs,
      plan: userPlan,
      quota: {
        daily: dailyQuota,
        usedDaily,
        remainingDaily: Math.max(0, dailyQuota - usedDaily),
        monthly: monthlyQuota,
        usedMonthly,
        remainingMonthly: Math.max(0, monthlyQuota - usedMonthly)
      },
      platformStats,
      downloadTrend: trendDays,
      recentDownloads
    };
  }
};

/**
 * Returns the appropriate UserRepository based on engine parameter or active DB_ENGINE.
 */
export function getUserRepository(engine = null) {
  const active = engine || getDbEngine();
  return active === SUPPORTED_ENGINES.MONGODB ? mongoUserRepository : sqliteUserRepository;
}
