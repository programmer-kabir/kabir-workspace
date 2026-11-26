import { connectMongo, disconnectMongo, getMongoDb, isMongoConnected } from './mongo.js';
import { COLLECTIONS, initMongoCollectionsAndIndexes } from './mongoSchemas.js';
import { hashPassword } from '../utils/crypto.js';

/**
 * Initialize MongoDB Atlas Database, Schemas, Indexes, and Default Seeds
 */
export async function initDatabase() {
  const mdb = await connectMongo();
  if (!mdb) {
    throw new Error('Failed to connect to MongoDB Atlas during initDatabase.');
  }

  // 1. Initialize Collections, JSON Schema Validators, and Indexes
  const initResult = await initMongoCollectionsAndIndexes(mdb);

  // 2. Seed Default System Settings if empty
  const settingsColl = mdb.collection(COLLECTIONS.SYSTEM_SETTINGS);
  const defaultSettings = [
    { key: 'maintenance_mode', value: 'false' },
    { key: 'registration_enabled', value: 'true' },
    { key: 'global_rate_limit', value: '60' },
    { key: 'max_concurrent_jobs', value: '3' },
    { key: 'platform_youtube_enabled', value: 'true' },
    { key: 'platform_tiktok_enabled', value: 'true' },
    { key: 'platform_instagram_enabled', value: 'true' },
    { key: 'platform_facebook_enabled', value: 'true' },
    { key: 'platform_twitter_enabled', value: 'true' },
    { key: 'api_free_rpm', value: '20' },
    { key: 'api_free_daily', value: '100' },
    { key: 'api_free_monthly', value: '1000' },
    { key: 'api_pro_rpm', value: '120' },
    { key: 'api_pro_daily', value: '2000' },
    { key: 'api_pro_monthly', value: '25000' },
    { key: 'api_enterprise_rpm', value: '600' },
    { key: 'api_enterprise_daily', value: '20000' },
    { key: 'api_enterprise_monthly', value: '500000' }
  ];

  for (const s of defaultSettings) {
    await settingsColl.updateOne(
      { _id: s.key },
      { $setOnInsert: { key: s.key, value: s.value, updated_at: new Date() } },
      { upsert: true }
    );
  }

  // 3. Seed Superadmin user if not exists
  const usersColl = mdb.collection(COLLECTIONS.USERS);
  const adminEmail = 'admin@streamvault.io';
  const existingAdmin = await usersColl.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const { hash, salt } = hashPassword('AdminPassword123!');
    const now = new Date();
    await usersColl.insertOne({
      _id: 'admin-master-id',
      email: adminEmail,
      password_hash: hash,
      salt,
      name: 'System Administrator',
      role: 'admin',
      plan: 'enterprise',
      is_verified: true,
      is_banned: false,
      two_factor_secret: null,
      two_factor_enabled: false,
      referral_code: null,
      referred_by: null,
      created_at: now,
      updated_at: now
    });
    console.log('✅ Master Admin account seeded in MongoDB: admin@streamvault.io / AdminPassword123!');
  }

  // 4. Seed Default Subscription Plans if empty
  const plansColl = mdb.collection(COLLECTIONS.SUBSCRIPTION_PLANS);
  const defaultPlans = [
    {
      _id: 'plan_free',
      name: 'Free Tier',
      slug: 'free',
      price_monthly_bdt: 0,
      price_yearly_bdt: 0,
      daily_download_quota: 15,
      monthly_download_quota: 250,
      api_rpm: 20,
      api_monthly_quota: 1000,
      max_concurrent_jobs: 1,
      features: [
        '1080p & 720p Full HD Video Downloads',
        '320kbps MP3 Audio Extraction',
        '15 Clean Downloads per Day',
        'Standard Queue Speed',
        'Basic API Access (20 Requests/Min)',
        'Zero Logs & Private Extraction'
      ],
      is_active: true
    },
    {
      _id: 'plan_pro',
      name: 'Pro Downloader',
      slug: 'pro',
      price_monthly_bdt: 499,
      price_yearly_bdt: 4990,
      daily_download_quota: 150,
      monthly_download_quota: 3000,
      api_rpm: 120,
      api_monthly_quota: 25000,
      max_concurrent_jobs: 3,
      features: [
        '4K & 1080p Ultra HD Uncapped Downloads',
        'High-Priority Background Queue (5x Speed)',
        '150 Downloads per Day',
        'Bulk Downloader (25 URLs simultaneously)',
        'High-Speed Developer API Access (120 RPM)',
        'Webhook Event Callbacks (10 Endpoints)',
        '10 Developer API Keys'
      ],
      is_active: true
    },
    {
      _id: 'plan_enterprise',
      name: 'Enterprise Master',
      slug: 'enterprise',
      price_monthly_bdt: 1499,
      price_yearly_bdt: 14990,
      daily_download_quota: 5000,
      monthly_download_quota: 50000,
      api_rpm: 600,
      api_monthly_quota: 500000,
      max_concurrent_jobs: 10,
      features: [
        'Unlimited 4K & 8K Media Streams',
        'Highest Queue Priority (10x Immediate Speed)',
        '5,000 Downloads per Day',
        'Bulk URL Downloader (100 URLs simultaneously)',
        'Maximum API Rate Limits (600 RPM)',
        'Unlimited Webhook Endpoints & 50 API Keys',
        'Custom Data Retention & Dedicated 24/7 Support'
      ],
      is_active: true
    }
  ];

  for (const p of defaultPlans) {
    await plansColl.updateOne(
      { _id: p._id },
      { $setOnInsert: { ...p, created_at: new Date(), updated_at: new Date() } },
      { upsert: true }
    );
  }

  // 5. Seed Default Payment Methods if empty
  const pmColl = mdb.collection(COLLECTIONS.PAYMENT_METHODS);
  const defaultPaymentMethods = [
    {
      _id: 'pm_bkash',
      name: 'bKash',
      identifier: 'bkash',
      account_number: '01712345678',
      account_type: 'Personal',
      instructions: '1. Open your bKash Mobile App or dial *247#.\n2. Tap "Send Money" (সেন্ড মানি).\n3. Enter our bKash Personal Number: 01712345678\n4. Enter the exact subscription amount in BDT (৳).\n5. Use Reference: "SV"\n6. Confirm with your bKash PIN.\n7. Copy the 10-character Transaction ID (TrxID) and enter it below.',
      is_enabled: true
    },
    {
      _id: 'pm_nagad',
      name: 'Nagad',
      identifier: 'nagad',
      account_number: '01812345678',
      account_type: 'Personal',
      instructions: '1. Open your Nagad Mobile App or dial *167#.\n2. Choose "Send Money" (সেন্ড মানি).\n3. Enter our Nagad Personal Number: 01812345678\n4. Enter the exact plan amount in BDT (৳).\n5. Confirm transaction and copy your 8-digit Transaction ID (TrxID).\n6. Submit your sender mobile number and TrxID in the verification form below.',
      is_enabled: true
    },
    {
      _id: 'pm_rocket',
      name: 'Rocket',
      identifier: 'rocket',
      account_number: '019123456789',
      account_type: 'Personal',
      instructions: '1. Open your DBBL Rocket App or dial *322#.\n2. Choose "Send Money".\n3. Enter our Rocket 12-digit number: 019123456789\n4. Enter the required amount and confirm.\n5. Copy your Transaction ID and submit the form below.',
      is_enabled: true
    }
  ];

  for (const pm of defaultPaymentMethods) {
    await pmColl.updateOne(
      { _id: pm._id },
      { $setOnInsert: { ...pm, created_at: new Date(), updated_at: new Date() } },
      { upsert: true }
    );
  }

  // 6. Check and expire overdue subscriptions
  await checkAndExpireSubscriptions();

  console.log(`✅ MongoDB Atlas database & ${initResult.collections.length} collections initialized successfully.`);
  return { mdb, initResult };
}

/**
 * Check and expire overdue subscriptions, reverting users to free tier
 */
export async function checkAndExpireSubscriptions() {
  try {
    const {
      getSubscriptionRepository,
      getUserRepository,
      getNotificationRepository,
      getSystemRepository
    } = await import('./repositories/index.js');

    const subRepo = getSubscriptionRepository();
    const userRepo = getUserRepository();
    const notifRepo = getNotificationRepository();
    const systemRepo = getSystemRepository();

    const expiredSubs = await subRepo.findExpiredSubscriptions();

    for (const sub of expiredSubs) {
      await subRepo.expireSubscription(sub.id);

      // Check if user has another active subscription
      const remainingCount = await subRepo.countActiveUserSubscriptions(sub.user_id);

      if (remainingCount === 0) {
        await userRepo.updatePlan(sub.user_id, 'free');

        await notifRepo.create({
          userId: sub.user_id,
          title: 'Subscription Expired',
          message: `Your ${(sub.plan_slug || '').toUpperCase()} subscription has expired. Your account has returned to the Free tier. All your download history and saved links remain safe.`,
          type: 'warning'
        });

        await systemRepo.logActivity(sub.user_id, 'subscription_expired', { plan: sub.plan_slug, subscriptionId: sub.id });
      }
    }

    if (expiredSubs && expiredSubs.length > 0) {
      console.log(`⏰ Automatically expired ${expiredSubs.length} overdue subscriptions.`);
    }
  } catch (err) {
    console.error('Subscription expiration check error:', err.message);
  }
}

/**
 * Log user activity for audit trail
 */
export function logUserActivity(userId, action, details = null, ipAddress = null, userAgent = null) {
  if (!userId || !action) return;
  import('./repositories/index.js')
    .then(({ getSystemRepository }) => {
      return getSystemRepository().logActivity(userId, action, details, ipAddress, userAgent);
    })
    .catch((err) => {
      console.error('Failed to log user activity:', err.message);
    });
}

export {
  connectMongo,
  disconnectMongo,
  getMongoDb,
  isMongoConnected,
  COLLECTIONS,
  initMongoCollectionsAndIndexes
};

export default {
  initDatabase,
  checkAndExpireSubscriptions,
  logUserActivity,
  connectMongo,
  disconnectMongo,
  getMongoDb,
  isMongoConnected
};
