<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Database;
use App\Core\Response;

/**
 * Atomically enforces email verification and plan-specific daily search/prompt quotas in MySQL usage_logs.
 */
final class QuotaMiddleware
{
    public function __construct(private readonly Database $database)
    {
    }

    /**
     * Enforce email verification & consume 1 quota unit atomically using FOR UPDATE locking.
     * Eliminates TasTracker's inconsistent quota bug where /usage/check returned 403 while /search returned 200.
     *
     * @param array<string, mixed> $user
     * @return array{searchesToday: int, promptsToday: int, dailyLimit: int}
     */
    public function enforceAndConsume(array $user, string $kind = 'search'): array
    {
        if (empty($user['emailVerified'])) {
            Response::error(
                'Please verify your email address before running searches or AI tools.',
                403,
                'EMAIL_NOT_VERIFIED'
            );
        }

        $userId = (int) $user['id'];
        $limit = (int) ($user['dailySearchesLimit'] ?? 2);
        $dateKey = gmdate('Y-m-d');
        $pdo = $this->database->connection();

        $pdo->beginTransaction();
        try {
            $ensure = $pdo->prepare(
                'INSERT IGNORE INTO usage_logs (user_id, date_key, search_count, prompt_count)
                 VALUES (:user_id, :date_key, 0, 0)'
            );
            $ensure->execute(['user_id' => $userId, 'date_key' => $dateKey]);

            $lock = $pdo->prepare(
                'SELECT search_count, prompt_count FROM usage_logs
                 WHERE user_id = :user_id AND date_key = :date_key FOR UPDATE'
            );
            $lock->execute(['user_id' => $userId, 'date_key' => $dateKey]);
            $row = $lock->fetch();

            $currentSearches = (int) ($row['search_count'] ?? 0);
            $currentPrompts = (int) ($row['prompt_count'] ?? 0);
            $combinedUsage = $currentSearches + $currentPrompts;

            if ($limit > 0 && $combinedUsage >= $limit) {
                $pdo->rollBack();
                Response::error(
                    "Daily limit reached ({$combinedUsage}/{$limit} requests today). Upgrade your plan to unlock more.",
                    429,
                    'QUOTA_EXCEEDED',
                    [
                        'searchesToday' => $combinedUsage,
                        'dailyLimit' => $limit,
                        'planTier' => $user['planTier'],
                    ]
                );
            }

            $column = $kind === 'prompt' ? 'prompt_count' : 'search_count';
            $upd = $pdo->prepare(
                "UPDATE usage_logs SET {$column} = {$column} + 1
                 WHERE user_id = :user_id AND date_key = :date_key"
            );
            $upd->execute(['user_id' => $userId, 'date_key' => $dateKey]);
            $pdo->commit();

            return [
                'searchesToday' => $currentSearches + ($kind === 'prompt' ? 0 : 1),
                'promptsToday' => $currentPrompts + ($kind === 'prompt' ? 1 : 0),
                'dailyLimit' => $limit,
            ];
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Read current daily usage snapshot without mutating counters.
     *
     * @return array{searchesToday: int, promptsToday: int}
     */
    public function inspectToday(int $userId): array
    {
        $stmt = $this->database->connection()->prepare(
            'SELECT search_count, prompt_count FROM usage_logs WHERE user_id = :user_id AND date_key = :date_key LIMIT 1'
        );
        $stmt->execute(['user_id' => $userId, 'date_key' => gmdate('Y-m-d')]);
        $row = $stmt->fetch();

        return [
            'searchesToday' => (int) ($row['search_count'] ?? 0),
            'promptsToday' => (int) ($row['prompt_count'] ?? 0),
        ];
    }
}
