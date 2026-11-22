import fs from 'fs';
import path from 'path';

/**
 * Validates runtime environment configuration on server boot
 */
export function validateEnvironment() {
  const warnings = [];

  // 1. Port validation
  const port = process.env.PORT || 5000;
  const numPort = parseInt(port, 10);
  if (isNaN(numPort) || numPort < 1 || numPort > 65535) {
    throw new Error(`Invalid PORT specified in environment: ${port}. Must be between 1 and 65535.`);
  }

  // 2. Node Environment
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv !== 'production' && nodeEnv !== 'development' && nodeEnv !== 'test') {
    warnings.push(`Unrecognized NODE_ENV: '${nodeEnv}'. Defaulting behavior to development.`);
  }

  // 3. Storage Directory Write Permission Check
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch (err) {
      throw new Error(`Cannot create data storage directory at ${dataDir}: ${err.message}`);
    }
  }

  // Test write permission
  const testFile = path.join(dataDir, '.write-test');
  try {
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
  } catch (err) {
    throw new Error(`Storage directory is not writable (${dataDir}): ${err.message}`);
  }

  // 4. Client Origin
  if (!process.env.CLIENT_ORIGIN && nodeEnv === 'production') {
    warnings.push('CLIENT_ORIGIN is not defined in production environment. Fallbacks will be applied.');
  }

  // 5. Database Engine Validation
  if (process.env.DB_ENGINE !== undefined) {
    const raw = String(process.env.DB_ENGINE).trim();
    if (raw === '') {
      throw new Error('Invalid DB_ENGINE: DB_ENGINE is explicitly defined but empty. Must be "sqlite" or "mongodb".');
    }
    const normalized = raw.toLowerCase();
    if (normalized !== 'sqlite' && normalized !== 'mongodb') {
      throw new Error(`Invalid DB_ENGINE: "${process.env.DB_ENGINE}". Supported values are "sqlite" or "mongodb".`);
    }
  }

  return {
    port: numPort,
    nodeEnv,
    warnings,
    isProduction: nodeEnv === 'production'
  };
}
