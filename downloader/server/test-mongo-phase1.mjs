// Phase 1 Automated Verification Suite - MongoDB Infrastructure & Connection Layer
import assert from 'node:assert';
import {
  sanitizeMongoUri,
  getMongoConfig,
  connectMongo,
  disconnectMongo,
  getMongoDb,
  getMongoClient,
  isMongoConnected,
  checkMongoHealth
} from './src/db/mongo.js';
import db from './src/db/index.js';

async function runPhase1MongoTests() {
  console.log('🧪 Starting Phase 1 MongoDB Infrastructure Verification Suite...\n');
  let passed = 0;

  function pass(desc) {
    passed++;
    console.log(`  ✅ ${desc}`);
  }

  try {
    // 1. URI Sanitization & Credential Protection
    const rawSrvUri = 'mongodb+srv://admin_user:SuperSecretPassword123@cluster0.abcde.mongodb.net/streamvault?retryWrites=true&w=majority';
    const sanitizedSrv = sanitizeMongoUri(rawSrvUri);
    assert.ok(!sanitizedSrv.includes('SuperSecretPassword123'), 'Sanitized SRV URI must not contain password');
    assert.ok(sanitizedSrv.includes('****'), 'Sanitized SRV URI must contain masked placeholder');
    assert.ok(sanitizedSrv.includes('admin_user:****@cluster0.abcde.mongodb.net'), 'Sanitized SRV URI maintains correct format');

    const rawStandardUri = 'mongodb://app_service:P%40ssw0rd!@10.0.0.5:27017/streamvault';
    const sanitizedStandard = sanitizeMongoUri(rawStandardUri);
    assert.ok(!sanitizedStandard.includes('P%40ssw0rd!'), 'Sanitized standard URI must not contain password');
    assert.ok(sanitizedStandard.includes('app_service:****@10.0.0.5:27017'), 'Sanitized standard URI maintains host/port');

    assert.strictEqual(sanitizeMongoUri(null), 'none');
    assert.strictEqual(sanitizeMongoUri(undefined), 'none');
    assert.strictEqual(sanitizeMongoUri(''), 'none');
    pass('Connection URI credential masking verified without leaking passwords');

    // 2. Configuration Parser & Defaults
    const defaultConfig = getMongoConfig();
    assert.strictEqual(defaultConfig.dbName, process.env.MONGODB_DB_NAME || 'streamvault');
    assert.strictEqual(defaultConfig.options.maxPoolSize, 10);
    assert.strictEqual(defaultConfig.options.minPoolSize, 2);
    assert.ok(defaultConfig.options.connectTimeoutMS >= 5000);
    assert.ok(defaultConfig.options.serverSelectionTimeoutMS >= 5000);
    assert.strictEqual(defaultConfig.options.appName, 'StreamVault');

    const customConfig = getMongoConfig('mongodb://localhost:27017', { maxPoolSize: 25 });
    assert.strictEqual(customConfig.uri, 'mongodb://localhost:27017');
    assert.strictEqual(customConfig.options.maxPoolSize, 25);
    pass('MongoDB configuration loader and pool defaults verified');

    // 3. Unconfigured Environment Safety
    // When MONGODB_URI is not set, connectMongo must not throw and must return null safely
    await disconnectMongo();
    const savedUri = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;

    try {
      const unconfiguredDb = await connectMongo(null);
      assert.strictEqual(unconfiguredDb, null);
      assert.strictEqual(isMongoConnected(), false);
      assert.strictEqual(getMongoDb(), null);
      assert.strictEqual(getMongoClient(), null);

      const unconfiguredHealth = await checkMongoHealth();
      assert.strictEqual(unconfiguredHealth.status, 'unconfigured');
      assert.strictEqual(unconfiguredHealth.connected, false);
      pass('Unconfigured MONGODB_URI handled gracefully without crashing or throwing');
    } finally {
      process.env.MONGODB_URI = savedUri;
    }

    // 4. Connection Failure & Timeout Handling
    // Attempt connecting to a non-existent port with a short 500ms timeout
    const nonExistentUri = 'mongodb://fakeuser:fakepass@127.0.0.1:29999/streamvault';
    const failedDb = await connectMongo(nonExistentUri, {
      connectTimeoutMS: 500,
      serverSelectionTimeoutMS: 500
    });
    assert.strictEqual(failedDb, null, 'Failed connection must return null without throwing unhandled exception');
    assert.strictEqual(isMongoConnected(), false);
    assert.strictEqual(getMongoDb(), null);
    assert.strictEqual(getMongoClient(), null);

    const failedHealth = await checkMongoHealth();
    assert.strictEqual(failedHealth.connected, false);
    pass('Connection failure and server selection timeout handled safely without process crash');

    // 5. Clean Disconnect Idempotency
    await disconnectMongo();
    assert.strictEqual(isMongoConnected(), false);
    await disconnectMongo(); // Second call must not throw
    pass('Clean connection disconnect is idempotent and safe');

    // 6. SQLite Durability & Isolation Verification
    // Verify that SQLite database remains completely unaffected and functional
    const integrityRow = db.prepare('PRAGMA integrity_check').get();
    const integrityResult = integrityRow ? Object.values(integrityRow)[0] : 'unknown';
    assert.strictEqual(integrityResult, 'ok', 'SQLite integrity must remain "ok"');

    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    assert.ok(userCount >= 1, `SQLite users table intact (found ${userCount} users)`);

    const planCount = db.prepare('SELECT COUNT(*) as count FROM subscription_plans').get().count;
    assert.strictEqual(planCount, 3, 'SQLite subscription plans intact');
    pass('SQLite WAL primary database remains 100% operational and isolated');

    console.log(`\n🎉 All ${passed} Phase 1 MongoDB Infrastructure verification tests PASSED!\n`);
    return true;
  } catch (err) {
    console.error('\n❌ Phase 1 Test Suite FAILED:', err);
    process.exit(1);
  }
}

runPhase1MongoTests();
