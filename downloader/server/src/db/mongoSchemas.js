/**
 * StreamVault — MongoDB Collection Schemas, Validators & Index Specifications
 * Phase 2 Schema Definition for MongoDB Atlas Free Tier
 */

export const COLLECTIONS = {
  USERS: 'users',
  SESSIONS: 'sessions',
  LOGIN_HISTORY: 'login_history',
  PASSWORD_RESETS: 'password_resets',
  DOWNLOAD_JOBS: 'download_jobs',
  DOWNLOAD_HISTORY: 'download_history',
  FAVORITES: 'favorites',
  NOTIFICATIONS: 'notifications',
  USER_ACTIVITY: 'user_activity',
  API_KEYS: 'api_keys',
  API_LOGS: 'api_logs',
  WEBHOOKS: 'webhooks',
  WEBHOOK_DELIVERIES: 'webhook_deliveries',
  SYSTEM_SETTINGS: 'system_settings',
  ADMIN_AUDIT_LOGS: 'admin_audit_logs',
  SUBSCRIPTION_PLANS: 'subscription_plans',
  PAYMENT_METHODS: 'payment_methods',
  PAYMENT_TRANSACTIONS: 'payment_transactions',
  SUBSCRIPTIONS: 'subscriptions'
};

/**
 * MongoDB JSON Schema Validators for all 19 collections.
 * Designed to strictly protect data integrity while respecting existing application types.
 */
export const SCHEMA_DEFINITIONS = {
  [COLLECTIONS.USERS]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'email', 'password_hash', 'salt', 'name', 'role', 'plan', 'created_at', 'updated_at'],
        properties: {
          _id: { bsonType: 'string', description: 'User custom string UUID (user_...)' },
          email: { bsonType: 'string', pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$', description: 'Valid lowercase email' },
          password_hash: { bsonType: 'string' },
          salt: { bsonType: 'string' },
          name: { bsonType: 'string', minLength: 1 },
          role: { enum: ['user', 'admin'] },
          plan: { enum: ['free', 'pro', 'enterprise'] },
          is_verified: { bsonType: 'bool' },
          is_banned: { bsonType: 'bool' },
          two_factor_secret: { bsonType: ['string', 'null'] },
          two_factor_enabled: { bsonType: 'bool' },
          referral_code: { bsonType: ['string', 'null'] },
          referred_by: { bsonType: ['string', 'null'] },
          created_at: { bsonType: 'date' },
          updated_at: { bsonType: 'date' }
        }
      }
    }
  },

  [COLLECTIONS.SESSIONS]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'user_id', 'token_hash', 'expires_at', 'created_at', 'last_active_at'],
        properties: {
          _id: { bsonType: 'string', description: 'Session custom string ID (sess_...)' },
          user_id: { bsonType: 'string', description: 'Reference to users._id' },
          token_hash: { bsonType: 'string' },
          ip_address: { bsonType: ['string', 'null'] },
          user_agent: { bsonType: ['string', 'null'] },
          expires_at: { bsonType: 'date' },
          created_at: { bsonType: 'date' },
          last_active_at: { bsonType: 'date' }
        }
      }
    }
  },

  [COLLECTIONS.LOGIN_HISTORY]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['email', 'status', 'created_at'],
        properties: {
          _id: { bsonType: 'objectId' },
          sqlite_id: { bsonType: ['int', 'long', 'null'] },
          user_id: { bsonType: ['string', 'null'] },
          email: { bsonType: 'string' },
          ip_address: { bsonType: ['string', 'null'] },
          user_agent: { bsonType: ['string', 'null'] },
          status: { enum: ['success', 'failed'] },
          created_at: { bsonType: 'date' }
        }
      }
    }
  },

  [COLLECTIONS.PASSWORD_RESETS]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['user_id', 'token_hash', 'expires_at', 'used', 'created_at'],
        properties: {
          _id: { bsonType: 'objectId' },
          sqlite_id: { bsonType: ['int', 'long', 'null'] },
          user_id: { bsonType: 'string' },
          token_hash: { bsonType: 'string' },
          expires_at: { bsonType: 'date' },
          used: { bsonType: 'bool' },
          created_at: { bsonType: 'date' }
        }
      }
    }
  },

  [COLLECTIONS.DOWNLOAD_JOBS]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'url', 'platform', 'type', 'status', 'progress', 'priority', 'attempts', 'max_attempts', 'created_at', 'updated_at'],
        properties: {
          _id: { bsonType: 'string', description: 'Job custom ID (job_...)' },
          user_id: { bsonType: ['string', 'null'] },
          url: { bsonType: 'string' },
          platform: { bsonType: 'string' },
          format_id: { bsonType: ['string', 'null'] },
          type: { enum: ['video', 'audio'] },
          quality: { bsonType: ['string', 'null'] },
          title: { bsonType: ['string', 'null'] },
          thumbnail: { bsonType: ['string', 'null'] },
          duration: { bsonType: ['string', 'null'] },
          status: { enum: ['queued', 'processing', 'completed', 'failed', 'paused', 'cancelled'] },
          progress: { bsonType: ['int', 'long', 'double'] },
          priority: { bsonType: ['int', 'long'] },
          attempts: { bsonType: ['int', 'long'] },
          max_attempts: { bsonType: ['int', 'long'] },
          error_message: { bsonType: ['string', 'null'] },
          file_size: { bsonType: ['string', 'null'] },
          direct_url: { bsonType: ['string', 'null'] },
          created_at: { bsonType: 'date' },
          started_at: { bsonType: ['date', 'null'] },
          completed_at: { bsonType: ['date', 'null'] },
          updated_at: { bsonType: 'date' }
        }
      }
    }
  },

  [COLLECTIONS.DOWNLOAD_HISTORY]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['url', 'platform', 'title', 'type', 'created_at'],
        properties: {
          _id: { bsonType: 'objectId' },
          sqlite_id: { bsonType: ['int', 'long', 'null'] },
          user_id: { bsonType: ['string', 'null'] },
          job_id: { bsonType: ['string', 'null'] },
          url: { bsonType: 'string' },
          platform: { bsonType: 'string' },
          title: { bsonType: 'string' },
          thumbnail: { bsonType: ['string', 'null'] },
          format_id: { bsonType: ['string', 'null'] },
          type: { enum: ['video', 'audio'] },
          resolution: { bsonType: ['string', 'null'] },
          file_size: { bsonType: ['string', 'null'] },
          duration: { bsonType: ['string', 'null'] },
          status: { bsonType: 'string' },
          created_at: { bsonType: 'date' }
        }
      }
    }
  },

  [COLLECTIONS.FAVORITES]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['user_id', 'url', 'platform', 'title', 'collection_name', 'created_at'],
        properties: {
          _id: { bsonType: 'objectId' },
          sqlite_id: { bsonType: ['int', 'long', 'null'] },
          user_id: { bsonType: 'string' },
          url: { bsonType: 'string' },
          platform: { bsonType: 'string' },
          title: { bsonType: 'string' },
          thumbnail: { bsonType: ['string', 'null'] },
          duration: { bsonType: ['string', 'null'] },
          collection_name: { bsonType: 'string' },
          created_at: { bsonType: 'date' }
        }
      }
    }
  },

  [COLLECTIONS.NOTIFICATIONS]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['user_id', 'title', 'message', 'type', 'is_read', 'created_at'],
        properties: {
          _id: { bsonType: 'objectId' },
          sqlite_id: { bsonType: ['int', 'long', 'null'] },
          user_id: { bsonType: 'string' },
          title: { bsonType: 'string' },
          message: { bsonType: 'string' },
          type: { enum: ['info', 'success', 'warning', 'error'] },
          is_read: { bsonType: 'bool' },
          link: { bsonType: ['string', 'null'] },
          created_at: { bsonType: 'date' }
        }
      }
    }
  },

  [COLLECTIONS.USER_ACTIVITY]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['user_id', 'action', 'created_at'],
        properties: {
          _id: { bsonType: 'objectId' },
          sqlite_id: { bsonType: ['int', 'long', 'null'] },
          user_id: { bsonType: 'string' },
          action: { bsonType: 'string' },
          details: { bsonType: ['object', 'string', 'null'] },
          ip_address: { bsonType: ['string', 'null'] },
          user_agent: { bsonType: ['string', 'null'] },
          created_at: { bsonType: 'date' }
        }
      }
    }
  },

  [COLLECTIONS.API_KEYS]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'user_id', 'name', 'key_prefix', 'key_hash', 'status', 'monthly_quota', 'requests_this_month', 'is_enabled', 'created_at'],
        properties: {
          _id: { bsonType: 'string', description: 'API Key ID (key_...)' },
          user_id: { bsonType: 'string' },
          name: { bsonType: 'string' },
          key_prefix: { bsonType: 'string' },
          key_hash: { bsonType: 'string' },
          status: { enum: ['active', 'revoked'] },
          monthly_quota: { bsonType: ['int', 'long'] },
          requests_this_month: { bsonType: ['int', 'long'] },
          last_used_at: { bsonType: ['date', 'null'] },
          created_at: { bsonType: 'date' },
          is_enabled: { bsonType: 'bool' },
          expires_at: { bsonType: ['date', 'null'] },
          last_used_ip: { bsonType: ['string', 'null'] }
        }
      }
    }
  },

  [COLLECTIONS.API_LOGS]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['endpoint', 'method', 'status_code', 'response_time_ms', 'created_at'],
        properties: {
          _id: { bsonType: 'objectId' },
          sqlite_id: { bsonType: ['int', 'long', 'null'] },
          api_key_id: { bsonType: ['string', 'null'] },
          user_id: { bsonType: ['string', 'null'] },
          endpoint: { bsonType: 'string' },
          method: { bsonType: 'string' },
          status_code: { bsonType: ['int', 'long'] },
          response_time_ms: { bsonType: ['int', 'long', 'double'] },
          ip_address: { bsonType: ['string', 'null'] },
          error_message: { bsonType: ['string', 'null'] },
          created_at: { bsonType: 'date' }
        }
      }
    }
  },

  [COLLECTIONS.WEBHOOKS]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'user_id', 'name', 'url', 'secret', 'events', 'is_active', 'created_at', 'updated_at'],
        properties: {
          _id: { bsonType: 'string', description: 'Webhook ID (wh_...)' },
          user_id: { bsonType: 'string' },
          name: { bsonType: 'string' },
          url: { bsonType: 'string' },
          secret: { bsonType: 'string' },
          events: { bsonType: 'array', items: { bsonType: 'string' } },
          is_active: { bsonType: 'bool' },
          created_at: { bsonType: 'date' },
          updated_at: { bsonType: 'date' }
        }
      }
    }
  },

  [COLLECTIONS.WEBHOOK_DELIVERIES]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'webhook_id', 'user_id', 'event', 'payload', 'attempt', 'max_attempts', 'status', 'created_at'],
        properties: {
          _id: { bsonType: 'string', description: 'Delivery ID (whd_...)' },
          webhook_id: { bsonType: 'string' },
          user_id: { bsonType: 'string' },
          event: { bsonType: 'string' },
          payload: { bsonType: ['object', 'string'] },
          response_status: { bsonType: ['int', 'long', 'null'] },
          response_body: { bsonType: ['string', 'null'] },
          attempt: { bsonType: ['int', 'long'] },
          max_attempts: { bsonType: ['int', 'long'] },
          status: { enum: ['pending', 'success', 'failed', 'retrying'] },
          error_message: { bsonType: ['string', 'null'] },
          created_at: { bsonType: 'date' },
          delivered_at: { bsonType: ['date', 'null'] }
        }
      }
    }
  },

  [COLLECTIONS.SYSTEM_SETTINGS]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'key', 'value', 'updated_at'],
        properties: {
          _id: { bsonType: 'string', description: 'Setting key name' },
          key: { bsonType: 'string' },
          value: { bsonType: 'string' },
          updated_at: { bsonType: 'date' }
        }
      }
    }
  },

  [COLLECTIONS.ADMIN_AUDIT_LOGS]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['action', 'created_at'],
        properties: {
          _id: { bsonType: 'objectId' },
          sqlite_id: { bsonType: ['int', 'long', 'null'] },
          admin_id: { bsonType: ['string', 'null'] },
          action: { bsonType: 'string' },
          target_type: { bsonType: ['string', 'null'] },
          target_id: { bsonType: ['string', 'null'] },
          details: { bsonType: ['object', 'string', 'null'] },
          ip_address: { bsonType: ['string', 'null'] },
          created_at: { bsonType: 'date' }
        }
      }
    }
  },

  [COLLECTIONS.SUBSCRIPTION_PLANS]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'name', 'slug', 'price_monthly_bdt', 'price_yearly_bdt', 'daily_download_quota', 'monthly_download_quota', 'api_rpm', 'api_monthly_quota', 'max_concurrent_jobs', 'features', 'is_active', 'created_at', 'updated_at'],
        properties: {
          _id: { bsonType: 'string', description: 'Plan ID (plan_...)' },
          name: { bsonType: 'string' },
          slug: { enum: ['free', 'pro', 'enterprise'] },
          price_monthly_bdt: { bsonType: ['int', 'long'] },
          price_yearly_bdt: { bsonType: ['int', 'long'] },
          daily_download_quota: { bsonType: ['int', 'long'] },
          monthly_download_quota: { bsonType: ['int', 'long'] },
          api_rpm: { bsonType: ['int', 'long'] },
          api_monthly_quota: { bsonType: ['int', 'long'] },
          max_concurrent_jobs: { bsonType: ['int', 'long'] },
          features: { bsonType: 'array', items: { bsonType: 'string' } },
          is_active: { bsonType: 'bool' },
          created_at: { bsonType: 'date' },
          updated_at: { bsonType: 'date' }
        }
      }
    }
  },

  [COLLECTIONS.PAYMENT_METHODS]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'name', 'identifier', 'account_number', 'account_type', 'instructions', 'is_enabled', 'created_at', 'updated_at'],
        properties: {
          _id: { bsonType: 'string', description: 'Payment method ID (pm_...)' },
          name: { bsonType: 'string' },
          identifier: { bsonType: 'string' },
          account_number: { bsonType: 'string' },
          account_type: { bsonType: 'string' },
          instructions: { bsonType: 'string' },
          is_enabled: { bsonType: 'bool' },
          created_at: { bsonType: 'date' },
          updated_at: { bsonType: 'date' }
        }
      }
    }
  },

  [COLLECTIONS.PAYMENT_TRANSACTIONS]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'user_id', 'plan_id', 'plan_slug', 'payment_method_id', 'payment_method_name', 'sender_number', 'transaction_id', 'amount', 'billing_period', 'status', 'created_at', 'updated_at'],
        properties: {
          _id: { bsonType: 'string', description: 'Transaction ID (tx_...)' },
          user_id: { bsonType: 'string' },
          plan_id: { bsonType: 'string' },
          plan_slug: { bsonType: 'string' },
          payment_method_id: { bsonType: 'string' },
          payment_method_name: { bsonType: 'string' },
          sender_number: { bsonType: 'string' },
          transaction_id: { bsonType: 'string' },
          amount: { bsonType: ['int', 'long'] },
          billing_period: { enum: ['monthly', 'yearly'] },
          status: { enum: ['pending', 'approved', 'rejected'] },
          screenshot_url: { bsonType: ['string', 'null'] },
          admin_note: { bsonType: ['string', 'null'] },
          verified_by: { bsonType: ['string', 'null'] },
          verified_at: { bsonType: ['date', 'null'] },
          created_at: { bsonType: 'date' },
          updated_at: { bsonType: 'date' }
        }
      }
    }
  },

  [COLLECTIONS.SUBSCRIPTIONS]: {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'user_id', 'plan_id', 'plan_slug', 'billing_period', 'starts_at', 'expires_at', 'status', 'created_at', 'updated_at'],
        properties: {
          _id: { bsonType: 'string', description: 'Subscription ID (sub_...)' },
          user_id: { bsonType: 'string' },
          plan_id: { bsonType: 'string' },
          plan_slug: { bsonType: 'string' },
          transaction_id: { bsonType: ['string', 'null'] },
          billing_period: { enum: ['monthly', 'yearly'] },
          starts_at: { bsonType: 'date' },
          expires_at: { bsonType: 'date' },
          status: { enum: ['active', 'expired', 'cancelled'] },
          created_at: { bsonType: 'date' },
          updated_at: { bsonType: 'date' }
        }
      }
    }
  }
};

/**
 * Minimal, lean index specifications tailored for query patterns and 512 MB Free Tier storage limit.
 */
export const COLLECTION_INDEXES = {
  [COLLECTIONS.USERS]: [
    { key: { email: 1 }, options: { unique: true, name: 'idx_users_email_unique' } },
    { key: { referral_code: 1 }, options: { unique: true, partialFilterExpression: { referral_code: { $type: 'string' } }, name: 'idx_users_referral_unique' } },
    { key: { role: 1 }, options: { name: 'idx_users_role' } }
  ],

  [COLLECTIONS.SESSIONS]: [
    { key: { token_hash: 1 }, options: { unique: true, name: 'idx_sessions_token_hash_unique' } },
    { key: { user_id: 1 }, options: { name: 'idx_sessions_user_id' } },
    { key: { expires_at: 1 }, options: { expireAfterSeconds: 0, name: 'idx_sessions_ttl_expires_at' } }
  ],

  [COLLECTIONS.LOGIN_HISTORY]: [
    { key: { email: 1, created_at: -1 }, options: { name: 'idx_login_history_email_created' } },
    { key: { user_id: 1, created_at: -1 }, options: { name: 'idx_login_history_user_created' } },
    { key: { created_at: 1 }, options: { expireAfterSeconds: 30 * 86400, name: 'idx_login_history_ttl_30d' } }
  ],

  [COLLECTIONS.PASSWORD_RESETS]: [
    { key: { token_hash: 1 }, options: { unique: true, name: 'idx_pwd_resets_token_hash_unique' } },
    { key: { expires_at: 1 }, options: { expireAfterSeconds: 0, name: 'idx_pwd_resets_ttl_expires_at' } }
  ],

  [COLLECTIONS.DOWNLOAD_JOBS]: [
    { key: { status: 1, priority: -1, created_at: 1 }, options: { name: 'idx_jobs_queue_priority_created' } },
    { key: { user_id: 1, created_at: -1 }, options: { name: 'idx_jobs_user_created' } },
    { key: { url: 1, status: 1 }, options: { name: 'idx_jobs_url_status_duplicate' } }
  ],

  [COLLECTIONS.DOWNLOAD_HISTORY]: [
    { key: { user_id: 1, created_at: -1 }, options: { name: 'idx_history_user_created' } }
  ],

  [COLLECTIONS.FAVORITES]: [
    { key: { user_id: 1, url: 1 }, options: { unique: true, name: 'idx_favorites_user_url_unique' } },
    { key: { user_id: 1, created_at: -1 }, options: { name: 'idx_favorites_user_created' } }
  ],

  [COLLECTIONS.NOTIFICATIONS]: [
    { key: { user_id: 1, is_read: 1, created_at: -1 }, options: { name: 'idx_notifications_user_read' } }
  ],

  [COLLECTIONS.USER_ACTIVITY]: [
    { key: { user_id: 1, created_at: -1 }, options: { name: 'idx_activity_user_created' } },
    { key: { created_at: 1 }, options: { expireAfterSeconds: 30 * 86400, name: 'idx_activity_ttl_30d' } }
  ],

  [COLLECTIONS.API_KEYS]: [
    { key: { key_hash: 1 }, options: { unique: true, name: 'idx_api_keys_hash_unique' } },
    { key: { user_id: 1, created_at: -1 }, options: { name: 'idx_api_keys_user_created' } },
    { key: { key_prefix: 1 }, options: { name: 'idx_api_keys_prefix' } }
  ],

  [COLLECTIONS.API_LOGS]: [
    { key: { created_at: 1 }, options: { expireAfterSeconds: 7 * 86400, name: 'idx_api_logs_ttl_7d' } },
    { key: { user_id: 1, created_at: -1 }, options: { name: 'idx_api_logs_user_created' } },
    { key: { api_key_id: 1, created_at: -1 }, options: { name: 'idx_api_logs_key_created' } }
  ],

  [COLLECTIONS.WEBHOOKS]: [
    { key: { user_id: 1, created_at: -1 }, options: { name: 'idx_webhooks_user_created' } }
  ],

  [COLLECTIONS.WEBHOOK_DELIVERIES]: [
    { key: { webhook_id: 1, created_at: -1 }, options: { name: 'idx_wh_deliveries_hook_created' } },
    { key: { user_id: 1, created_at: -1 }, options: { name: 'idx_wh_deliveries_user_created' } },
    { key: { created_at: 1 }, options: { expireAfterSeconds: 14 * 86400, name: 'idx_wh_deliveries_ttl_14d' } }
  ],

  [COLLECTIONS.SYSTEM_SETTINGS]: [
    { key: { key: 1 }, options: { unique: true, name: 'idx_system_settings_key_unique' } }
  ],

  [COLLECTIONS.ADMIN_AUDIT_LOGS]: [
    { key: { created_at: -1 }, options: { name: 'idx_admin_audit_created' } }
  ],

  [COLLECTIONS.SUBSCRIPTION_PLANS]: [
    { key: { slug: 1 }, options: { unique: true, name: 'idx_sub_plans_slug_unique' } }
  ],

  [COLLECTIONS.PAYMENT_METHODS]: [
    { key: { identifier: 1 }, options: { unique: true, name: 'idx_payment_methods_identifier_unique' } }
  ],

  [COLLECTIONS.PAYMENT_TRANSACTIONS]: [
    { key: { transaction_id: 1 }, options: { unique: true, name: 'idx_transactions_trxid_unique' } },
    { key: { user_id: 1, created_at: -1 }, options: { name: 'idx_transactions_user_created' } },
    { key: { status: 1, created_at: -1 }, options: { name: 'idx_transactions_status_created' } }
  ],

  [COLLECTIONS.SUBSCRIPTIONS]: [
    { key: { user_id: 1, status: 1, expires_at: -1 }, options: { name: 'idx_subscriptions_user_status_exp' } }
  ]
};

/**
 * Idempotently initializes MongoDB collections, schemas, and indexes.
 * Does NOT delete any existing collections or documents.
 *
 * @param {import('mongodb').Db} db - Connected MongoDB Database instance
 * @returns {Promise<{ initializedCount: number, collections: string[], indexesCreated: number }>}
 */
export async function initMongoCollectionsAndIndexes(db) {
  if (!db) {
    throw new Error('Valid MongoDB Db instance is required to initialize collections and indexes.');
  }

  const existingCollections = await db.listCollections().toArray();
  const existingNames = new Set(existingCollections.map(c => c.name));

  const collectionNames = Object.values(COLLECTIONS);
  let indexesCreated = 0;

  for (const name of collectionNames) {
    const schemaDef = SCHEMA_DEFINITIONS[name];

    // 1. Create collection with schema validator if it does not exist
    if (!existingNames.has(name)) {
      await db.createCollection(name, {
        validator: schemaDef.validator,
        validationAction: 'error',
        validationLevel: 'moderate' // Validates inserts and updates on matching fields; safe for migrations
      });
    } else {
      // If collection already exists, safely update the validator without dropping data
      try {
        await db.command({
          collMod: name,
          validator: schemaDef.validator,
          validationAction: 'error',
          validationLevel: 'moderate'
        });
      } catch (err) {
        // Ignore if collMod unsupported or no change
      }
    }

    // 2. Create indexes idempotently
    const indexList = COLLECTION_INDEXES[name] || [];
    if (indexList.length > 0) {
      for (const idx of indexList) {
        try {
          await db.collection(name).createIndex(idx.key, idx.options);
          indexesCreated++;
        } catch (idxErr) {
          // If index already exists with matching name/options, createIndex is a no-op
        }
      }
    }
  }

  return {
    initializedCount: collectionNames.length,
    collections: collectionNames,
    indexesCreated
  };
}
