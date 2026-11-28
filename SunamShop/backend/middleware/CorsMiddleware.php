<?php
declare(strict_types=1);

namespace SunamShop\Middleware;

use SunamShop\Core\Request;

final class CorsMiddleware
{
    public static function handle(Request $request): void
    {
        if (headers_sent()) {
            return;
        }

        $config = require __DIR__ . '/../config/app.php';
        $allowedOrigins = $config['cors']['allowed_origins'];
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if (in_array($origin, $allowedOrigins, true) || $config['env'] === 'development') {
            header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
        }

        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Idempotency-Key, Accept-Language');
        header('Access-Control-Max-Age: 86400');
    }
}
