import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { DB_PATH } from './index.js';
import { verifyDatabaseBackup } from './backup.js';

/**
 * Safe database recovery procedure
 * 1. Verifies candidate backup file integrity
 * 2. Creates emergency safety snapshot of current active DB
 * 3. Copies verified backup over the target DB
 * 4. Removes stale -wal and -shm files
 */
export function restoreDatabase(backupFilePath) {
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not found: ${backupFilePath}`);
  }

  // 1. Verify backup file integrity before touching anything
  const verification = verifyDatabaseBackup(backupFilePath);
  if (!verification.valid) {
    throw new Error(`Cannot restore: Backup integrity check failed (${verification.integrity}).`);
  }

  // 2. Safety snapshot of current database
  if (fs.existsSync(DB_PATH)) {
    const safetySnapshotPath = `${DB_PATH}.safety-${Date.now()}.bak`;
    fs.copyFileSync(DB_PATH, safetySnapshotPath);
    console.log(`🛡️ Safety snapshot created: ${safetySnapshotPath}`);
  }

  // 3. Remove existing WAL / SHM files to avoid stale journal conflicts
  const walPath = `${DB_PATH}-wal`;
  const shmPath = `${DB_PATH}-shm`;
  if (fs.existsSync(walPath)) {
    try { fs.unlinkSync(walPath); } catch {}
  }
  if (fs.existsSync(shmPath)) {
    try { fs.unlinkSync(shmPath); } catch {}
  }

  // 4. Copy verified backup to active database location
  fs.copyFileSync(backupFilePath, DB_PATH);

  // 5. Verify restored database
  const restoredDb = new DatabaseSync(DB_PATH);
  const integrityRow = restoredDb.prepare('PRAGMA integrity_check').get();
  restoredDb.close();

  const integrityResult = integrityRow ? Object.values(integrityRow)[0] : 'unknown';
  if (integrityResult !== 'ok') {
    throw new Error(`Restored database integrity check failed: ${integrityResult}`);
  }

  return {
    success: true,
    message: 'Database successfully restored from verified backup.',
    sourceBackup: backupFilePath,
    restoredPath: DB_PATH,
    integrity: integrityResult,
    restoredAt: new Date().toISOString()
  };
}

// CLI Execution support: node server/src/db/restore.js <path-to-backup>
if (process.argv[1] && process.argv[1].endsWith('restore.js')) {
  const targetBackup = process.argv[2];
  if (!targetBackup) {
    console.error('Usage: node server/src/db/restore.js <path-to-backup-file>');
    process.exit(1);
  }

  try {
    const res = restoreDatabase(path.resolve(targetBackup));
    console.log('✅', res.message);
    process.exit(0);
  } catch (err) {
    console.error('❌ Restore failed:', err.message);
    process.exit(1);
  }
}
