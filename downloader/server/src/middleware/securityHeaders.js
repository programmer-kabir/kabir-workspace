/**
 * Production Security Headers Middleware
 * Implements OWASP recommended defensive HTTP response headers
 */
export function securityHeadersMiddleware(req, res, next) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Protect against clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Control referrer information leakage
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Legacy browser cross-site scripting filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Restrict access to sensitive browser device features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Remove Express fingerprinting header
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * Production-ready CORS validator
 */
export function getCorsOptions() {
  const allowedOriginsStr = process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:5175,http://127.0.0.1:5175';
  const allowedOrigins = allowedOriginsStr
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // In development mode, allow localhost and local LAN IPs
      if (process.env.NODE_ENV !== 'production') {
        if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.startsWith('http://192.168.') || origin.startsWith('http://10.')) {
          return callback(null, true);
        }
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // If wildcards or exact match
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
    maxAge: 86400 // 24 hours pre-flight cache
  };
}
