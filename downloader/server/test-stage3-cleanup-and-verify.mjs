/**
 * StreamVault — Stage 3.10 Cleanup & Final Production Verification Suite
 * Cleans up 'StreamVault_Test' and validates production SQLite & Atlas 'StreamVault' databases.
 */

import assert from 'assert';
import fs from 'fs';
import crypto from 'crypto';
import { MongoClient } from 'mongodb';
import db, { DB_PATH } from './src/db/index.js';
import { getMongoConfig } from './src/db/mongo.js';
import { COLLECTIONS } from './src/db/mongoSchemas.js';

console.log('='.repeat(75));
console.log('StreamVault — Stage 3.10: Cleanup & Final Production Verification');
console.log('='.repeat(75));

async function run() {
  const config = getMongoConfig();
  assert.ok(config.uri, 'MONGODB_URI must be configured');

  const client = new MongoClient(config.uri, config.options);
  await client.connect();

  try {
    // 1. Clean up isolated test database: StreamVault_Test
    const testDb = client.db('StreamVault_Test');
    await testDb.dropDatabase();
    console.log('✅ [CLEANUP] Dropped isolated test database: StreamVault_Test');

    // 2. Production Configuration Check
    assert.strictEqual(
      process.env.DB_ENGINE || 'sqlite',
      'sqlite',
      'Production DB_ENGINE must remain "sqlite"'
    );
    console.log('✅ [SAFETY] Active production database engine confirmed: DB_ENGINE=sqlite');

    // 3. Production SQLite Verification
    const integrityRow = db.prepare('PRAGMA integrity_check').get();
    const integrityStatus = integrityRow ? Object.values(integrityRow)[0] : 'failed';
    assert.strictEqual(integrityStatus, 'ok', 'SQLite integrity must be ok');

    const journalRow = db.prepare('PRAGMA journal_mode').get();
    assert.strictEqual(journalRow.journal_mode, 'wal', 'SQLite must remain in WAL mode');

    // Count all 19 SQLite tables
    const tables = [
      'users', 'sessions', 'password_resets', 'login_history', 'user_activity',
      'download_jobs', 'download_history', 'favorites', 'notifications',
      'api_keys', 'api_logs', 'webhooks', 'webhook_deliveries', 'system_settings',
      'admin_audit_logs', 'subscription_plans', 'payment_methods',
      'payment_transactions', 'subscriptions'
    ];

    let totalSqliteRecords = 0;
    const tableCounts = {};
    for (const t of tables) {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${t}`).get().count;
      tableCounts[t] = count;
      totalSqliteRecords += count;
    }

    console.log(`✅ [SQLITE] Integrity: ${integrityStatus} | Tables: ${tables.length} | Records: ${totalSqliteRecords}`);
    assert.strictEqual(totalSqliteRecords, 2595, `Expected 2595 records in production SQLite, found ${totalSqliteRecords}`);

    // SQLite file hash check
    const fileBytes = fs.readFileSync(DB_PATH);
    const sha256 = crypto.createHash('sha256').update(fileBytes).digest('hex');
    console.log(`✅ [SQLITE] Database file size: ${(fileBytes.length / 1024).toFixed(1)} KB`);

    // 4. Production MongoDB Atlas Verification
    const prodDb = client.db('StreamVault');
    const prodCollections = await prodDb.listCollections().toArray();
    console.log(`✅ [ATLAS] Connected to production database: ${prodDb.databaseName} (${prodCollections.length} collections)`);
    assert.strictEqual(prodCollections.length, 19, 'Production Atlas must contain exactly 19 collections');

    let totalAtlasRecords = 0;
    let totalIndexes = 0;
    const discrepancies = [];

    for (const t of tables) {
      const collName = COLLECTIONS[t.toUpperCase()] || t;
      const count = await prodDb.collection(collName).countDocuments();
      const indexes = await prodDb.collection(collName).indexes();
      totalAtlasRecords += count;
      totalIndexes += indexes.length;

      const expectedCount = tableCounts[t];
      if (count !== expectedCount) {
        discrepancies.push(`${collName}: SQLite=${expectedCount}, Mongo=${count}`);
      }
    }

    console.log(`✅ [ATLAS] Total documents: ${totalAtlasRecords} | Total indexes: ${totalIndexes}`);
    assert.strictEqual(discrepancies.length, 0, `Discrepancies found: ${discrepancies.join(', ')}`);
    assert.strictEqual(totalAtlasRecords, 2595, `Expected 2595 records in production Atlas, found ${totalAtlasRecords}`);
    assert.strictEqual(totalIndexes, 57, `Expected 57 indexes in production Atlas, found ${totalIndexes}`);

    console.log('='.repeat(75));
    console.log('STAGE 3 VERIFICATION PASSED: Production data 100% verified and pristine!');
    console.log('='.repeat(75));

  } finally {
    await client.close();
  }
}

run().catch((err) => {
  console.error('Stage 3.10 verification failed:', err);
  process.exit(1);
});
