import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import { MongoClient } from 'mongodb';

async function main() {
  console.log('=== PHASE 4 FINAL VERIFICATION & DATA SAFETY AUDIT ===\n');

  // 1. SQLite Database Safety & Integrity Check
  const dbPath = path.resolve(process.cwd(), 'server', 'data', 'streamvault.db');
  if (!fs.existsSync(dbPath)) {
    console.error('ERROR: SQLite database file not found at:', dbPath);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(dbPath);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const stats = fs.statSync(dbPath);

  console.log('1. SQLite Physical File Safety:');
  console.log('   - File Path:', dbPath);
  console.log('   - File Size:', stats.size, 'bytes');
  console.log('   - Last Modified:', stats.mtime.toISOString());
  console.log('   - SHA-256 Checksum:', hash);

  const sqlite = new DatabaseSync(dbPath, { readOnly: true });
  const integrity = sqlite.prepare('PRAGMA integrity_check;').get();
  console.log('   - PRAGMA integrity_check:', integrity.integrity_check);

  const tables = sqlite.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  ).all();
  console.log('   - Total Application Tables:', tables.length);

  let totalRows = 0;
  const tableCounts = {};
  for (const t of tables) {
    const count = sqlite.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get().c;
    tableCounts[t.name] = count;
    totalRows += count;
  }
  console.log('   - Table Row Breakdown:');
  for (const [tbl, count] of Object.entries(tableCounts)) {
    console.log(`     * ${tbl.padEnd(25)}: ${count} rows`);
  }
  console.log('   - Total Database Records:', totalRows);
  sqlite.close();

  // 2. MongoDB Atlas Cluster Inspection
  console.log('\n2. MongoDB Atlas Production Inspection:');
  const atlasUri = 'mongodb://StreamVault:uo7cCqdxWKroPFI5@ac-apocvfx-shard-00-00.0i3pjbq.mongodb.net:27017,ac-apocvfx-shard-00-01.0i3pjbq.mongodb.net:27017,ac-apocvfx-shard-00-02.0i3pjbq.mongodb.net:27017/?ssl=true&replicaSet=atlas-dsyw7d-shard-0&authSource=admin';

  let atlasClient = null;
  try {
    atlasClient = new MongoClient(atlasUri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000
    });
    console.log('   - Connecting to MongoDB Atlas cluster...');
    await atlasClient.connect();
    console.log('   - Successfully connected to MongoDB Atlas!');

    // Ping
    const pingResult = await atlasClient.db('admin').command({ ping: 1 });
    console.log('   - Ping response:', pingResult);

    // List databases
    const adminDb = atlasClient.db().admin();
    const dbsList = await adminDb.listDatabases();
    console.log('   - Databases on Atlas Cluster:');
    for (const d of dbsList.databases) {
      console.log(`     * ${d.name} (${d.sizeOnDisk} bytes)`);
    }

    // Inspect streamvault database specifically
    const svDb = atlasClient.db('streamvault');
    const collections = await svDb.listCollections().toArray();
    console.log('   - Collections in "streamvault" database:', collections.length);
    let totalMongoDocs = 0;
    for (const col of collections) {
      const docCount = await svDb.collection(col.name).countDocuments();
      console.log(`     * Collection ${col.name.padEnd(25)}: ${docCount} documents`);
      totalMongoDocs += docCount;
    }
    console.log('   - Total Documents Inserted in Production MongoDB Atlas:', totalMongoDocs);
    if (totalMongoDocs === 0) {
      console.log('   >>> CONFIRMED: ZERO application documents exist in MongoDB Atlas. No live migration was executed.');
    }
  } catch (err) {
    console.log('   - Atlas Connection Note / Warning:', err.message);
  } finally {
    if (atlasClient) {
      await atlasClient.close();
      console.log('   - Disconnected from Atlas.');
    }
  }

  console.log('\n=== Safety Audit Execution Complete ===\n');
}

main().catch(err => {
  console.error('Fatal safety audit error:', err);
  process.exit(1);
});
