import { getMongoDb } from '../mongo.js';
import { ObjectId } from 'mongodb';
import { COLLECTIONS } from '../mongoSchemas.js';

// MongoDB Implementation
export const mongoSystemRepository = {
  _getSettingsColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.SYSTEM_SETTINGS);
  },

  _getLoginColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.LOGIN_HISTORY);
  },

  _getActivityColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.USER_ACTIVITY);
  },

  _getAuditColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.ADMIN_AUDIT_LOGS);
  },

  async getSetting(key) {
    const doc = await this._getSettingsColl().findOne({ _id: String(key) });
    return doc ? doc.value : null;
  },

  async setSetting(key, value) {
    const now = new Date();
    await this._getSettingsColl().updateOne(
      { _id: String(key) },
      { $set: { key: String(key), value: String(value), updated_at: now } },
      { upsert: true }
    );
  },

  async recordLogin({ userId = null, email, ipAddress = null, userAgent = null, status = 'success' }) {
    const doc = {
      _id: new ObjectId(),
      user_id: userId ? String(userId) : null,
      email: email.trim().toLowerCase(),
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      status: status || 'success',
      created_at: new Date()
    };
    await this._getLoginColl().insertOne(doc);
  },

  async countFailedLoginsSince(email, sinceDate) {
    const dateObj = sinceDate instanceof Date ? sinceDate : new Date(sinceDate);
    return this._getLoginColl().countDocuments({
      email: email.trim().toLowerCase(),
      status: 'failed',
      created_at: { $gte: dateObj }
    });
  },

  async findLastLoginSuccess(email, sinceDate) {
    const dateObj = sinceDate instanceof Date ? sinceDate : new Date(sinceDate);
    return this._getLoginColl().findOne(
      {
        email: email.trim().toLowerCase(),
        status: 'success',
        created_at: { $gte: dateObj }
      },
      { sort: { created_at: -1 } }
    );
  },

  async findLastLoginFailure(email, sinceDate) {
    const dateObj = sinceDate instanceof Date ? sinceDate : new Date(sinceDate);
    return this._getLoginColl().findOne(
      {
        email: email.trim().toLowerCase(),
        status: 'failed',
        created_at: { $gte: dateObj }
      },
      { sort: { created_at: -1 } }
    );
  },

  async logActivity(userId, action, details = null, ipAddress = null, userAgent = null) {
    if (!userId || !action) return;
    const doc = {
      _id: new ObjectId(),
      user_id: String(userId),
      action: String(action),
      details: details || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      created_at: new Date()
    };
    await this._getActivityColl().insertOne(doc);
  },

  async logAdminAudit(adminId, action, targetType = null, targetId = null, details = null, ipAddress = null) {
    const doc = {
      _id: new ObjectId(),
      admin_id: adminId ? String(adminId) : null,
      action: String(action),
      target_type: targetType || null,
      target_id: targetId || null,
      details: details || null,
      ip_address: ipAddress || null,
      created_at: new Date()
    };
    await this._getAuditColl().insertOne(doc);
  },

  async getDatabaseDiagnostics() {
    const mdb = getMongoDb();
    if (!mdb) {
      return {
        path: 'mongodb://cluster',
        sizeBytes: 0,
        sizeHuman: '0 KB',
        journalMode: 'wiredTiger',
        foreignKeys: 'schema_validated',
        tablesCount: 19,
        status: 'disconnected'
      };
    }
    const stats = await mdb.command({ dbStats: 1 }).catch(() => ({ dataSize: 0, collections: 19 }));
    const sizeBytes = stats.dataSize || 0;
    return {
      path: 'MongoDB Atlas',
      sizeBytes,
      sizeHuman: `${(sizeBytes / 1024).toFixed(1)} KB`,
      journalMode: 'wiredTiger',
      foreignKeys: 'schema_validated',
      tablesCount: stats.collections || 19,
      status: 'connected (MongoDB Atlas)'
    };
  },

  async getLoginHistory(userId, limit = 15) {
    const docs = await this._getLoginColl().find({ user_id: String(userId) })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
    return docs.map(d => ({
      ip_address: d.ip_address,
      user_agent: d.user_agent,
      status: d.status,
      created_at: d.created_at
    }));
  },

  async findUserActivityPaginated({ userId, search = '', page = 1, limit = 15 }) {
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit) || 15));
    const skip = (safePage - 1) * safeLimit;
    const cleanSearch = (search || '').trim();

    const filter = { user_id: String(userId) };
    if (cleanSearch) {
      filter.$or = [
        { action: { $regex: cleanSearch, $options: 'i' } },
        { details: { $regex: cleanSearch, $options: 'i' } }
      ];
    }

    const total = await this._getActivityColl().countDocuments(filter);
    const docs = await this._getActivityColl().find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(safeLimit)
      .toArray();

    return {
      activities: docs.map(d => ({ ...d, id: d._id.toString() })),
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit) || 1
    };
  }
};

export function getSystemRepository() {
  return mongoSystemRepository;
}

export default mongoSystemRepository;
