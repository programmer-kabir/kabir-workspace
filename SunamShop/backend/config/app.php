<?php
declare(strict_types=1);

/**
 * SUNAM SHOP — Application Configuration
 */
return [
    'name'        => getenv('APP_NAME') ?: 'Sunam Shop',
    'env'         => getenv('APP_ENV') ?: 'development',
    'debug'       => filter_var(getenv('APP_DEBUG') ?: true, FILTER_VALIDATE_BOOLEAN),
    'url'         => getenv('APP_URL') ?: 'http://localhost:8000',
    'cors'        => [
        'allowed_origins' => explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001'),
        'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key', 'Accept-Language'],
        'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        'allow_credentials' => true,
    ],
    'jwt'         => [
        'secret'           => getenv('JWT_SECRET') ?: 'sunam_shop_jwt_secret_fallback_key',
        'expiration_hours' => (int)(getenv('JWT_EXPIRATION_HOURS') ?: 72),
        'algorithm'        => 'HS256',
    ],
    'cookie'      => [
        'name'     => getenv('SESSION_COOKIE_NAME') ?: 'sunam_shop_session',
        'lifetime' => 86400 * 7,
        'path'     => '/',
        'secure'   => false, // set true in production with HTTPS
        'httponly' => true,
        'samesite' => 'Lax',
    ],
    'pagination'  => [
        'default_limit' => 20,
        'max_limit'     => 100,
    ],
];
