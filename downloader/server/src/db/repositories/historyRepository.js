import { getMongoDb } from '../mongo.js';
import { ObjectId } from 'mongodb';
import { COLLECTIONS } from '../mongoSchemas.js';

// MongoDB Implementation
export const mongoHistoryRepository = {
  _getColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.DOWNLOAD_HISTORY);
  },

  async create(entry) {
    const now = (entry.created_at || entry.createdAt) ? new Date(entry.created_at || entry.createdAt) : new Date();
    const userId = entry.user_id || entry.userId;
    const jobId = entry.job_id || entry.jobId;
    const formatId = entry.format_id || entry.formatId;
    const fileSize = entry.file_size || entry.fileSize;
    const doc = {
      _id: new ObjectId(),
      sqlite_id: entry.sqlite_id || null,
      user_id: userId ? String(userId) : null,
      job_id: jobId ? String(jobId) : null,
      url: String(entry.url),
      platform: String(entry.platform || 'generic'),
      title: String(entry.title || 'Untitled Download'),
      thumbnail: entry.thumbnail || null,
      format_id: formatId || null,
      type: entry.type || 'video',
      resolution: entry.resolution || null,
      file_size: fileSize || null,
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
    if (id instanceof ObjectId) {
      query._id = id;
    } else if (typeof id === 'string' && ObjectId.isValid(id) && id.length === 24) {
      query._id = new ObjectId(id);
    } else {
      query.$or = [{ _id: String(id) }, { sqlite_id: parseInt(id, 10) || 0 }];
    }
    const res = await this._getColl().deleteOne(query);
    return res.deletedCount > 0;
  },

  async findByIdAndUserId(id, userId) {
    const query = { user_id: String(userId) };
    if (id instanceof ObjectId) {
      query._id = id;
    } else if (typeof id === 'string' && ObjectId.isValid(id) && id.length === 24) {
      query._id = new ObjectId(id);
    } else {
      query.$or = [{ _id: String(id) }, { sqlite_id: parseInt(id, 10) || 0 }];
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

export function getHistoryRepository() {
  return mongoHistoryRepository;
}

export default mongoHistoryRepository;
