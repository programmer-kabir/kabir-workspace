import 'dotenv/config';
import { MongoClient } from 'mongodb';
import logger from '../utils/logger.js';

let client = null;
let db = null;
let isConnecting = false;

/**
 * Strips password and sensitive credentials from MongoDB URI for safe logging
 */
export function sanitizeMongoUri(rawUri) {
  if (!rawUri || typeof rawUri !== 'string') return 'none';
  try {
    // Matches standard mongodb:// and mongodb+srv:// credentials
    return rawUri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/i, '$1****$3');
  } catch {
    return 'redacted';
  }
}

/**
 * Returns connection configuration merged from environment variables
 */
export function getMongoConfig(overrideUri = null, overrideOptions = {}) {
  const uri = overrideUri || process.env.MONGODB_URI || null;
  const dbName = process.env.MONGODB_DB_NAME || 'streamvault';
  const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10);
  const minPoolSize = parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10);
  const connectTimeoutMS = parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS || '5000', 10);
  const serverSelectionTimeoutMS = parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000', 10);

  return {
    uri,
    dbName,
    options: {
      maxPoolSize,
      minPoolSize,
      connectTimeoutMS,
      serverSelectionTimeoutMS,
      retryWrites: true,
      w: 'majority',
      appName: 'StreamVault',
      ...overrideOptions
    }
  };
}

/**
 * Connect to MongoDB Atlas / Server safely with timeout & error handling
 * Returns connected Db instance, or null if unconfigured/failed
 */
export async function connectMongo(customUri = null, customOptions = {}) {
  if (db && client) {
    return db;
  }

  if (isConnecting) {
    logger.warn('MongoDB connection attempt already in progress.');
    return null;
  }

  const config = getMongoConfig(customUri, customOptions);

  if (!config.uri) {
    logger.info('MongoDB URI is not configured (MONGODB_URI is unset). SQLite continues as primary database.');
    return null;
  }

  const safeUri = sanitizeMongoUri(config.uri);

  try {
    isConnecting = true;
    logger.info(`Connecting to MongoDB at ${safeUri}...`);

    client = new MongoClient(config.uri, config.options);
    await client.connect();

    // Verify ping
    await client.db('admin').command({ ping: 1 });

    db = client.db(config.dbName);
    logger.info(`✅ MongoDB connected successfully to database: "${config.dbName}"`);
    return db;
  } catch (err) {
    logger.error(`MongoDB connection failed (${safeUri})`, err.message);
    if (client) {
      try {
        await client.close();
      } catch {}
      client = null;
    }
    db = null;
    return null;
  } finally {
    isConnecting = false;
  }
}

/**
 * Disconnect cleanly from MongoDB
 */
export async function disconnectMongo() {
  if (client) {
    try {
      await client.close();
      logger.info('MongoDB connection closed.');
    } catch (err) {
      logger.error('Error during MongoDB disconnect', err);
    } finally {
      client = null;
      db = null;
    }
  }
}

/**
 * Get active MongoDB Db instance (or null)
 */
export function getMongoDb() {
  return db;
}

/**
 * Get active MongoClient instance (or null)
 */
export function getMongoClient() {
  return client;
}

/**
 * Check if MongoDB is currently connected
 */
export function isMongoConnected() {
  return !!(client && db);
}

/**
 * Health check with round-trip latency measurement and credential-safe diagnostics
 */
export async function checkMongoHealth() {
  const config = getMongoConfig();
  const safeUri = sanitizeMongoUri(config.uri);

  if (!config.uri) {
    return {
      status: 'unconfigured',
      connected: false,
      message: 'MONGODB_URI is not set in environment.',
      sanitizedUri: safeUri
    };
  }

  if (!client || !db) {
    return {
      status: 'disconnected',
      connected: false,
      message: 'MongoDB client is not connected.',
      sanitizedUri: safeUri
    };
  }

  try {
    const startTime = Date.now();
    await client.db('admin').command({ ping: 1 });
    const latencyMs = Date.now() - startTime;

    return {
      status: 'healthy',
      connected: true,
      database: config.dbName,
      latencyMs,
      sanitizedUri: safeUri,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      connected: false,
      error: err.message,
      sanitizedUri: safeUri
    };
  }
}
