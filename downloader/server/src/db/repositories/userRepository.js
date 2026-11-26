import { getMongoDb } from '../mongo.js';
import { ObjectId } from 'mongodb';
import { COLLECTIONS } from '../mongoSchemas.js';

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

  async update(id, fields) {
    const now = new Date();
    await this._getColl().updateOne(
      { _id: String(id) },
      { $set: { ...fields, updated_at: now } }
    );
    return this.findById(id);
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

    const trendDayDefs = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayStart = new Date(`${dateKey}T00:00:00.000Z`);
      const dayEnd = new Date(`${dateKey}T23:59:59.999Z`);
      trendDayDefs.push({
        date: dateKey,
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        dayStart,
        dayEnd
      });
    }

    const [
      totalDownloads,
      successfulDownloads,
      failedDownloads,
      activeQueueJobs,
      usedDaily,
      usedMonthly,
      platformAgg,
      recentDocs,
      ...trendCounts
    ] = await Promise.all([
      historyColl.countDocuments({ user_id: userIdStr }),
      jobsColl.countDocuments({ user_id: userIdStr, status: 'completed' }),
      jobsColl.countDocuments({ user_id: userIdStr, status: 'failed' }),
      jobsColl.countDocuments({
        user_id: userIdStr,
        status: { $in: ['queued', 'processing'] }
      }),
      historyColl.countDocuments({
        user_id: userIdStr,
        $or: [
          { created_at: { $gte: todayStart } },
          { created_at: { $gte: `${todayStr}T00:00:00.000Z` } }
        ]
      }),
      historyColl.countDocuments({
        user_id: userIdStr,
        $or: [
          { created_at: { $gte: monthStart } },
          { created_at: { $gte: `${monthStr}-01T00:00:00.000Z` } }
        ]
      }),
      historyColl.aggregate([
        { $match: { user_id: userIdStr } },
        { $group: { _id: '$platform', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]).toArray(),
      historyColl.find({ user_id: userIdStr })
        .sort({ created_at: -1 })
        .limit(5)
        .toArray(),
      ...trendDayDefs.map(t => historyColl.countDocuments({
        user_id: userIdStr,
        $or: [
          { created_at: { $gte: t.dayStart, $lte: t.dayEnd } },
          { created_at: { $gte: `${t.date}T00:00:00.000Z`, $lte: `${t.date}T23:59:59.999Z` } }
        ]
      }))
    ]);

    const platformStats = platformAgg.map(p => ({ platform: p._id, count: p.count }));
    const trendDays = trendDayDefs.map((t, idx) => ({
      date: t.date,
      label: t.label,
      count: trendCounts[idx] || 0
    }));

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
export function getUserRepository() {
  return mongoUserRepository;
}

export default mongoUserRepository;
