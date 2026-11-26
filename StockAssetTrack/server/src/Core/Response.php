<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Standardized JSON and CORS HTTP response emitter.
 */
final class Response
{
    /**
     * Apply CORS headers when the request Origin matches the configured allowlist.
     *
     * @param string[] $allowedOrigins
     */
    public static function applyCors(Request $request, array $allowedOrigins): void
    {
        $origin = $request->header('origin');
        if ($origin !== '' && (in_array($origin, $allowedOrigins, true) || in_array('*', $allowedOrigins, true))) {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Vary: Origin');
        }

        header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Device-Token, X-Turnstile-Token, X-CSR-Token, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');
    }

    /**
     * Emit a JSON response and terminate request execution cleanly.
     *
     * @param array<string, mixed> $payload
     */
    public static function json(array $payload, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Emit a structured JSON error response.
     *
     * @param array<string, mixed> $details
     */
    public static function error(string $message, int $status = 400, string $code = 'BAD_REQUEST', array $details = []): never
    {
        $body = [
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
        ];

        if ($details !== []) {
            $body['error']['details'] = $details;
        }

        self::json($body, $status);
    }
}
