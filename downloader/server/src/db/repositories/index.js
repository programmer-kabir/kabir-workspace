/**
 * StreamVault — Database Abstraction Layer & Repository Registry
 * Supports dual-engine operation: 'sqlite' (default, active) and 'mongodb' (optional)
 */

import { getUserRepository } from './userRepository.js';
import { getSessionRepository } from './sessionRepository.js';
import { getQueueRepository } from './queueRepository.js';
import { getHistoryRepository } from './historyRepository.js';
import { getFavoriteRepository } from './favoriteRepository.js';
import { getNotificationRepository } from './notificationRepository.js';
import { getApiKeyRepository } from './apiKeyRepository.js';
import { getSubscriptionRepository } from './subscriptionRepository.js';
import { getSystemRepository } from './systemRepository.js';
import { getWebhookRepository } from './webhookRepository.js';
import { isMongoConnected } from '../mongo.js';

export const SUPPORTED_ENGINES = {
  SQLITE: 'sqlite',
  MONGODB: 'mongodb'
};

/**
 * Returns the currently active database engine.
 * - Unset (undefined): returns 'sqlite' (default active)
 * - 'sqlite': returns 'sqlite'
 * - 'mongodb': returns 'mongodb'
 * - Empty string or any other unsupported value: throws an explicit Error (NO silent fallback)
 */
export function getDbEngine() {
  if (process.env.DB_ENGINE === undefined || process.env.DB_ENGINE === 'undefined') {
    return SUPPORTED_ENGINES.SQLITE;
  }
  const raw = String(process.env.DB_ENGINE).trim();
  if (raw === '') {
    throw new Error('Invalid DB_ENGINE: DB_ENGINE is explicitly defined but empty. Expected "sqlite" or "mongodb".');
  }
  const normalized = raw.toLowerCase();
  if (normalized === SUPPORTED_ENGINES.SQLITE) {
    return SUPPORTED_ENGINES.SQLITE;
  }
  if (normalized === SUPPORTED_ENGINES.MONGODB) {
    return SUPPORTED_ENGINES.MONGODB;
  }
  throw new Error(`Invalid DB_ENGINE: "${process.env.DB_ENGINE}". Supported database engines are "sqlite" or "mongodb".`);
}

/**
 * Validates that the active database engine is ready and operational.
 * If MongoDB is selected but disconnected, throws an explicit error rather than silently falling back.
 */
export function validateActiveEngine() {
  const engine = getDbEngine();
  if (engine === SUPPORTED_ENGINES.MONGODB) {
    if (!isMongoConnected()) {
      throw new Error('Database Engine is set to "mongodb", but MongoDB Atlas is not connected. Operation halted for data safety.');
    }
  }
  return { engine, ready: true };
}

/**
 * Helper to create a dynamic proxy resolving the repository for the active DB_ENGINE at call time.
 */
function createRepoProxy(getRepoFn) {
  return new Proxy({}, {
    get(_target, prop) {
      const activeRepo = getRepoFn();
      const val = activeRepo[prop];
      if (typeof val === 'function') {
        return val.bind(activeRepo);
      }
      return val;
    }
  });
}

// Export dynamic repositories that resolve according to active DB_ENGINE
export const userRepository = createRepoProxy(getUserRepository);
export const sessionRepository = createRepoProxy(getSessionRepository);
export const queueRepository = createRepoProxy(getQueueRepository);
export const historyRepository = createRepoProxy(getHistoryRepository);
export const favoriteRepository = createRepoProxy(getFavoriteRepository);
export const notificationRepository = createRepoProxy(getNotificationRepository);
export const apiKeyRepository = createRepoProxy(getApiKeyRepository);
export const subscriptionRepository = createRepoProxy(getSubscriptionRepository);
export const systemRepository = createRepoProxy(getSystemRepository);
export const webhookRepository = createRepoProxy(getWebhookRepository);

export {
  getUserRepository,
  getSessionRepository,
  getQueueRepository,
  getHistoryRepository,
  getFavoriteRepository,
  getNotificationRepository,
  getApiKeyRepository,
  getSubscriptionRepository,
  getSystemRepository,
  getWebhookRepository
};

// Direct engine implementations
export { sqliteUserRepository, mongoUserRepository } from './userRepository.js';
export { sqliteSessionRepository, mongoSessionRepository } from './sessionRepository.js';
export { sqliteQueueRepository, mongoQueueRepository } from './queueRepository.js';
export { sqliteHistoryRepository, mongoHistoryRepository } from './historyRepository.js';
export { sqliteFavoriteRepository, mongoFavoriteRepository } from './favoriteRepository.js';
export { sqliteNotificationRepository, mongoNotificationRepository } from './notificationRepository.js';
export { sqliteApiKeyRepository, mongoApiKeyRepository } from './apiKeyRepository.js';
export { sqliteSubscriptionRepository, mongoSubscriptionRepository } from './subscriptionRepository.js';
export { sqliteSystemRepository, mongoSystemRepository } from './systemRepository.js';
export { sqliteWebhookRepository, mongoWebhookRepository } from './webhookRepository.js';

