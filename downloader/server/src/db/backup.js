import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import db, { DB_PATH } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_BACKUP_DIR = path.resolve(__dirname, '../../backups');

/**
 * Creates an atomic, verified SQLite backup using VACUUM INTO
 */
export function createDatabaseBackup(customBackupDir = null) {
  const targetDir = customBackupDir ? path.resolve(customBackupDir) : DEFAULT_BACKUP_DIR;

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `streamvault-backup-${timestamp}.sqlite`;
  const backupFilePath = path.join(targetDir, backupFileName);

  // Normalize path for SQLite on Windows
  const normalizedPath = backupFilePath.replace(/\\/g, '/');

  try {
    // 1. Atomic VACUUM INTO creates a consistent standalone copy while in WAL mode
    db.exec(`VACUUM INTO '${normalizedPath}'`);

    // 2. Verify backup file exists and has content
    const stats = fs.statSync(backupFilePath);
    if (stats.size === 0) {
      throw new Error('Backup file was created but is empty (0 bytes).');
    }

    // 3. Verify backup database integrity
    const backupDb = new DatabaseSync(backupFilePath);
    const integrityRow = backupDb.prepare('PRAGMA integrity_check').get();
    backupDb.close();

    const integrityResult = integrityRow ? Object.values(integrityRow)[0] : 'unknown';
    if (integrityResult !== 'ok') {
      throw new Error(`Backup integrity check failed: ${integrityResult}`);
    }

    return {
      success: true,
      filename: backupFileName,
      path: backupFilePath,
      sizeBytes: stats.size,
      sizeHuman: `${(stats.size / 1024).toFixed(1)} KB`,
      integrity: integrityResult,
      createdAt: new Date().toISOString()
    };
  } catch (err) {
    // Clean up corrupted file if failed
    if (fs.existsSync(backupFilePath)) {
      try { fs.unlinkSync(backupFilePath); } catch {}
    }
    throw new Error(`Database backup failed: ${err.message}`);
  }
}

/**
 * List all available backups
 */
export function listDatabaseBackups(customBackupDir = null) {
  const targetDir = customBackupDir ? path.resolve(customBackupDir) : DEFAULT_BACKUP_DIR;

  if (!fs.existsSync(targetDir)) {
    return [];
  }

  const files = fs.readdirSync(targetDir)
    .filter(f => f.startsWith('streamvault-backup-') && f.endsWith('.sqlite'))
    .sort()
    .reverse();

  return files.map(file => {
    const fullPath = path.join(targetDir, file);
    const stat = fs.statSync(fullPath);
    return {
      filename: file,
      path: fullPath,
      sizeBytes: stat.size,
      sizeHuman: `${(stat.size / 1024).toFixed(1)} KB`,
      createdAt: stat.birthtime.toISOString()
    };
  });
}

/**
 * Verify an existing backup file
 */
export function verifyDatabaseBackup(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file does not exist: ${filePath}`);
  }

  const backupDb = new DatabaseSync(filePath);
  const integrityRow = backupDb.prepare('PRAGMA integrity_check').get();
  const tablesRow = backupDb.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get();
  backupDb.close();

  const integrityResult = integrityRow ? Object.values(integrityRow)[0] : 'unknown';

  return {
    valid: integrityResult === 'ok',
    integrity: integrityResult,
    tablesCount: tablesRow ? tablesRow.count : 0
  };
}
