# StreamVault — MongoDB Atlas Migration Feasibility Review & Impact Analysis
**Document Version:** 1.0.0  
**Date:** November 22, 2026  
**Status:** Architecture Review Only (READ-ONLY — Zero Code or Data Modified)  
**Author:** Antigravity Engineering

---

## 1. Executive Summary

This report delivers an exhaustive technical assessment regarding migrating the **StreamVault** database from its current Node.js 24 native SQLite engine (`DatabaseSync` in WAL mode) to **MongoDB Atlas M0 Free Tier (512 MB)**.

### Primary Conclusion & Verdict:
> ### ⚠️ Verdict: NOT RECOMMENDED for MongoDB Atlas Free Tier (512 MB)
> Migrating StreamVault to the **MongoDB Atlas M0 Free Tier (512 MB)** introduces severe operational, storage, and architectural risks that outweigh any advantages. 
> 
> 1. **Storage Exhaustion:** Due to BSON document overhead and multiple secondary indexes, the 512 MB ceiling will be exhausted within **30 to 90 days** of moderate production traffic (driven primarily by `api_logs`, `download_history`, `user_activity`, and `login_history`).
> 2. **Runtime Paradigm Shift (Sync to Async):** StreamVault is built upon Node.js 24's native `node:sqlite` (`DatabaseSync`), meaning core services, rate limiters, session validators, and queue engines execute **synchronously** in sub-millisecond time (<0.2ms). Migrating to MongoDB requires an asynchronous driver (`mongodb` or `mongoose`), necessitating a complete rewrite of database query signatures across **18+ backend service/middleware files** and all test suites.
> 3. **Latency Degradation:** Local SQLite operates in-memory/in-process (0.05ms – 0.2ms query latency). MongoDB Atlas M0 introduces a cross-network TLS hop (50ms – 250ms per roundtrip). Endpoints executing 3–4 database operations will see response latencies increase from **5ms to 300ms–800ms**.
> 4. **No Automated Backups:** The Atlas M0 Free Tier **does not provide automated backups or point-in-time recovery** (PITR), rendering StreamVault's current atomic SQLite hot-backup engine (`VACUUM INTO` + `PRAGMA integrity_check`) obsolete without an equivalent cloud backup substitute.

If multi-node horizontal scaling is mandated in the future, a managed relational database (such as PostgreSQL) or a **Paid MongoDB Tier (M10+ with minimum 10 GB storage and automated snapshots)** should be considered. For single-instance or containerized production deployment, the current SQLite WAL implementation is faster, more reliable, immune to network partition, and storage-sustainable.

---

## 2. Current SQLite Database Architecture & Inventory

The StreamVault SQLite database is located at `server/data/streamvault.db` and operates under:
- `PRAGMA journal_mode = WAL;` (Write-Ahead Logging allowing concurrent reads during writes)
- `PRAGMA foreign_keys = ON;` (Strict referential integrity enforcement)
- `PRAGMA synchronous = NORMAL;` (High durability with optimal I/O throughput)

### Comprehensive Table Inventory (19 SQLite Tables Discovered)

| # | Table Name | Purpose | Columns | Primary Key | Foreign Keys | Unique Constraints | Indexes | Sensitive Data |
|---|---|---|:---:|---|---|---|---|:---:|
| **1** | `users` | User accounts, credentials, subscription plan, status | 14 | `id` (TEXT, custom UUID) | `referred_by -> users(id)` | `email`, `referral_code` | `idx_users_email`, `idx_users_role` | **YES** (password_hash, salt, 2FA) |
| **2** | `sessions` | Active user login sessions with token hashes | 8 | `id` (TEXT, `sess_...`) | `user_id -> users(id)` (CASCADE) | `token_hash` | `idx_sessions_token`, `idx_sessions_user` | **YES** (token_hash, IP) |
| **3** | `login_history` | Audit log of login attempts for security & lockout | 7 | `id` (INT AUTOINCREMENT) | `user_id -> users(id)` (SET NULL) | None | `idx_login_history_email` | **YES** (IP, email) |
| **4** | `password_resets` | One-time password reset tokens | 6 | `id` (INT AUTOINCREMENT) | `user_id -> users(id)` (CASCADE) | `token_hash` | Auto index on `token_hash` | **YES** (token_hash) |
| **5** | `download_jobs` | Background queue jobs with priority & retries | 22 | `id` (TEXT, `job_...`) | `user_id -> users(id)` (SET NULL) | None | `idx_jobs_status_priority`, `idx_jobs_user`, `idx_jobs_url` | No |
| **6** | `download_history` | Completed download records for user dashboard | 12 | `id` (INT AUTOINCREMENT) | `user_id -> users(id)` (CASCADE) | None | `idx_history_user` | Privacy-sensitive |
| **7** | `favorites` | Bookmarked URLs and user collections | 8 | `id` (INT AUTOINCREMENT) | `user_id -> users(id)` (CASCADE) | `(user_id, url)` | `idx_favorites_user` | User data |
| **8** | `notifications` | In-app user notifications (billing, jobs, alerts) | 7 | `id` (INT AUTOINCREMENT) | `user_id -> users(id)` (CASCADE) | None | `idx_notifications_user` | No |
| **9** | `user_activity` | User action audit log for compliance & debugging | 7 | `id` (INT AUTOINCREMENT) | `user_id -> users(id)` (CASCADE) | None | `idx_activity_user` | **YES** (IP address) |
| **10** | `api_keys` | Developer API keys with hashed secrets & quotas | 13 | `id` (TEXT, `key_...`) | `user_id -> users(id)` (CASCADE) | `key_hash` | `idx_api_keys_hash` | **YES** (key_hash) |
| **11** | `api_logs` | Granular Developer API request logs & response times | 10 | `id` (INT AUTOINCREMENT) | `api_key_id -> api_keys(id)` (CASCADE) | None | `idx_api_logs_user`, `idx_api_logs_key` | **YES** (IP address) |
| **12** | `webhooks` | Webhook endpoints and HMAC-SHA256 secrets | 9 | `id` (TEXT, `wh_...`) | `user_id -> users(id)` (CASCADE) | None | `idx_webhooks_user` | **YES** (secret) |
| **13** | `webhook_deliveries` | Webhook HTTP delivery attempts & responses | 13 | `id` (TEXT, `whd_...`) | `webhook_id -> webhooks(id)`, `user_id -> users(id)` | None | `idx_webhook_deliveries_user`, `idx_webhook_deliveries_webhook` | Payload data |
| **14** | `system_settings` | Global key-value operational configuration | 3 | `key` (TEXT) | None | `key` | Primary key index | No |
| **15** | `admin_audit_logs` | Admin action audit trail (payment approvals, updates) | 8 | `id` (INT AUTOINCREMENT) | `admin_id -> users(id)` (SET NULL) | None | None | **YES** (Admin IP) |
| **16** | `subscription_plans` | Pricing tiers, quotas, RPM, and feature lists | 14 | `id` (TEXT, `plan_...`) | None | `slug` | `idx_plans_slug` | No |
| **17** | `payment_methods` | Mobile wallet configurations (bKash, Nagad, Rocket) | 9 | `id` (TEXT, `pm_...`) | None | `identifier` | `idx_payment_methods_identifier` | Wallet numbers |
| **18** | `payment_transactions` | Manual payment verification records & TrxIDs | 17 | `id` (TEXT, `tx_...`) | `user_id -> users(id)`, `plan_id`, `pm_id`, `verified_by` | `transaction_id` | `idx_transactions_user`, `idx_transactions_trxid`, `idx_transactions_status` | **YES** (Sender phone, TrxID) |
| **19** | `subscriptions` | Active & historical subscription validity records | 11 | `id` (TEXT, `sub_...`) | `user_id -> users(id)`, `plan_id` | None | `idx_subscriptions_user` | No |

---

## 3. SQLite-to-MongoDB Compatibility & Data Modeling

Blindly converting all 19 SQLite tables into 19 individual MongoDB collections is an anti-pattern. A document database requires an intentional hybrid of **embedding** and **referencing**.

### Collection Mapping & Modeling Strategy

| Existing SQLite Table | Proposed MongoDB Collection | Modeling Strategy | Proposed Document Schema / Justification | Migration Complexity |
|---|---|---|---|:---:|
| `users` | `users` | Root Document | Contains user profile, authentication hashes (`password_hash`, `salt`), subscription status, embedded `settings`, and optional embedded `active_sessions`. | **Medium** |
| `sessions` | `sessions` (or embedded) | Separate Collection with TTL | Kept as a separate collection to prevent user document bloat and enable native MongoDB **TTL Indexes** (`expireAfterSeconds: 0`) for automatic expiration cleanup. | **Low** |
| `login_history` | `login_history` | Separate Collection | High-write append-only log. Requires a compound index on `{ email: 1, created_at: -1 }` for the 15-minute brute-force lockout check. | **Low** |
| `password_resets` | `password_resets` | Separate Collection with TTL | One-time documents with native MongoDB TTL index on `expires_at`. | **Low** |
| `download_jobs` | `download_jobs` | Separate Collection | Highly dynamic queue items with status transitions (`queued` -> `processing` -> `completed`). Indexed on `{ status: 1, priority: -1, created_at: 1 }`. | **High** |
| `download_history` | `download_history` | Separate Collection | User-partitioned download catalog. References `userId`. High volume. | **Medium** |
| `favorites` | `favorites` | Separate Collection | Indexed on `{ userId: 1, url: 1 }` with a unique compound constraint to preserve deduplication. | **Low** |
| `notifications` | `notifications` | Separate Collection | In-app alerts. Separate collection indexed on `{ userId: 1, isRead: 1, createdAt: -1 }`. | **Low** |
| `user_activity` | `user_activity` | Separate Collection | Append-only audit trail. Needs TTL index (e.g. 90 days) to prevent 512 MB overflow. | **Low** |
| `api_keys` | `api_keys` | Separate Collection | References `userId`. Unique index on `key_hash`. Indexed on `key_prefix`. | **Medium** |
| `api_logs` | `api_logs` | Separate Collection (Capped or TTL) | **Dangerous on Free Tier.** Must use a Capped Collection or aggressive 7-day TTL index; otherwise, 512 MB will fill up in weeks. | **Medium** |
| `webhooks` | `webhooks` | Separate Collection | References `userId`. Contains HMAC secret and subscribed event array. | **Low** |
| `webhook_deliveries` | `webhook_deliveries` | Separate Collection (TTL) | High-volume payload storage. Must have TTL pruning. | **Medium** |
| `system_settings` | `system_settings` | Single Document or Collection | Can be stored as a single document with key-value fields. | **Low** |
| `admin_audit_logs` | `admin_audit_logs` | Separate Collection | Admin action history. References `adminId`. | **Low** |
| `subscription_plans` | `subscription_plans` | Separate Collection | Low-volume reference collection (3 documents: free, pro, enterprise). | **Low** |
| `payment_methods` | `payment_methods` | Separate Collection | Reference collection (3–5 documents: bKash, Nagad, Rocket). | **Low** |
| `payment_transactions` | `payment_transactions` | Separate Collection | Highly sensitive financial records. Unique index on `transactionId`. Requires atomic document updates for status transitions. | **High** |
| `subscriptions` | `subscriptions` | Separate Collection | References `userId` and `planId`. Indexed on `{ userId: 1, status: 1, expiresAt: -1 }`. | **Medium** |

### How SQLite Features Map to MongoDB:

```
┌──────────────────────────────────────┬──────────────────────────────────────────────────────┐
│ SQLite WAL Implementation             │ Proposed MongoDB Architecture                        │
├──────────────────────────────────────┼──────────────────────────────────────────────────────┤
│ PRIMARY KEY (TEXT / INTEGER)         │ _id (Preserve custom IDs as String or ObjectId)      │
│ FOREIGN KEY (... REFERENCES ... )    │ Application-level reference / Mongoose populate      │
│ UNIQUE constraints                   │ db.collection.createIndex({ field: 1 }, { unique })  │
│ Atomic conditional UPDATE ... WHERE  │ findOneAndUpdate({ _id, status: 'pending' }, ...)    │
│ Multi-table SQL JOIN queries         │ $lookup Aggregation Pipeline                         │
│ Automatic cascade deletes            │ Mongoose pre('deleteOne') hooks / Manual cascaded del│
│ SQLite WAL Mode in-memory latency    │ TCP Socket over TLS to cloud cluster (Atlas M0)      │
│ VACUUM INTO atomic hot backup        │ mongodump / mongoexport CLI (No Atlas automated PITR)│
│ Synchronous db.prepare().get()       │ Asynchronous await db.collection.findOne()           │
└──────────────────────────────────────┴──────────────────────────────────────────────────────┘
```

---

## 4. Code Changes Required (Detailed File Impact)

Migrating to MongoDB would touch **21 out of 29 files** in `server/src/`, as well as configuration files, environment setups, and test suites.

```
server/
├── src/
│   ├── db/
│   │   ├── index.js          ❌ [COMPLETE REWRITE] Replace node:sqlite with mongoose / mongodb client
│   │   ├── backup.js         ❌ [OBSOLETE / REWRITE] VACUUM INTO is SQLite-only; replace with mongodump
│   │   └── restore.js        ❌ [OBSOLETE / REWRITE] SQLite WAL file copy obsolete; replace with mongorestore
│   ├── middleware/
│   │   ├── apiAuth.js        ⚠️ [MODIFY] Convert synchronous db.prepare() lookups to async/await
│   │   ├── auth.js           ⚠️ [MODIFY] Convert validateSession calls to async/await
│   │   ├── authRateLimiter.js⚠️ [MODIFY] Convert login_history queries to async/await
│   │   └── securityHeaders.js✅ [NO CHANGE]
│   ├── routes/
│   │   ├── adminPaymentRoutes.js  ⚠️ [MODIFY] Convert to async service calls
│   │   ├── adminSystemRoutes.js   ❌ [REWRITE] PRAGMA journal_mode/db size queries obsolete
│   │   ├── apiV1Routes.js         ⚠️ [MODIFY] Direct SQL queries replaced with Mongo queries
│   │   ├── authRoutes.js          ⚠️ [MODIFY] Async auth route handlers
│   │   ├── developerRoutes.js     ⚠️ [MODIFY] Direct SQL logs/stats replaced with Mongo aggregations
│   │   ├── favoriteRoutes.js      ⚠️ [MODIFY] Direct SQL replaced with Mongo collection calls
│   │   ├── historyRoutes.js       ⚠️ [MODIFY] SQL LIKE, filters, and pagination replaced with Mongo queries
│   │   ├── notificationRoutes.js  ⚠️ [MODIFY] Notification updates replaced with Mongo queries
│   │   ├── queueRoutes.js         ⚠️ [MODIFY] Async queue handlers
│   │   ├── subscriptionRoutes.js  ⚠️ [MODIFY] Async subscription handlers
│   │   └── userRoutes.js          ⚠️ [MODIFY] Direct SQL stats replaced with Mongo $facet aggregations
│   ├── services/
│   │   ├── apiKeyService.js       ⚠️ [MODIFY] Replace SQL with Mongo queries
│   │   ├── authService.js         ⚠️ [MODIFY] Rewrite user/session CRUD to async Mongo
│   │   ├── extractor.js           ✅ [NO CHANGE] Media extraction logic is independent
│   │   ├── queueService.js        ❌ [HEAVY REWRITE] Persistent queue loop, stale recovery, and quota checks
│   │   ├── subscriptionService.js ❌ [HEAVY REWRITE] Atomic payment transitions and plan management
│   │   └── webhookService.js      ⚠️ [MODIFY] Delivery logging and webhook lookups
│   ├── utils/
│   │   ├── crypto.js              ✅ [NO CHANGE]
│   │   ├── envValidator.js        ⚠️ [MODIFY] Validate MONGODB_URI instead of SQLite data directory
│   │   ├── logger.js              ✅ [NO CHANGE]
│   │   └── platformDetector.js    ✅ [NO CHANGE]
│   └── server.js                  ⚠️ [MODIFY] Replace initDatabase() with async connectMongo()
└── test-phase[1-5].mjs            ❌ [REWRITE] Tests importing db or issuing direct SQL queries
```

### Frontend Impact:
- **No changes required to frontend React/TypeScript UI.**  
  If the API response JSON contract is preserved exactly (`{ success: true, data: ... }`), the client bundle (`dist/`) will remain 100% compatible.

---

## 5. Data Migration Strategy (SQLite -> MongoDB)

If authorized in the future, the migration of existing data would follow a strict 17-step protocol:

```mermaid
flowchart TD
    A["1. Create SQLite Atomic Safety Backup (VACUUM INTO)"] --> B["2. Put Application in Maintenance Mode"]
    B --> C["3. Export SQLite Tables to JSON/NDJSON"]
    C --> D["4. Data Transformation Pipeline"]
    subgraph Transform["Transformation Logic"]
        D1["Map custom id to _id (Preserve user_123, job_456)"]
        D2["Convert 0/1 integers to native boolean true/false"]
        D3["Convert ISO-8601 strings to native BSON Date objects"]
        D4["Parse JSON feature arrays and details strings"]
    end
    D --> Transform
    Transform --> E["5. Insert Transformed Documents into MongoDB Atlas"]
    E --> F["6. Build Indexes & Unique Constraints on Atlas"]
    F --> G["7. Automated Cross-Verification (Row Counts & Checksums)"]
    G --> H{"Integrity Verified?"}
    H -- Yes --> I["8. Switch Connection URI & Bring Online"]
    H -- No --> J["9. Rollback to SQLite Instantly"]
```

### Key ID Preservation Decision:
- **Existing User IDs and Entity IDs MUST be preserved as strings in `_id`.**  
  Because StreamVault already uses custom UUID strings (e.g., `user_d2a849bb...`, `job_8b201...`, `key_...`), setting `_id: record.id` in MongoDB ensures:
  - Existing session tokens remain valid without forcing users to log in again.
  - Existing hashed API keys (`sk_live_...`) remain linked to the exact same user.
  - Download history, favorites, and subscriptions retain their foreign references with zero orphan records.

---

## 6. MongoDB Atlas M0 Free Tier (512 MB) Assessment

The free tier is heavily constrained by strict hardware and operational quotas:

```
┌─────────────────────────────────┬────────────────────────────────────────────────────────┐
│ Metric / Constraint             │ MongoDB Atlas M0 Free Tier Specification               │
├─────────────────────────────────┼────────────────────────────────────────────────────────┤
│ Total Storage Space             │ 512 MB (Data files + Index storage COMBINED)           │
│ Shared RAM / CPU                │ Shared vCPU, ~512 MB shared RAM                        │
│ Max Concurrent Connections      │ 500 total across all clients                           │
│ Network / IOPS Throughput       │ Throttled burst limit (100 IOPS max)                   │
│ Automated Backups               │ NONE (Snapshot/Cloud backup disabled on free tier)     │
│ Network Security                │ Public IP access list only (No VPC Peering)            │
│ Regional Latency                │ 50ms – 250ms per roundtrip (Cloud network hop)         │
└─────────────────────────────────┴────────────────────────────────────────────────────────┘
```

### Storage Consumption Projections (512 MB Limit)

In MongoDB, document storage is significantly larger than in SQLite because **field names are repeated inside every single BSON record**:

| Data Type / Collection | Average Record Size (BSON + Index) | Projected Rate | 30-Day Storage | 90-Day Storage |
|---|:---:|:---:|:---:|:---:|
| `users`, `sessions`, `plans` | ~1.2 KB | 500 users | ~0.6 MB | ~1.5 MB |
| `download_history` | ~850 bytes | 200 downloads/day | 5.1 MB | 15.3 MB |
| `download_jobs` (active/done) | ~1.8 KB | 250 jobs/day | 13.5 MB | 40.5 MB |
| `api_logs` (Phase 3 Developer API) | ~650 bytes | 5,000 req/day | **97.5 MB** | **292.5 MB** |
| `webhook_deliveries` | ~2.0 KB | 500 deliveries/day | **30.0 MB** | **90.0 MB** |
| `login_history` & `user_activity`| ~600 bytes | 1,000 actions/day | **18.0 MB** | **54.0 MB** |
| **Combined Secondary Indexes** | ~20% of data volume | Cumulative | **33.0 MB** | **98.8 MB** |
| **Total Projected Storage** | — | — | **~197.7 MB** | **~592.6 MB (EXCEEDS 512 MB)** |

### Critical Finding:
Under normal usage with a single active developer utilizing the Developer API and 200 daily video downloads, **MongoDB Atlas Free Tier will exceed its 512 MB storage limit in approximately 75 to 90 days**. Once 512 MB is breached, Atlas puts the cluster into **read-only mode**, crashing the queue engine, authentication, and payment verification.

---

## 7. Performance & Reliability Comparison

| Category | Current SQLite (Node 24 WAL) | MongoDB Atlas Free (M0) | Impact & Risk Analysis |
|---|---|---|---|
| **Hosting Location** | In-Process / Local Disk | Cloud Hosted (AWS/GCP/Azure) | Network hop adds 50ms–250ms latency per query. |
| **Execution Model** | **Synchronous** (<0.2ms) | **Asynchronous** (Promise/Network) | Complete rewrite of backend service signatures required. |
| **Query Latency** | **0.05ms – 0.5ms** | **50ms – 250ms** | 100x – 500x latency increase on database calls. |
| **Storage Capacity** | Local Disk (e.g. 100 GB+) | **512 MB Hard Ceiling** | Risk of cluster lockdown upon exceeding 512 MB. |
| **Automated Backups** | Atomic `VACUUM INTO` + integrity check | **None on M0** | Backups become manual CLI scripts (`mongodump`). |
| **Queue Operations** | Fast local lock-free WAL queue loop | High latency; IOPS burst throttled | Background queue processing throughput degrades. |
| **Payment Approval** | Instant atomic conditional updates | Atomic via `findOneAndUpdate` | Equal reliability, but higher latency. |
| **Connection Limits** | Unlimited in-process connections | Capped at 500 shared connections | Connection pooling required to avoid leaks. |
| **Horizontal Scaling**| Single host only (unless Litestream) | Multi-instance application ready | MongoDB allows multiple servers sharing one DB. |

---

## 8. Security Impact Analysis

1. **Connection String Exposure:** SQLite uses a local file path (`server/data/streamvault.db`). MongoDB requires exposing a cloud connection URI (`mongodb+srv://user:pass@cluster.mongodb.net/streamvault`). If leaked, the database is exposed over the public internet unless strictly restricted by Atlas IP Access Lists.
2. **Network Attack Surface:** On Atlas M0, private VPC peering is unavailable. Connection traffic must traverse the public internet over TLS with IP whitelisting.
3. **NoSQL Injection:** Replacing parameterized SQL statements (`db.prepare('... ?')`) with MongoDB query objects introduces NoSQL object injection vulnerabilities (e.g., `{ email: { $ne: null } }`). Sanitization middleware (such as `mongo-sanitize`) would be mandatory.
4. **Secret Storage:** Sensitive fields (`password_hash`, `salt`, `key_hash`, `webhook_secret`) would remain hashed using `scrypt` and `sha256` as currently implemented in `server/src/utils/crypto.js`.

---

## 9. Backup & Recovery Changes

| Feature | Current Phase 5 SQLite System | Proposed MongoDB Atlas Free System |
|---|---|---|
| **Backup Mechanism** | `VACUUM INTO 'streamvault-backup-DATE.sqlite'` | External `mongodump --uri="..." --archive=...` |
| **Integrity Verification**| `PRAGMA integrity_check` returning `'ok'` | BSON metadata validation during restore |
| **Execution Point** | Local backend server | Requires local install of `mongodump` binaries |
| **Admin API Trigger** | `POST /api/admin/system/backup` | Obsolete or must spawn shell `mongodump` child process |
| **Restoration** | `server/src/db/restore.js` (Instant atomic copy) | `mongorestore` tool (Requires dropping/re-indexing) |
| **Automated Snapshots**| Supported via OS task scheduler / node timer | **Unsupported on Atlas M0** (Paid M10+ required) |

---

## 10. Testing & Regression Risks

Migrating the persistence layer poses significant regression risks across all 5 previously verified phases:

1. **Queue Race Conditions:** The download queue engine relies on synchronous state transitions. Under async MongoDB, two worker ticks could fetch the same job simultaneously without atomic locks (`findOneAndUpdate`).
2. **Quota Enforcement Bypasses:** `checkUserDownloadQuota` queries multiple collections. Network latency in quota checks could permit burst submissions that bypass daily limits.
3. **Authentication Delays:** Password verification and session retrieval would experience a noticeable 150ms delay per request compared to instant SQLite retrieval.
4. **Test Suite Invalidation:** All 117 automated tests in `test-phase1.mjs` through `test-phase5.mjs` would fail immediately because direct SQL assertions (`db.prepare(...)`) would throw errors.

---

## 11. Migration Complexity & Work Breakdown

| Metric | Estimate |
|---|:---:|
| **Files to Modify** | **21 files** |
| **Files to Completely Rewrite** | **5 files** (`db/index.js`, `backup.js`, `restore.js`, `adminSystemRoutes.js`, `queueService.js`) |
| **New Files Required** | **8 files** (Mongoose Models or Schema Validators + Migration Scripts) |
| **Test Files to Rewrite** | **5 test files** (117 test cases to re-verify) |
| **Estimated Implementation Effort** | **4 to 6 focused engineering days** |
| **Overall Complexity** | **HIGH** |
| **Risk of Production Downtime** | **HIGH (if attempting on Free Tier)** |

---

## 12. Recommended Production Architecture (If Cloud DB Mandated)

If the platform must move to an external cloud database to enable multi-server deployment (e.g., frontend on Vercel/Cloudflare and backend on Railway/Render):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Recommended Cloud Setup                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Database: MongoDB Atlas M10+ (Paid) OR Managed PostgreSQL (Supabase)│
│    - Storage: Minimum 10 GB auto-scaling SSD                           │
│    - Automated Backups: Daily continuous snapshots enabled             │
│    - Retention: 7-day automated point-in-time recovery                 │
│                                                                        │
│ 2. Connection Strategy:                                                │
│    - Node.js connection pooling: maxPoolSize: 20, minPoolSize: 5       │
│    - Aggressive TTL Indexes on api_logs (7 days) and user_activity     │
│                                                                        │
│ 3. Hosting:                                                            │
│    - Backend: Containerized Node.js (Docker on Render/Railway/Fly.io)  │
│    - Frontend: Static Vite build deployed on Cloudflare Pages / Vercel │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Direct Answers to Specified Questions

#### 1. Is MongoDB Atlas Free suitable for StreamVault?
**No.** The 512 MB hard ceiling will be exhausted rapidly by request logs, audit trails, and download history. Furthermore, it lacks automated backups and throttles IOPS.

#### 2. Is migration worth doing?
**No, not at this stage.** The current SQLite WAL setup is faster, self-contained, stable, has zero network latency, and includes a verified atomic backup system.

#### 3. What are the biggest benefits?
The only tangible benefit of MongoDB would be enabling multi-instance horizontal scaling (running multiple backend instances behind a load balancer sharing a single database).

#### 4. What are the biggest risks?
Storage exhaustion (cluster enters read-only mode), network latency spikes (300ms+ per API call), loss of automated backups, and regression bugs resulting from converting synchronous code to asynchronous.

#### 5. What features might break?
The persistent queue engine, stale job recovery on startup, rate limiters, admin diagnostics, and atomic SQLite hot-backups.

#### 6. Can the migration be completed without losing existing data?
**Yes.** Custom IDs (`user_...`, `job_...`, `key_...`) can be preserved directly as string `_id` values in MongoDB.

#### 7. Can the current frontend remain unchanged?
**Yes.** As long as the backend REST API response structures remain identical, the React/TypeScript frontend requires zero modifications.

#### 8. Can we preserve all existing functionality?
**Yes**, but only after completely rewriting database service layers, query logic, and backup systems.

#### 9. Is 512 MB sufficient for the expected initial usage?
It is sufficient for approximately **30 to 60 days of low-traffic testing**, but **insufficient for production usage** once Developer API logs and download history accumulate.

#### 10. Should we migrate now or keep SQLite?
**Keep SQLite.** StreamVault's current SQLite WAL engine is production-ready, highly optimized, and has 117 passing automated tests.

---

## 14. Final Recommendation

# ⛔ Final Verdict: NOT RECOMMENDED (For Atlas Free 512 MB)

**Reasoning:**  
StreamVault does not currently suffer from database bottlenecks. Moving to MongoDB Atlas Free Tier would exchange a fast (<0.2ms), durable, zero-cost, in-process database with hot-backups for an external, network-latent, throttled cloud database with a rigid 512 MB limit and no automated backup protection.

**Recommended Action:**  
Retain the current SQLite WAL implementation for Phase 6. Only consider migrating if:
1. Horizontal multi-server backend scaling is strictly required.
2. Budget is allocated for a paid database tier (MongoDB Atlas M10+ or Managed PostgreSQL) with automated backups and at least 10 GB of storage.
