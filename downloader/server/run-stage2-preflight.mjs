/**
 * StreamVault — Stage 2 Migration Preflight Audit Runner
 *
 * Performs:
 * 1. Source Database Verification (Integrity, PRAGMAs, table inventory, checksum)
 * 2. Fresh Verified SQLite Backup (atomic VACUUM INTO, backup integrity, exact record match)
 * 3. Data Mapping Verification for all 19 tables
 * 4. Index & Constraint Conflict Audit (scans SQLite for potential unique violations)
 * 5. MongoDB Capacity & Storage Estimation (BSON overhead, indexes, Atlas Free Tier)
 * 6. Migration Simulation / Dry Run (using migrateSqliteToMongo.js dryRun mode)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import db, { DB_PATH } from './src/db/index.js';
import { createDatabaseBackup } from './src/db/backup.js';
import { runMigration, MIGRATION_ORDER, ROW_CONVERTERS } from './src/db/migrateSqliteToMongo.js';
import { COLLECTIONS, COLLECTION_INDEXES } from './src/db/mongoSchemas.js';
import { getDbEngine } from './src/db/repositories/index.js';

console.log('='.repeat(80));
console.log('StreamVault — Stage 2 Migration Preflight Audit');
console.log('='.repeat(80));

async function main() {
  const auditReport = {};

  // -------------------------------------------------------------
  // 1. Source Database Verification
  // -------------------------------------------------------------
  console.log('\n>>> 1. SOURCE DATABASE VERIFICATION');
  const activeEngine = getDbEngine();
  console.log(`Active DB Engine: ${activeEngine}`);

  const integrityPragma = db.prepare('PRAGMA integrity_check;').get();
  const integrityStatus = Object.values(integrityPragma)[0];
  console.log(`SQLite Integrity Check: ${integrityStatus}`);

  const journalModePragma = db.prepare('PRAGMA journal_mode;').get();
  const journalMode = Object.values(journalModePragma)[0];
  console.log(`SQLite Journal Mode: ${journalMode}`);

  const foreignKeysPragma = db.prepare('PRAGMA foreign_keys;').get();
  const foreignKeysStatus = Object.values(foreignKeysPragma)[0] === 1 ? 'ENABLED' : 'DISABLED';
  console.log(`SQLite Foreign Keys: ${foreignKeysStatus}`);

  const tablesQuery = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC").all();
  const tableNames = tablesQuery.map(t => t.name);
  console.log(`Found ${tableNames.length} SQLite tables.`);

  const sourceTableCounts = {};
  let totalSourceRecords = 0;
  for (const t of tableNames) {
    const c = db.prepare(`SELECT COUNT(*) as count FROM ${t}`).get().count;
    sourceTableCounts[t] = c;
    totalSourceRecords += c;
  }

  const dbBuffer = fs.readFileSync(DB_PATH);
  const dbSha256 = crypto.createHash('sha256').update(dbBuffer).digest('hex');
  const dbSizeBytes = dbBuffer.length;

  console.log(`Source DB File: ${DB_PATH}`);
  console.log(`Source DB Size: ${(dbSizeBytes / 1024).toFixed(1)} KB (${dbSizeBytes} bytes)`);
  console.log(`Source DB SHA-256: ${dbSha256}`);
  console.log(`Total Source Records: ${totalSourceRecords}`);

  auditReport.source = {
    activeEngine,
    integrityStatus,
    journalMode,
    foreignKeysStatus,
    tableCount: tableNames.length,
    totalRecords: totalSourceRecords,
    fileSizeHuman: `${(dbSizeBytes / 1024).toFixed(1)} KB`,
    fileSizeBytes: dbSizeBytes,
    sha256: dbSha256,
    tableCounts: sourceTableCounts
  };

  // -------------------------------------------------------------
  // 2. Fresh Verified SQLite Backup
  // -------------------------------------------------------------
  console.log('\n>>> 2. FRESH VERIFIED SQLITE BACKUP');
  const backupResult = createDatabaseBackup();
  console.log(`Created backup: ${backupResult.filename}`);
  console.log(`Backup path: ${backupResult.path}`);
  console.log(`Backup size: ${backupResult.sizeHuman}`);
  console.log(`Backup PRAGMA integrity: ${backupResult.integrity}`);

  // Deep verification of the backup
  const backupBuffer = fs.readFileSync(backupResult.path);
  const backupSha256 = crypto.createHash('sha256').update(backupBuffer).digest('hex');
  console.log(`Backup SHA-256: ${backupSha256}`);

  const backupDb = new DatabaseSync(backupResult.path, { readOnly: true });
  const backupPragma = backupDb.prepare('PRAGMA integrity_check;').get();
  const backupIntegrity = Object.values(backupPragma)[0];

  let backupTotalRecords = 0;
  const backupTableCounts = {};
  let countMismatches = 0;

  for (const t of tableNames) {
    const count = backupDb.prepare(`SELECT COUNT(*) as count FROM ${t}`).get().count;
    backupTableCounts[t] = count;
    backupTotalRecords += count;
    if (count !== sourceTableCounts[t]) {
      countMismatches++;
      console.error(`❌ Mismatch in table ${t}: Source=${sourceTableCounts[t]}, Backup=${count}`);
    }
  }
  backupDb.close();

  console.log(`Backup Total Records: ${backupTotalRecords} (Source: ${totalSourceRecords})`);
  console.log(`Table Count Match: ${countMismatches === 0 ? '100% MATCH (0 mismatches)' : `${countMismatches} MISMATCHES`}`);

  auditReport.backup = {
    filename: backupResult.filename,
    path: backupResult.path,
    sizeHuman: backupResult.sizeHuman,
    sizeBytes: backupResult.sizeBytes,
    integrity: backupIntegrity,
    sha256: backupSha256,
    totalRecords: backupTotalRecords,
    matchesSource: countMismatches === 0
  };

  // -------------------------------------------------------------
  // 3. Unique Index & Constraint Conflict Audit
  // -------------------------------------------------------------
  console.log('\n>>> 3. UNIQUE INDEX & CONSTRAINT CONFLICT AUDIT');
  const uniqueChecks = [
    { table: 'users', field: 'LOWER(TRIM(email))', name: 'users(email)' },
    { table: 'users', field: 'referral_code', filter: 'referral_code IS NOT NULL', name: 'users(referral_code)' },
    { table: 'sessions', field: 'token_hash', name: 'sessions(token_hash)' },
    { table: 'password_resets', field: 'token_hash', name: 'password_resets(token_hash)' },
    { table: 'favorites', field: "user_id || '::' || url", name: 'favorites(user_id, url)' },
    { table: 'api_keys', field: 'key_hash', name: 'api_keys(key_hash)' },
    { table: 'system_settings', field: 'key', name: 'system_settings(key)' },
    { table: 'subscription_plans', field: 'slug', name: 'subscription_plans(slug)' },
    { table: 'payment_methods', field: 'identifier', name: 'payment_methods(identifier)' },
    { table: 'payment_transactions', field: 'transaction_id', name: 'payment_transactions(transaction_id)' }
  ];

  let totalConflicts = 0;
  const conflictResults = [];

  for (const check of uniqueChecks) {
    const whereClause = check.filter ? `WHERE ${check.filter}` : '';
    const query = `
      SELECT ${check.field} as val, COUNT(*) as cnt
      FROM ${check.table}
      ${whereClause}
      GROUP BY ${check.field}
      HAVING cnt > 1
    `;
    const dups = db.prepare(query).all();
    if (dups.length > 0) {
      totalConflicts += dups.length;
      console.error(`❌ Duplicate conflict on ${check.name}: ${dups.length} duplicate groups found!`);
      conflictResults.push({ target: check.name, duplicates: dups.length, status: 'CONFLICT' });
    } else {
      conflictResults.push({ target: check.name, duplicates: 0, status: 'CLEAN' });
    }
  }

  console.table(conflictResults);
  console.log(`Unique Constraint Audit: ${totalConflicts === 0 ? 'CLEAN (0 conflicts found)' : `${totalConflicts} CONFLICTS`}`);
  auditReport.uniqueConflicts = totalConflicts;

  // -------------------------------------------------------------
  // 4. Storage & Capacity Estimation for MongoDB Atlas Free Tier
  // -------------------------------------------------------------
  console.log('\n>>> 4. MONGODB CAPACITY & STORAGE ESTIMATION');
  // Sample conversion of all rows to calculate realistic BSON size
  let estimatedRawBsonBytes = 0;
  const collectionSizeEstimates = {};

  for (const collName of MIGRATION_ORDER) {
    const converter = ROW_CONVERTERS[collName];
    if (!converter) continue;

    const rows = db.prepare(`SELECT * FROM ${collName}`).all();
    let collBytes = 0;

    for (const row of rows) {
      const doc = converter(row);
      // Rough BSON serialization size estimate (JSON string length + BSON overhead ~ 1.3x)
      const jsonLen = Buffer.byteLength(JSON.stringify(doc), 'utf8');
      const docBsonEstimate = Math.ceil(jsonLen * 1.25 + 16);
      collBytes += docBsonEstimate;
    }

    estimatedRawBsonBytes += collBytes;
    collectionSizeEstimates[collName] = {
      records: rows.length,
      estimatedDataSizeKB: (collBytes / 1024).toFixed(2),
      avgDocSizeBytes: rows.length > 0 ? Math.round(collBytes / rows.length) : 0
    };
  }

  // Estimate index size: ~32 bytes per indexed field entry per document + btree overhead
  let estimatedIndexBytes = 0;
  for (const collName of Object.keys(COLLECTION_INDEXES)) {
    const rowCount = sourceTableCounts[collName] || 0;
    const indexList = COLLECTION_INDEXES[collName] || [];
    // Each index entry is ~40 bytes in WiredTiger
    const collIndexBytes = (indexList.length + 1) * rowCount * 45; // +1 for _id index
    estimatedIndexBytes += collIndexBytes;
  }

  // Base WiredTiger collection overhead (each collection file has minimum ~36KB on disk)
  const wiredTigerMinOverheadBytes = 19 * 2 * 36 * 1024; // 19 collections * (data + index) * 36KB
  const totalEstimatedStorageBytes = estimatedRawBsonBytes + estimatedIndexBytes + wiredTigerMinOverheadBytes;
  const atlasFreeTierLimitBytes = 512 * 1024 * 1024; // 512 MB
  const percentageOfFreeTier = ((totalEstimatedStorageBytes / atlasFreeTierLimitBytes) * 100).toFixed(2);

  console.log(`Estimated Uncompressed BSON Data Size : ${(estimatedRawBsonBytes / 1024).toFixed(2)} KB`);
  console.log(`Estimated Index Overhead              : ${(estimatedIndexBytes / 1024).toFixed(2)} KB`);
  console.log(`Estimated WiredTiger Collection Files : ${(wiredTigerMinOverheadBytes / 1024).toFixed(2)} KB`);
  console.log(`Total Projected Atlas Storage Usage   : ${(totalEstimatedStorageBytes / 1024).toFixed(2)} KB (~${(totalEstimatedStorageBytes / (1024 * 1024)).toFixed(3)} MB)`);
  console.log(`Atlas Free Tier Limit                 : 512.00 MB`);
  console.log(`Projected Storage Consumption         : ${percentageOfFreeTier}% of Free Tier capacity`);

  auditReport.storage = {
    estimatedDataSizeKB: `${(estimatedRawBsonBytes / 1024).toFixed(2)} KB`,
    estimatedIndexKB: `${(estimatedIndexBytes / 1024).toFixed(2)} KB`,
    totalProjectedKB: `${(totalEstimatedStorageBytes / 1024).toFixed(2)} KB`,
    totalProjectedMB: `${(totalEstimatedStorageBytes / (1024 * 1024)).toFixed(3)} MB`,
    freeTierQuotaMB: 512,
    percentUsed: `${percentageOfFreeTier}%`
  };

  // -------------------------------------------------------------
  // 5. Migration Simulation / Dry Run Execution
  // -------------------------------------------------------------
  console.log('\n>>> 5. MIGRATION SIMULATION (DRY-RUN)');
  const dryRunResult = await runMigration({
    dryRun: true,
    execute: false,
    batchSize: 250,
    logger: {
      log: (msg) => console.log(`   ${msg}`),
      warn: (msg) => console.warn(`   ⚠️ ${msg}`),
      error: (msg) => console.error(`   ❌ ${msg}`)
    }
  });

  console.log('\nDry-Run Verification Summary:');
  console.log(`  Source SQLite Records  : ${dryRunResult.totalSqliteRecords}`);
  console.log(`  Successfully Converted : ${dryRunResult.totalConverted}`);
  console.log(`  Migrated to MongoDB    : ${dryRunResult.totalMigrated} (Expected: 0 in Dry-Run)`);
  console.log(`  Skipped                : ${dryRunResult.totalSkipped}`);
  console.log(`  Conversion Errors      : ${dryRunResult.totalErrors}`);
  console.log(`  Duration               : ${(dryRunResult.durationMs / 1000).toFixed(2)}s`);

  // Verify Source SQLite was NOT modified during dry run
  const afterDryRunBuffer = fs.readFileSync(DB_PATH);
  const afterDryRunSha256 = crypto.createHash('sha256').update(afterDryRunBuffer).digest('hex');
  const sourceUntouched = afterDryRunSha256 === dbSha256;
  console.log(`\nSource Database Immutability Check:`);
  console.log(`  Pre-Audit SHA-256 : ${dbSha256}`);
  console.log(`  Post-Audit SHA-256: ${afterDryRunSha256}`);
  console.log(`  Untouched Status  : ${sourceUntouched ? '✅ 100% UNTOUCHED (Bit-for-bit identical)' : '❌ MODIFIED!'}`);

  auditReport.dryRun = {
    totalSqliteRecords: dryRunResult.totalSqliteRecords,
    totalConverted: dryRunResult.totalConverted,
    totalMigrated: dryRunResult.totalMigrated,
    totalErrors: dryRunResult.totalErrors,
    durationSeconds: (dryRunResult.durationMs / 1000).toFixed(2),
    sourceUntouched
  };

  // -------------------------------------------------------------
  // 6. Data Mapping Table Preparation
  // -------------------------------------------------------------
  console.log('\n>>> 6. MIGRATION MAPPING TABLE');
  const mappingTable = [];
  for (const collName of MIGRATION_ORDER) {
    const sqliteCount = sourceTableCounts[collName] || 0;
    const collStats = dryRunResult.collections[collName] || {};
    mappingTable.push({
      'SQLite Table': collName,
      'MongoDB Collection': collName,
      'SQLite Count': sqliteCount,
      'Expected Mongo Count': collStats.convertedCount || 0,
      'Mapping Status': collStats.failedCount === 0 ? 'VALIDATED' : 'CONVERSION_ERRORS'
    });
  }
  console.table(mappingTable);

  fs.writeFileSync('server/stage2-preflight-report.json', JSON.stringify(auditReport, null, 2));
  console.log('\nPreflight audit execution completed successfully.');
}

main().catch(err => {
  console.error('Preflight audit failed:', err);
  process.exit(1);
});
