<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\Database;

/**
 * Handles password hashing, signed HMAC bearer/CSR tokens, email verification codes, and device-slot caps (1/1/3/5).
 */
final class AuthService
{
    private const CSR_TTL_SECONDS = 900; // 15 minutes

    /**
     * @param array<string, mixed> $config
     */
    public function __construct(
        private readonly Database $database,
        private readonly array $config
    ) {
    }

    public function secret(): string
    {
        return (string) ($this->config['security']['appSecret'] ?? 'local-dev-secret-change-me');
    }

    public function maxDevicesForPlan(string $planTier): int
    {
        return (int) ($this->config['plans'][$planTier]['maxDevices'] ?? 1);
    }

    public function dailyLimitForPlan(string $planTier): int
    {
        return (int) ($this->config['plans'][$planTier]['dailySearches'] ?? 2);
    }

    /**
     * Register a new user account and generate a verification code (HMAC-derived in stateless fashion).
     *
     * @return array<string, mixed>
     */
    public function registerUser(string $email, string $password, string $displayName, string $planTier = 'free'): array
    {
        $cleanEmail = strtolower(trim($email));
        $cleanName = trim($displayName) ?: explode('@', $cleanEmail)[0];
        $allowedPlans = ['free', 'starter', 'pro', 'annual'];
        $tier = in_array($planTier, $allowedPlans, true) ? $planTier : 'free';

        $pdo = $this->database->connection();
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $cleanEmail]);
        if ($stmt->fetchColumn() !== false) {
            return ['conflict' => true];
        }

        $insert = $pdo->prepare(
            'INSERT INTO users (email, password_hash, display_name, email_verified_at, plan_tier)
             VALUES (:email, :hash, :name, NULL, :tier)'
        );
        $insert->execute([
            'email' => $cleanEmail,
            'hash' => password_hash($password, PASSWORD_DEFAULT),
            'name' => mb_substr($cleanName, 0, 120),
            'tier' => $tier,
        ]);

        $userId = (int) $pdo->lastInsertId();
        $user = $this->findUserById($userId);

        return [
            'conflict' => false,
            'user' => $user,
            'verificationCode' => $this->expectedVerificationCode($userId, $cleanEmail),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function authenticateCredentials(string $email, string $password): ?array
    {
        $stmt = $this->database->connection()->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => strtolower(trim($email))]);
        $row = $stmt->fetch();

        if (!$row || !password_verify($password, (string) $row['password_hash'])) {
            return null;
        }

        return $this->sanitizeUser($row);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findUserById(int $userId): ?array
    {
        $stmt = $this->database->connection()->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $userId]);
        $row = $stmt->fetch();

        return $row ? $this->sanitizeUser($row) : null;
    }

    public function verifyEmailWithCode(int $userId, string $code): bool
    {
        $user = $this->findUserById($userId);
        if ($user === null) {
            return false;
        }
        $expected = $this->expectedVerificationCode($userId, (string) $user['email']);
        if (!hash_equals($expected, trim($code))) {
            return false;
        }

        $stmt = $this->database->connection()->prepare(
            'UPDATE users SET email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP()) WHERE id = :id'
        );
        $stmt->execute(['id' => $userId]);
        return true;
    }

    public function expectedVerificationCode(int $userId, string $email): string
    {
        return strtoupper(substr(hash_hmac('sha256', "verify:{$userId}:" . strtolower($email), $this->secret()), 0, 8));
    }

    /**
     * Issue a signed bearer session token.
     */
    public function issueAuthToken(int $userId): string
    {
        $ttl = (int) ($this->config['security']['tokenTtlSeconds'] ?? 604800);
        return $this->signPayload([
            'sub' => $userId,
            'typ' => 'auth',
            'exp' => time() + $ttl,
        ]);
    }

    public function verifyAuthToken(string $token): ?int
    {
        $payload = $this->verifySignedToken($token, 'auth');
        if ($payload === null || !isset($payload['sub'])) {
            return null;
        }
        return (int) $payload['sub'];
    }

    /**
     * Issue a 15-minute signed CSR token.
     *
     * @return array{token: string, expiresIn: int}
     */
    public function issueCsrToken(string $deviceHint = ''): array
    {
        $token = $this->signPayload([
            'typ' => 'csr',
            'dev' => substr(hash('sha256', $deviceHint), 0, 12),
            'nonce' => bin2hex(random_bytes(8)),
            'exp' => time() + self::CSR_TTL_SECONDS,
        ]);

        return [
            'token' => $token,
            'expiresIn' => self::CSR_TTL_SECONDS * 1000,
        ];
    }

    public function verifyCsrToken(string $token): bool
    {
        return $this->verifySignedToken($token, 'csr') !== null;
    }

    /**
     * Ensure current device is registered or reject with active devices when over plan slot cap.
     *
     * @return array{allowed: bool, devices: array<int, array<string, mixed>>, maxDevices: int}
     */
    public function registerOrCheckDevice(int $userId, string $planTier, string $rawDeviceToken, string $deviceLabel): array
    {
        $maxDevices = $this->maxDevicesForPlan($planTier);
        $tokenHash = $this->hashDeviceToken($rawDeviceToken);
        $pdo = $this->database->connection();

        $devices = $this->listDevices($userId);
        foreach ($devices as $device) {
            if ($device['tokenHash'] === $tokenHash) {
                $upd = $pdo->prepare(
                    'UPDATE user_devices SET last_active_at = UTC_TIMESTAMP(), device_label = :label WHERE id = :id'
                );
                $upd->execute([
                    'label' => mb_substr($deviceLabel ?: 'Browser', 0, 191),
                    'id' => $device['id'],
                ]);
                return ['allowed' => true, 'devices' => $this->listDevices($userId), 'maxDevices' => $maxDevices];
            }
        }

        if (count($devices) >= $maxDevices) {
            return ['allowed' => false, 'devices' => $devices, 'maxDevices' => $maxDevices];
        }

        $ins = $pdo->prepare(
            'INSERT INTO user_devices (user_id, device_token_hash, device_label, last_active_at)
             VALUES (:user_id, :hash, :label, UTC_TIMESTAMP())'
        );
        $ins->execute([
            'user_id' => $userId,
            'hash' => $tokenHash,
            'label' => mb_substr($deviceLabel ?: 'Browser', 0, 191),
        ]);

        return ['allowed' => true, 'devices' => $this->listDevices($userId), 'maxDevices' => $maxDevices];
    }

    public function isDeviceRegistered(int $userId, string $rawDeviceToken): bool
    {
        if (trim($rawDeviceToken) === '') {
            return false;
        }
        $stmt = $this->database->connection()->prepare(
            'SELECT id FROM user_devices WHERE user_id = :user_id AND device_token_hash = :hash LIMIT 1'
        );
        $stmt->execute([
            'user_id' => $userId,
            'hash' => $this->hashDeviceToken($rawDeviceToken),
        ]);

        $deviceId = $stmt->fetchColumn();
        if ($deviceId === false) {
            return false;
        }

        $upd = $this->database->connection()->prepare('UPDATE user_devices SET last_active_at = UTC_TIMESTAMP() WHERE id = :id');
        $upd->execute(['id' => (int) $deviceId]);
        return true;
    }

    public function replaceDevice(int $userId, int $oldDeviceId, string $newRawToken, string $newLabel): bool
    {
        $pdo = $this->database->connection();
        $pdo->beginTransaction();
        try {
            $del = $pdo->prepare('DELETE FROM user_devices WHERE id = :id AND user_id = :user_id');
            $del->execute(['id' => $oldDeviceId, 'user_id' => $userId]);
            if ($del->rowCount() === 0) {
                $pdo->rollBack();
                return false;
            }

            $ins = $pdo->prepare(
                'INSERT INTO user_devices (user_id, device_token_hash, device_label, last_active_at)
                 VALUES (:user_id, :hash, :label, UTC_TIMESTAMP())
                 ON DUPLICATE KEY UPDATE device_label = VALUES(device_label), last_active_at = UTC_TIMESTAMP()'
            );
            $ins->execute([
                'user_id' => $userId,
                'hash' => $this->hashDeviceToken($newRawToken),
                'label' => mb_substr($newLabel ?: 'Replaced Browser', 0, 191),
            ]);
            $pdo->commit();
            return true;
        } catch (\Throwable) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            return false;
        }
    }

    public function revokeDevice(int $userId, int $deviceId): bool
    {
        $stmt = $this->database->connection()->prepare('DELETE FROM user_devices WHERE id = :id AND user_id = :user_id');
        $stmt->execute(['id' => $deviceId, 'user_id' => $userId]);
        return $stmt->rowCount() > 0;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listDevices(int $userId, ?string $currentRawDeviceToken = null): array
    {
        $currentHash = $currentRawDeviceToken !== null && trim($currentRawDeviceToken) !== ''
            ? $this->hashDeviceToken($currentRawDeviceToken)
            : null;

        $stmt = $this->database->connection()->prepare(
            'SELECT id, device_token_hash, device_label, last_active_at, created_at
             FROM user_devices
             WHERE user_id = :user_id
             ORDER BY last_active_at DESC'
        );
        $stmt->execute(['user_id' => $userId]);

        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $items[] = [
                'id' => (int) $row['id'],
                'tokenHash' => (string) $row['device_token_hash'],
                'deviceLabel' => (string) $row['device_label'],
                'lastActiveAt' => (string) $row['last_active_at'],
                'createdAt' => (string) $row['created_at'],
                'isCurrent' => $currentHash !== null && hash_equals((string) $row['device_token_hash'], $currentHash),
            ];
        }

        return $items;
    }

    public function hashDeviceToken(string $rawToken): string
    {
        return hash('sha256', trim($rawToken) ?: 'default-device');
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function signPayload(array $payload): string
    {
        $encoded = $this->base64UrlEncode((string) json_encode($payload, JSON_UNESCAPED_SLASHES));
        $sig = hash_hmac('sha256', $encoded, $this->secret(), true);
        return $encoded . '.' . $this->base64UrlEncode($sig);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function verifySignedToken(string $token, string $expectedType): ?array
    {
        $parts = explode('.', trim($token));
        if (count($parts) !== 2) {
            return null;
        }

        [$encodedPayload, $encodedSig] = $parts;
        $expectedSig = $this->base64UrlEncode(hash_hmac('sha256', $encodedPayload, $this->secret(), true));
        if (!hash_equals($expectedSig, $encodedSig)) {
            return null;
        }

        $decoded = json_decode($this->base64UrlDecode($encodedPayload), true);
        if (!is_array($decoded) || ($decoded['typ'] ?? '') !== $expectedType) {
            return null;
        }

        if ((int) ($decoded['exp'] ?? 0) < time()) {
            return null;
        }

        return $decoded;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function sanitizeUser(array $row): array
    {
        $planTier = (string) ($row['plan_tier'] ?? 'free');
        return [
            'id' => (int) $row['id'],
            'email' => (string) $row['email'],
            'displayName' => (string) $row['display_name'],
            'emailVerified' => $row['email_verified_at'] !== null && $row['email_verified_at'] !== '',
            'emailVerifiedAt' => $row['email_verified_at'] ? (string) $row['email_verified_at'] : null,
            'planTier' => $planTier,
            'dailySearchesLimit' => $this->dailyLimitForPlan($planTier),
            'maxDevices' => $this->maxDevicesForPlan($planTier),
            'createdAt' => (string) ($row['created_at'] ?? ''),
        ];
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $data): string
    {
        $padded = strtr($data, '-_', '+/');
        $rem = strlen($padded) % 4;
        if ($rem > 0) {
            $padded .= str_repeat('=', 4 - $rem);
        }
        return (string) base64_decode($padded, true);
    }
}
