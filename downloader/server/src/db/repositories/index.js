/**
 * StreamVault — Database Abstraction Layer & Repository Registry
 * MongoDB Atlas is the exclusive active database engine.
 */

import { getUserRepository, mongoUserRepository } from './userRepository.js';
import { getSessionRepository, mongoSessionRepository } from './sessionRepository.js';
import { getQueueRepository, mongoQueueRepository } from './queueRepository.js';
import { getHistoryRepository, mongoHistoryRepository } from './historyRepository.js';
import { getFavoriteRepository, mongoFavoriteRepository } from './favoriteRepository.js';
import { getNotificationRepository, mongoNotificationRepository } from './notificationRepository.js';
import { getApiKeyRepository, mongoApiKeyRepository } from './apiKeyRepository.js';
import { getSubscriptionRepository, mongoSubscriptionRepository } from './subscriptionRepository.js';
import { getSystemRepository, mongoSystemRepository } from './systemRepository.js';
import { getWebhookRepository, mongoWebhookRepository } from './webhookRepository.js';
import { isMongoConnected } from '../mongo.js';

export const SUPPORTED_ENGINES = {
  MONGODB: 'mongodb'
};

/**
 * Returns the currently active database engine.
 * StreamVault exclusively supports 'mongodb'.
 */
export function getDbEngine() {
  if (process.env.DB_ENGINE !== undefined && process.env.DB_ENGINE !== 'undefined') {
    const raw = String(process.env.DB_ENGINE).trim().toLowerCase();
    if (raw === 'sqlite') {
      throw new Error('Invalid DB_ENGINE: SQLite has been decommissioned. StreamVault runs exclusively on MongoDB Atlas. Set DB_ENGINE=mongodb.');
    }
    if (raw !== 'mongodb' && raw !== '') {
      throw new Error(`Invalid DB_ENGINE: "${process.env.DB_ENGINE}". Supported database engine is "mongodb".`);
    }
  }
  return SUPPORTED_ENGINES.MONGODB;
}

/**
 * Validates that the active database engine is ready and operational.
 * If MongoDB is disconnected, throws an explicit error rather than silently failing.
 */
export function validateActiveEngine() {
  const engine = getDbEngine();
  if (!isMongoConnected()) {
    throw new Error('Database Engine is set to "mongodb", but MongoDB Atlas is not connected. Operation halted for data safety.');
  }
  return { engine, ready: true };
}

/**
 * Helper to create a dynamic proxy resolving the repository at call time.
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

// Export dynamic repositories that resolve to MongoDB
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

// Direct MongoDB engine implementations
export { mongoUserRepository } from './userRepository.js';
export { mongoSessionRepository } from './sessionRepository.js';
export { mongoQueueRepository } from './queueRepository.js';
export { mongoHistoryRepository } from './historyRepository.js';
export { mongoFavoriteRepository } from './favoriteRepository.js';
export { mongoNotificationRepository } from './notificationRepository.js';
export { mongoApiKeyRepository } from './apiKeyRepository.js';
export { mongoSubscriptionRepository } from './subscriptionRepository.js';
export { mongoSystemRepository } from './systemRepository.js';
export { mongoWebhookRepository } from './webhookRepository.js';
