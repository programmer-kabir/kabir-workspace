<?php
declare(strict_types=1);

namespace SunamShop\Middleware;

use SunamShop\Core\Auth;
use SunamShop\Core\Request;
use SunamShop\Core\Response;

final class AuthMiddleware
{
    public static function handle(Request $request): void
    {
        $token = $request->getBearerToken();

        if (!$token) {
            // Also check session cookie if present
            $cookieName = 'sunam_shop_session';
            $token = $_COOKIE[$cookieName] ?? null;
        }

        if (!$token) {
            Response::unauthorized('Authentication token is missing. Please log in.');
            return;
        }

        $payload = Auth::validateJwt($token);
        if (!$payload) {
            Response::unauthorized('Session has expired or token is invalid. Please log in again.');
            return;
        }

        $request->user = $payload;
    }
}
