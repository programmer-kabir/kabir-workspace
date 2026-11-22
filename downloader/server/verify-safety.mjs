import db, { DB_PATH } from './src/db/index.js';
import { getDbEngine } from './src/db/repositories/index.js';
import { connectMongo, getMongoDb, disconnectMongo } from './src/db/mongo.js';
import fs from 'fs';
import crypto from 'crypto';

async function main() {
  console.log('='.repeat(70));
  console.log('StreamVault — Final Database Safety & Isolation Verification');
  console.log('='.repeat(70));

  console.log('Active DB Engine:', getDbEngine());

  // SQLite PRAGMA check
  const pragma = db.prepare('PRAGMA integrity_check;').get();
  console.log('SQLite Integrity Check:', Object.values(pragma)[0]);

  // Foreign keys check
  const fk = db.prepare('PRAGMA foreign_keys;').get();
  console.log('SQLite Foreign Keys:', Object.values(fk)[0] === 1 ? 'ENABLED' : 'DISABLED');

  // Count records across all 19 SQLite tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC").all();
  let totalRecords = 0;
  const tableCounts = {};
  for (const t of tables) {
    const count = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get().c;
    tableCounts[t.name] = count;
    totalRecords += count;
  }
  console.log('Total SQLite Tables:', tables.length);
  console.log('Total SQLite Records:', totalRecords);
  console.table(tableCounts);

  // File size & SHA-256
  const dbFile = fs.readFileSync(DB_PATH);
  const hash = crypto.createHash('sha256').update(dbFile).digest('hex');
  console.log('SQLite DB Path:', DB_PATH);
  console.log('SQLite DB Size:', (dbFile.length / 1024).toFixed(1), 'KB');
  console.log('SQLite DB SHA-256:', hash);

  // MongoDB Atlas verification
  try {
    await connectMongo();
    const mdb = getMongoDb();
    if (mdb) {
      const collections = await mdb.listCollections().toArray();
      const appCollections = collections.filter(c => !c.name.startsWith('system.'));
      console.log('MongoDB Atlas Application Collections:', appCollections.length);
      for (const col of appCollections) {
        const docCount = await mdb.collection(col.name).countDocuments();
        console.log(`  - ${col.name}: ${docCount} documents`);
      }
      if (appCollections.length === 0) {
        console.log('✅ MongoDB Atlas Application Database is 100% UNTOUCHED (0 collections / 0 documents)');
      }
    }
    await disconnectMongo();
  } catch (err) {
    console.log('MongoDB connection status during audit:', err.message);
  }

  console.log('='.repeat(70));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
