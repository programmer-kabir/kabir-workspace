<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use PDO;

/**
 * Persists and evaluates competitor contributor watchlists in MySQL/MariaDB.
 */
final class WatchlistService
{
    private const DEFAULT_USER_EMAIL = 'workspace@stockassettrack.local';

    public function __construct(private readonly Database $database)
    {
    }

    /**
     * Return all saved watchlist rows for the active workspace/user.
     *
     * @return array<int, array<string, mixed>>
     */
    public function listRows(?int $userId = null): array
    {
        $resolvedUserId = $this->resolveUserId($userId);
        $stmt = $this->database->connection()->prepare(
            'SELECT creator_id, creator_name, last_total_assets, last_total_downloads, notify_enabled, updated_at
             FROM contributor_watchlists
             WHERE user_id = :user_id
             ORDER BY updated_at DESC'
        );
        $stmt->execute(['user_id' => $resolvedUserId]);

        $rows = [];
        foreach ($stmt->fetchAll() as $row) {
            $rows[] = [
                'creatorId' => (string) $row['creator_id'],
                'creatorName' => (string) $row['creator_name'],
                'lastTotalAssets' => (int) $row['last_total_assets'],
                'lastTotalDownloads' => (int) $row['last_total_downloads'],
                'notifyEnabled' => (bool) $row['notify_enabled'],
                'updatedAt' => (string) $row['updated_at'],
            ];
        }

        return $rows;
    }

    public function upsert(
        string $creatorId,
        string $creatorName,
        int $totalAssets,
        int $totalDownloads,
        bool $notifyEnabled = true,
        ?int $userId = null
    ): void {
        $resolvedUserId = $this->resolveUserId($userId);
        $stmt = $this->database->connection()->prepare(
            'INSERT INTO contributor_watchlists (user_id, creator_id, creator_name, last_total_assets, last_total_downloads, notify_enabled)
             VALUES (:user_id, :creator_id, :creator_name, :assets, :downloads, :notify)
             ON DUPLICATE KEY UPDATE
               creator_name = VALUES(creator_name),
               last_total_assets = VALUES(last_total_assets),
               last_total_downloads = VALUES(last_total_downloads),
               notify_enabled = VALUES(notify_enabled),
               updated_at = CURRENT_TIMESTAMP'
        );

        $stmt->execute([
            'user_id' => $resolvedUserId,
            'creator_id' => $creatorId,
            'creator_name' => mb_substr($creatorName, 0, 191),
            'assets' => max(0, $totalAssets),
            'downloads' => max(0, $totalDownloads),
            'notify' => $notifyEnabled ? 1 : 0,
        ]);
    }

    public function remove(string $creatorId, ?int $userId = null): bool
    {
        $resolvedUserId = $this->resolveUserId($userId);
        $stmt = $this->database->connection()->prepare(
            'DELETE FROM contributor_watchlists WHERE user_id = :user_id AND creator_id = :creator_id'
        );
        $stmt->execute([
            'user_id' => $resolvedUserId,
            'creator_id' => $creatorId,
        ]);

        return $stmt->rowCount() > 0;
    }

    public function isWatched(string $creatorId, ?int $userId = null): bool
    {
        $resolvedUserId = $this->resolveUserId($userId);
        $stmt = $this->database->connection()->prepare(
            'SELECT 1 FROM contributor_watchlists WHERE user_id = :user_id AND creator_id = :creator_id LIMIT 1'
        );
        $stmt->execute([
            'user_id' => $resolvedUserId,
            'creator_id' => $creatorId,
        ]);

        return (bool) $stmt->fetchColumn();
    }

    /**
     * Resolve an authenticated user ID or bootstrap a clean default local workspace user row for pre-auth phases.
     */
    private function resolveUserId(?int $explicitUserId): int
    {
        if ($explicitUserId !== null && $explicitUserId > 0) {
            return $explicitUserId;
        }

        $pdo = $this->database->connection();
        $find = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
        $find->execute(['email' => self::DEFAULT_USER_EMAIL]);
        $existingId = $find->fetchColumn();
        if ($existingId !== false) {
            return (int) $existingId;
        }

        $insert = $pdo->prepare(
            'INSERT INTO users (email, password_hash, display_name, email_verified_at, plan_tier)
             VALUES (:email, :hash, :name, UTC_TIMESTAMP(), :tier)'
        );
        $insert->execute([
            'email' => self::DEFAULT_USER_EMAIL,
            'hash' => password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT),
            'name' => 'Workspace Default',
            'tier' => 'pro',
        ]);

        return (int) $pdo->lastInsertId();
    }
}
