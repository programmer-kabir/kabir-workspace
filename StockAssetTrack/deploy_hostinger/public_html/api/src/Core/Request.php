<?php

declare(strict_types=1);

namespace App\Core;

/**
 * HTTP request wrapper normalizing method, path, headers, query parameters, and JSON payload.
 */
final class Request
{
    /** @var array<string, mixed>|null */
    private ?array $jsonBody = null;

    /**
     * @param array<string, string> $headers
     * @param array<string, mixed>  $query
     */
    public function __construct(
        private readonly string $method,
        private readonly string $path,
        private readonly array $headers,
        private readonly array $query
    ) {
    }

    /**
     * Construct a Request instance from PHP superglobals.
     */
    public static function fromGlobals(): self
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $rawUri = $_SERVER['REQUEST_URI'] ?? '/';
        $rawPath = (string) (parse_url($rawUri, PHP_URL_PATH) ?: '/');

        // Strip script directory when deployed in a subdirectory rather than domain root
        $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
        if ($scriptDir !== '' && $scriptDir !== '/' && str_starts_with($rawPath, $scriptDir)) {
            $rawPath = substr($rawPath, strlen($scriptDir)) ?: '/';
        }

        $normalizedPath = '/' . trim($rawPath, '/');
        if ($normalizedPath !== '/') {
            $normalizedPath = rtrim($normalizedPath, '/');
        }

        return new self($method, $normalizedPath, self::collectHeaders(), $_GET);
    }

    public function method(): string
    {
        return $this->method;
    }

    public function path(): string
    {
        return $this->path;
    }

    public function header(string $name, string $default = ''): string
    {
        $key = strtolower($name);
        return $this->headers[$key] ?? $default;
    }

    public function query(string $key, mixed $default = null): mixed
    {
        return $this->query[$key] ?? $default;
    }

    /**
     * Retrieve a normalized uploaded file descriptor from $_FILES.
     *
     * @return array{name: string, type: string, tmp_name: string, error: int, size: int}|null
     */
    public function file(string $field): ?array
    {
        $entry = $_FILES[$field] ?? null;
        if (!is_array($entry) || is_array($entry['tmp_name'] ?? null)) {
            return null;
        }

        return [
            'name' => (string) ($entry['name'] ?? ''),
            'type' => (string) ($entry['type'] ?? ''),
            'tmp_name' => (string) ($entry['tmp_name'] ?? ''),
            'error' => (int) ($entry['error'] ?? UPLOAD_ERR_NO_FILE),
            'size' => (int) ($entry['size'] ?? 0),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function json(): array
    {
        if ($this->jsonBody !== null) {
            return $this->jsonBody;
        }

        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            $this->jsonBody = [];
            return $this->jsonBody;
        }

        $decoded = json_decode($raw, true);
        $this->jsonBody = is_array($decoded) ? $decoded : [];
        return $this->jsonBody;
    }

    /**
     * @return array<string, string>
     */
    private static function collectHeaders(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (!is_string($value)) {
                continue;
            }
            if (str_starts_with($key, 'HTTP_')) {
                $name = strtolower(str_replace('_', '-', substr($key, 5)));
                $headers[$name] = $value;
            }
        }

        if (isset($_SERVER['CONTENT_TYPE']) && is_string($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = $_SERVER['CONTENT_TYPE'];
        }

        return $headers;
    }
}
