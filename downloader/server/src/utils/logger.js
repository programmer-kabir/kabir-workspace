/**
 * StreamVault Structured Production Logger
 */

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'key_hash', 'salt', 'pin', 'otp', 'apiKey'];

function sanitize(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitize);

  const clean = {};
  for (const [k, v] of Object.entries(data)) {
    if (SENSITIVE_KEYS.some(sk => k.toLowerCase().includes(sk.toLowerCase()))) {
      clean[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      clean[k] = sanitize(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

export const logger = {
  info: (msg, meta) => {
    const metaStr = meta ? ` | ${JSON.stringify(sanitize(meta))}` : '';
    console.log(`[INFO]  ${new Date().toISOString()} - ${msg}${metaStr}`);
  },

  warn: (msg, meta) => {
    const metaStr = meta ? ` | ${JSON.stringify(sanitize(meta))}` : '';
    console.warn(`[WARN]  ${new Date().toISOString()} - ${msg}${metaStr}`);
  },

  error: (msg, error, meta) => {
    const errDetails = error instanceof Error ? `${error.message}${error.stack ? `\n${error.stack}` : ''}` : String(error || '');
    const metaStr = meta ? ` | Meta: ${JSON.stringify(sanitize(meta))}` : '';
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}: ${errDetails}${metaStr}`);
  },

  audit: (action, actor, details) => {
    console.log(`[AUDIT] ${new Date().toISOString()} - Action: ${action} | Actor: ${actor} | Details: ${JSON.stringify(sanitize(details))}`);
  },

  security: (event, ip, details) => {
    console.warn(`[SEC]   ${new Date().toISOString()} - Event: ${event} | IP: ${ip || 'unknown'} | Details: ${JSON.stringify(sanitize(details))}`);
  }
};

export default logger;
