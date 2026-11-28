<?php
declare(strict_types=1);

namespace SunamShop\Core;

/**
 * Standardized JSON API Response Helper
 */
final class Response
{
    public static bool $hasResponded = false;

    public static function json(
        mixed $data = null,
        string $message = 'Success',
        int $statusCode = 200,
        mixed $errors = null,
        array $meta = []
    ): void {
        self::$hasResponded = true;

        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Content-Type: application/json; charset=utf-8');
        }

        $isSuccess = $statusCode >= 200 && $statusCode < 300;

        $payload = [
            'success'     => $isSuccess,
            'status_code' => $statusCode,
            'message'     => $message,
            'data'        => $data,
            'errors'      => $errors,
            'meta'        => array_merge([
                'timestamp' => date('c'),
                'version'   => 'v1',
            ], $meta)
        ];

        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
        if (!defined('SUNAM_TESTING')) {
            exit;
        }
    }

    public static function success(mixed $data = null, string $message = 'Operation successful.', int $statusCode = 200, array $meta = []): void
    {
        self::json($data, $message, $statusCode, null, $meta);
    }

    public static function error(string $message, int $statusCode = 400, mixed $errors = null): void
    {
        self::json(null, $message, $statusCode, $errors);
    }

    public static function unauthorized(string $message = 'Unauthorized access.'): void
    {
        self::json(null, $message, 401);
    }

    public static function forbidden(string $message = 'Forbidden. Insufficient permissions.'): void
    {
        self::json(null, $message, 403);
    }

    public static function notFound(string $message = 'Requested resource not found.'): void
    {
        self::json(null, $message, 404);
    }
}
