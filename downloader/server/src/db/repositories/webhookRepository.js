import db from '../index.js';
import { getMongoDb } from '../mongo.js';
import { ObjectId } from 'mongodb';
import { COLLECTIONS } from '../mongoSchemas.js';
import { getDbEngine, SUPPORTED_ENGINES } from './index.js';

// SQLite Implementation
export const sqliteWebhookRepository = {
  async createWebhook(wh) {
    const now = wh.created_at || new Date().toISOString();
    const eventStr = typeof wh.events === 'string' ? wh.events : JSON.stringify(wh.events || ['*']);
    db.prepare(`
      INSERT INTO webhooks (id, user_id, name, url, secret, events, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      wh.id,
      wh.user_id,
      wh.name,
      wh.url,
      wh.secret,
      eventStr,
      wh.is_active ?? 1,
      now,
      now
    );
    return this.findWebhookById(wh.id);
  },

  async findWebhookById(id) {
    const row = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(id);
    if (!row) return null;
    return {
      ...row,
      events: typeof row.events === 'string' ? JSON.parse(row.events) : row.events
    };
  },

  async findWebhooksByUserId(userId) {
    const rows = db.prepare('SELECT * FROM webhooks WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    return rows.map(r => ({
      ...r,
      events: typeof r.events === 'string' ? JSON.parse(r.events) : r.events
    }));
  },

  async countWebhooksByUserId(userId) {
    const row = db.prepare('SELECT COUNT(*) as count FROM webhooks WHERE user_id = ?').get(userId);
    return row ? row.count : 0;
  },

  async updateWebhook(id, updates) {
    const now = new Date().toISOString();
    const existing = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(id);
    if (!existing) return null;

    const name = updates.name !== undefined ? updates.name : existing.name;
    const url = updates.url !== undefined ? updates.url : existing.url;
    const events = updates.events !== undefined
      ? (typeof updates.events === 'string' ? updates.events : JSON.stringify(updates.events))
      : existing.events;
    const isActive = updates.is_active !== undefined ? (updates.is_active ? 1 : 0) : existing.is_active;

    db.prepare(`
      UPDATE webhooks
      SET name = ?, url = ?, events = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `).run(name, url, events, isActive, now, id);

    return this.findWebhookById(id);
  },

  async deleteWebhook(id) {
    db.prepare('DELETE FROM webhook_deliveries WHERE webhook_id = ?').run(id);
    const res = db.prepare('DELETE FROM webhooks WHERE id = ?').run(id);
    return res.changes > 0;
  },

  async findActiveWebhooksForEvent(event) {
    const rows = db.prepare('SELECT * FROM webhooks WHERE is_active = 1').all();
    return rows
      .map(r => ({
        ...r,
        events: typeof r.events === 'string' ? JSON.parse(r.events) : r.events
      }))
      .filter(w => Array.isArray(w.events) && (w.events.includes('*') || w.events.includes(event)));
  },

  async createDelivery(del) {
    const now = del.created_at || new Date().toISOString();
    const payloadStr = typeof del.payload === 'object' && del.payload !== null ? JSON.stringify(del.payload) : del.payload;
    const res = db.prepare(`
      INSERT INTO webhook_deliveries (webhook_id, user_id, event, payload, status_code, response_body, error, duration_ms, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      del.webhook_id,
      del.user_id,
      del.event,
      payloadStr,
      del.status_code || null,
      del.response_body || null,
      del.error || null,
      del.duration_ms || null,
      now
    );
    return db.prepare('SELECT * FROM webhook_deliveries WHERE id = ?').get(res.lastInsertRowid);
  },

  async getDeliveriesByWebhookId(webhookId, limit = 50) {
    return db.prepare('SELECT * FROM webhook_deliveries WHERE webhook_id = ? ORDER BY created_at DESC LIMIT ?').all(webhookId, limit);
  },

  async findWebhookByIdAndUserId(id, userId) {
    const row = db.prepare('SELECT * FROM webhooks WHERE id = ? AND user_id = ?').get(id, userId);
    if (!row) return null;
    return {
      ...row,
      events: typeof row.events === 'string' ? JSON.parse(row.events) : row.events
    };
  },

  async findActiveWebhooksByUserId(userId) {
    const rows = db.prepare('SELECT * FROM webhooks WHERE user_id = ? AND is_active = 1').all(userId);
    return rows.map(r => ({
      ...r,
      events: typeof r.events === 'string' ? JSON.parse(r.events) : r.events
    }));
  },

  async findDeliveriesPaginated({ userId, webhookId = null, page = 1, limit = 20 }) {
    const safePage = Math.max(1, parseInt(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (safePage - 1) * safeLimit;

    let query = 'SELECT * FROM webhook_deliveries WHERE user_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM webhook_deliveries WHERE user_id = ?';
    const params = [userId];
    const countParams = [userId];

    if (webhookId) {
      query += ' AND webhook_id = ?';
      countQuery += ' AND webhook_id = ?';
      params.push(webhookId);
      countParams.push(webhookId);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(safeLimit, offset);

    const rows = db.prepare(query).all(...params);
    const totalRow = db.prepare(countQuery).get(...countParams);
    const total = totalRow ? totalRow.total : 0;

    const deliveries = rows.map(d => ({
      ...d,
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
    return db.prepare('SELECT * FROM webhook_deliveries WHERE id = ? AND user_id = ?').get(deliveryId, userId) || null;
  },

  async incrementDeliveryAttempt(deliveryId) {
    const res = db.prepare('UPDATE webhook_deliveries SET attempt = attempt + 1 WHERE id = ?').run(deliveryId);
    return res.changes > 0;
  },

  async createDeliveryRecord(del) {
    const now = del.created_at || new Date().toISOString();
    const payloadStr = typeof del.payload === 'object' && del.payload !== null ? JSON.stringify(del.payload) : del.payload;
    db.prepare(`
      INSERT INTO webhook_deliveries (
        id, webhook_id, user_id, event, payload, attempt, max_attempts, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      del.id,
      del.webhook_id,
      del.user_id,
      del.event,
      payloadStr,
      del.attempt ?? 1,
      del.max_attempts ?? 3,
      del.status || 'pending',
      now
    );
    return db.prepare('SELECT * FROM webhook_deliveries WHERE id = ?').get(del.id);
  },

  async updateDeliveryResult(deliveryId, { response_status = null, response_body = null, status = 'failed', delivered_at = null, error_message = null }) {
    const res = db.prepare(`
      UPDATE webhook_deliveries
      SET response_status = ?, response_body = ?, status = ?, delivered_at = ?, error_message = ?
      WHERE id = ?
    `).run(
      response_status,
      response_body ? response_body.slice(0, 1000) : null,
      status,
      delivered_at,
      error_message,
      deliveryId
    );
    return res.changes > 0;
  }
};

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
      _id: new ObjectId(),
      webhook_id: String(del.webhook_id),
      user_id: String(del.user_id),
      event: String(del.event),
      payload: del.payload,
      status_code: del.status_code || null,
      response_body: del.response_body || null,
      error: del.error || null,
      duration_ms: del.duration_ms || null,
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

export function getWebhookRepository(engine = null) {
  const active = engine || getDbEngine();
  return active === SUPPORTED_ENGINES.MONGODB ? mongoWebhookRepository : sqliteWebhookRepository;
}
