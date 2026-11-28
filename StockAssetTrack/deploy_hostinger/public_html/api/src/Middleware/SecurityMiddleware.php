<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Services\AuthService;

/**
 * Enforces MySQL sliding/window rate limits, Turnstile challenge checks, and CSR token verification.
 */
final class SecurityMiddleware
{
    public function __construct(
        private readonly Database $database,
        private readonly AuthService $authService,
        private readonly string $turnstileSecretKey
    ) {
    }

    /**
     * Atomically enforce MySQL-backed IP rate limits against rate_limits table.
     */
    public function enforceRateLimit(Request $request, string $scope, int $maxHits = 60, int $windowSeconds = 60): void
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $bucketKey = hash('sha256', $scope . '|' . $ip);

        try {
            $pdo = $this->database->connection();
            $pdo->beginTransaction();

            $sel = $pdo->prepare('SELECT hits, reset_at FROM rate_limits WHERE bucket_key = :key FOR UPDATE');
            $sel->execute(['key' => $bucketKey]);
            $row = $sel->fetch();

            $now = time();
            $resetTs = $row ? strtotime((string) $row['reset_at'] . ' UTC') : false;

            if (!$row || $resetTs === false || $resetTs <= $now) {
                $upsert = $pdo->prepare(
                    'INSERT INTO rate_limits (bucket_key, hits, reset_at)
                     VALUES (:key, 1, DATE_ADD(UTC_TIMESTAMP(), INTERVAL :win SECOND))
                     ON DUPLICATE KEY UPDATE hits = 1, reset_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL :win2 SECOND)'
                );
                $upsert->execute(['key' => $bucketKey, 'win' => $windowSeconds, 'win2' => $windowSeconds]);
                $pdo->commit();
                return;
            }

            if ((int) $row['hits'] >= $maxHits) {
                $pdo->rollBack();
                Response::error('Too many requests. Please slow down briefly.', 429, 'RATE_LIMITED', [
                    'retryAfterSeconds' => max(1, $resetTs - $now),
                ]);
            }

            $upd = $pdo->prepare('UPDATE rate_limits SET hits = hits + 1 WHERE bucket_key = :key');
            $upd->execute(['key' => $bucketKey]);
            $pdo->commit();
        } catch (\Throwable) {
            if (isset($pdo) && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            // Fail open gracefully if rate_limits table is temporarily unavailable in dev
        }
    }

    /**
     * Validate Cloudflare Turnstile response token when TURNSTILE_SECRET_KEY is configured.
     */
    public function enforceTurnstileIfConfigured(Request $request): void
    {
        $secret = trim($this->turnstileSecretKey);
        if ($secret === '') {
            return;
        }

        $token = trim($request->header('x-turnstile-token'));
        if ($token === '') {
            Response::error('Security verification challenge is required.', 403, 'TURNSTILE_REQUIRED');
        }

        $ch = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
        if ($ch === false) {
            Response::error('Security verification service unavailable.', 503, 'TURNSTILE_UNAVAILABLE');
        }

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_POSTFIELDS => http_build_query([
                'secret' => $secret,
                'response' => $token,
                'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
            ]),
        ]);

        $raw = curl_exec($ch);
        curl_close($ch);
        $decoded = is_string($raw) ? json_decode($raw, true) : null;

        if (!is_array($decoded) || empty($decoded['success'])) {
            Response::error('Security check failed. Please retry Turnstile verification.', 403, 'TURNSTILE_FAILED');
        }
    }

    /**
     * Validate optional X-CSR-Token signature when present.
     */
    public function verifyOptionalCsrHeader(Request $request): void
    {
        $token = trim($request->header('x-csr-token'));
        if ($token !== '' && !$this->authService->verifyCsrToken($token)) {
            Response::error('Session request signature expired. Please refresh CSR token.', 403, 'INVALID_CSR_TOKEN');
        }
    }
}
