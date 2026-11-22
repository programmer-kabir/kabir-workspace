import fs from 'fs';
import crypto from 'crypto';
import db, { DB_PATH } from './src/db/index.js';
import { getDbEngine } from './src/db/repositories/index.js';
import { connectMongo, disconnectMongo, getMongoDb } from './src/db/mongo.js';
import { COLLECTIONS } from './src/db/mongoSchemas.js';
import { MIGRATION_ORDER } from './src/db/migrateSqliteToMongo.js';

async function main() {
  console.log('='.repeat(75));
  console.log('StreamVault — Stage 2 Post-Migration Live Verification Audit');
  console.log('='.repeat(75));

  // 1. Source SQLite Integrity & Checksum Verification
  console.log('\n--- 1. SQLite Source Safety & Immutability Verification ---');
  const engine = getDbEngine();
  console.log('Active DB_ENGINE:', engine);

  const pragma = db.prepare('PRAGMA integrity_check;').get();
  const integrity = Object.values(pragma)[0];
  console.log('SQLite PRAGMA integrity_check:', integrity);

  const buf = fs.readFileSync(DB_PATH);
  const currentSha256 = crypto.createHash('sha256').update(buf).digest('hex');
  const originalSha256 = '255357a3855b872ecd84bae3689225584a31360e7f59582ad766df11f9b54d9e';
  console.log('Current SQLite SHA-256 :', currentSha256);
  console.log('Original SQLite SHA-256:', originalSha256);
  console.log('SHA-256 Match Status   :', currentSha256 === originalSha256 ? '✅ IDENTICAL (Bit-for-bit unmutated)' : '❌ MISMATCH');

  const sqliteTableCounts = {};
  let totalSqliteRows = 0;
  for (const coll of MIGRATION_ORDER) {
    const c = db.prepare(`SELECT COUNT(*) as count FROM ${coll}`).get().count;
    sqliteTableCounts[coll] = c;
    totalSqliteRows += c;
  }
  console.log('Total SQLite Source Records:', totalSqliteRows);

  // 2. Connect to MongoDB Atlas
  console.log('\n--- 2. MongoDB Atlas Live Connection & Stats ---');
  const mdb = await connectMongo();
  if (!mdb) throw new Error('Could not connect to MongoDB Atlas!');
  console.log('Connected to MongoDB Atlas Database:', mdb.databaseName);

  const dbStats = await mdb.command({ dbStats: 1 });
  console.log('Atlas DB Stats:');
  console.log('  - Collections :', dbStats.collections);
  console.log('  - Objects/Docs:', dbStats.objects);
  console.log('  - Data Size   :', (dbStats.dataSize / 1024).toFixed(2), 'KB');
  console.log('  - Storage Size:', (dbStats.storageSize / 1024).toFixed(2), 'KB');
  console.log('  - Indexes     :', dbStats.indexes);
  console.log('  - Index Size  :', (dbStats.indexSize / 1024).toFixed(2), 'KB');

  // 3. Collection by Collection Verification
  console.log('\n--- 3. Collection-by-Collection Verification ---');
  const verificationTable = [];
  let totalMongoDocs = 0;
  let totalDiscrepancies = 0;

  for (const collName of MIGRATION_ORDER) {
    const expected = sqliteTableCounts[collName] || 0;
    const coll = mdb.collection(collName);
    const actual = await coll.countDocuments();
    totalMongoDocs += actual;
    const diff = actual - expected;
    if (diff !== 0) totalDiscrepancies++;

    verificationTable.push({
      Collection: collName,
      ExpectedCount: expected,
      ActualCount: actual,
      Difference: diff,
      Status: diff === 0 ? 'MATCH' : 'MISMATCH'
    });
  }

  console.table(verificationTable);
  console.log(`Total Migrated Documents: ${totalMongoDocs} / ${totalSqliteRows}`);
  console.log(`Discrepancies: ${totalDiscrepancies}`);

  // 4. Data Quality & Type Sampling
  console.log('\n--- 4. Data Quality & Type Sampling Verification ---');
  
  // A. Date conversion check (sample user, job, session)
  const sampleUser = await mdb.collection('users').findOne({});
  console.log('Sample User Date Type:', sampleUser.created_at instanceof Date ? '✅ BSON Date' : '❌ String');
  console.log('Sample User Boolean Type (is_verified):', typeof sampleUser.is_verified === 'boolean' ? '✅ Boolean' : '❌ Int');

  const sampleSession = await mdb.collection('sessions').findOne({});
  console.log('Sample Session expires_at Type:', sampleSession.expires_at instanceof Date ? '✅ BSON Date' : '❌ String');

  // B. JSON parsing check (subscription_plans, webhooks)
  const samplePlan = await mdb.collection('subscription_plans').findOne({ slug: 'pro' });
  console.log('Sample Plan features Array:', Array.isArray(samplePlan.features) ? `✅ Array (${samplePlan.features.length} items)` : '❌ Non-array');

  // C. Relationship check: users -> sessions, users -> download_jobs
  const sampleUserWithSession = await mdb.collection('sessions').findOne({});
  const parentUser = await mdb.collection('users').findOne({ _id: sampleUserWithSession.user_id });
  console.log('Session -> User foreign key valid:', parentUser ? `✅ Found (${parentUser.email})` : '❌ Orphaned');

  const sampleJob = await mdb.collection('download_jobs').findOne({ user_id: { $ne: null } });
  if (sampleJob) {
    const jobUser = await mdb.collection('users').findOne({ _id: sampleJob.user_id });
    console.log('Job -> User foreign key valid:', jobUser ? `✅ Found (${jobUser.email})` : '❌ Orphaned');
  }

  // D. Index status on Atlas
  console.log('\n--- 5. Index Status Audit across Collections ---');
  let totalIndexes = 0;
  for (const collName of MIGRATION_ORDER) {
    const coll = mdb.collection(collName);
    const indexes = await coll.indexes();
    totalIndexes += indexes.length;
    console.log(`  - ${collName.padEnd(25)}: ${indexes.length} indexes (${indexes.map(i => i.name).join(', ')})`);
  }
  console.log(`Total Indexes across all collections: ${totalIndexes}`);

  // 5. Backup Check
  console.log('\n--- 6. Backup Verification ---');
  const backupFile = './server/backups/streamvault-backup-2026-11-22T10-46-59-227Z.sqlite';
  console.log('Backup file exists:', fs.existsSync(backupFile));
  if (fs.existsSync(backupFile)) {
    const stat = fs.statSync(backupFile);
    console.log('Backup size:', (stat.size / 1024).toFixed(1), 'KB');
  }

  await disconnectMongo();
  console.log('\n' + '='.repeat(75));
  console.log('STAGE 2 POST-MIGRATION VERIFICATION COMPLETE');
  console.log('='.repeat(75));
}

main().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
