import { getMongoDb, getMongoClient } from '../mongo.js';
import { ObjectId } from 'mongodb';
import { COLLECTIONS } from '../mongoSchemas.js';

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

    const client = getMongoClient() || mdb.client;
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
    const now = (sub.created_at || sub.createdAt) ? new Date(sub.created_at || sub.createdAt) : new Date();
    const subId = sub.id || sub._id;
    const userId = sub.user_id || sub.userId;
    const planId = sub.plan_id || sub.planId;
    const planSlug = sub.plan_slug || sub.planSlug;
    const transactionId = sub.transaction_id || sub.transactionId || null;
    const billingPeriod = sub.billing_period || sub.billingPeriod || 'monthly';
    const startsAt = (sub.starts_at || sub.startsAt) ? new Date(sub.starts_at || sub.startsAt) : now;
    const expiresAt = (sub.expires_at || sub.expiresAt) ? new Date(sub.expires_at || sub.expiresAt) : new Date(Date.now() + 30 * 86400 * 1000);
    const status = sub.status || 'active';

    const doc = {
      _id: String(subId),
      user_id: String(userId),
      plan_id: String(planId),
      plan_slug: String(planSlug),
      transaction_id: transactionId,
      billing_period: billingPeriod,
      starts_at: startsAt,
      expires_at: expiresAt,
      status: status,
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

export function getSubscriptionRepository() {
  return mongoSubscriptionRepository;
}

export default mongoSubscriptionRepository;
