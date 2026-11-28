<?php

declare(strict_types=1);

namespace App\Core;

use Throwable;

/**
 * Two-tier cache combining request-scoped memory with persistent MySQL TTL storage.
 */
final class Cache
{
    /** @var array<string, mixed> */
    private array $memory = [];

    public function __construct(private readonly Database $database)
    {
    }

    public function get(string $key): mixed
    {
        if (array_key_exists($key, $this->memory)) {
            return $this->memory[$key];
        }

        try {
            $stmt = $this->database->connection()->prepare(
                'SELECT payload_json FROM cache_entries WHERE cache_key = :key AND expires_at > UTC_TIMESTAMP() LIMIT 1'
            );
            $stmt->execute(['key' => $this->hashKey($key)]);
            $row = $stmt->fetch();
            if (!$row) {
                return null;
            }

            $decoded = json_decode((string) $row['payload_json'], true);
            $this->memory[$key] = $decoded;
            return $decoded;
        } catch (Throwable) {
            return null;
        }
    }

    public function set(string $key, mixed $value, int $ttlSeconds): void
    {
        $this->memory[$key] = $value;

        try {
            $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if ($encoded === false) {
                return;
            }

            $stmt = $this->database->connection()->prepare(
                'INSERT INTO cache_entries (cache_key, payload_json, expires_at)
                 VALUES (:key, :payload, DATE_ADD(UTC_TIMESTAMP(), INTERVAL :ttl SECOND))
                 ON DUPLICATE KEY UPDATE payload_json = VALUES(payload_json), expires_at = VALUES(expires_at)'
            );
            $stmt->execute([
                'key' => $this->hashKey($key),
                'payload' => $encoded,
                'ttl' => max(1, $ttlSeconds),
            ]);
        } catch (Throwable) {
            // Fall back cleanly to request-scoped memory when DB schema is not yet initialized.
        }
    }

    private function hashKey(string $key): string
    {
        return hash('sha256', $key);
    }
}
