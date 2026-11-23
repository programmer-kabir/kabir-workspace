import db from '../index.js';
import { getMongoDb } from '../mongo.js';
import { ObjectId } from 'mongodb';
import { COLLECTIONS } from '../mongoSchemas.js';
import { getDbEngine, SUPPORTED_ENGINES } from './index.js';

// SQLite Implementation
export const sqliteNotificationRepository = {
  async create(notif) {
    const now = notif.created_at || new Date().toISOString();
    const userId = notif.user_id || notif.userId;
    const res = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, is_read, link, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      notif.title,
      notif.message,
      notif.type || 'info',
      notif.is_read ? 1 : 0,
      notif.link || null,
      now
    );
    return db.prepare('SELECT * FROM notifications WHERE id = ?').get(res.lastInsertRowid);
  },

  async findByUserId(userId, limit = 50) {
    return db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(userId, limit);
  },

  async countUnread(userId) {
    return db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0')
      .get(userId).count;
  },

  async markRead(id, userId) {
    const res = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
    return res.changes > 0;
  },

  async markAllRead(userId) {
    const res = db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
    return res.changes;
  },

  async deleteById(id, userId) {
    const res = db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(id, userId);
    return res.changes > 0;
  },

  async clearAll(userId) {
    const res = db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
    return res.changes;
  },

  async findNotifications({ userId, unreadOnly = false, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
    const params = [userId];
    const countParams = [userId];

    if (unreadOnly) {
      query += ' AND is_read = 0';
      countQuery += ' AND is_read = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const notifications = db.prepare(query).all(...params);
    const countRow = db.prepare(countQuery).get(...countParams);
    const total = countRow ? countRow.total : 0;

    const unreadRow = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(userId);
    const unreadCount = unreadRow ? unreadRow.count : 0;

    return {
      notifications,
      unreadCount,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    };
  }
};

// MongoDB Implementation
export const mongoNotificationRepository = {
  _getColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.NOTIFICATIONS);
  },

  async create(notif) {
    const now = notif.created_at ? new Date(notif.created_at) : new Date();
    const userId = notif.user_id || notif.userId;
    const doc = {
      _id: new ObjectId(),
      sqlite_id: notif.sqlite_id || null,
      user_id: String(userId),
      title: String(notif.title),
      message: String(notif.message),
      type: String(notif.type || 'info'),
      is_read: !!notif.is_read,
      link: notif.link || null,
      created_at: now
    };
    await this._getColl().insertOne(doc);
    return { ...doc, id: doc._id.toString() };
  },

  async findByUserId(userId, limit = 50) {
    const docs = await this._getColl().find({ user_id: String(userId) })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
    return docs.map(d => ({ ...d, id: d._id.toString(), is_read: d.is_read ? 1 : 0 }));
  },

  async countUnread(userId) {
    return this._getColl().countDocuments({ user_id: String(userId), is_read: false });
  },

  _buildIdQuery(id, userId) {
    const query = { user_id: String(userId) };
    if (id instanceof ObjectId) {
      query._id = id;
    } else if (typeof id === 'string' && ObjectId.isValid(id) && id.length === 24) {
      query.$or = [{ _id: new ObjectId(id) }, { _id: String(id) }];
    } else {
      const num = parseInt(id, 10);
      query.$or = [{ _id: String(id) }];
      if (!isNaN(num)) query.$or.push({ sqlite_id: num });
    }
    return query;
  },

  async markRead(id, userId) {
    const query = this._buildIdQuery(id, userId);
    const res = await this._getColl().updateOne(query, { $set: { is_read: true } });
    return res.modifiedCount > 0;
  },

  async markAllRead(userId) {
    const res = await this._getColl().updateMany(
      { user_id: String(userId), is_read: false },
      { $set: { is_read: true } }
    );
    return res.modifiedCount;
  },

  async deleteById(id, userId) {
    const query = this._buildIdQuery(id, userId);
    const res = await this._getColl().deleteOne(query);
    return res.deletedCount > 0;
  },

  async clearAll(userId) {
    const res = await this._getColl().deleteMany({ user_id: String(userId) });
    return res.deletedCount;
  },

  async findNotifications({ userId, unreadOnly = false, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const filter = { user_id: String(userId) };
    if (unreadOnly) {
      filter.is_read = false;
    }

    const [total, unreadCount, docs] = await Promise.all([
      this._getColl().countDocuments(filter),
      this._getColl().countDocuments({ user_id: String(userId), is_read: false }),
      this._getColl().find(filter)
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(limit)
        .toArray()
    ]);

    const notifications = docs.map(d => ({ ...d, id: d._id, is_read: d.is_read ? 1 : 0 }));

    return {
      notifications,
      unreadCount,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    };
  }
};

export function getNotificationRepository(engine = null) {
  const active = engine || getDbEngine();
  return active === SUPPORTED_ENGINES.MONGODB ? mongoNotificationRepository : sqliteNotificationRepository;
}
