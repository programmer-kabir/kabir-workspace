import { getMongoDb } from '../mongo.js';
import { ObjectId } from 'mongodb';
import { COLLECTIONS } from '../mongoSchemas.js';

// MongoDB Implementation
export const mongoFavoriteRepository = {
  _getColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.FAVORITES);
  },

  async create(fav) {
    const now = fav.created_at ? new Date(fav.created_at) : new Date();
    const doc = {
      _id: new ObjectId(),
      sqlite_id: fav.sqlite_id || null,
      user_id: String(fav.user_id),
      url: String(fav.url),
      platform: String(fav.platform || 'generic'),
      title: String(fav.title || 'Saved Video'),
      thumbnail: fav.thumbnail || null,
      duration: fav.duration || null,
      collection_name: String(fav.collection_name || fav.collection || 'General'),
      created_at: now
    };
    await this._getColl().insertOne(doc);
    return { ...doc, id: doc._id };
  },

  async findByUserId(userId) {
    const docs = await this._getColl().find({ user_id: String(userId) }).sort({ created_at: -1 }).toArray();
    return docs.map(d => ({ ...d, id: d._id, collection: d.collection_name }));
  },

  async findByUserAndUrl(userId, url) {
    const doc = await this._getColl().findOne({ user_id: String(userId), url: String(url) });
    if (!doc) return null;
    return { ...doc, id: doc._id, collection: doc.collection_name };
  },

  async exists(userId, url) {
    const count = await this._getColl().countDocuments({ user_id: String(userId), url: String(url) });
    return count > 0;
  },

  async deleteById(id, userId) {
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
    const res = await this._getColl().deleteOne(query);
    return res.deletedCount > 0;
  },

  async findFavorites({ userId, search = '', platform = '', collection = '', page = 1, limit = 12 }) {
    const cleanSearch = (search || '').trim();
    const cleanPlatform = (platform || '').trim();
    const cleanCollection = (collection || '').trim();
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
    if (cleanCollection && cleanCollection !== 'all') {
      filter.$or = [
        { collection_name: cleanCollection },
        { collection: cleanCollection }
      ];
    }

    const total = await this._getColl().countDocuments(filter);
    const docs = await this._getColl().find(filter)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const favorites = docs.map(d => ({
      ...d,
      id: d._id,
      collection: d.collection_name || d.collection || 'General'
    }));

    const distinctCollections = await this._getColl().distinct('collection_name', { user_id: String(userId) });
    const validCollections = distinctCollections.filter(Boolean).sort();

    const distinctPlatforms = await this._getColl().distinct('platform', { user_id: String(userId) });
    const validPlatforms = distinctPlatforms.filter(Boolean).sort();

    return {
      favorites,
      collections: validCollections.length ? validCollections : ['General'],
      platforms: validPlatforms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  },

  async upsert({ userId, url, platform, title, thumbnail = null, duration = null, collection = 'General' }) {
    const now = new Date();
    const cleanUrl = url.trim();
    const resolvedTitle = (title || 'Saved Video').trim();
    const cleanCollection = (collection || 'General').trim();

    const res = await this._getColl().findOneAndUpdate(
      { user_id: String(userId), url: cleanUrl },
      {
        $set: {
          platform: String(platform || 'generic'),
          title: resolvedTitle,
          thumbnail: thumbnail || null,
          duration: duration || null,
          collection_name: cleanCollection,
          collection: cleanCollection
        },
        $setOnInsert: {
          _id: new ObjectId(),
          created_at: now
        }
      },
      { upsert: true, returnDocument: 'after' }
    );
    return { ...res, id: res._id, collection: res.collection_name || res.collection || cleanCollection };
  }
};

export function getFavoriteRepository() {
  return mongoFavoriteRepository;
}

export default mongoFavoriteRepository;
