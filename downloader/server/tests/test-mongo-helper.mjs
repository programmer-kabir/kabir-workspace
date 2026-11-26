/**
 * StreamVault — Stage 3 Test Database Isolation Helper
 * Connects exclusively to 'StreamVault_Test' on MongoDB Atlas.
 * Guarantees zero writes to production 'StreamVault' database.
 */

import { MongoClient } from 'mongodb';
import { getMongoConfig, setMongoDb } from '../src/db/mongo.js';
import { initMongoCollectionsAndIndexes, SCHEMA_DEFINITIONS, COLLECTIONS } from '../src/db/mongoSchemas.js';

export const TEST_DB_NAME = 'StreamVault_Test';
let testClient = null;
let testDb = null;

export async function setupTestMongo() {
  const config = getMongoConfig();
  if (!config.uri) {
    throw new Error('MONGODB_URI is not configured in environment. Cannot run Stage 3 tests.');
  }

  if (testClient && testDb) {
    setMongoDb(testDb, testClient);
    return { client: testClient, db: testDb };
  }

  testClient = new MongoClient(config.uri, config.options);
  await testClient.connect();
  testDb = testClient.db(TEST_DB_NAME);
  testDb.client = testClient;

  // Initialize schema validators and indexes on StreamVault_Test if not present
  const existingCols = await testDb.listCollections().toArray();
  if (existingCols.length < 10) {
    console.log(`[TEST-INIT] Initializing schema validators and indexes on ${TEST_DB_NAME}...`);
    await initMongoCollectionsAndIndexes(testDb);
    console.log(`[TEST-INIT] Schema validators and indexes initialized.`);
  } else {
    // Sync any modified validators
    for (const name of [COLLECTIONS.DOWNLOAD_JOBS, COLLECTIONS.DOWNLOAD_HISTORY]) {
      try {
        await testDb.command({
          collMod: name,
          validator: SCHEMA_DEFINITIONS[name].validator,
          validationAction: 'error',
          validationLevel: 'moderate'
        });
      } catch {}
    }
  }

  // Set the active MongoDB instance in repository layer to StreamVault_Test
  setMongoDb(testDb, testClient);

  return { client: testClient, db: testDb };
}

export async function teardownTestMongo(drop = false) {
  if (testClient && testDb) {
    if (drop) {
      try {
        await testDb.dropDatabase();
        console.log(`[TEARDOWN] Dropped isolated test database: ${TEST_DB_NAME}`);
      } catch (err) {
        console.error(`[TEARDOWN] Error dropping ${TEST_DB_NAME}:`, err.message);
      }
    }
    await testClient.close();
    testClient = null;
    testDb = null;
    setMongoDb(null, null);
  }
}
