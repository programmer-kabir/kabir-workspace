import db from '../index.js';
import { getMongoDb } from '../mongo.js';
import { ObjectId } from 'mongodb';
import { COLLECTIONS } from '../mongoSchemas.js';
import { getDbEngine, SUPPORTED_ENGINES } from './index.js';

// SQLite Implementation
export const sqliteSubscriptionRepository = {
  async getPlans() {
    return db.prepare('SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price_monthly_bdt ASC').all();
  },

  async getPublicPlans() {
    const plans = db.prepare('SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price_monthly_bdt ASC').all();
    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      priceMonthlyBdt: p.price_monthly_bdt,
      priceYearlyBdt: p.price_yearly_bdt,
      dailyDownloadQuota: p.daily_download_quota,
      monthlyDownloadQuota: p.monthly_download_quota,
      apiRpm: p.api_rpm,
      apiMonthlyQuota: p.api_monthly_quota,
      maxConcurrentJobs: p.max_concurrent_jobs,
      features: typeof p.features === 'string' ? JSON.parse(p.features || '[]') : (p.features || [])
    }));
  },

  async getPlanBySlug(slug) {
    return db.prepare('SELECT * FROM subscription_plans WHERE slug = ?').get(slug) || null;
  },

  async getPlanById(id) {
    return db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(id) || null;
  },

  async getPaymentMethods() {
    return db.prepare('SELECT * FROM payment_methods WHERE is_enabled = 1 ORDER BY name ASC').all();
  },

  async getActivePaymentMethods() {
    return db.prepare(`
      SELECT id, name, identifier, account_number, account_type, instructions
      FROM payment_methods
      WHERE is_enabled = 1
      ORDER BY name ASC
    `).all();
  },

  async getAdminPaymentMethods() {
    return db.prepare('SELECT * FROM payment_methods ORDER BY created_at ASC').all();
  },

  async findPaymentMethodById(id) {
    return db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(id) || null;
  },

  async findPaymentMethodByIdentifier(identifier) {
    return db.prepare('SELECT * FROM payment_methods WHERE identifier = ?').get(identifier) || null;
  },

  async createPaymentMethod(pm) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO payment_methods (
        id, name, identifier, account_number, account_type, instructions, is_enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      pm.id,
      pm.name.trim(),
      pm.identifier.trim(),
      pm.account_number.trim(),
      pm.account_type.trim(),
      pm.instructions || '',
      pm.is_enabled ? 1 : 0,
      now,
      now
    );
    return this.findPaymentMethodById(pm.id);
  },

  async updatePaymentMethod(id, updates) {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE payment_methods
      SET name = COALESCE(?, name),
          account_number = COALESCE(?, account_number),
          account_type = COALESCE(?, account_type),
          instructions = COALESCE(?, instructions),
          is_enabled = COALESCE(?, is_enabled),
          updated_at = ?
      WHERE id = ?
    `).run(
      updates.name || null,
      updates.account_number || null,
      updates.account_type || null,
      updates.instructions !== undefined ? updates.instructions : null,
      typeof updates.is_enabled === 'boolean' ? (updates.is_enabled ? 1 : 0) : null,
      now,
      id
    );
    return this.findPaymentMethodById(id);
  },

  async deletePaymentMethod(id) {
    const res = db.prepare('DELETE FROM payment_methods WHERE id = ?').run(id);
    return res.changes > 0;
  },

  async createTransaction(tx) {
    const now = tx.created_at || new Date().toISOString();
    db.prepare(`
      INSERT INTO payment_transactions (
        id, user_id, plan_id, plan_slug, payment_method_id, payment_method_name,
        sender_number, transaction_id, amount, billing_period, status, screenshot_url,
        admin_note, verified_by, verified_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tx.id,
      tx.user_id,
      tx.plan_id,
      tx.plan_slug,
      tx.payment_method_id,
      tx.payment_method_name,
      tx.sender_number,
      tx.transaction_id,
      tx.amount,
      tx.billing_period || 'monthly',
      tx.status || 'pending',
      tx.screenshot_url || null,
      tx.admin_note || null,
      tx.verified_by || null,
      tx.verified_at || null,
      now,
      now
    );
    return this.findTransactionById(tx.id);
  },

  async findTransactionById(id) {
    return db.prepare('SELECT * FROM payment_transactions WHERE id = ?').get(id) || null;
  },

  async findTransactionByTrxId(trxId) {
    return db.prepare('SELECT id, status, transaction_id FROM payment_transactions WHERE transaction_id = ?').get(trxId) || null;
  },

  async findPendingTransactionByUserId(userId) {
    return db.prepare(`
      SELECT id, transaction_id, plan_slug, payment_method_name, amount, created_at
      FROM payment_transactions
      WHERE user_id = ? AND status = 'pending'
      ORDER BY created_at DESC LIMIT 1
    `).get(userId) || null;
  },

  async getUserTransactions(userId) {
    return db.prepare(`
      SELECT t.*, p.name as plan_name
      FROM payment_transactions t
      JOIN subscription_plans p ON t.plan_id = p.id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `).all(userId);
  },

  async getAdminTransactions({ status = 'all', search = '', page = 1, limit = 20 }) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;

    let query = `
      SELECT t.*, u.email as user_email, u.name as user_name, p.name as plan_name
      FROM payment_transactions t
      JOIN users u ON t.user_id = u.id
      JOIN subscription_plans p ON t.plan_id = p.id
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM payment_transactions t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    const countParams = [];

    if (status && status !== 'all') {
      query += ' AND t.status = ?';
      countQuery += ' AND t.status = ?';
      params.push(status);
      countParams.push(status);
    }

    if (search) {
      const s = `%${search.trim()}%`;
      query += ' AND (t.transaction_id LIKE ? OR t.sender_number LIKE ? OR u.email LIKE ? OR u.name LIKE ?)';
      countQuery += ' AND (t.transaction_id LIKE ? OR t.sender_number LIKE ? OR u.email LIKE ? OR u.name LIKE ?)';
      params.push(s, s, s, s);
      countParams.push(s, s, s, s);
    }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(safeLimit, offset);

    const transactions = db.prepare(query).all(...params);
    const countRow = db.prepare(countQuery).get(...countParams);
    const total = countRow ? countRow.total : 0;

    return {
      transactions,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit) || 1
    };
  },

  async getAdminPaymentStats() {
    const pending = db.prepare("SELECT COUNT(*) as count FROM payment_transactions WHERE status = 'pending'").get().count;
    const approved = db.prepare("SELECT COUNT(*) as count FROM payment_transactions WHERE status = 'approved'").get().count;
    const rejected = db.prepare("SELECT COUNT(*) as count FROM payment_transactions WHERE status = 'rejected'").get().count;
    const totalRevenueRow = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions WHERE status = 'approved'").get();

    return {
      pendingCount: pending,
      approvedCount: approved,
      rejectedCount: rejected,
      totalRevenueBdt: totalRevenueRow ? totalRevenueRow.total : 0
    };
  },

  async updateTransactionStatus(id, status, verifiedBy = null, adminNote = null) {
    const now = new Date().toISOString();
    const res = db.prepare(`
      UPDATE payment_transactions
      SET status = ?, verified_by = ?, verified_at = ?, admin_note = ?, updated_at = ?
      WHERE id = ? AND status = 'pending'
    `).run(status, verifiedBy, now, adminNote, now, id);

    if (res.changes === 0) {
      throw new Error('Transaction is no longer in pending status.');
    }
    return this.findTransactionById(id);
  },

  async approvePaymentTransaction({ adminId, transactionId, adminNote, subId, startsAt, expiresAt, plan, trx }) {
    const updateTrx = db.prepare(`
      UPDATE payment_transactions
      SET status = 'approved', verified_by = ?, verified_at = ?, admin_note = ?, updated_at = ?
      WHERE id = ? AND status = 'pending'
    `).run(adminId, startsAt, adminNote || 'Verified and approved by Administrator', startsAt, transactionId);

    if (updateTrx.changes === 0) {
      throw new Error('Approval race condition prevented: this transaction is no longer in pending status.');
    }

    db.prepare(`
      INSERT INTO subscriptions (
        id, user_id, plan_id, plan_slug, transaction_id, billing_period, starts_at, expires_at, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).run(
      subId,
      trx.user_id,
      plan.id,
      plan.slug,
      trx.transaction_id,
      trx.billing_period,
      startsAt,
      expiresAt,
      startsAt,
      startsAt
    );

    db.prepare(`UPDATE users SET plan = ?, updated_at = ? WHERE id = ?`).run(plan.slug, startsAt, trx.user_id);

    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
      VALUES (?, ?, ?, 'success', 0, ?)
    `).run(
      trx.user_id,
      'Subscription Activated!',
      `Congratulations! Your payment for ${plan.name} (${trx.billing_period}) has been verified and approved. Your plan is active until ${new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`,
      startsAt
    );

    db.prepare(`
      INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details, created_at)
      VALUES (?, 'approve_payment', 'transaction', ?, ?, ?)
    `).run(
      adminId,
      trx.id || transactionId,
      JSON.stringify({
        trxId: trx.transaction_id,
        userId: trx.user_id,
        plan: plan.slug,
        amount: trx.amount
      }),
      startsAt
    );

    return this.findTransactionById(transactionId);
  },

  async rejectPaymentTransaction({ adminId, transactionId, rejectionReason, now }) {
    const updateTrx = db.prepare(`
      UPDATE payment_transactions
      SET status = 'rejected', verified_by = ?, verified_at = ?, admin_note = ?, updated_at = ?
      WHERE id = ? AND status = 'pending'
    `).run(adminId, now, rejectionReason.trim(), now, transactionId);

    if (updateTrx.changes === 0) {
      throw new Error('Rejection race condition prevented: this transaction is no longer in pending status.');
    }

    const trx = await this.findTransactionById(transactionId);

    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
      VALUES (?, ?, ?, 'error', 0, ?)
    `).run(
      trx.user_id,
      'Payment Verification Rejected',
      `Your payment verification for Transaction ID ${trx.transaction_id} could not be approved. Reason: "${rejectionReason.trim()}". Please double check your SMS receipt or submit a new payment.`,
      now
    );

    db.prepare(`
      INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details, created_at)
      VALUES (?, 'reject_payment', 'transaction', ?, ?, ?)
    `).run(
      adminId,
      transactionId,
      JSON.stringify({
        trxId: trx.transaction_id,
        userId: trx.user_id,
        reason: rejectionReason.trim()
      }),
      now
    );

    return trx;
  },

  async createSubscription(sub) {
    const now = sub.created_at || new Date().toISOString();
    db.prepare(`
      INSERT INTO subscriptions (
        id, user_id, plan_id, plan_slug, transaction_id, billing_period, starts_at, expires_at, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sub.id,
      sub.user_id,
      sub.plan_id,
      sub.plan_slug,
      sub.transaction_id || null,
      sub.billing_period || 'monthly',
      sub.starts_at,
      sub.expires_at,
      sub.status || 'active',
      now,
      now
    );
    return db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(sub.id);
  },

  async findActiveSubscription(userId) {
    return db.prepare(`
      SELECT * FROM subscriptions
      WHERE user_id = ? AND status = 'active' AND datetime(expires_at) >= datetime('now')
      ORDER BY expires_at DESC LIMIT 1
    `).get(userId) || null;
  },

  async expireSubscription(id) {
    const now = new Date().toISOString();
    const res = db.prepare(`UPDATE subscriptions SET status = 'expired', updated_at = ? WHERE id = ?`).run(now, id);
    return res.changes > 0;
  },

  async expireUserSubscriptions(userId) {
    const now = new Date().toISOString();
    const res = db.prepare(`
      UPDATE subscriptions SET status = 'expired', updated_at = ?
      WHERE user_id = ? AND status = 'active' AND datetime(expires_at) < datetime('now')
    `).run(now, userId);
    return res.changes;
  },

  async findExpiredSubscriptions(now = new Date().toISOString()) {
    const isoString = now instanceof Date ? now.toISOString() : now;
    return db.prepare(`
      SELECT * FROM subscriptions
      WHERE status = 'active' AND datetime(expires_at) < datetime(?)
    `).all(isoString);
  },

  async countActiveUserSubscriptions(userId, now = new Date().toISOString()) {
    const isoString = now instanceof Date ? now.toISOString() : now;
    return db.prepare(`
      SELECT COUNT(*) as count FROM subscriptions
      WHERE user_id = ? AND status = 'active' AND datetime(expires_at) >= datetime(?)
    `).get(userId, isoString).count;
  }
};

// MongoDB Implementation
export const mongoSubscriptionRepository = {
  _getPlansColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.SUBSCRIPTION_PLANS);
  },

  _getMethodsColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.PAYMENT_METHODS);
  },

  _getTrxColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.PAYMENT_TRANSACTIONS);
  },

  _getSubsColl() {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');
    return mdb.collection(COLLECTIONS.SUBSCRIPTIONS);
  },

  async getPlans() {
    const docs = await this._getPlansColl().find({ is_active: true }).sort({ price_monthly_bdt: 1 }).toArray();
    return docs.map(d => ({ ...d, id: d._id }));
  },

  async getPublicPlans() {
    const docs = await this._getPlansColl().find({ is_active: true }).sort({ price_monthly_bdt: 1 }).toArray();
    return docs.map((p) => ({
      id: p._id,
      name: p.name,
      slug: p.slug,
      priceMonthlyBdt: p.price_monthly_bdt,
      priceYearlyBdt: p.price_yearly_bdt,
      dailyDownloadQuota: p.daily_download_quota,
      monthlyDownloadQuota: p.monthly_download_quota,
      apiRpm: p.api_rpm,
      apiMonthlyQuota: p.api_monthly_quota,
      maxConcurrentJobs: p.max_concurrent_jobs,
      features: Array.isArray(p.features) ? p.features : JSON.parse(p.features || '[]')
    }));
  },

  async getPlanBySlug(slug) {
    const doc = await this._getPlansColl().findOne({ slug: String(slug) });
    if (!doc) return null;
    return { ...doc, id: doc._id };
  },

  async getPlanById(id) {
    const doc = await this._getPlansColl().findOne({ _id: String(id) });
    if (!doc) return null;
    return { ...doc, id: doc._id };
  },

  async getPaymentMethods() {
    const docs = await this._getMethodsColl().find({ is_enabled: true }).sort({ name: 1 }).toArray();
    return docs.map(d => ({ ...d, id: d._id }));
  },

  async getActivePaymentMethods() {
    const docs = await this._getMethodsColl().find({ is_enabled: true }).sort({ name: 1 }).toArray();
    return docs.map(d => ({
      id: d._id,
      name: d.name,
      identifier: d.identifier,
      account_number: d.account_number,
      account_type: d.account_type,
      instructions: d.instructions
    }));
  },

  async getAdminPaymentMethods() {
    const docs = await this._getMethodsColl().find({}).sort({ created_at: 1 }).toArray();
    return docs.map(d => ({ ...d, id: d._id }));
  },

  async findPaymentMethodById(id) {
    const doc = await this._getMethodsColl().findOne({ _id: String(id) });
    if (!doc) return null;
    return { ...doc, id: doc._id };
  },

  async findPaymentMethodByIdentifier(identifier) {
    const doc = await this._getMethodsColl().findOne({ identifier: String(identifier) });
    if (!doc) return null;
    return { ...doc, id: doc._id };
  },

  async createPaymentMethod(pm) {
    const now = new Date();
    const doc = {
      _id: String(pm.id),
      name: pm.name.trim(),
      identifier: pm.identifier.trim(),
      account_number: pm.account_number.trim(),
      account_type: pm.account_type.trim(),
      instructions: pm.instructions || '',
      is_enabled: !!pm.is_enabled,
      created_at: now,
      updated_at: now
    };
    await this._getMethodsColl().insertOne(doc);
    return { ...doc, id: doc._id };
  },

  async updatePaymentMethod(id, updates) {
    const now = new Date();
    const $set = { updated_at: now };
    if (updates.name !== undefined) $set.name = updates.name.trim();
    if (updates.account_number !== undefined) $set.account_number = updates.account_number.trim();
    if (updates.account_type !== undefined) $set.account_type = updates.account_type.trim();
    if (updates.instructions !== undefined) $set.instructions = updates.instructions;
    if (updates.is_enabled !== undefined) $set.is_enabled = !!updates.is_enabled;

    await this._getMethodsColl().updateOne({ _id: String(id) }, { $set });
    return this.findPaymentMethodById(id);
  },

  async deletePaymentMethod(id) {
    const res = await this._getMethodsColl().deleteOne({ _id: String(id) });
    return res.deletedCount > 0;
  },

  async createTransaction(tx) {
    const now = tx.created_at ? new Date(tx.created_at) : new Date();
    const doc = {
      _id: String(tx.id),
      user_id: String(tx.user_id),
      plan_id: String(tx.plan_id),
      plan_slug: String(tx.plan_slug),
      payment_method_id: String(tx.payment_method_id),
      payment_method_name: String(tx.payment_method_name),
      sender_number: String(tx.sender_number),
      transaction_id: String(tx.transaction_id),
      amount: Number(tx.amount),
      billing_period: tx.billing_period || 'monthly',
      status: tx.status || 'pending',
      screenshot_url: tx.screenshot_url || null,
      admin_note: tx.admin_note || null,
      verified_by: tx.verified_by || null,
      verified_at: tx.verified_at ? new Date(tx.verified_at) : null,
      created_at: now,
      updated_at: now
    };
    await this._getTrxColl().insertOne(doc);
    return { ...doc, id: doc._id };
  },

  async findTransactionById(id) {
    const doc = await this._getTrxColl().findOne({ _id: String(id) });
    if (!doc) return null;
    return { ...doc, id: doc._id };
  },

  async findTransactionByTrxId(trxId) {
    const doc = await this._getTrxColl().findOne({ transaction_id: String(trxId) });
    if (!doc) return null;
    return { ...doc, id: doc._id };
  },

  async findPendingTransactionByUserId(userId) {
    const doc = await this._getTrxColl().findOne({
      user_id: String(userId),
      status: 'pending'
    }, { sort: { created_at: -1 } });
    if (!doc) return null;
    return { ...doc, id: doc._id };
  },

  async getUserTransactions(userId) {
    const docs = await this._getTrxColl().find({ user_id: String(userId) })
      .sort({ created_at: -1 })
      .toArray();

    // Attach plan_name
    const plans = await this._getPlansColl().find({}).toArray();
    const planMap = new Map(plans.map(p => [p._id, p.name]));

    return docs.map(t => ({
      ...t,
      id: t._id,
      plan_name: planMap.get(t.plan_id) || t.plan_slug
    }));
  },

  async getAdminTransactions({ status = 'all', search = '', page = 1, limit = 20 }) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (safePage - 1) * safeLimit;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { transaction_id: { $regex: search.trim(), $options: 'i' } },
        { sender_number: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const total = await this._getTrxColl().countDocuments(filter);
    const docs = await this._getTrxColl().find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(safeLimit)
      .toArray();

    const mdb = getMongoDb();
    const users = await mdb.collection(COLLECTIONS.USERS).find({}).toArray();
    const userMap = new Map(users.map(u => [u._id, u]));
    const plans = await this._getPlansColl().find({}).toArray();
    const planMap = new Map(plans.map(p => [p._id, p.name]));

    const transactions = docs.map(t => {
      const u = userMap.get(t.user_id) || {};
      return {
        ...t,
        id: t._id,
        user_email: u.email || null,
        user_name: u.name || null,
        plan_name: planMap.get(t.plan_id) || t.plan_slug
      };
    });

    return {
      transactions,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit) || 1
    };
  },

  async getAdminPaymentStats() {
    const [pending, approved, rejected] = await Promise.all([
      this._getTrxColl().countDocuments({ status: 'pending' }),
      this._getTrxColl().countDocuments({ status: 'approved' }),
      this._getTrxColl().countDocuments({ status: 'rejected' })
    ]);

    const revAgg = await this._getTrxColl().aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).toArray();

    return {
      pendingCount: pending,
      approvedCount: approved,
      rejectedCount: rejected,
      totalRevenueBdt: revAgg[0]?.total || 0
    };
  },

  async updateTransactionStatus(id, status, verifiedBy = null, adminNote = null) {
    const now = new Date();
    const res = await this._getTrxColl().findOneAndUpdate(
      { _id: String(id), status: 'pending' },
      {
        $set: {
          status,
          verified_by: verifiedBy ? String(verifiedBy) : null,
          verified_at: now,
          admin_note: adminNote,
          updated_at: now
        }
      },
      { returnDocument: 'after' }
    );

    if (!res) {
      throw new Error('Transaction is no longer in pending status.');
    }
    return { ...res, id: res._id };
  },

  async approvePaymentTransaction({ adminId, transactionId, adminNote, subId, startsAt, expiresAt, plan, trx }) {
    const mdb = getMongoDb();
    if (!mdb) throw new Error('MongoDB instance not connected.');

    const client = mdb.client;
    const session = client ? client.startSession() : null;

    const performApproval = async (sess) => {
      const opts = sess ? { session: sess } : {};
      const now = new Date(startsAt);
      const exp = new Date(expiresAt);

      const trxRes = await this._getTrxColl().findOneAndUpdate(
        { _id: String(transactionId), status: 'pending' },
        {
          $set: {
            status: 'approved',
            verified_by: String(adminId),
            verified_at: now,
            admin_note: adminNote || 'Verified and approved by Administrator',
            updated_at: now
          }
        },
        { returnDocument: 'after', ...opts }
      );

      if (!trxRes) {
        throw new Error('Approval race condition prevented: this transaction is no longer in pending status.');
      }

      const subDoc = {
        _id: String(subId),
        user_id: String(trx.user_id),
        plan_id: String(plan.id),
        plan_slug: String(plan.slug),
        transaction_id: String(trx.transaction_id),
        billing_period: String(trx.billing_period),
        starts_at: now,
        expires_at: exp,
        status: 'active',
        created_at: now,
        updated_at: now
      };
      await this._getSubsColl().insertOne(subDoc, opts);

      await mdb.collection(COLLECTIONS.USERS).updateOne(
        { _id: String(trx.user_id) },
        { $set: { plan: String(plan.slug), updated_at: now } },
        opts
      );

      await mdb.collection(COLLECTIONS.NOTIFICATIONS).insertOne({
        _id: new ObjectId(),
        user_id: String(trx.user_id),
        title: 'Subscription Activated!',
        message: `Congratulations! Your payment for ${plan.name} (${trx.billing_period}) has been verified and approved. Your plan is active until ${new Date(expiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`,
        type: 'success',
        is_read: false,
        created_at: now
      }, opts);

      await mdb.collection(COLLECTIONS.ADMIN_AUDIT_LOGS).insertOne({
        _id: new ObjectId(),
        admin_id: String(adminId),
        action: 'approve_payment',
        target_type: 'transaction',
        target_id: String(trx.id || transactionId),
        details: JSON.stringify({
          trxId: trx.transaction_id,
          userId: trx.user_id,
          plan: plan.slug,
          amount: trx.amount
        }),
        created_at: now
      }, opts);

      return { ...trxRes, id: trxRes._id };
    };

    if (session) {
      try {
        let result;
        await session.withTransaction(async () => {
          result = await performApproval(session);
        });
        return result;
      } catch (err) {
        if (err.message && (err.message.includes('Transaction numbers are only allowed') || err.message.includes('replica set'))) {
          return await performApproval(null);
        }
        throw err;
      } finally {
        await session.endSession();
      }
    } else {
      return await performApproval(null);
    }
  },

  async rejectPaymentTransaction({ adminId, transactionId, rejectionReason, now }) {
    const mdb = getMongoDb();
    const nowDate = new Date(now);

    const trxRes = await this._getTrxColl().findOneAndUpdate(
      { _id: String(transactionId), status: 'pending' },
      {
        $set: {
          status: 'rejected',
          verified_by: String(adminId),
          verified_at: nowDate,
          admin_note: rejectionReason.trim(),
          updated_at: nowDate
        }
      },
      { returnDocument: 'after' }
    );

    if (!trxRes) {
      throw new Error('Rejection race condition prevented: this transaction is no longer in pending status.');
    }

    await mdb.collection(COLLECTIONS.NOTIFICATIONS).insertOne({
      _id: new ObjectId(),
      user_id: String(trxRes.user_id),
      title: 'Payment Verification Rejected',
      message: `Your payment verification for Transaction ID ${trxRes.transaction_id} could not be approved. Reason: "${rejectionReason.trim()}". Please double check your SMS receipt or submit a new payment.`,
      type: 'error',
      is_read: false,
      created_at: nowDate
    });

    await mdb.collection(COLLECTIONS.ADMIN_AUDIT_LOGS).insertOne({
      _id: new ObjectId(),
      admin_id: String(adminId),
      action: 'reject_payment',
      target_type: 'transaction',
      target_id: String(transactionId),
      details: JSON.stringify({
        trxId: trxRes.transaction_id,
        userId: trxRes.user_id,
        reason: rejectionReason.trim()
      }),
      created_at: nowDate
    });

    return { ...trxRes, id: trxRes._id };
  },

  async createSubscription(sub) {
    const now = sub.created_at ? new Date(sub.created_at) : new Date();
    const doc = {
      _id: String(sub.id),
      user_id: String(sub.user_id),
      plan_id: String(sub.plan_id),
      plan_slug: String(sub.plan_slug),
      transaction_id: sub.transaction_id || null,
      billing_period: sub.billing_period || 'monthly',
      starts_at: sub.starts_at ? new Date(sub.starts_at) : now,
      expires_at: sub.expires_at ? new Date(sub.expires_at) : new Date(Date.now() + 30 * 86400 * 1000),
      status: sub.status || 'active',
      created_at: now,
      updated_at: now
    };
    await this._getSubsColl().insertOne(doc);
    return { ...doc, id: doc._id };
  },

  async findActiveSubscription(userId) {
    const now = new Date();
    const doc = await this._getSubsColl().findOne({
      user_id: String(userId),
      status: 'active',
      expires_at: { $gte: now }
    });
    if (!doc) return null;
    return { ...doc, id: doc._id };
  },

  async expireSubscription(id) {
    const now = new Date();
    const res = await this._getSubsColl().updateOne(
      { _id: String(id) },
      { $set: { status: 'expired', updated_at: now } }
    );
    return res.modifiedCount > 0;
  },

  async expireUserSubscriptions(userId) {
    const now = new Date();
    const res = await this._getSubsColl().updateMany(
      {
        user_id: String(userId),
        status: 'active',
        expires_at: { $lt: now }
      },
      {
        $set: { status: 'expired', updated_at: now }
      }
    );
    return res.modifiedCount;
  },

  async findExpiredSubscriptions(now = new Date()) {
    const nowDate = now instanceof Date ? now : new Date(now);
    const docs = await this._getSubsColl().find({
      status: 'active',
      expires_at: { $lt: nowDate }
    }).toArray();
    return docs.map(d => ({ ...d, id: d._id }));
  },

  async countActiveUserSubscriptions(userId, now = new Date()) {
    const nowDate = now instanceof Date ? now : new Date(now);
    return this._getSubsColl().countDocuments({
      user_id: String(userId),
      status: 'active',
      expires_at: { $gte: nowDate }
    });
  }
};

export function getSubscriptionRepository(engine = null) {
  const active = engine || getDbEngine();
  return active === SUPPORTED_ENGINES.MONGODB ? mongoSubscriptionRepository : sqliteSubscriptionRepository;
}
