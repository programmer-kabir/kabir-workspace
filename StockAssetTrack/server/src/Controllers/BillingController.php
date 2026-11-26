<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use App\Middleware\SecurityMiddleware;
use App\Services\AuthService;

/**
 * Handles Stripe, Creem, and Cryptomus multi-currency checkouts, portal state, cancellations, and webhooks.
 */
final class BillingController
{
    private const ALLOWED_PLANS = ['starter', 'pro', 'annual'];
    private const ALLOWED_GATEWAYS = ['stripe', 'creem', 'cryptomus'];
    private const PLAN_PRICES = [
        'starter' => [
            'monthly' => ['USD' => 4, 'BDT' => 480, 'days' => 30],
            'yearly' => ['USD' => 38, 'BDT' => 4560, 'days' => 365],
        ],
        'pro' => [
            'monthly' => ['USD' => 8, 'BDT' => 960, 'days' => 30],
            'yearly' => ['USD' => 67, 'BDT' => 7990, 'days' => 365],
        ],
        'annual' => [
            'monthly' => ['USD' => 67, 'BDT' => 7990, 'days' => 365],
            'yearly' => ['USD' => 67, 'BDT' => 7990, 'days' => 365],
        ],
    ];
    private const CURRENCY_SYMBOLS = [
        'USD' => '$',
        'BDT' => '৳',
    ];

    /**
     * @param array<string, mixed> $config
     */
    public function __construct(
        private readonly array $config,
        private readonly Database $database,
        private readonly AuthMiddleware $authMiddleware,
        private readonly AuthService $authService,
        private readonly SecurityMiddleware $securityMiddleware
    ) {
    }

    public function checkout(Request $request): never
    {
        $this->securityMiddleware->enforceRateLimit($request, 'billing:checkout', 20, 60);
        $user = $this->authMiddleware->resolveUser($request, required: true);
        assert($user !== null);

        $body = $request->json();
        $planTier = strtolower(trim((string) ($body['planTier'] ?? 'pro')));
        $cycle = strtolower(trim((string) ($body['billingCycle'] ?? 'monthly'))) === 'yearly' ? 'yearly' : 'monthly';
        $gateway = strtolower(trim((string) ($body['gateway'] ?? 'stripe')));
        $currency = strtoupper(trim((string) ($body['currency'] ?? 'USD')));

        if (!in_array($planTier, self::ALLOWED_PLANS, true)) {
            Response::error('Invalid plan tier selected.', 400, 'INVALID_PLAN');
        }
        if (!in_array($gateway, self::ALLOWED_GATEWAYS, true)) {
            Response::error('Unsupported payment gateway.', 400, 'INVALID_GATEWAY');
        }
        if (!isset(self::CURRENCY_SYMBOLS[$currency])) {
            $currency = 'USD';
        }

        $pricing = self::PLAN_PRICES[$planTier][$cycle];
        $amount = (int) $pricing[$currency];
        $days = (int) $pricing['days'];
        $symbol = self::CURRENCY_SYMBOLS[$currency];
        $periodLabel = $days >= 365 ? '/yr' : '/mo';
        $sessionId = 'chk_' . bin2hex(random_bytes(8));

        $pdo = $this->database->connection();
        $ins = $pdo->prepare(
            'INSERT INTO subscriptions (user_id, gateway, external_sub_id, status, period_end, cancel_at_period_end)
             VALUES (:uid, :gw, :ext, :status, DATE_ADD(UTC_TIMESTAMP(), INTERVAL :days DAY), 0)'
        );
        $ins->execute([
            'uid' => (int) $user['id'],
            'gw' => $gateway,
            'ext' => $sessionId,
            'status' => 'pending',
            'days' => $days,
        ]);

        Response::json([
            'success' => true,
            'checkoutSessionId' => $sessionId,
            'gateway' => $gateway,
            'planTier' => $planTier,
            'billingCycle' => $cycle,
            'currency' => $currency,
            'amountDisplay' => $symbol . number_format($amount) . $periodLabel,
            'localTestWebhookEnabled' => ($this->config['env'] ?? 'production') === 'local',
        ]);
    }

    public function portal(Request $request): never
    {
        $user = $this->authMiddleware->resolveUser($request, required: true);
        assert($user !== null);

        $stmt = $this->database->connection()->prepare(
            'SELECT id, gateway, external_sub_id, status, period_end, cancel_at_period_end, created_at
             FROM subscriptions WHERE user_id = :uid ORDER BY created_at DESC LIMIT 15'
        );
        $stmt->execute(['uid' => (int) $user['id']]);
        $rows = array_map(static fn(array $r): array => [
            'id' => (int) $r['id'],
            'gateway' => (string) $r['gateway'],
            'externalSubId' => $r['external_sub_id'] ? (string) $r['external_sub_id'] : null,
            'status' => (string) $r['status'],
            'periodEnd' => $r['period_end'] ? (string) $r['period_end'] : null,
            'cancelAtPeriodEnd' => (bool) $r['cancel_at_period_end'],
            'createdAt' => (string) $r['created_at'],
        ], $stmt->fetchAll());

        Response::json([
            'success' => true,
            'planTier' => $user['planTier'],
            'subscriptions' => $rows,
        ]);
    }

    public function cancel(Request $request): never
    {
        $this->toggleCancellation($request, true);
    }

    public function resubscribe(Request $request): never
    {
        $this->toggleCancellation($request, false);
    }

    /**
     * Handle Stripe / Creem / Cryptomus webhooks and update MySQL subscriptions + users.plan_tier transactionally.
     *
     * @param array<string, string> $params
     */
    public function webhook(Request $request, array $params): never
    {
        $gateway = strtolower(trim((string) ($params['gateway'] ?? 'stripe')));
        if (!in_array($gateway, self::ALLOWED_GATEWAYS, true)) {
            Response::error('Unknown billing gateway.', 400, 'INVALID_GATEWAY');
        }

        $rawBody = file_get_contents('php://input') ?: '{}';
        $this->verifyGatewaySignatureIfConfigured($request, $gateway, $rawBody);

        $body = json_decode($rawBody, true);
        if (!is_array($body)) {
            Response::error('Malformed JSON webhook payload.', 400, 'INVALID_PAYLOAD');
        }

        $event = strtolower(trim((string) ($body['event'] ?? 'subscription.activated')));
        $sessionId = trim((string) ($body['checkoutSessionId'] ?? $body['externalSubId'] ?? ''));
        $planTier = strtolower(trim((string) ($body['planTier'] ?? 'pro')));
        if (!in_array($planTier, self::ALLOWED_PLANS, true)) {
            $planTier = 'pro';
        }

        $userId = (int) ($body['userId'] ?? 0);
        $pdo = $this->database->connection();
        $pdo->beginTransaction();

        try {
            if ($sessionId !== '') {
                $lookup = $pdo->prepare('SELECT user_id FROM subscriptions WHERE external_sub_id = :ext LIMIT 1');
                $lookup->execute(['ext' => $sessionId]);
                $foundUser = $lookup->fetchColumn();
                if ($foundUser !== false) {
                    $userId = (int) $foundUser;
                }
            }

            if ($userId <= 0) {
                $pdo->rollBack();
                Response::error('Unable to resolve user for billing webhook.', 404, 'USER_NOT_FOUND');
            }

            if (str_contains($event, 'cancel')) {
                $updSub = $pdo->prepare(
                    'UPDATE subscriptions SET status = :status, cancel_at_period_end = 1
                     WHERE user_id = :uid AND gateway = :gw'
                );
                $updSub->execute(['status' => 'canceled', 'uid' => $userId, 'gw' => $gateway]);

                $updUser = $pdo->prepare('UPDATE users SET plan_tier = :tier WHERE id = :uid');
                $updUser->execute(['tier' => 'free', 'uid' => $userId]);
            } else {
                if ($sessionId !== '') {
                    $updSub = $pdo->prepare(
                        'UPDATE subscriptions SET gateway = :gw, status = :status, cancel_at_period_end = 0
                         WHERE external_sub_id = :ext AND user_id = :uid'
                    );
                    $updSub->execute(['gw' => $gateway, 'status' => 'active', 'ext' => $sessionId, 'uid' => $userId]);
                }

                $updUser = $pdo->prepare('UPDATE users SET plan_tier = :tier WHERE id = :uid');
                $updUser->execute(['tier' => $planTier, 'uid' => $userId]);
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        Response::json([
            'success' => true,
            'gateway' => $gateway,
            'event' => $event,
            'user' => $this->authService->findUserById($userId),
        ]);
    }

    private function toggleCancellation(Request $request, bool $cancelFlag): never
    {
        $user = $this->authMiddleware->resolveUser($request, required: true);
        assert($user !== null);

        $stmt = $this->database->connection()->prepare(
            'UPDATE subscriptions SET cancel_at_period_end = :flag
             WHERE user_id = :uid AND status = :status'
        );
        $stmt->execute([
            'flag' => $cancelFlag ? 1 : 0,
            'uid' => (int) $user['id'],
            'status' => 'active',
        ]);

        Response::json([
            'success' => true,
            'cancelAtPeriodEnd' => $cancelFlag,
        ]);
    }

    private function verifyGatewaySignatureIfConfigured(Request $request, string $gateway, string $rawBody): void
    {
        $secret = match ($gateway) {
            'stripe' => trim((string) ($this->config['billing']['stripeWebhookSecret'] ?? '')),
            'creem' => trim((string) ($this->config['billing']['creemWebhookSecret'] ?? '')),
            'cryptomus' => trim((string) ($this->config['billing']['cryptomusApiKey'] ?? '')),
            default => '',
        };

        if ($secret === '') {
            return;
        }

        $sigHeader = trim(
            $request->header('x-webhook-signature')
            ?: $request->header('stripe-signature')
            ?: $request->header('creem-signature')
        );
        $expected = hash_hmac('sha256', $rawBody, $secret);
        if ($sigHeader === '' || !hash_equals($expected, $sigHeader)) {
            Response::error('Invalid webhook signature.', 401, 'INVALID_WEBHOOK_SIGNATURE');
        }
    }
}
