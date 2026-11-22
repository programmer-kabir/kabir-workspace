import db from '../index.js';
import { getMongoDb } from '../mongo.js';
import { ObjectId } from 'mongodb';
import { COLLECTIONS } from '../mongoSchemas.js';
import { getDbEngine, SUPPORTED_ENGINES } from './index.js';

// SQLite Implementation
export const sqliteHistoryRepository = {
  async create(entry) {
    const now = entry.created_at || new Date().toISOString();
    const res = db.prepare(`
      INSERT INTO download_history (
        user_id, job_id, url, platform, title, thumbnail, format_id, type, resolution, file_size, duration, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.user_id || null,
      entry.job_id || null,
      entry.url,
      entry.platform || 'generic',
      entry.title || 'Untitled Download',
      entry.thumbnail || null,
      entry.format_id || null,
      entry.type || 'video',
      entry.resolution || null,
      entry.file_size || null,
      entry.duration || null,
      entry.status || 'completed',
      now
    );
    return db.prepare('SELECT * FROM download_history WHERE id = ?').get(res.lastInsertRowid);
  },

  async findByUserId(userId, { limit = 50, offset = 0, platform = null, search = '' } = {}) {
    let query = 'SELECT * FROM download_history WHERE user_id = ?';
    const params = [userId];

    if (platform) {
      query += ' AND platform = ?';
      params.push(platform);
    }
    if (search) {
      query += ' AND (title LIKE ? OR url LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  },

  async countSince(userId, sinceDate) {
    if (!userId) return 0;
    const isoString = sinceDate instanceof Date ? sinceDate.toISOString() : sinceDate;
    return db.prepare('SELECT COUNT(*) as count FROM download_history WHERE user_id = ? AND created_at >= ?')
      .get(userId, isoString).count;
  },

  async deleteById(id, userId) {
    const res = db.prepare('DELETE FROM download_history WHERE id = ? AND user_id = ?').run(id, userId);
    return res.changes > 0;
  },

  async findByIdAndUserId(id, userId) {
    return db.prepare('SELECT * FROM download_history WHERE id = ? AND user_id = ?').get(id, userId) || null;
  },

  async deleteBulk(ids, userId) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const statement = db.prepare(`DELETE FROM download_history WHERE id IN (${placeholders}) AND user_id = ?`);
    const res = statement.run(...ids, userId);
    return res.changes;
  },

  async findHistory({ userId, search = '', platform = '', type = '', dateFrom = '', dateTo = '', sort = 'DESC', page = 1, limit = 10 }) {
    const cleanSearch = (search || '').trim().toLowerCase();
    const cleanPlatform = (platform || '').trim();
    const cleanType = (type || '').trim().toLowerCase();
    const sortDir = sort === 'oldest' || sort === 'ASC' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM download_history WHERE user_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM download_history WHERE user_id = ?';
    const params = [userId];
    const countParams = [userId];

    if (cleanSearch) {
      query += ' AND (LOWER(title) LIKE ? OR LOWER(url) LIKE ?)';
      countQuery += ' AND (LOWER(title) LIKE ? OR LOWER(url) LIKE ?)';
      params.push(`%${cleanSearch}%`, `%${cleanSearch}%`);
      countParams.push(`%${cleanSearch}%`, `%${cleanSearch}%`);
    }

    if (cleanPlatform && cleanPlatform !== 'all') {
      query += ' AND LOWER(platform) = LOWER(?)';
      countQuery += ' AND LOWER(platform) = LOWER(?)';
      params.push(cleanPlatform);
      countParams.push(cleanPlatform);
    }

    if (cleanType && cleanType !== 'all') {
      query += ' AND type = ?';
      countQuery += ' AND type = ?';
      params.push(cleanType);
      countParams.push(cleanType);
    }

    if (dateFrom) {
      query += ' AND created_at >= ?';
      countQuery += ' AND created_at >= ?';
      params.push(`${dateFrom}T00:00:00.000Z`);
      countParams.push(`${dateFrom}T00:00:00.000Z`);
    }

    if (dateTo) {
      query += ' AND created_at <= ?';
      countQuery += ' AND created_at <= ?';
      params.push(`${dateTo}T23:59:59.999Z`);
      countParams.push(`${dateTo}T23:59:59.999Z`);
    }

    query += ` ORDER BY created_at ${sortDir} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const history = db.prepare(query).all(...params);
    const countRow = db.prepare(countQuery).get(...countParams);
    const total = countRow ? countRow.total : 0;

    const platformRows = db.prepare(`
      SELECT DISTINCT platform FROM download_history WHERE user_id = ? ORDER BY platform ASC
    `).all(userId);
    const platforms = platformRows.map(p => p.platform);

    return {
      history,
      platforms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }
};

// MongoDB Implementation
export const mongoHistoryRepository = {
  _getColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.DOWNLOAD_HISTORY);
  },

  async create(entry) {
    const now = entry.created_at ? new Date(entry.created_at) : new Date();
    const doc = {
      _id: new ObjectId(),
      sqlite_id: entry.sqlite_id || null,
      user_id: entry.user_id ? String(entry.user_id) : null,
      job_id: entry.job_id ? String(entry.job_id) : null,
      url: String(entry.url),
      platform: String(entry.platform || 'generic'),
      title: String(entry.title || 'Untitled Download'),
      thumbnail: entry.thumbnail || null,
      format_id: entry.format_id || null,
      type: entry.type || 'video',
      resolution: entry.resolution || null,
      file_size: entry.file_size || null,
      duration: entry.duration || null,
      status: entry.status || 'completed',
      created_at: now
    };
    await this._getColl().insertOne(doc);
    return { ...doc, id: doc._id };
  },

  async findByUserId(userId, { limit = 50, offset = 0, platform = null, search = '' } = {}) {
    const filter = { user_id: String(userId) };
    if (platform) filter.platform = platform;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { url: { $regex: search, $options: 'i' } }
      ];
    }
    const docs = await this._getColl().find(filter)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return docs.map(d => ({ ...d, id: d._id }));
  },

  async countSince(userId, sinceDate) {
    if (!userId) return 0;
    const dateObj = sinceDate instanceof Date ? sinceDate : new Date(sinceDate);
    return this._getColl().countDocuments({
      user_id: String(userId),
      created_at: { $gte: dateObj }
    });
  },

  async deleteById(id, userId) {
    const query = { user_id: String(userId) };
    if (typeof id === 'string' && id.length === 24) {
      query._id = new ObjectId(id);
    } else {
      query.$or = [{ _id: String(id) }, { sqlite_id: parseInt(id, 10) }];
    }
    const res = await this._getColl().deleteOne(query);
    return res.deletedCount > 0;
  },

  async findByIdAndUserId(id, userId) {
    const query = { user_id: String(userId) };
    if (typeof id === 'string' && id.length === 24) {
      query._id = new ObjectId(id);
    } else {
      query.$or = [{ _id: String(id) }, { sqlite_id: parseInt(id, 10) }];
    }
    const doc = await this._getColl().findOne(query);
    return doc ? { ...doc, id: doc._id } : null;
  },

  async deleteBulk(ids, userId) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    const objectIds = [];
    const sqliteIds = [];
    const stringIds = [];

    for (const id of ids) {
      if (typeof id === 'string' && id.length === 24) {
        objectIds.push(new ObjectId(id));
      } else if (Number.isInteger(Number(id))) {
        sqliteIds.push(Number(id));
      } else {
        stringIds.push(String(id));
      }
    }

    const filter = {
      user_id: String(userId),
      $or: [
        ...(objectIds.length ? [{ _id: { $in: objectIds } }] : []),
        ...(sqliteIds.length ? [{ sqlite_id: { $in: sqliteIds } }] : []),
        ...(stringIds.length ? [{ _id: { $in: stringIds } }] : [])
      ]
    };

    const res = await this._getColl().deleteMany(filter);
    return res.deletedCount;
  },

  async findHistory({ userId, search = '', platform = '', type = '', dateFrom = '', dateTo = '', sort = 'DESC', page = 1, limit = 10 }) {
    const cleanSearch = (search || '').trim();
    const cleanPlatform = (platform || '').trim();
    const cleanType = (type || '').trim().toLowerCase();
    const sortDir = sort === 'oldest' || sort === 'ASC' ? 1 : -1;
    const offset = (page - 1) * limit;

    const filter = { user_id: String(userId) };
    if (cleanSearch) {
      filter.$or = [
        { title: { $regex: cleanSearch, $options: 'i' } },
        { url: { $regex: cleanSearch, $options: 'i' } }
      ];
    }
    if (cleanPlatform && cleanPlatform !== 'all') {
      filter.platform = { $regex: `^${cleanPlatform}$`, $options: 'i' };
    }
    if (cleanType && cleanType !== 'all') {
      filter.type = cleanType;
    }
    if (dateFrom || dateTo) {
      filter.created_at = {};
      if (dateFrom) filter.created_at.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
      if (dateTo) filter.created_at.$lte = new Date(`${dateTo}T23:59:59.999Z`);
    }

    const total = await this._getColl().countDocuments(filter);
    const docs = await this._getColl().find(filter)
      .sort({ created_at: sortDir })
      .skip(offset)
      .limit(limit)
      .toArray();

    const history = docs.map(d => ({ ...d, id: d._id }));
    const distinctPlatforms = await this._getColl().distinct('platform', { user_id: String(userId) });

    return {
      history,
      platforms: distinctPlatforms.filter(Boolean).sort(),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }
};

export function getHistoryRepository(engine = null) {
  const active = engine || getDbEngine();
  return active === SUPPORTED_ENGINES.MONGODB ? mongoHistoryRepository : sqliteHistoryRepository;
}
