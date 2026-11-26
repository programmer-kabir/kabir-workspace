import { getMongoDb } from '../mongo.js';
import { COLLECTIONS } from '../mongoSchemas.js';

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
    const now = (session.created_at || session.createdAt) ? new Date(session.created_at || session.createdAt) : new Date();
    const rawExp = session.expires_at || session.expiresAt;
    const expiresAt = rawExp ? new Date(rawExp) : new Date(Date.now() + 7 * 86400 * 1000);
    const userId = session.user_id || session.userId;
    const tokenHash = session.token_hash || session.tokenHash;
    const ipAddress = session.ip_address || session.ipAddress || null;
    const userAgent = session.user_agent || session.userAgent || null;
    const doc = {
      _id: String(session.id),
      user_id: String(userId),
      token_hash: String(tokenHash),
      ip_address: ipAddress,
      user_agent: userAgent,
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

export function getSessionRepository() {
  return mongoSessionRepository;
}

export default mongoSessionRepository;
