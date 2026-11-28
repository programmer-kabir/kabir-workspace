<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use App\Middleware\QuotaMiddleware;
use App\Middleware\SecurityMiddleware;
use App\Services\AdobeClientInterface;
use App\Services\AuthService;

/**
 * Manages authentication, email verification, CSR handshakes, device slots (1/1/3/5), favorites, and dashboard metrics.
 */
final class UserController
{
    /**
     * @param array<string, mixed> $config
     */
    public function __construct(
        private readonly array $config,
        private readonly Database $database,
        private readonly AuthService $authService,
        private readonly AuthMiddleware $authMiddleware,
        private readonly QuotaMiddleware $quotaMiddleware,
        private readonly SecurityMiddleware $securityMiddleware,
        private readonly AdobeClientInterface $adobeClient
    ) {
    }

    public function register(Request $request): never
    {
        $this->securityMiddleware->enforceRateLimit($request, 'auth:register', 10, 60);
        $this->securityMiddleware->enforceTurnstileIfConfigured($request);

        $body = $request->json();
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        $displayName = trim((string) ($body['displayName'] ?? ''));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Please enter a valid email address.', 400, 'INVALID_EMAIL');
        }
        if (strlen($password) < 6) {
            Response::error('Password must be at least 6 characters.', 400, 'WEAK_PASSWORD');
        }

        $result = $this->authService->registerUser($email, $password, $displayName, 'free');
        if (!empty($result['conflict'])) {
            Response::error('An account with this email already exists.', 409, 'EMAIL_EXISTS');
        }

        /** @var array<string, mixed> $user */
        $user = $result['user'];
        $deviceToken = trim($request->header('x-device-token') ?: bin2hex(random_bytes(16)));
        $deviceLabel = trim((string) ($body['deviceLabel'] ?? 'Web Browser'));

        $this->authService->registerOrCheckDevice((int) $user['id'], (string) $user['planTier'], $deviceToken, $deviceLabel);
        $token = $this->authService->issueAuthToken((int) $user['id']);
        $csr = $this->authService->issueCsrToken($deviceToken);

        $autoVerify = (bool) ($this->config['mail']['autoVerifySignup'] ?? false);
        if ($autoVerify) {
            $this->authService->verifyEmailWithCode((int) $user['id'], (string) $result['verificationCode']);
            $user = $this->authService->findUserById((int) $user['id']) ?? $user;
        } else {
            $this->dispatchVerificationEmail((string) $user['email'], (string) $user['displayName'], (string) $result['verificationCode']);
        }

        $payload = [
            'success' => true,
            'token' => $token,
            'deviceToken' => $deviceToken,
            'csrToken' => $csr['token'],
            'user' => $user,
            'devices' => $this->authService->listDevices((int) $user['id'], $deviceToken),
        ];

        Response::json($payload, 201);
    }

    public function login(Request $request): never
    {
        $this->securityMiddleware->enforceRateLimit($request, 'auth:login', 15, 60);
        $this->securityMiddleware->enforceTurnstileIfConfigured($request);

        $body = $request->json();
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        $user = $this->authService->authenticateCredentials($email, $password);
        if ($user === null) {
            Response::error('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
        }

        $deviceToken = trim($request->header('x-device-token') ?: bin2hex(random_bytes(16)));
        $deviceLabel = trim((string) ($body['deviceLabel'] ?? 'Web Browser'));
        $slotCheck = $this->authService->registerOrCheckDevice((int) $user['id'], (string) $user['planTier'], $deviceToken, $deviceLabel);
        $token = $this->authService->issueAuthToken((int) $user['id']);

        if (!$slotCheck['allowed']) {
            Response::json([
                'success' => false,
                'error' => [
                    'code' => 'DEVICE_LIMIT_EXCEEDED',
                    'message' => "Device limit reached ({$slotCheck['maxDevices']} slots for {$user['planTier']} plan). Choose a device to replace.",
                    'details' => [
                        'maxDevices' => $slotCheck['maxDevices'],
                        'planTier' => $user['planTier'],
                        'pendingToken' => $token,
                        'deviceToken' => $deviceToken,
                        'devices' => $slotCheck['devices'],
                    ],
                ],
            ], 409);
        }

        $csr = $this->authService->issueCsrToken($deviceToken);

        if (empty($user['emailVerified'])) {
            $code = $this->authService->expectedVerificationCode((int) $user['id'], (string) $user['email']);
            $this->dispatchVerificationEmail((string) $user['email'], (string) $user['displayName'], $code);

            Response::json([
                'success' => false,
                'error' => [
                    'code' => 'EMAIL_NOT_VERIFIED',
                    'message' => 'Please verify your email before signing in. We have sent a verification code to your email.',
                    'details' => [
                        'email' => $user['email'],
                        'pendingToken' => $token,
                        'deviceToken' => $deviceToken,
                    ],
                ],
            ], 403);
        }

        $payload = [
            'success' => true,
            'token' => $token,
            'deviceToken' => $deviceToken,
            'csrToken' => $csr['token'],
            'user' => $user,
            'devices' => $slotCheck['devices'],
        ];

        Response::json($payload);
    }

    public function verifyEmail(Request $request): never
    {
        $user = $this->authMiddleware->resolveUser($request, required: true, enforceDeviceSlot: false);
        assert($user !== null);

        $body = $request->json();
        $code = trim((string) ($body['code'] ?? ''));
        if ($code === '' || !$this->authService->verifyEmailWithCode((int) $user['id'], $code)) {
            Response::error('Invalid or mismatched verification code.', 400, 'INVALID_VERIFICATION_CODE');
        }

        Response::json([
            'success' => true,
            'message' => 'Email verified successfully.',
            'user' => $this->authService->findUserById((int) $user['id']),
        ]);
    }

    public function resendVerification(Request $request): never
    {
        $user = $this->authMiddleware->resolveUser($request, required: true, enforceDeviceSlot: false);
        assert($user !== null);

        $code = $this->authService->expectedVerificationCode((int) $user['id'], (string) $user['email']);
        $this->dispatchVerificationEmail((string) $user['email'], (string) $user['displayName'], $code);

        $payload = [
            'success' => true,
            'message' => 'Verification instructions issued.',
        ];

        Response::json($payload);
    }

    public function me(Request $request): never
    {
        $user = $this->authMiddleware->resolveUser($request, required: true);
        assert($user !== null);

        $deviceToken = trim($request->header('x-device-token'));
        $usage = $this->quotaMiddleware->inspectToday((int) $user['id']);

        Response::json([
            'success' => true,
            'user' => $user,
            'usage' => [
                'searchesToday' => $usage['searchesToday'] + $usage['promptsToday'],
                'searchCount' => $usage['searchesToday'],
                'promptCount' => $usage['promptsToday'],
                'dailyLimit' => $user['dailySearchesLimit'],
            ],
            'devices' => $this->authService->listDevices((int) $user['id'], $deviceToken),
        ]);
    }

    public function csrToken(Request $request): never
    {
        $issued = $this->authService->issueCsrToken($request->header('x-device-token'));
        Response::json([
            'success' => true,
            'token' => $issued['token'],
            'expiresIn' => $issued['expiresIn'],
        ]);
    }

    public function usageCheck(Request $request): never
    {
        $user = $this->authMiddleware->resolveUser($request, required: false);
        if ($user === null) {
            Response::json([
                'success' => true,
                'authenticated' => false,
                'allowed' => !($this->config['security']['requireAuthForMetered'] ?? false),
                'planTier' => 'guest',
                'searchesToday' => 0,
                'dailyLimit' => -1,
            ]);
        }

        if (empty($user['emailVerified'])) {
            Response::error('Email not verified. Please verify your email to search.', 403, 'EMAIL_NOT_VERIFIED');
        }

        $usage = $this->quotaMiddleware->inspectToday((int) $user['id']);
        $used = $usage['searchesToday'] + $usage['promptsToday'];
        $limit = (int) $user['dailySearchesLimit'];

        if ($limit > 0 && $used >= $limit) {
            Response::error("Daily quota reached ({$used}/{$limit}).", 429, 'QUOTA_EXCEEDED', [
                'searchesToday' => $used,
                'dailyLimit' => $limit,
            ]);
        }

        Response::json([
            'success' => true,
            'authenticated' => true,
            'allowed' => true,
            'planTier' => $user['planTier'],
            'searchesToday' => $used,
            'dailyLimit' => $limit,
        ]);
    }

    public function dashboard(Request $request): never
    {
        $user = $this->authMiddleware->resolveUser($request, required: true);
        assert($user !== null);

        $usage = $this->quotaMiddleware->inspectToday((int) $user['id']);
        $deviceToken = trim($request->header('x-device-token'));

        $subStmt = $this->database->connection()->prepare(
            'SELECT id, gateway, external_sub_id, status, period_end, cancel_at_period_end, created_at
             FROM subscriptions WHERE user_id = :uid ORDER BY created_at DESC LIMIT 10'
        );
        $subStmt->execute(['uid' => (int) $user['id']]);
        $subscriptions = array_map(static fn(array $r): array => [
            'id' => (int) $r['id'],
            'gateway' => (string) $r['gateway'],
            'externalSubId' => $r['external_sub_id'] ? (string) $r['external_sub_id'] : null,
            'status' => (string) $r['status'],
            'periodEnd' => $r['period_end'] ? (string) $r['period_end'] : null,
            'cancelAtPeriodEnd' => (bool) $r['cancel_at_period_end'],
            'createdAt' => (string) $r['created_at'],
        ], $subStmt->fetchAll());

        Response::json([
            'success' => true,
            'user' => $user,
            'usage' => [
                'searchesToday' => $usage['searchesToday'] + $usage['promptsToday'],
                'searchCount' => $usage['searchesToday'],
                'promptCount' => $usage['promptsToday'],
                'dailyLimit' => $user['dailySearchesLimit'],
            ],
            'devices' => $this->authService->listDevices((int) $user['id'], $deviceToken),
            'subscriptions' => $subscriptions,
            'platform' => [
                'adobeDataMode' => $this->adobeClient->mode(),
                'adobeKeyConfigured' => trim((string) ($this->config['adobe']['apiKey'] ?? '')) !== '',
                'requireAuthForMetered' => (bool) ($this->config['security']['requireAuthForMetered'] ?? false),
                'turnstileConfigured' => trim((string) ($this->config['security']['turnstileSecretKey'] ?? '')) !== '',
            ],
        ]);
    }

    public function updateProfile(Request $request): never
    {
        $user = $this->authMiddleware->resolveUser($request, required: true);
        assert($user !== null);

        $body = $request->json();
        $displayName = trim((string) ($body['displayName'] ?? ''));
        if ($displayName === '') {
            Response::error('Display name cannot be empty.', 400, 'INVALID_NAME');
        }

        $stmt = $this->database->connection()->prepare('UPDATE users SET display_name = :name WHERE id = :id');
        $stmt->execute(['name' => mb_substr($displayName, 0, 120), 'id' => (int) $user['id']]);

        Response::json([
            'success' => true,
            'user' => $this->authService->findUserById((int) $user['id']),
        ]);
    }

    public function listDevices(Request $request): never
    {
        $user = $this->authMiddleware->resolveUser($request, required: true, enforceDeviceSlot: false);
        assert($user !== null);

        Response::json([
            'success' => true,
            'maxDevices' => $user['maxDevices'],
            'devices' => $this->authService->listDevices((int) $user['id'], $request->header('x-device-token')),
        ]);
    }

    public function replaceDevice(Request $request): never
    {
        $user = $this->authMiddleware->resolveUser($request, required: true, enforceDeviceSlot: false);
        assert($user !== null);

        $body = $request->json();
        $oldDeviceId = (int) ($body['replaceDeviceId'] ?? 0);
        $newDeviceToken = trim((string) ($body['deviceToken'] ?? $request->header('x-device-token')));
        $newLabel = trim((string) ($body['deviceLabel'] ?? 'Web Browser'));

        if ($oldDeviceId <= 0 || $newDeviceToken === '') {
            Response::error('replaceDeviceId and deviceToken are required.', 400, 'INVALID_DEVICE_REPLACE');
        }

        if (!$this->authService->replaceDevice((int) $user['id'], $oldDeviceId, $newDeviceToken, $newLabel)) {
            Response::error('Target device slot not found.', 404, 'DEVICE_NOT_FOUND');
        }

        Response::json([
            'success' => true,
            'message' => 'Device slot replaced cleanly.',
            'devices' => $this->authService->listDevices((int) $user['id'], $newDeviceToken),
        ]);
    }

    public function revokeDevice(Request $request): never
    {
        $user = $this->authMiddleware->resolveUser($request, required: true);
        assert($user !== null);

        $body = $request->json();
        $deviceId = (int) ($request->query('deviceId') ?? $body['deviceId'] ?? 0);
        if ($deviceId <= 0 || !$this->authService->revokeDevice((int) $user['id'], $deviceId)) {
            Response::error('Device not found.', 404, 'DEVICE_NOT_FOUND');
        }

        Response::json([
            'success' => true,
            'devices' => $this->authService->listDevices((int) $user['id'], $request->header('x-device-token')),
        ]);
    }

    public function listFavorites(Request $request): never
    {
        $user = $this->authMiddleware->resolveUser($request, required: true);
        assert($user !== null);

        $stmt = $this->database->connection()->prepare(
            'SELECT item_type, target_id, metadata_json, created_at FROM favorites WHERE user_id = :uid ORDER BY created_at DESC'
        );
        $stmt->execute(['uid' => (int) $user['id']]);

        $images = [];
        $contributors = [];
        foreach ($stmt->fetchAll() as $row) {
            $meta = json_decode((string) ($row['metadata_json'] ?? '{}'), true);
            if (!is_array($meta)) {
                $meta = [];
            }
            if ($row['item_type'] === 'contributor') {
                $contributors[] = array_merge(['id' => (string) $row['target_id']], $meta);
            } else {
                $images[] = array_merge(['id' => (string) $row['target_id']], $meta);
            }
        }

        Response::json([
            'success' => true,
            'images' => $images,
            'contributors' => $contributors,
        ]);
    }

    public function saveFavorite(Request $request): never
    {
        $user = $this->authMiddleware->resolveUser($request, required: true);
        assert($user !== null);

        $body = $request->json();
        $type = ($body['itemType'] ?? 'image') === 'contributor' ? 'contributor' : 'image';
        $targetId = trim((string) ($body['targetId'] ?? ''));
        $metadata = is_array($body['metadata'] ?? null) ? $body['metadata'] : [];

        if ($targetId === '') {
            Response::error('targetId is required.', 400, 'MISSING_TARGET_ID');
        }

        $stmt = $this->database->connection()->prepare(
            'INSERT INTO favorites (user_id, item_type, target_id, metadata_json)
             VALUES (:uid, :typ, :tid, :meta)
             ON DUPLICATE KEY UPDATE metadata_json = VALUES(metadata_json)'
        );
        $stmt->execute([
            'uid' => (int) $user['id'],
            'typ' => $type,
            'tid' => mb_substr($targetId, 0, 64),
            'meta' => json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);

        Response::json(['success' => true]);
    }

    public function deleteFavorite(Request $request): never
    {
        $user = $this->authMiddleware->resolveUser($request, required: true);
        assert($user !== null);

        $body = $request->json();
        $type = (($request->query('itemType') ?? $body['itemType'] ?? 'image') === 'contributor') ? 'contributor' : 'image';
        $targetId = trim((string) ($request->query('targetId') ?? $body['targetId'] ?? ''));

        if ($targetId === '') {
            Response::error('targetId is required.', 400, 'MISSING_TARGET_ID');
        }

        $stmt = $this->database->connection()->prepare(
            'DELETE FROM favorites WHERE user_id = :uid AND item_type = :typ AND target_id = :tid'
        );
        $stmt->execute([
            'uid' => (int) $user['id'],
            'typ' => $type,
            'tid' => $targetId,
        ]);

        Response::json(['success' => true, 'removed' => $stmt->rowCount() > 0]);
    }

    private function dispatchVerificationEmail(string $toEmail, string $displayName, string $code): bool
    {
        $safeName = htmlspecialchars($displayName ?: 'Creator', ENT_QUOTES, 'UTF-8');
        $subject = "Your StockAssetTrack Verification Code: {$code}";
        $textBody = "Hello {$displayName},\n\nYour StockAssetTrack verification code is: {$code}\n\nEnter this 8-character code to verify your account.\n\nBest regards,\nThe StockAssetTrack Team\nhttps://stockassettrack.com\n";

        $htmlBody = <<<HTML
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; padding: 36px 32px; border: 1px solid #334155;">
  <div style="margin-bottom: 24px;">
    <span style="font-size: 20px; font-weight: 800; color: #818cf8; letter-spacing: -0.5px;">StockAssetTrack</span>
    <span style="font-size: 11px; margin-left: 8px; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Intelligence</span>
  </div>
  <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 700; color: #ffffff;">Verify Your Creator Account</h2>
  <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin: 0 0 20px 0;">
    Hello <strong>{$safeName}</strong>,<br>
    Welcome to StockAssetTrack. Use the verification code below to activate your account and unlock niche research, competitor tracking, and AI prompt tools:
  </p>
  <div style="margin: 28px 0; text-align: center;">
    <div style="display: inline-block; padding: 14px 28px; background: #1e1b4b; border: 1px solid #6366f1; border-radius: 12px; font-family: 'JetBrains Mono', Consolas, monospace; font-size: 26px; font-weight: 800; letter-spacing: 5px; color: #a5b4fc;">
      {$code}
    </div>
  </div>
  <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
    Enter this code on your StockAssetTrack verification screen. If you did not request this code, you can safely ignore this email.
  </p>
  <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 11px; color: #475569; text-align: center;">
    StockAssetTrack &copy; 2026 · Microstock Intelligence Platform<br>
    <a href="https://stockassettrack.com" style="color: #6366f1; text-decoration: none;">stockassettrack.com</a>
  </div>
</div>
HTML;

        $mailer = new \App\Services\SmtpMailer($this->config);
        return $mailer->send($toEmail, $displayName, $subject, $htmlBody, $textBody);
    }
}
