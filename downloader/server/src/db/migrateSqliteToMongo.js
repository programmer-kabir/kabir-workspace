/**
 * StreamVault — SQLite to MongoDB Data Migration Tool
 * Phase 3: Safe, Idempotent, Batch-Oriented Migration & Dry-Run Engine
 */

import { DatabaseSync } from 'node:sqlite';
import { ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DB_PATH } from './index.js';
import { COLLECTIONS, initMongoCollectionsAndIndexes } from './mongoSchemas.js';
import { connectMongo, disconnectMongo, isMongoConnected, getMongoDb } from './mongo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Dependency-ordered migration sequence ensuring foreign entities resolve cleanly.
 */
export const MIGRATION_ORDER = [
  COLLECTIONS.SYSTEM_SETTINGS,     // 1. Independent Operational Settings
  COLLECTIONS.SUBSCRIPTION_PLANS,  // 2. Independent Plan Definitions
  COLLECTIONS.PAYMENT_METHODS,     // 3. Independent Wallet Configurations
  COLLECTIONS.USERS,                // 4. Core User Identities
  COLLECTIONS.SESSIONS,             // 5. User Sessions (depends on users)
  COLLECTIONS.LOGIN_HISTORY,        // 6. Auth History (references users)
  COLLECTIONS.PASSWORD_RESETS,      // 7. Password Recovery Tokens (depends on users)
  COLLECTIONS.DOWNLOAD_JOBS,        // 8. Queue Jobs (references users)
  COLLECTIONS.DOWNLOAD_HISTORY,     // 9. Download History (references users & jobs)
  COLLECTIONS.FAVORITES,            // 10. Saved URLs (depends on users)
  COLLECTIONS.NOTIFICATIONS,        // 11. Notifications (depends on users)
  COLLECTIONS.USER_ACTIVITY,        // 12. Activity Audit Trail (depends on users)
  COLLECTIONS.API_KEYS,             // 13. Developer API Keys (depends on users)
  COLLECTIONS.API_LOGS,             // 14. Developer API Logs (depends on keys & users)
  COLLECTIONS.WEBHOOKS,             // 15. Webhook Endpoints (depends on users)
  COLLECTIONS.WEBHOOK_DELIVERIES,   // 16. Webhook Deliveries (depends on webhooks)
  COLLECTIONS.ADMIN_AUDIT_LOGS,     // 17. Admin Logs (references users as admin)
  COLLECTIONS.PAYMENT_TRANSACTIONS, // 18. Transactions (depends on users, plans, methods)
  COLLECTIONS.SUBSCRIPTIONS         // 19. Active Subscriptions (depends on users, plans, transactions)
];

// ---------------- Helper Conversion Functions ----------------

export function toDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export function toBool(val) {
  return val === 1 || val === true || val === '1';
}

export function parseJson(val, fallback = null) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export function toInt(val, fallback = 0) {
  const num = parseInt(val, 10);
  return isNaN(num) ? fallback : num;
}

/**
 * Collection-specific row transformation functions mapping SQLite columns to BSON documents.
 */
export const ROW_CONVERTERS = {
  [COLLECTIONS.SYSTEM_SETTINGS]: (row) => ({
    _id: String(row.key),
    key: String(row.key),
    value: String(row.value),
    updated_at: toDate(row.updated_at) || new Date()
  }),

  [COLLECTIONS.SUBSCRIPTION_PLANS]: (row) => ({
    _id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    price_monthly_bdt: toInt(row.price_monthly_bdt, 0),
    price_yearly_bdt: toInt(row.price_yearly_bdt, 0),
    daily_download_quota: toInt(row.daily_download_quota, 15),
    monthly_download_quota: toInt(row.monthly_download_quota, 250),
    api_rpm: toInt(row.api_rpm, 20),
    api_monthly_quota: toInt(row.api_monthly_quota, 1000),
    max_concurrent_jobs: toInt(row.max_concurrent_jobs, 1),
    features: parseJson(row.features, []),
    is_active: toBool(row.is_active),
    created_at: toDate(row.created_at) || new Date(),
    updated_at: toDate(row.updated_at) || new Date()
  }),

  [COLLECTIONS.PAYMENT_METHODS]: (row) => ({
    _id: String(row.id),
    name: String(row.name),
    identifier: String(row.identifier),
    account_number: String(row.account_number),
    account_type: String(row.account_type || 'Personal'),
    instructions: String(row.instructions || ''),
    is_enabled: toBool(row.is_enabled),
    created_at: toDate(row.created_at) || new Date(),
    updated_at: toDate(row.updated_at) || new Date()
  }),

  [COLLECTIONS.USERS]: (row) => ({
    _id: String(row.id),
    email: String(row.email).trim().toLowerCase(),
    password_hash: String(row.password_hash),
    salt: String(row.salt),
    name: String(row.name).trim(),
    role: String(row.role || 'user'),
    plan: String(row.plan || 'free'),
    is_verified: toBool(row.is_verified),
    is_banned: toBool(row.is_banned),
    two_factor_secret: row.two_factor_secret ? String(row.two_factor_secret) : null,
    two_factor_enabled: toBool(row.two_factor_enabled),
    referral_code: row.referral_code ? String(row.referral_code) : null,
    referred_by: row.referred_by ? String(row.referred_by) : null,
    created_at: toDate(row.created_at) || new Date(),
    updated_at: toDate(row.updated_at) || new Date()
  }),

  [COLLECTIONS.SESSIONS]: (row) => ({
    _id: String(row.id),
    user_id: String(row.user_id),
    token_hash: String(row.token_hash),
    ip_address: row.ip_address ? String(row.ip_address) : null,
    user_agent: row.user_agent ? String(row.user_agent) : null,
    expires_at: toDate(row.expires_at) || new Date(),
    created_at: toDate(row.created_at) || new Date(),
    last_active_at: toDate(row.last_active_at) || new Date()
  }),

  [COLLECTIONS.LOGIN_HISTORY]: (row) => ({
    _id: new ObjectId(),
    sqlite_id: toInt(row.id),
    user_id: row.user_id ? String(row.user_id) : null,
    email: String(row.email).trim().toLowerCase(),
    ip_address: row.ip_address ? String(row.ip_address) : null,
    user_agent: row.user_agent ? String(row.user_agent) : null,
    status: String(row.status || 'failed'),
    created_at: toDate(row.created_at) || new Date()
  }),

  [COLLECTIONS.PASSWORD_RESETS]: (row) => ({
    _id: new ObjectId(),
    sqlite_id: toInt(row.id),
    user_id: String(row.user_id),
    token_hash: String(row.token_hash),
    expires_at: toDate(row.expires_at) || new Date(),
    used: toBool(row.used),
    created_at: toDate(row.created_at) || new Date()
  }),

  [COLLECTIONS.DOWNLOAD_JOBS]: (row) => ({
    _id: String(row.id),
    user_id: row.user_id ? String(row.user_id) : null,
    url: String(row.url),
    platform: String(row.platform || 'generic'),
    format_id: row.format_id ? String(row.format_id) : null,
    type: String(row.type || 'video'),
    quality: row.quality ? String(row.quality) : null,
    title: row.title ? String(row.title) : null,
    thumbnail: row.thumbnail ? String(row.thumbnail) : null,
    duration: row.duration ? String(row.duration) : null,
    status: String(row.status || 'queued'),
    progress: toInt(row.progress, 0),
    priority: toInt(row.priority, 1),
    attempts: toInt(row.attempts, 0),
    max_attempts: toInt(row.max_attempts, 3),
    error_message: row.error_message ? String(row.error_message) : null,
    file_size: row.file_size ? String(row.file_size) : null,
    direct_url: row.direct_url ? String(row.direct_url) : null,
    created_at: toDate(row.created_at) || new Date(),
    started_at: toDate(row.started_at),
    completed_at: toDate(row.completed_at),
    updated_at: toDate(row.updated_at) || new Date()
  }),

  [COLLECTIONS.DOWNLOAD_HISTORY]: (row) => ({
    _id: new ObjectId(),
    sqlite_id: toInt(row.id),
    user_id: row.user_id ? String(row.user_id) : null,
    job_id: row.job_id ? String(row.job_id) : null,
    url: String(row.url),
    platform: String(row.platform || 'generic'),
    title: String(row.title || 'Untitled Download'),
    thumbnail: row.thumbnail ? String(row.thumbnail) : null,
    format_id: row.format_id ? String(row.format_id) : null,
    type: String(row.type || 'video'),
    resolution: row.resolution ? String(row.resolution) : null,
    file_size: row.file_size ? String(row.file_size) : null,
    duration: row.duration ? String(row.duration) : null,
    status: String(row.status || 'completed'),
    created_at: toDate(row.created_at) || new Date()
  }),

  [COLLECTIONS.FAVORITES]: (row) => ({
    _id: new ObjectId(),
    sqlite_id: toInt(row.id),
    user_id: String(row.user_id),
    url: String(row.url),
    platform: String(row.platform || 'generic'),
    title: String(row.title || 'Saved Video'),
    thumbnail: row.thumbnail ? String(row.thumbnail) : null,
    duration: row.duration ? String(row.duration) : null,
    collection_name: String(row.collection || 'General'),
    created_at: toDate(row.created_at) || new Date()
  }),

  [COLLECTIONS.NOTIFICATIONS]: (row) => ({
    _id: new ObjectId(),
    sqlite_id: toInt(row.id),
    user_id: String(row.user_id),
    title: String(row.title),
    message: String(row.message),
    type: String(row.type || 'info'),
    is_read: toBool(row.is_read),
    link: row.link ? String(row.link) : null,
    created_at: toDate(row.created_at) || new Date()
  }),

  [COLLECTIONS.USER_ACTIVITY]: (row) => ({
    _id: new ObjectId(),
    sqlite_id: toInt(row.id),
    user_id: String(row.user_id),
    action: String(row.action),
    details: parseJson(row.details, row.details ? String(row.details) : null),
    ip_address: row.ip_address ? String(row.ip_address) : null,
    user_agent: row.user_agent ? String(row.user_agent) : null,
    created_at: toDate(row.created_at) || new Date()
  }),

  [COLLECTIONS.API_KEYS]: (row) => ({
    _id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    key_prefix: String(row.key_prefix),
    key_hash: String(row.key_hash),
    status: String(row.status || 'active'),
    monthly_quota: toInt(row.monthly_quota, 500),
    requests_this_month: toInt(row.requests_this_month, 0),
    last_used_at: toDate(row.last_used_at),
    created_at: toDate(row.created_at) || new Date(),
    is_enabled: toBool(row.is_enabled),
    expires_at: toDate(row.expires_at),
    last_used_ip: row.last_used_ip ? String(row.last_used_ip) : null
  }),

  [COLLECTIONS.API_LOGS]: (row) => ({
    _id: new ObjectId(),
    sqlite_id: toInt(row.id),
    api_key_id: row.api_key_id ? String(row.api_key_id) : null,
    user_id: row.user_id ? String(row.user_id) : null,
    endpoint: String(row.endpoint),
    method: String(row.method),
    status_code: toInt(row.status_code, 200),
    response_time_ms: toInt(row.response_time_ms, 0),
    ip_address: row.ip_address ? String(row.ip_address) : null,
    error_message: row.error_message ? String(row.error_message) : null,
    created_at: toDate(row.created_at) || new Date()
  }),

  [COLLECTIONS.WEBHOOKS]: (row) => ({
    _id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    url: String(row.url),
    secret: String(row.secret),
    events: parseJson(row.events, []),
    is_active: toBool(row.is_active),
    created_at: toDate(row.created_at) || new Date(),
    updated_at: toDate(row.updated_at) || new Date()
  }),

  [COLLECTIONS.WEBHOOK_DELIVERIES]: (row) => ({
    _id: String(row.id),
    webhook_id: String(row.webhook_id),
    user_id: String(row.user_id),
    event: String(row.event),
    payload: parseJson(row.payload, String(row.payload || '')),
    response_status: row.response_status ? toInt(row.response_status) : null,
    response_body: row.response_body ? String(row.response_body) : null,
    attempt: toInt(row.attempt, 1),
    max_attempts: toInt(row.max_attempts, 3),
    status: String(row.status || 'pending'),
    error_message: row.error_message ? String(row.error_message) : null,
    created_at: toDate(row.created_at) || new Date(),
    delivered_at: toDate(row.delivered_at)
  }),

  [COLLECTIONS.ADMIN_AUDIT_LOGS]: (row) => ({
    _id: new ObjectId(),
    sqlite_id: toInt(row.id),
    admin_id: row.admin_id ? String(row.admin_id) : null,
    action: String(row.action),
    target_type: row.target_type ? String(row.target_type) : null,
    target_id: row.target_id ? String(row.target_id) : null,
    details: parseJson(row.details, row.details ? String(row.details) : null),
    ip_address: row.ip_address ? String(row.ip_address) : null,
    created_at: toDate(row.created_at) || new Date()
  }),

  [COLLECTIONS.PAYMENT_TRANSACTIONS]: (row) => ({
    _id: String(row.id),
    user_id: String(row.user_id),
    plan_id: String(row.plan_id),
    plan_slug: String(row.plan_slug),
    payment_method_id: String(row.payment_method_id),
    payment_method_name: String(row.payment_method_name),
    sender_number: String(row.sender_number),
    transaction_id: String(row.transaction_id),
    amount: toInt(row.amount, 0),
    billing_period: String(row.billing_period || 'monthly'),
    status: String(row.status || 'pending'),
    screenshot_url: row.screenshot_url ? String(row.screenshot_url) : null,
    admin_note: row.admin_note ? String(row.admin_note) : null,
    verified_by: row.verified_by ? String(row.verified_by) : null,
    verified_at: toDate(row.verified_at),
    created_at: toDate(row.created_at) || new Date(),
    updated_at: toDate(row.updated_at) || new Date()
  }),

  [COLLECTIONS.SUBSCRIPTIONS]: (row) => ({
    _id: String(row.id),
    user_id: String(row.user_id),
    plan_id: String(row.plan_id),
    plan_slug: String(row.plan_slug),
    transaction_id: row.transaction_id ? String(row.transaction_id) : null,
    billing_period: String(row.billing_period || 'monthly'),
    starts_at: toDate(row.starts_at) || new Date(),
    expires_at: toDate(row.expires_at) || new Date(),
    status: String(row.status || 'active'),
    created_at: toDate(row.created_at) || new Date(),
    updated_at: toDate(row.updated_at) || new Date()
  })
};

/**
 * Executes migration in either dry-run (read-only validation) or live execute mode.
 *
 * @param {Object} options
 * @param {boolean} [options.dryRun=true] - If true, validates conversions without writing to Mongo.
 * @param {boolean} [options.execute=false] - If true, executes writes to MongoDB.
 * @param {DatabaseSync} [options.sqliteDb=null] - Optional SQLite instance override (read-only).
 * @param {import('mongodb').Db} [options.mongoDb=null] - Optional MongoDB instance override.
 * @param {number} [options.batchSize=250] - Number of records processed per batch.
 * @param {Object} [options.logger=console] - Logging interface.
 */
export async function runMigration({
  dryRun = true,
  execute = false,
  sqliteDb = null,
  mongoDb = null,
  batchSize = 250,
  logger = console
} = {}) {
  const isActualExecution = execute === true && dryRun === false;
  const mode = isActualExecution ? 'EXECUTE' : 'DRY-RUN';
  const startTime = Date.now();

  logger.log(`\n======================================================`);
  logger.log(`🚀 StreamVault Database Migration Engine [MODE: ${mode}]`);
  logger.log(`======================================================\n`);

  if (!isActualExecution) {
    logger.log('ℹ️  DRY-RUN MODE ACTIVE: Read-only conversion validation.');
    logger.log('ℹ️  Zero records will be written to MongoDB.\n');
  } else {
    logger.log('⚠️  EXECUTION MODE ACTIVE: Records will be inserted into MongoDB Atlas.\n');
  }

  // 1. Open SQLite strictly in read-only mode if not supplied
  let readOnlySqlite = sqliteDb;
  let shouldCloseSqlite = false;

  if (!readOnlySqlite) {
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(`SQLite source database not found at ${DB_PATH}`);
    }
    readOnlySqlite = new DatabaseSync(DB_PATH, { readOnly: true });
    readOnlySqlite.exec('PRAGMA query_only = ON;');
    shouldCloseSqlite = true;
  }

  // 2. Connect to MongoDB if in execution mode and not supplied
  let activeMongoDb = mongoDb;
  let shouldCloseMongo = false;

  if (isActualExecution && !activeMongoDb) {
    activeMongoDb = await connectMongo();
    if (!activeMongoDb) {
      throw new Error('Cannot execute migration: MongoDB connection failed or MONGODB_URI is unconfigured.');
    }
    shouldCloseMongo = true;
    // Ensure collections and indexes exist before insertion
    await initMongoCollectionsAndIndexes(activeMongoDb);
  }

  const results = {
    mode,
    startTime: new Date(startTime).toISOString(),
    collections: {},
    totalSqliteRecords: 0,
    totalConverted: 0,
    totalMigrated: 0,
    totalSkipped: 0,
    totalErrors: 0
  };

  try {
    for (const collName of MIGRATION_ORDER) {
      const converter = ROW_CONVERTERS[collName];
      if (!converter) {
        logger.warn(`No converter defined for ${collName}. Skipping.`);
        continue;
      }

      // Check if table exists in SQLite
      const tableCheck = readOnlySqlite.prepare(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name = ?"
      ).get(collName);

      if (!tableCheck || tableCheck.count === 0) {
        results.collections[collName] = {
          sqliteCount: 0,
          convertedCount: 0,
          migratedCount: 0,
          skippedCount: 0,
          failedCount: 0,
          errors: ['Table does not exist in SQLite']
        };
        continue;
      }

      // Fetch row count from SQLite
      const totalCountRow = readOnlySqlite.prepare(`SELECT COUNT(*) as count FROM ${collName}`).get();
      const sqliteCount = totalCountRow ? totalCountRow.count : 0;
      results.totalSqliteRecords += sqliteCount;

      const collStats = {
        sqliteCount,
        convertedCount: 0,
        migratedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        errors: []
      };

      if (sqliteCount === 0) {
        results.collections[collName] = collStats;
        logger.log(`  [${collName}] 0 rows in SQLite. Skipped.`);
        continue;
      }

      logger.log(`  Processing [${collName}] (${sqliteCount} rows)...`);

      // Read rows in batches from SQLite
      let offset = 0;
      while (offset < sqliteCount) {
        const rows = readOnlySqlite.prepare(`SELECT * FROM ${collName} LIMIT ? OFFSET ?`).all(batchSize, offset);
        const convertedBatch = [];

        for (const row of rows) {
          try {
            const doc = converter(row);
            convertedBatch.push(doc);
            collStats.convertedCount++;
            results.totalConverted++;
          } catch (convErr) {
            collStats.failedCount++;
            results.totalErrors++;
            collStats.errors.push(`Row conversion failed (ID: ${row.id || row.key}): ${convErr.message}`);
          }
        }

        // In Execution mode: Check idempotency and insert into MongoDB
        if (isActualExecution && convertedBatch.length > 0 && activeMongoDb) {
          const targetColl = activeMongoDb.collection(collName);

          // Idempotency check: Identify already existing documents
          const batchIds = convertedBatch.map(d => d._id).filter(Boolean);
          const existingDocs = await targetColl.find(
            { _id: { $in: batchIds } },
            { projection: { _id: 1 } }
          ).toArray();

          const existingIdSet = new Set(existingDocs.map(d => String(d._id)));

          // Check legacy sqlite_id for auto-increment collections
          let existingSqliteIdSet = new Set();
          const batchSqliteIds = convertedBatch.map(d => d.sqlite_id).filter(id => id !== undefined && id !== null);
          if (batchSqliteIds.length > 0) {
            const existingLegacy = await targetColl.find(
              { sqlite_id: { $in: batchSqliteIds } },
              { projection: { sqlite_id: 1 } }
            ).toArray();
            existingSqliteIdSet = new Set(existingLegacy.map(d => d.sqlite_id));
          }

          const docsToInsert = convertedBatch.filter(doc => {
            const idExists = existingIdSet.has(String(doc._id));
            const legacyExists = doc.sqlite_id !== undefined && existingSqliteIdSet.has(doc.sqlite_id);
            if (idExists || legacyExists) {
              collStats.skippedCount++;
              results.totalSkipped++;
              return false;
            }
            return true;
          });

          if (docsToInsert.length > 0) {
            try {
              const insertResult = await targetColl.insertMany(docsToInsert, { ordered: false });
              collStats.migratedCount += insertResult.insertedCount;
              results.totalMigrated += insertResult.insertedCount;
            } catch (insErr) {
              collStats.failedCount += docsToInsert.length;
              results.totalErrors += docsToInsert.length;
              collStats.errors.push(`Batch insert error: ${insErr.message}`);
            }
          }
        }

        offset += batchSize;
      }

      results.collections[collName] = collStats;
      logger.log(`    -> Converted: ${collStats.convertedCount} | Migrated: ${collStats.migratedCount} | Skipped: ${collStats.skippedCount} | Failed: ${collStats.failedCount}`);
    }

    const durationMs = Date.now() - startTime;
    results.durationMs = durationMs;
    results.endTime = new Date().toISOString();

    logger.log(`\n======================================================`);
    logger.log(`📊 Migration Summary [${mode}]`);
    logger.log(`======================================================`);
    logger.log(`  Source SQLite Records : ${results.totalSqliteRecords}`);
    logger.log(`  Successfully Converted: ${results.totalConverted}`);
    logger.log(`  Migrated to MongoDB   : ${results.totalMigrated}`);
    logger.log(`  Skipped (Existing)    : ${results.totalSkipped}`);
    logger.log(`  Errors / Failures     : ${results.totalErrors}`);
    logger.log(`  Duration              : ${(durationMs / 1000).toFixed(2)}s`);
    logger.log(`======================================================\n`);

    return results;
  } finally {
    if (shouldCloseSqlite && readOnlySqlite) {
      try { readOnlySqlite.close(); } catch {}
    }
    if (shouldCloseMongo && activeMongoDb) {
      try { await disconnectMongo(); } catch {}
    }
  }
}

// CLI Execution support
if (process.argv[1] && process.argv[1].endsWith('migrateSqliteToMongo.js')) {
  const args = process.argv.slice(2);
  const isExecute = args.includes('--execute');
  const isDryRun = args.includes('--dry-run') || !isExecute;

  if (!isExecute && !args.includes('--dry-run')) {
    console.log('⚠️  No execution flag provided. Defaulting to safe --dry-run mode.');
    console.log('💡 To perform live migration, you must pass: --execute\n');
  }

  runMigration({ dryRun: isDryRun, execute: isExecute })
    .then(res => {
      process.exit(res.totalErrors > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Fatal migration error:', err.message);
      process.exit(1);
    });
}
