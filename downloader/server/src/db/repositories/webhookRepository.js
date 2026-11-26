import { getMongoDb } from '../mongo.js';
import { ObjectId } from 'mongodb';
import { COLLECTIONS } from '../mongoSchemas.js';

// MongoDB Implementation
export const mongoWebhookRepository = {
  _getWhColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.WEBHOOKS);
  },

  _getDelColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.WEBHOOK_DELIVERIES);
  },

  async createWebhook(wh) {
    const now = wh.created_at ? new Date(wh.created_at) : new Date();
    const eventArr = Array.isArray(wh.events)
      ? wh.events
      : (typeof wh.events === 'string' ? JSON.parse(wh.events) : ['*']);

    const doc = {
      _id: String(wh.id),
      user_id: String(wh.user_id),
      name: String(wh.name),
      url: String(wh.url),
      secret: String(wh.secret),
      events: eventArr,
      is_active: wh.is_active !== undefined ? !!wh.is_active : true,
      created_at: now,
      updated_at: now
    };
    await this._getWhColl().insertOne(doc);
    return { ...doc, id: doc._id };
  },

  async findWebhookById(id) {
    const doc = await this._getWhColl().findOne({ _id: String(id) });
    if (!doc) return null;
    return { ...doc, id: doc._id };
  },

  async findWebhooksByUserId(userId) {
    const docs = await this._getWhColl().find({ user_id: String(userId) }).sort({ created_at: -1 }).toArray();
    return docs.map(d => ({ ...d, id: d._id }));
  },

  async countWebhooksByUserId(userId) {
    return this._getWhColl().countDocuments({ user_id: String(userId) });
  },

  async updateWebhook(id, updates) {
    const setFields = { updated_at: new Date() };
    if (updates.name !== undefined) setFields.name = String(updates.name);
    if (updates.url !== undefined) setFields.url = String(updates.url);
    if (updates.events !== undefined) {
      setFields.events = Array.isArray(updates.events) ? updates.events : JSON.parse(updates.events);
    }
    if (updates.is_active !== undefined) setFields.is_active = !!updates.is_active;

    const res = await this._getWhColl().findOneAndUpdate(
      { _id: String(id) },
      { $set: setFields },
      { returnDocument: 'after' }
    );
    if (!res) return null;
    return { ...res, id: res._id };
  },

  async deleteWebhook(id) {
    await this._getDelColl().deleteMany({ webhook_id: String(id) });
    const res = await this._getWhColl().deleteOne({ _id: String(id) });
    return res.deletedCount > 0;
  },

  async findActiveWebhooksForEvent(event) {
    const docs = await this._getWhColl().find({
      is_active: true,
      $or: [{ events: '*' }, { events: event }]
    }).toArray();
    return docs.map(d => ({ ...d, id: d._id }));
  },

  async createDelivery(del) {
    const now = del.created_at ? new Date(del.created_at) : new Date();
    const doc = {
      _id: del.id ? String(del.id) : ('whd_' + new ObjectId().toString()),
      webhook_id: String(del.webhook_id),
      user_id: String(del.user_id),
      event: String(del.event),
      payload: del.payload,
      response_status: del.status_code || del.response_status || null,
      response_body: del.response_body || null,
      attempt: Number(del.attempt || 1),
      max_attempts: Number(del.max_attempts || 3),
      status: del.status || (del.status_code && del.status_code < 400 ? 'success' : 'pending'),
      error_message: del.error || del.error_message || null,
      created_at: now
    };
    await this._getDelColl().insertOne(doc);
    return { ...doc, id: doc._id.toString() };
  },

  async getDeliveriesByWebhookId(webhookId, limit = 50) {
    const docs = await this._getDelColl().find({ webhook_id: String(webhookId) })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
    return docs.map(d => ({ ...d, id: d._id.toString() }));
  },

  async findWebhookByIdAndUserId(id, userId) {
    const doc = await this._getWhColl().findOne({ _id: String(id), user_id: String(userId) });
    if (!doc) return null;
    return { ...doc, id: doc._id };
  },

  async findActiveWebhooksByUserId(userId) {
    const docs = await this._getWhColl().find({ user_id: String(userId), is_active: true }).toArray();
    return docs.map(d => ({ ...d, id: d._id }));
  },

  async findDeliveriesPaginated({ userId, webhookId = null, page = 1, limit = 20 }) {
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const filter = { user_id: String(userId) };
    if (webhookId) {
      filter.webhook_id = String(webhookId);
    }

    const total = await this._getDelColl().countDocuments(filter);
    const docs = await this._getDelColl().find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(safeLimit)
      .toArray();

    const deliveries = docs.map(d => ({
      ...d,
      id: d._id.toString(),
      payload: typeof d.payload === 'string' ? JSON.parse(d.payload || '{}') : (d.payload || {})
    }));

    return {
      deliveries,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit) || 1
    };
  },

  async findDeliveryByIdAndUserId(deliveryId, userId) {
    const doc = await this._getDelColl().findOne({
      $or: [
        { _id: String(deliveryId) },
        ...(ObjectId.isValid(deliveryId) ? [{ _id: new ObjectId(deliveryId) }] : []),
        { id: String(deliveryId) }
      ],
      user_id: String(userId)
    });
    if (!doc) return null;
    return { ...doc, id: doc._id.toString() };
  },

  async incrementDeliveryAttempt(deliveryId) {
    const filter = ObjectId.isValid(deliveryId) ? { _id: new ObjectId(deliveryId) } : { _id: String(deliveryId) };
    const res = await this._getDelColl().updateOne(filter, { $inc: { attempt: 1 } });
    return res.matchedCount > 0;
  },

  async createDeliveryRecord(del) {
    const now = del.created_at ? new Date(del.created_at) : new Date();
    const doc = {
      _id: String(del.id),
      webhook_id: String(del.webhook_id),
      user_id: String(del.user_id),
      event: String(del.event),
      payload: del.payload,
      attempt: del.attempt ?? 1,
      max_attempts: del.max_attempts ?? 3,
      status: del.status || 'pending',
      created_at: now
    };
    await this._getDelColl().insertOne(doc);
    return { ...doc, id: doc._id };
  },

  async updateDeliveryResult(deliveryId, { response_status = null, response_body = null, status = 'failed', delivered_at = null, error_message = null }) {
    const filter = ObjectId.isValid(deliveryId) ? { _id: new ObjectId(deliveryId) } : { _id: String(deliveryId) };
    const update = {
      $set: {
        response_status,
        response_body: response_body ? response_body.slice(0, 1000) : null,
        status,
        delivered_at: delivered_at ? new Date(delivered_at) : null,
        error_message
      }
    };
    const res = await this._getDelColl().updateOne(filter, update);
    return res.matchedCount > 0;
  }
};

export function getWebhookRepository() {
  return mongoWebhookRepository;
}

export default mongoWebhookRepository;
