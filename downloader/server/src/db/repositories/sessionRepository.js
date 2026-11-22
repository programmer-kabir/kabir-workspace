import db from '../index.js';
import { getMongoDb } from '../mongo.js';
import { COLLECTIONS } from '../mongoSchemas.js';
import { getDbEngine, SUPPORTED_ENGINES } from './index.js';

// SQLite Implementation
export const sqliteSessionRepository = {
  async findByTokenHash(tokenHash) {
    const session = db.prepare(`
      SELECT s.*, u.id as user_id, u.email, u.name, u.role, u.plan, u.is_banned, u.two_factor_enabled, u.referral_code
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token_hash = ?
    `).get(tokenHash);
    return session || null;
  },

  async create(session) {
    const now = session.created_at || new Date().toISOString();
    db.prepare(`
      INSERT INTO sessions (
        id, user_id, token_hash, ip_address, user_agent, expires_at, created_at, last_active_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id,
      session.user_id,
      session.token_hash,
      session.ip_address || null,
      session.user_agent || null,
      session.expires_at,
      now,
      now
    );
    return db.prepare('SELECT * FROM sessions WHERE id = ?').get(session.id);
  },

  async findByUserId(userId) {
    return db.prepare('SELECT * FROM sessions WHERE user_id = ? ORDER BY last_active_at DESC').all(userId);
  },

  async deleteById(id) {
    const res = db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
    return res.changes > 0;
  },

  async deleteByUserIdExcept(userId, excludeSessionId) {
    const res = db.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').run(userId, excludeSessionId);
    return res.changes;
  },

  async deleteExpired() {
    const now = new Date().toISOString();
    const res = db.prepare('DELETE FROM sessions WHERE datetime(expires_at) < datetime(?)').run(now);
    return res.changes;
  },

  async count() {
    return db.prepare('SELECT COUNT(*) as count FROM sessions').get().count;
  },

  async touch(id) {
    const now = new Date().toISOString();
    const res = db.prepare('UPDATE sessions SET last_active_at = ? WHERE id = ?').run(now, id);
    return res.changes > 0;
  },

  async deleteByTokenHash(tokenHash) {
    const res = db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
    return res.changes > 0;
  },

  async deleteByIdAndUserId(id, userId) {
    const res = db.prepare('DELETE FROM sessions WHERE id = ? AND user_id = ?').run(id, userId);
    return res.changes > 0;
  },

  async deleteByUserId(userId) {
    const res = db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    return res.changes;
  }
};

// MongoDB Implementation
export const mongoSessionRepository = {
  _getColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.SESSIONS);
  },

  async findByTokenHash(tokenHash) {
    const coll = this._getColl();
    const session = await coll.findOne({ token_hash: tokenHash });
    if (!session) return null;

    // Join with users collection
    const user = await getMongoDb().collection(COLLECTIONS.USERS).findOne({ _id: session.user_id });
    if (!user) return null;

    return {
      ...session,
      id: session._id,
      user_id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      is_banned: user.is_banned ? 1 : 0,
      two_factor_enabled: user.two_factor_enabled ? 1 : 0,
      referral_code: user.referral_code
    };
  },

  async create(session) {
    const now = session.created_at ? new Date(session.created_at) : new Date();
    const expiresAt = session.expires_at ? new Date(session.expires_at) : new Date(Date.now() + 7 * 86400 * 1000);
    const doc = {
      _id: String(session.id),
      user_id: String(session.user_id),
      token_hash: String(session.token_hash),
      ip_address: session.ip_address || null,
      user_agent: session.user_agent || null,
      expires_at: expiresAt,
      created_at: now,
      last_active_at: now
    };
    await this._getColl().insertOne(doc);
    return { ...doc, id: doc._id };
  },

  async findByUserId(userId) {
    const docs = await this._getColl().find({ user_id: String(userId) }).sort({ last_active_at: -1 }).toArray();
    return docs.map(d => ({ ...d, id: d._id }));
  },

  async deleteById(id) {
    const res = await this._getColl().deleteOne({ _id: String(id) });
    return res.deletedCount > 0;
  },

  async deleteByUserIdExcept(userId, excludeSessionId) {
    const res = await this._getColl().deleteMany({
      user_id: String(userId),
      _id: { $ne: String(excludeSessionId) }
    });
    return res.deletedCount;
  },

  async deleteExpired() {
    const now = new Date();
    const res = await this._getColl().deleteMany({ expires_at: { $lt: now } });
    return res.deletedCount;
  },

  async count() {
    return this._getColl().countDocuments();
  },

  async touch(id) {
    const res = await this._getColl().updateOne({ _id: String(id) }, { $set: { last_active_at: new Date() } });
    return res.matchedCount > 0;
  },

  async deleteByTokenHash(tokenHash) {
    const res = await this._getColl().deleteOne({ token_hash: String(tokenHash) });
    return res.deletedCount > 0;
  },

  async deleteByIdAndUserId(id, userId) {
    const res = await this._getColl().deleteOne({ _id: String(id), user_id: String(userId) });
    return res.deletedCount > 0;
  },

  async deleteByUserId(userId) {
    const res = await this._getColl().deleteMany({ user_id: String(userId) });
    return res.deletedCount;
  }
};

export function getSessionRepository(engine = null) {
  const active = engine || getDbEngine();
  return active === SUPPORTED_ENGINES.MONGODB ? mongoSessionRepository : sqliteSessionRepository;
}
