import { getMongoDb } from '../mongo.js';
import { ObjectId } from 'mongodb';
import { COLLECTIONS } from '../mongoSchemas.js';

// MongoDB Implementation
export const mongoApiKeyRepository = {
  _getColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.API_KEYS);
  },

  _getLogsColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.API_LOGS);
  },

  async createKey(key) {
    const now = key.created_at ? new Date(key.created_at) : new Date();
    const doc = {
      _id: String(key.id),
      user_id: String(key.user_id),
      name: String(key.name),
      key_prefix: String(key.key_prefix),
      key_hash: String(key.key_hash),
      status: String(key.status || 'active'),
      monthly_quota: key.monthly_quota || 500,
      requests_this_month: key.requests_this_month || 0,
      last_used_at: key.last_used_at ? new Date(key.last_used_at) : null,
      created_at: now,
      is_enabled: !!(key.is_enabled ?? true),
      expires_at: key.expires_at ? new Date(key.expires_at) : null,
      last_used_ip: key.last_used_ip || null
    };
    await this._getColl().insertOne(doc);
    return { ...doc, id: doc._id };
  },

  async findByHash(keyHash) {
    const key = await this._getColl().findOne({ key_hash: String(keyHash) });
    if (!key) return null;

    const user = await getMongoDb().collection(COLLECTIONS.USERS).findOne({ _id: key.user_id });
    if (!user) return null;

    return {
      ...key,
      id: key._id,
      plan: user.plan,
      role: user.role,
      is_banned: user.is_banned ? 1 : 0
    };
  },

  async findByUserId(userId) {
    const docs = await this._getColl().find({ user_id: String(userId) }).sort({ created_at: -1 }).toArray();
    return docs.map(d => ({ ...d, id: d._id }));
  },

  async updateUsage(id, ip = null) {
    const now = new Date();
    await this._getColl().updateOne(
      { _id: String(id) },
      {
        $inc: { requests_this_month: 1 },
        $set: { last_used_at: now, last_used_ip: ip }
      }
    );
  },

  async createLog(log) {
    const now = log.created_at ? new Date(log.created_at) : new Date();
    const doc = {
      _id: new ObjectId(),
      sqlite_id: log.sqlite_id || null,
      api_key_id: log.api_key_id ? String(log.api_key_id) : null,
      user_id: log.user_id ? String(log.user_id) : null,
      endpoint: String(log.endpoint),
      method: String(log.method),
      status_code: log.status_code,
      response_time_ms: log.response_time_ms,
      ip_address: log.ip_address || null,
      error_message: log.error_message || null,
      created_at: now
    };
    await this._getLogsColl().insertOne(doc);
    return { ...doc, id: doc._id };
  },

  async getLogsByUserId(userId, limit = 50) {
    const docs = await this._getLogsColl().find({ user_id: String(userId) })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
    return docs.map(d => ({ ...d, id: d._id }));
  },

  async countActiveKeysByUserId(userId) {
    return this._getColl().countDocuments({
      user_id: String(userId),
      status: { $ne: 'revoked' }
    });
  },

  async findKeyByIdAndUserId(id, userId) {
    const doc = await this._getColl().findOne({
      _id: String(id),
      user_id: String(userId)
    });
    return doc ? { ...doc, id: doc._id } : null;
  },

  async toggleKeyStatus(id, userId, isEnabled) {
    const res = await this._getColl().updateOne(
      { _id: String(id), user_id: String(userId) },
      { $set: { is_enabled: !!isEnabled } }
    );
    return res.matchedCount > 0;
  },

  async revokeKey(id, userId) {
    const res = await this._getColl().updateOne(
      { _id: String(id), user_id: String(userId) },
      { $set: { status: 'revoked', is_enabled: false } }
    );
    return res.matchedCount > 0;
  },

  async deleteKey(id, userId) {
    const res = await this._getColl().deleteOne({
      _id: String(id),
      user_id: String(userId)
    });
    return res.deletedCount > 0;
  },

  async regenerateKey(id, userId, keyPrefix, keyHash) {
    const res = await this._getColl().updateOne(
      { _id: String(id), user_id: String(userId) },
      {
        $set: {
          key_prefix: String(keyPrefix),
          key_hash: String(keyHash),
          status: 'active',
          is_enabled: true
        }
      }
    );
    return res.matchedCount > 0;
  },

  async getKeyUsageStats(apiKeyId) {
    const keyIdStr = String(apiKeyId);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayStart = new Date(`${todayStr}T00:00:00.000Z`);

    const todayFilter = {
      api_key_id: keyIdStr,
      $or: [
        { created_at: { $gte: todayStart } },
        { created_at: { $gte: `${todayStr}T00:00:00.000Z` } }
      ]
    };

    const todayCount = await this._getLogsColl().countDocuments(todayFilter);
    const totalRequests = await this._getLogsColl().countDocuments({ api_key_id: keyIdStr });

    const agg = await this._getLogsColl().aggregate([
      { $match: { api_key_id: keyIdStr } },
      { $group: { _id: null, avg_time: { $avg: '$response_time_ms' } } }
    ]).toArray();

    return {
      todayCount,
      totalRequests,
      averageResponseTimeMs: Math.round(agg[0]?.avg_time || 0)
    };
  },

  async getUserDeveloperStats(userId, userPlan = 'free') {
    const userIdStr = String(userId);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
    const monthStr = todayStr.slice(0, 7);
    const monthStart = new Date(`${monthStr}-01T00:00:00.000Z`);

    const totalRequests = await this._getLogsColl().countDocuments({ user_id: userIdStr });
    const requestsToday = await this._getLogsColl().countDocuments({
      user_id: userIdStr,
      $or: [
        { created_at: { $gte: todayStart } },
        { created_at: { $gte: `${todayStr}T00:00:00.000Z` } }
      ]
    });
    const requestsThisMonth = await this._getLogsColl().countDocuments({
      user_id: userIdStr,
      $or: [
        { created_at: { $gte: monthStart } },
        { created_at: { $gte: `${monthStr}-01T00:00:00.000Z` } }
      ]
    });

    const successfulRequests = await this._getLogsColl().countDocuments({
      user_id: userIdStr,
      status_code: { $gte: 200, $lt: 400 }
    });
    const failedRequests = await this._getLogsColl().countDocuments({
      user_id: userIdStr,
      status_code: { $gte: 400 }
    });

    const agg = await this._getLogsColl().aggregate([
      { $match: { user_id: userIdStr } },
      { $group: { _id: null, avg_time: { $avg: '$response_time_ms' } } }
    ]).toArray();
    const averageResponseTimeMs = Math.round(agg[0]?.avg_time || 0);

    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayStart = new Date(`${dateKey}T00:00:00.000Z`);
      const dayEnd = new Date(`${dateKey}T23:59:59.999Z`);

      const count = await this._getLogsColl().countDocuments({
        user_id: userIdStr,
        $or: [
          { created_at: { $gte: dayStart, $lte: dayEnd } },
          { created_at: { $gte: `${dateKey}T00:00:00.000Z`, $lte: `${dateKey}T23:59:59.999Z` } }
        ]
      });

      trend.push({
        date: dateKey,
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        count
      });
    }

    const endpointAgg = await this._getLogsColl().aggregate([
      { $match: { user_id: userIdStr } },
      { $group: { _id: { endpoint: '$endpoint', method: '$method' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]).toArray();

    const endpointBreakdown = endpointAgg.map(e => ({
      endpoint: e._id.endpoint,
      method: e._id.method,
      count: e.count
    }));

    let monthlyQuota = 1000;
    if (userPlan === 'enterprise') monthlyQuota = 500000;
    else if (userPlan === 'pro') monthlyQuota = 25000;

    return {
      totalRequests,
      requestsToday,
      requestsThisMonth,
      successfulRequests,
      failedRequests,
      averageResponseTimeMs,
      plan: userPlan,
      quota: {
        monthlyLimit: monthlyQuota,
        usedThisMonth: requestsThisMonth,
        remainingMonth: Math.max(0, monthlyQuota - requestsThisMonth)
      },
      usageTrend: trend,
      endpointBreakdown
    };
  },

  async findLogsPaginated({ userId, endpoint, status, search, page = 1, limit = 20 }) {
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const filter = { user_id: String(userId) };

    if (endpoint && endpoint !== 'all') {
      filter.endpoint = { $regex: endpoint, $options: 'i' };
    }

    if (status && status !== 'all') {
      if (status === 'success') {
        filter.status_code = { $gte: 200, $lt: 400 };
      } else if (status === 'error') {
        filter.status_code = { $gte: 400 };
      }
    }

    if (search) {
      filter.$or = [
        { endpoint: { $regex: search, $options: 'i' } },
        { ip_address: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await this._getLogsColl().countDocuments(filter);
    const docs = await this._getLogsColl().find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(safeLimit)
      .toArray();

    const logs = docs.map(d => ({ ...d, id: d._id.toString() }));

    return {
      logs,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit) || 1
    };
  }
};

export function getApiKeyRepository() {
  return mongoApiKeyRepository;
}

export default mongoApiKeyRepository;
