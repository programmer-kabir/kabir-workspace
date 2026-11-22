import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { hashPassword } from '../utils/crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const DB_PATH = path.resolve(dataDir, 'streamvault.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode & foreign keys for high-performance concurrent reads/writes
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA synchronous = NORMAL;
`);

/**
 * Initialize Schema with Safe Migrations
 */
export function initDatabase() {
  db.exec(`
    -- 1. Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
      plan TEXT NOT NULL DEFAULT 'free', -- 'free' | 'pro' | 'enterprise'
      is_verified INTEGER NOT NULL DEFAULT 1,
      is_banned INTEGER NOT NULL DEFAULT 0,
      two_factor_secret TEXT DEFAULT NULL,
      two_factor_enabled INTEGER NOT NULL DEFAULT 0,
      referral_code TEXT UNIQUE,
      referred_by TEXT DEFAULT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

    -- 2. Sessions Table (Persistent Auth & Session Management)
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_active_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

    -- 3. Login History Table
    CREATE TABLE IF NOT EXISTS login_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      email TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      status TEXT NOT NULL, -- 'success' | 'failed'
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 4. Password Resets
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 5. Persistent Download Jobs (Queue System)
    CREATE TABLE IF NOT EXISTS download_jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT DEFAULT NULL, -- NULL for guests
      url TEXT NOT NULL,
      platform TEXT NOT NULL,
      format_id TEXT DEFAULT NULL,
      type TEXT NOT NULL DEFAULT 'video', -- 'video' | 'audio'
      quality TEXT DEFAULT NULL,
      title TEXT DEFAULT NULL,
      thumbnail TEXT DEFAULT NULL,
      duration TEXT DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'queued', -- 'queued' | 'processing' | 'completed' | 'failed' | 'paused' | 'cancelled'
      progress INTEGER NOT NULL DEFAULT 0,
      priority INTEGER NOT NULL DEFAULT 1, -- 1=Free/Guest, 5=Pro, 10=Enterprise
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      error_message TEXT DEFAULT NULL,
      file_size TEXT DEFAULT NULL,
      direct_url TEXT DEFAULT NULL,
      created_at TEXT NOT NULL,
      started_at TEXT DEFAULT NULL,
      completed_at TEXT DEFAULT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_status_priority ON download_jobs(status, priority DESC, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_jobs_user ON download_jobs(user_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_url ON download_jobs(url);

    -- 6. Download History
    CREATE TABLE IF NOT EXISTS download_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      job_id TEXT,
      url TEXT NOT NULL,
      platform TEXT NOT NULL,
      title TEXT NOT NULL,
      thumbnail TEXT,
      format_id TEXT,
      type TEXT NOT NULL DEFAULT 'video',
      resolution TEXT,
      file_size TEXT,
      duration TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_history_user ON download_history(user_id, created_at DESC);

    -- 7. Favorites / Saved URLs
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      url TEXT NOT NULL,
      platform TEXT NOT NULL,
      title TEXT NOT NULL,
      thumbnail TEXT,
      duration TEXT,
      collection TEXT DEFAULT 'General',
      created_at TEXT NOT NULL,
      UNIQUE(user_id, url),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id, created_at DESC);

    -- 8. Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info', -- 'info' | 'success' | 'warning' | 'error'
      is_read INTEGER NOT NULL DEFAULT 0,
      link TEXT DEFAULT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

    -- 9. User Activity Audit Trail
    CREATE TABLE IF NOT EXISTS user_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity(user_id, created_at DESC);

    -- 9. Developer API Keys
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      key_prefix TEXT NOT NULL, -- e.g. 'sv_live_4a2f...'
      key_hash TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'revoked'
      monthly_quota INTEGER NOT NULL DEFAULT 500,
      requests_this_month INTEGER NOT NULL DEFAULT 0,
      last_used_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

    -- 10. API Request Logs
    CREATE TABLE IF NOT EXISTS api_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_key_id TEXT,
      user_id TEXT,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      status_code INTEGER NOT NULL,
      response_time_ms INTEGER NOT NULL,
      ip_address TEXT,
      error_message TEXT DEFAULT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_api_logs_user ON api_logs(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_api_logs_key ON api_logs(api_key_id, created_at DESC);

    -- 11. Webhooks
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      secret TEXT NOT NULL,
      events TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks(user_id, created_at DESC);

    -- 12. Webhook Deliveries
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id TEXT PRIMARY KEY,
      webhook_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      event TEXT NOT NULL,
      payload TEXT NOT NULL,
      response_status INTEGER DEFAULT NULL,
      response_body TEXT DEFAULT NULL,
      attempt INTEGER NOT NULL DEFAULT 1,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'success' | 'failed' | 'retrying'
      error_message TEXT DEFAULT NULL,
      created_at TEXT NOT NULL,
      delivered_at TEXT DEFAULT NULL,
      FOREIGN KEY (webhook_id) REFERENCES webhooks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_user ON webhook_deliveries(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC);

    -- 13. System Settings & Configuration
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 14. Admin Audit Logs
    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 15. Subscription Plans
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL, -- 'free' | 'pro' | 'enterprise'
      price_monthly_bdt INTEGER NOT NULL,
      price_yearly_bdt INTEGER NOT NULL,
      daily_download_quota INTEGER NOT NULL,
      monthly_download_quota INTEGER NOT NULL,
      api_rpm INTEGER NOT NULL,
      api_monthly_quota INTEGER NOT NULL,
      max_concurrent_jobs INTEGER NOT NULL,
      features TEXT NOT NULL, -- JSON array of strings
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_plans_slug ON subscription_plans(slug);

    -- 16. Payment Methods (bKash, Nagad, Rocket, Custom Wallets)
    CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      identifier TEXT UNIQUE NOT NULL, -- 'bkash' | 'nagad' | 'rocket'
      account_number TEXT NOT NULL,
      account_type TEXT NOT NULL DEFAULT 'Personal', -- 'Personal' | 'Merchant' | 'Agent'
      instructions TEXT NOT NULL,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_payment_methods_identifier ON payment_methods(identifier);

    -- 17. Manual Payment Transactions
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      plan_slug TEXT NOT NULL,
      payment_method_id TEXT NOT NULL,
      payment_method_name TEXT NOT NULL,
      sender_number TEXT NOT NULL,
      transaction_id TEXT UNIQUE NOT NULL,
      amount INTEGER NOT NULL,
      billing_period TEXT NOT NULL DEFAULT 'monthly', -- 'monthly' | 'yearly'
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
      screenshot_url TEXT DEFAULT NULL,
      admin_note TEXT DEFAULT NULL,
      verified_by TEXT DEFAULT NULL,
      verified_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT,
      FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE RESTRICT,
      FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_user ON payment_transactions(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_trxid ON payment_transactions(transaction_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON payment_transactions(status, created_at DESC);

    -- 18. Active User Subscriptions
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      plan_slug TEXT NOT NULL,
      transaction_id TEXT DEFAULT NULL,
      billing_period TEXT NOT NULL DEFAULT 'monthly',
      starts_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'expired' | 'cancelled'
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id, status, expires_at DESC);
  `);

  // Seed Default System Settings if empty
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

  const checkSetting = db.prepare('SELECT key FROM system_settings WHERE key = ?');
  const insertSetting = db.prepare('INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)');

  for (const s of defaultSettings) {
    if (!checkSetting.get(s.key)) {
      insertSetting.run(s.key, s.value, new Date().toISOString());
    }
  }

  // Seed Superadmin user if not exists
  const checkAdmin = db.prepare('SELECT id FROM users WHERE email = ?');
  const adminEmail = 'admin@streamvault.io';
  if (!checkAdmin.get(adminEmail)) {
    const { hash, salt } = hashPassword('AdminPassword123!');
    const now = new Date().toISOString();
    const insertAdmin = db.prepare(`
      INSERT INTO users (
        id, email, password_hash, salt, name, role, plan, is_verified, is_banned, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAdmin.run(
      'admin-master-id',
      adminEmail,
      hash,
      salt,
      'System Administrator',
      'admin',
      'enterprise',
      1,
      0,
      now,
      now
    );
    console.log('✅ Master Admin account seeded: admin@streamvault.io / AdminPassword123!');
  }

  // Safe incremental migrations for existing databases
  try {
    db.exec(`ALTER TABLE favorites ADD COLUMN collection TEXT DEFAULT 'General';`);
  } catch {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE download_history ADD COLUMN status TEXT DEFAULT 'completed';`);
  } catch {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE api_keys ADD COLUMN is_enabled INTEGER NOT NULL DEFAULT 1;`);
  } catch {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE api_keys ADD COLUMN expires_at TEXT DEFAULT NULL;`);
  } catch {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE api_keys ADD COLUMN last_used_ip TEXT DEFAULT NULL;`);
  } catch {
    // Column already exists
  }

  try {
    db.exec(`ALTER TABLE api_logs ADD COLUMN error_message TEXT DEFAULT NULL;`);
  } catch {
    // Column already exists
  }

  // Seed Default Subscription Plans if empty
  const defaultPlans = [
    {
      id: 'plan_free',
      name: 'Free Tier',
      slug: 'free',
      priceMonthly: 0,
      priceYearly: 0,
      dailyQuota: 15,
      monthlyQuota: 250,
      apiRpm: 20,
      apiMonthly: 1000,
      maxConcurrent: 1,
      features: JSON.stringify([
        '1080p & 720p Full HD Video Downloads',
        '320kbps MP3 Audio Extraction',
        '15 Clean Downloads per Day',
        'Standard Queue Speed',
        'Basic API Access (20 Requests/Min)',
        'Zero Logs & Private Extraction'
      ])
    },
    {
      id: 'plan_pro',
      name: 'Pro Downloader',
      slug: 'pro',
      priceMonthly: 499,
      priceYearly: 4990,
      dailyQuota: 150,
      monthlyQuota: 3000,
      apiRpm: 120,
      apiMonthly: 25000,
      maxConcurrent: 3,
      features: JSON.stringify([
        '4K & 1080p Ultra HD Uncapped Downloads',
        'High-Priority Background Queue (5x Speed)',
        '150 Downloads per Day',
        'Bulk Downloader (25 URLs simultaneously)',
        'High-Speed Developer API Access (120 RPM)',
        'Webhook Event Callbacks (10 Endpoints)',
        '10 Developer API Keys'
      ])
    },
    {
      id: 'plan_enterprise',
      name: 'Enterprise Master',
      slug: 'enterprise',
      priceMonthly: 1499,
      priceYearly: 14990,
      dailyQuota: 5000,
      monthlyQuota: 50000,
      apiRpm: 600,
      apiMonthly: 500000,
      maxConcurrent: 10,
      features: JSON.stringify([
        'Unlimited 4K & 8K Media Streams',
        'Highest Queue Priority (10x Immediate Speed)',
        '5,000 Downloads per Day',
        'Bulk URL Downloader (100 URLs simultaneously)',
        'Maximum API Rate Limits (600 RPM)',
        'Unlimited Webhook Endpoints & 50 API Keys',
        'Custom Data Retention & Dedicated 24/7 Support'
      ])
    }
  ];

  const checkPlan = db.prepare('SELECT id FROM subscription_plans WHERE slug = ?');
  const insertPlan = db.prepare(`
    INSERT INTO subscription_plans (
      id, name, slug, price_monthly_bdt, price_yearly_bdt, daily_download_quota, monthly_download_quota,
      api_rpm, api_monthly_quota, max_concurrent_jobs, features, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const p of defaultPlans) {
    if (!checkPlan.get(p.slug)) {
      insertPlan.run(
        p.id,
        p.name,
        p.slug,
        p.priceMonthly,
        p.priceYearly,
        p.dailyQuota,
        p.monthlyQuota,
        p.apiRpm,
        p.apiMonthly,
        p.maxConcurrent,
        p.features,
        now,
        now
      );
    }
  }

  // Seed Default Payment Methods if empty
  const defaultPaymentMethods = [
    {
      id: 'pm_bkash',
      name: 'bKash',
      identifier: 'bkash',
      accountNumber: '01712345678',
      accountType: 'Personal',
      instructions: '1. Open your bKash Mobile App or dial *247#.\n2. Tap "Send Money" (সেন্ড মানি).\n3. Enter our bKash Personal Number: 01712345678\n4. Enter the exact subscription amount in BDT (৳).\n5. Use Reference: "SV"\n6. Confirm with your bKash PIN.\n7. Copy the 10-character Transaction ID (TrxID) and enter it below.'
    },
    {
      id: 'pm_nagad',
      name: 'Nagad',
      identifier: 'nagad',
      accountNumber: '01812345678',
      accountType: 'Personal',
      instructions: '1. Open your Nagad Mobile App or dial *167#.\n2. Choose "Send Money" (সেন্ড মানি).\n3. Enter our Nagad Personal Number: 01812345678\n4. Enter the exact plan amount in BDT (৳).\n5. Confirm transaction and copy your 8-digit Transaction ID (TrxID).\n6. Submit your sender mobile number and TrxID in the verification form below.'
    },
    {
      id: 'pm_rocket',
      name: 'Rocket',
      identifier: 'rocket',
      accountNumber: '019123456789',
      accountType: 'Personal',
      instructions: '1. Open your DBBL Rocket App or dial *322#.\n2. Choose "Send Money".\n3. Enter our Rocket 12-digit number: 019123456789\n4. Enter the required amount and confirm.\n5. Copy your Transaction ID and submit the form below.'
    }
  ];

  const checkPM = db.prepare('SELECT id FROM payment_methods WHERE identifier = ?');
  const insertPM = db.prepare(`
    INSERT INTO payment_methods (
      id, name, identifier, account_number, account_type, instructions, is_enabled, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  for (const pm of defaultPaymentMethods) {
    if (!checkPM.get(pm.identifier)) {
      insertPM.run(
        pm.id,
        pm.name,
        pm.identifier,
        pm.accountNumber,
        pm.accountType,
        pm.instructions,
        now,
        now
      );
    }
  }

  // Check and expire overdue subscriptions
  checkAndExpireSubscriptions();

  console.log('✅ SQLite Database & Tables initialized successfully in WAL mode.');
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

export default db;
