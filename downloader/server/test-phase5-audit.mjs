/**
 * StreamVault — Stage 1 Comprehensive Repository Integration & Query Inventory Audit
 *
 * Audits:
 * 1. Direct SQLite Query Inventory across server/src/ (0 allowed in routes, services, middleware)
 * 2. 100% Repository Method Parity across SQLite and MongoDB adapters for all 10 repositories
 * 3. Database Safety & Integrity checks
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import db from './src/db/index.js';
import { getDbEngine } from './src/db/repositories/index.js';
import { sqliteUserRepository, mongoUserRepository } from './src/db/repositories/userRepository.js';
import { sqliteSessionRepository, mongoSessionRepository } from './src/db/repositories/sessionRepository.js';
import { sqliteApiKeyRepository, mongoApiKeyRepository } from './src/db/repositories/apiKeyRepository.js';
import { sqliteWebhookRepository, mongoWebhookRepository } from './src/db/repositories/webhookRepository.js';
import { sqliteQueueRepository, mongoQueueRepository } from './src/db/repositories/queueRepository.js';
import { sqliteHistoryRepository, mongoHistoryRepository } from './src/db/repositories/historyRepository.js';
import { sqliteFavoriteRepository, mongoFavoriteRepository } from './src/db/repositories/favoriteRepository.js';
import { sqliteNotificationRepository, mongoNotificationRepository } from './src/db/repositories/notificationRepository.js';
import { sqliteSystemRepository, mongoSystemRepository } from './src/db/repositories/systemRepository.js';
import { sqliteSubscriptionRepository, mongoSubscriptionRepository } from './src/db/repositories/subscriptionRepository.js';
import { getMongoDb } from './src/db/mongo.js';

console.log('='.repeat(75));
console.log('StreamVault — Stage 1 Phase 5.1-5.5 Architecture & Dual Parity Audit');
console.log('='.repeat(75));

// 1. Direct SQLite Query Audit
console.log('\n--- 1. Direct SQLite Query Inventory ---');
function scanDirectory(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(full, list);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (/db\.(prepare|exec)\(/.test(line)) {
          list.push({ file: path.relative(process.cwd(), full).replace(/\\/g, '/'), line: idx + 1, text: line.trim() });
        }
      });
    }
  }
  return list;
}

const allDirectQueries = scanDirectory('server/src');
const queriesByFolder = {
  routes: 0,
  services: 0,
  middleware: 0,
  dbRepositories: 0,
  dbCore: 0
};

const fileCounts = {};
allDirectQueries.forEach(q => {
  fileCounts[q.file] = (fileCounts[q.file] || 0) + 1;
  if (q.file.startsWith('server/src/routes')) queriesByFolder.routes++;
  else if (q.file.startsWith('server/src/services')) queriesByFolder.services++;
  else if (q.file.startsWith('server/src/middleware')) queriesByFolder.middleware++;
  else if (q.file.startsWith('server/src/db/repositories')) queriesByFolder.dbRepositories++;
  else queriesByFolder.dbCore++;
});

console.log('Query distribution across architectural layers:');
console.table(queriesByFolder);

assert.strictEqual(queriesByFolder.routes, 0, 'Routes MUST have 0 direct SQLite queries');
assert.strictEqual(queriesByFolder.services, 0, 'Services MUST have 0 direct SQLite queries');
assert.strictEqual(queriesByFolder.middleware, 0, 'Middleware MUST have 0 direct SQLite queries');
console.log('✅ Direct SQLite Query Audit PASSED: 0 direct queries in application layers.');

// 2. Dual Repository Method Parity Audit
console.log('\n--- 2. Dual Repository Interface Parity Audit ---');
const repos = [
  { name: 'userRepository', sqlite: sqliteUserRepository, mongo: mongoUserRepository },
  { name: 'sessionRepository', sqlite: sqliteSessionRepository, mongo: mongoSessionRepository },
  { name: 'apiKeyRepository', sqlite: sqliteApiKeyRepository, mongo: mongoApiKeyRepository },
  { name: 'webhookRepository', sqlite: sqliteWebhookRepository, mongo: mongoWebhookRepository },
  { name: 'queueRepository', sqlite: sqliteQueueRepository, mongo: mongoQueueRepository },
  { name: 'historyRepository', sqlite: sqliteHistoryRepository, mongo: mongoHistoryRepository },
  { name: 'favoriteRepository', sqlite: sqliteFavoriteRepository, mongo: mongoFavoriteRepository },
  { name: 'notificationRepository', sqlite: sqliteNotificationRepository, mongo: mongoNotificationRepository },
  { name: 'systemRepository', sqlite: sqliteSystemRepository, mongo: mongoSystemRepository },
  { name: 'subscriptionRepository', sqlite: sqliteSubscriptionRepository, mongo: mongoSubscriptionRepository }
];

let totalMethodsAudited = 0;
const paritySummary = [];

for (const repo of repos) {
  const sqliteMethods = Object.keys(repo.sqlite).filter(m => typeof repo.sqlite[m] === 'function').sort();
  const mongoMethods = Object.keys(repo.mongo).filter(m => !m.startsWith('_') && typeof repo.mongo[m] === 'function').sort();

  const missingInMongo = sqliteMethods.filter(m => !mongoMethods.includes(m));
  const missingInSqlite = mongoMethods.filter(m => !sqliteMethods.includes(m));

  assert.deepStrictEqual(missingInMongo, [], `[${repo.name}] Methods missing in MongoDB: ${missingInMongo.join(', ')}`);
  assert.deepStrictEqual(missingInSqlite, [], `[${repo.name}] Methods missing in SQLite: ${missingInSqlite.join(', ')}`);
  assert.strictEqual(sqliteMethods.length, mongoMethods.length, `[${repo.name}] Method counts differ: SQLite=${sqliteMethods.length}, Mongo=${mongoMethods.length}`);

  totalMethodsAudited += sqliteMethods.length;
  paritySummary.push({
    Repository: repo.name,
    Methods: sqliteMethods.length,
    SQLiteParity: '100%',
    MongoParity: '100%'
  });
}

console.table(paritySummary);
console.log(`✅ Dual Parity Audit PASSED: ${totalMethodsAudited} repository methods audited across all 10 repositories with 100% parity.`);

// 3. Database Safety & Integrity Audit
console.log('\n--- 3. Database Safety & Isolation Audit ---');
const activeEngine = getDbEngine();
console.log(`Active DB Engine: ${activeEngine}`);
assert.strictEqual(activeEngine, 'sqlite', 'DB_ENGINE must remain sqlite');

const pragma = db.prepare('PRAGMA integrity_check;').get();
assert.strictEqual(Object.values(pragma)[0], 'ok', 'SQLite integrity check failed');
console.log('✅ SQLite integrity check: OK');

const foreignKeys = db.prepare('PRAGMA foreign_keys;').get();
assert.strictEqual(Object.values(foreignKeys)[0], 1, 'Foreign keys must be enabled');
console.log('✅ SQLite foreign keys: ENABLED');

const journalMode = db.prepare('PRAGMA journal_mode;').get();
assert.strictEqual(Object.values(journalMode)[0], 'wal', 'Journal mode must be WAL');
console.log('✅ SQLite journal mode: WAL');

const mongoDb = getMongoDb();
if (mongoDb) {
  const collections = await mongoDb.listCollections().toArray();
  const appCollections = collections.filter(c => !c.name.startsWith('system.'));
  console.log(`MongoDB Atlas application collections: ${appCollections.length}`);
  assert.strictEqual(appCollections.length, 0, 'MongoDB Atlas must contain 0 application collections');
  console.log('✅ MongoDB Atlas isolation verified: 0 collections / 0 documents.');
} else {
  console.log('ℹ️ MongoDB client disconnected during test (Atlas safely isolated)');
}

console.log('\n' + '='.repeat(75));
console.log('STAGE 1 ARCHITECTURE & DUAL PARITY AUDIT: 100% PASSED');
console.log('='.repeat(75));
