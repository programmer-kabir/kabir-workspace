import fs from 'fs';
import db, { DB_PATH } from '../index.js';
import { getMongoDb } from '../mongo.js';
import { ObjectId } from 'mongodb';
import { COLLECTIONS } from '../mongoSchemas.js';
import { getDbEngine, SUPPORTED_ENGINES } from './index.js';

// SQLite Implementation
export const sqliteSystemRepository = {
  async getSetting(key) {
    const row = db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key);
    return row ? row.value : null;
  },

  async setSetting(key, value) {
    const now = new Date().toISOString();
    db.prepare('INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)')
      .run(key, String(value), now);
  },

  async recordLogin({ userId = null, email, ipAddress = null, userAgent = null, status = 'success' }) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO login_history (user_id, email, ip_address, user_agent, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, email.trim().toLowerCase(), ipAddress, userAgent, status, now);
  },

  async countFailedLoginsSince(email, sinceDate) {
    const isoString = sinceDate instanceof Date ? sinceDate.toISOString() : sinceDate;
    const row = db.prepare(`
      SELECT COUNT(*) as failedCount
      FROM login_history
      WHERE email = ? AND status = 'failed' AND created_at >= ?
    `).get(email.trim().toLowerCase(), isoString);
    return row ? row.failedCount : 0;
  },

  async findLastLoginSuccess(email, sinceDate) {
    const isoString = sinceDate instanceof Date ? sinceDate.toISOString() : sinceDate;
    return db.prepare(`
      SELECT created_at FROM login_history
      WHERE email = ? AND status = 'success' AND created_at >= ?
      ORDER BY created_at DESC LIMIT 1
    `).get(email.trim().toLowerCase(), isoString) || null;
  },

  async findLastLoginFailure(email, sinceDate) {
    const isoString = sinceDate instanceof Date ? sinceDate.toISOString() : sinceDate;
    return db.prepare(`
      SELECT created_at FROM login_history
      WHERE email = ? AND status = 'failed' AND created_at >= ?
      ORDER BY created_at DESC LIMIT 1
    `).get(email.trim().toLowerCase(), isoString) || null;
  },

  async logActivity(userId, action, details = null, ipAddress = null, userAgent = null) {
    if (!userId || !action) return;
    const detailsStr = typeof details === 'object' && details !== null ? JSON.stringify(details) : details;
    db.prepare(`
      INSERT INTO user_activity (user_id, action, details, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, action, detailsStr, ipAddress, userAgent, new Date().toISOString());
  },

  async logAdminAudit(adminId, action, targetType = null, targetId = null, details = null, ipAddress = null) {
    const detailsStr = typeof details === 'object' && details !== null ? JSON.stringify(details) : details;
    db.prepare(`
      INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(adminId, action, targetType, targetId, detailsStr, ipAddress, new Date().toISOString());
  },

  async getDatabaseDiagnostics() {
    const journalModeRow = db.prepare('PRAGMA journal_mode').get();
    const foreignKeysRow = db.prepare('PRAGMA foreign_keys').get();
    const tableCountRow = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get();
    let dbSizeBytes = 0;
    if (fs.existsSync(DB_PATH)) {
      dbSizeBytes = fs.statSync(DB_PATH).size;
    }
    return {
      path: DB_PATH,
      sizeBytes: dbSizeBytes,
      sizeHuman: `${(dbSizeBytes / 1024).toFixed(1)} KB`,
      journalMode: Object.values(journalModeRow || {})[0],
      foreignKeys: Object.values(foreignKeysRow || {})[0] === 1 ? 'enabled' : 'disabled',
      tablesCount: tableCountRow ? tableCountRow.count : 19,
      status: 'connected (WAL)'
    };
  },

  async getLoginHistory(userId, limit = 15) {
    return db.prepare(`
      SELECT ip_address, user_agent, status, created_at
      FROM login_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit);
  },

  async findUserActivityPaginated({ userId, search = '', page = 1, limit = 15 }) {
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit) || 15));
    const offset = (safePage - 1) * safeLimit;
    const cleanSearch = (search || '').trim().toLowerCase();

    let query = 'SELECT * FROM user_activity WHERE user_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM user_activity WHERE user_id = ?';
    const params = [userId];
    const countParams = [userId];

    if (cleanSearch) {
      query += ' AND (LOWER(action) LIKE ? OR LOWER(details) LIKE ?)';
      countQuery += ' AND (LOWER(action) LIKE ? OR LOWER(details) LIKE ?)';
      params.push(`%${cleanSearch}%`, `%${cleanSearch}%`);
      countParams.push(`%${cleanSearch}%`, `%${cleanSearch}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(safeLimit, offset);

    const activities = db.prepare(query).all(...params);
    const countRow = db.prepare(countQuery).get(...countParams);
    const total = countRow ? countRow.total : 0;

    return {
      activities,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit) || 1
    };
  }
};

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

export function getSystemRepository(engine = null) {
  const active = engine || getDbEngine();
  return active === SUPPORTED_ENGINES.MONGODB ? mongoSystemRepository : sqliteSystemRepository;
}
