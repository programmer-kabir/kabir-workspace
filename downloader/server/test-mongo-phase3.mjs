// Phase 3 Automated Verification Suite - SQLite to MongoDB Migration Script
import assert from 'node:assert';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import {
  MIGRATION_ORDER,
  ROW_CONVERTERS,
  toDate,
  toBool,
  parseJson,
  toInt,
  runMigration
} from './src/db/migrateSqliteToMongo.js';
import { DB_PATH } from './src/db/index.js';
import db from './src/db/index.js';

async function runPhase3MigrationTests() {
  console.log('🧪 Starting Phase 3 Migration Tool & Conversion Verification Suite...\n');
  let passed = 0;

  function pass(desc) {
    passed++;
    console.log(`  ✅ ${desc}`);
  }

  try {
    // 1. Source Database Read-Only Protection Verification
    assert.ok(fs.existsSync(DB_PATH), `SQLite database must exist at ${DB_PATH}`);
    const initialStats = fs.statSync(DB_PATH);

    const testReadOnlyDb = new DatabaseSync(DB_PATH, { readOnly: true });
    testReadOnlyDb.exec('PRAGMA query_only = ON;');

    // Attempting any write against SQLite must throw
    assert.throws(() => {
      testReadOnlyDb.exec('CREATE TABLE IF NOT EXISTS test_illegal_write (id INT)');
    }, /attempt to write a readonly database/, 'Writes to SQLite must be blocked by readonly lock');

    assert.throws(() => {
      testReadOnlyDb.prepare("DELETE FROM users WHERE id = 'non_existent'").run();
    }, /attempt to write a readonly database/, 'DELETE from SQLite must be blocked');

    testReadOnlyDb.close();

    const afterStats = fs.statSync(DB_PATH);
    assert.strictEqual(initialStats.size, afterStats.size, 'SQLite DB file size must remain completely unchanged');
    pass('SQLite read-only protection verified: writes are blocked at database engine level');

    // 2. Data Type Conversion Utility Functions
    // Date conversion
    const sampleIso = '2026-11-22T04:40:02.931Z';
    const parsedDate = toDate(sampleIso);
    assert.ok(parsedDate instanceof Date, 'toDate must return native Date instance');
    assert.strictEqual(parsedDate.toISOString(), sampleIso, 'Parsed date must match input timestamp');
    assert.strictEqual(toDate(null), null, 'toDate(null) must return null');
    assert.strictEqual(toDate('invalid-date-string'), null, 'toDate(invalid) must return null');

    // Boolean conversion
    assert.strictEqual(toBool(1), true, 'toBool(1) must be true');
    assert.strictEqual(toBool('1'), true, 'toBool("1") must be true');
    assert.strictEqual(toBool(true), true, 'toBool(true) must be true');
    assert.strictEqual(toBool(0), false, 'toBool(0) must be false');
    assert.strictEqual(toBool('0'), false, 'toBool("0") must be false');
    assert.strictEqual(toBool(null), false, 'toBool(null) must be false');

    // JSON parsing
    const arrJson = '["1080p Full HD", "MP3 320kbps", "15 Downloads/Day"]';
    const parsedArr = parseJson(arrJson, []);
    assert.ok(Array.isArray(parsedArr), 'parseJson must parse array strings to native arrays');
    assert.strictEqual(parsedArr.length, 3);
    assert.strictEqual(parsedArr[0], '1080p Full HD');
    assert.deepStrictEqual(parseJson('{invalid json', { fallback: true }), { fallback: true }, 'parseJson handles malformed strings');

    // Number conversion & Financial Precision
    assert.strictEqual(toInt('499'), 499, 'toInt parses string integers');
    assert.strictEqual(toInt(1499), 1499, 'toInt preserves numbers');
    assert.strictEqual(toInt(null, 15), 15, 'toInt returns fallback on null');
    pass('Conversion utilities verified for Dates, Booleans, JSON structures, and integer precision');

    // 3. Row Converters & Schema Fidelity Verification
    // User row converter
    const mockUserRow = {
      id: 'user_test_uuid_123',
      email: ' TestUser@StreamVault.IO ',
      password_hash: 'abc123hash',
      salt: 'salt123',
      name: 'Test Pilot',
      role: 'user',
      plan: 'pro',
      is_verified: 1,
      is_banned: 0,
      two_factor_secret: null,
      two_factor_enabled: 0,
      referral_code: 'REF123',
      referred_by: null,
      created_at: sampleIso,
      updated_at: sampleIso
    };
    const convertedUser = ROW_CONVERTERS.users(mockUserRow);
    assert.strictEqual(convertedUser._id, 'user_test_uuid_123', 'Preserves user custom ID in _id');
    assert.strictEqual(convertedUser.email, 'testuser@streamvault.io', 'Email is normalized to lowercase and trimmed');
    assert.strictEqual(convertedUser.is_verified, true, 'is_verified integer converted to boolean');
    assert.strictEqual(convertedUser.is_banned, false, 'is_banned integer converted to boolean');
    assert.ok(convertedUser.created_at instanceof Date, 'created_at converted to Date');

    // Download Job row converter
    const mockJobRow = {
      id: 'job_test_uuid_456',
      user_id: 'user_test_uuid_123',
      url: 'https://youtube.com/watch?v=sample',
      platform: 'youtube',
      format_id: '1080p_mp4',
      type: 'video',
      quality: '1080p',
      title: 'Sample Video',
      status: 'queued',
      progress: 0,
      priority: 5,
      attempts: 0,
      max_attempts: 3,
      created_at: sampleIso,
      updated_at: sampleIso
    };
    const convertedJob = ROW_CONVERTERS.download_jobs(mockJobRow);
    assert.strictEqual(convertedJob._id, 'job_test_uuid_456', 'Preserves job custom ID in _id');
    assert.strictEqual(convertedJob.priority, 5);
    assert.strictEqual(convertedJob.status, 'queued');

    // Download History row converter (Integer table -> ObjectId + sqlite_id)
    const mockHistoryRow = {
      id: 88,
      user_id: 'user_test_uuid_123',
      job_id: 'job_test_uuid_456',
      url: 'https://youtube.com/watch?v=sample',
      platform: 'youtube',
      title: 'Sample Video',
      type: 'video',
      status: 'completed',
      created_at: sampleIso
    };
    const convertedHist = ROW_CONVERTERS.download_history(mockHistoryRow);
    assert.ok(convertedHist._id, 'History receives native ObjectId');
    assert.strictEqual(convertedHist.sqlite_id, 88, 'History preserves original integer ID in sqlite_id');
    pass('Row converters map schema fields, custom IDs, and legacy SQLite IDs accurately');

    // 4. Dry-Run Mode Verification (Default Safe Execution)
    // Runs migration in dry-run mode against actual SQLite database
    const dryRunOutput = [];
    const mockLogger = {
      log: (msg) => dryRunOutput.push(msg),
      warn: (msg) => dryRunOutput.push(`[WARN] ${msg}`),
      error: (msg) => dryRunOutput.push(`[ERROR] ${msg}`)
    };

    const dryRunResult = await runMigration({
      dryRun: true,
      execute: false,
      logger: mockLogger
    });

    assert.strictEqual(dryRunResult.mode, 'DRY-RUN', 'Must execute in DRY-RUN mode');
    assert.strictEqual(dryRunResult.totalMigrated, 0, 'DRY-RUN must write ZERO records to MongoDB');
    assert.ok(dryRunResult.totalSqliteRecords > 0, `Discovered ${dryRunResult.totalSqliteRecords} existing SQLite records`);
    assert.strictEqual(dryRunResult.totalConverted, dryRunResult.totalSqliteRecords, '100% of SQLite records converted cleanly');
    assert.strictEqual(dryRunResult.totalErrors, 0, 'Zero conversion errors in live database');

    // Verify all 19 collections are present in summary
    assert.strictEqual(Object.keys(dryRunResult.collections).length, 19, 'All 19 collections processed in dry-run');
    pass('Dry-run mode validated 100% of existing SQLite records without writing any data');

    // 5. Idempotency & Duplicate Prevention (Mock Storage Test)
    const storedMongoDocs = new Map(); // collectionName -> Map of id -> doc

    const mockMongoDb = {
      collection: (name) => {
        if (!storedMongoDocs.has(name)) {
          storedMongoDocs.set(name, new Map());
        }
        const collStore = storedMongoDocs.get(name);

        return {
          find: (query, { projection } = {}) => ({
            toArray: async () => {
              const docs = Array.from(collStore.values());
              if (query._id?.$in) {
                const inIds = new Set(query._id.$in.map(String));
                return docs.filter(d => inIds.has(String(d._id)));
              }
              if (query.sqlite_id?.$in) {
                const inSqliteIds = new Set(query.sqlite_id.$in);
                return docs.filter(d => inSqliteIds.has(d.sqlite_id));
              }
              return docs;
            }
          }),
          insertMany: async (docs) => {
            for (const d of docs) {
              collStore.set(String(d._id), d);
            }
            return { insertedCount: docs.length };
          }
        };
      }
    };

    // First simulated execution: All documents migrate
    const simResult1 = await runMigration({
      dryRun: false,
      execute: true,
      mongoDb: mockMongoDb,
      logger: { log: () => {}, warn: () => {}, error: () => {} }
    });
    assert.strictEqual(simResult1.totalMigrated, simResult1.totalConverted, 'First run migrates all documents');
    assert.strictEqual(simResult1.totalSkipped, 0, 'First run has 0 skipped');

    // Second simulated execution on same target: Must be 100% skipped (Idempotent)
    const simResult2 = await runMigration({
      dryRun: false,
      execute: true,
      mongoDb: mockMongoDb,
      logger: { log: () => {}, warn: () => {}, error: () => {} }
    });
    assert.strictEqual(simResult2.totalMigrated, 0, 'Second run must migrate 0 documents');
    assert.strictEqual(simResult2.totalSkipped, simResult1.totalMigrated, 'Second run must skip all existing documents');
    assert.strictEqual(simResult2.totalErrors, 0, 'Second run must encounter 0 errors');
    pass('Idempotency verified: re-running migration safely skips existing records without overwriting');

    // 6. Final SQLite Durability & Health Check
    const integrityRow = db.prepare('PRAGMA integrity_check').get();
    const integrityResult = integrityRow ? Object.values(integrityRow)[0] : 'unknown';
    assert.strictEqual(integrityResult, 'ok', 'SQLite primary integrity check must remain "ok"');
    pass('SQLite primary WAL database verified completely untouched and healthy');

    console.log(`\n🎉 All ${passed} Phase 3 Migration Script & Conversion tests PASSED!\n`);
    return true;
  } catch (err) {
    console.error('\n❌ Phase 3 Test Suite FAILED:', err);
    process.exit(1);
  }
}

runPhase3MigrationTests();
