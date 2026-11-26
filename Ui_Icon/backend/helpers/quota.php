<?php
// backend/helpers/quota.php
// Manages server-side daily export/copy quotas (10 guest, 20 free user, unlimited pro)

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/rate_limit.php';

define('GUEST_DAILY_EXPORT_LIMIT', 10);
define('FREE_USER_DAILY_EXPORT_LIMIT', 20);

/**
 * Ensures the daily_export_usage table exists (self-healing migration).
 * Called once per request via static flag.
 */
function ensureQuotaTableExists($pdo) {
    static $checked = false;
    if ($checked) return;
    $checked = true;
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS daily_export_usage (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usage_date DATE NOT NULL,
                identifier VARCHAR(64) NOT NULL,
                user_id INT NULL,
                ip_address VARCHAR(45) NOT NULL DEFAULT '',
                count INT NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_date_identifier (usage_date, identifier),
                KEY idx_user_date (user_id, usage_date),
                KEY idx_ip_date (ip_address, usage_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    } catch (Exception $e) {
        error_log("quota.php: Could not create daily_export_usage table: " . $e->getMessage());
    }
}

/**
 * Returns current daily quota status for a guest or logged-in user
 */
function getDailyQuotaStatus($pdo, $user = null, $ip = null) {
    if ($ip === null) {
        $ip = getClientIpAddress();
    }

    // 1. Admin or Active Subscriber (Unlimited)
    if ($user && is_array($user)) {
        $roles = getUserRoles($user);
        // Administrators always have unlimited access
        if (in_array('admin', $roles)) {
            return [
                'plan' => 'pro',
                'plan_type' => 'admin',
                'is_unlimited' => true,
                'used' => 0,
                'limit' => null,
                'remaining' => 999999,
                'can_export' => true,
                'require_login' => false,
                'require_pro' => false
            ];
        }

        // Check if user has an active and valid subscription in subscriptions table
        if (!empty($user['id'])) {
            try {
                $stmt = $pdo->prepare("
                    SELECT id, plan_type, status, ends_at, renews_at 
                    FROM subscriptions 
                    WHERE user_id = :uid AND status = 'active' AND (ends_at IS NULL OR ends_at > NOW())
                    ORDER BY id DESC LIMIT 1
                ");
                $stmt->execute([':uid' => (int)$user['id']]);
                $activeSub = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($activeSub) {
                    return [
                        'plan' => 'pro',
                        'plan_type' => $activeSub['plan_type'],
                        'is_unlimited' => true,
                        'used' => 0,
                        'limit' => null,
                        'remaining' => 999999,
                        'can_export' => true,
                        'require_login' => false,
                        'require_pro' => false,
                        'subscription' => $activeSub
                    ];
                }
            } catch (Exception $e) {
                error_log("Error checking subscription quota: " . $e->getMessage());
            }

            // Check if user is an active team member under someone else's subscription
            try {
                $stmtTeam = $pdo->prepare("
                    SELECT s.id, s.plan_type, s.status, s.ends_at, s.renews_at 
                    FROM team_members tm
                    JOIN subscriptions s ON tm.subscription_id = s.id
                    WHERE (tm.member_user_id = :uid OR LOWER(tm.member_email) = LOWER(:email))
                      AND tm.status = 'active'
                      AND s.status = 'active' AND (s.ends_at IS NULL OR s.ends_at > NOW())
                    ORDER BY s.id DESC LIMIT 1
                ");
                $stmtTeam->execute([
                    ':uid' => (int)$user['id'],
                    ':email' => $user['email'] ?? ''
                ]);
                $teamSub = $stmtTeam->fetch(PDO::FETCH_ASSOC);

                if ($teamSub) {
                    return [
                        'plan' => 'pro',
                        'plan_type' => 'team_member',
                        'is_unlimited' => true,
                        'used' => 0,
                        'limit' => null,
                        'remaining' => 999999,
                        'can_export' => true,
                        'require_login' => false,
                        'require_pro' => false,
                        'subscription' => $teamSub
                    ];
                }
            } catch (Exception $e) {
                error_log("Error checking team member quota: " . $e->getMessage());
            }
        }
    }

    // Ensure table exists before any quota tracking queries
    ensureQuotaTableExists($pdo);

    // 2. Free Registered User (20 icons / day)
    if ($user && !empty($user['id'])) {
        $userId = (int)$user['id'];
        $identifier = 'u:' . $userId;
        $limit = FREE_USER_DAILY_EXPORT_LIMIT;

        try {
            $stmt = $pdo->prepare("
                SELECT count FROM daily_export_usage 
                WHERE usage_date = CURDATE() AND identifier = :identifier 
                LIMIT 1
            ");
            $stmt->execute([':identifier' => $identifier]);
            $used = (int)$stmt->fetchColumn();
        } catch (Exception $e) {
            error_log("Error reading free user quota: " . $e->getMessage());
            $used = 0;
        }

        $canExport = $used < $limit;
        return [
            'plan' => 'free',
            'is_unlimited' => false,
            'used' => $used,
            'limit' => $limit,
            'remaining' => max(0, $limit - $used),
            'can_export' => $canExport,
            'require_login' => false,
            'require_pro' => !$canExport
        ];
    }

    // 3. Guest Visitor (10 icons / day by IP)
    $identifier = 'ip:' . $ip;
    $limit = GUEST_DAILY_EXPORT_LIMIT;

    try {
        $stmt = $pdo->prepare("
            SELECT count FROM daily_export_usage 
            WHERE usage_date = CURDATE() AND identifier = :identifier 
            LIMIT 1
        ");
        $stmt->execute([':identifier' => $identifier]);
        $used = (int)$stmt->fetchColumn();
    } catch (Exception $e) {
        error_log("Error reading guest quota: " . $e->getMessage());
        $used = 0;
    }

    $canExport = $used < $limit;
    return [
        'plan' => 'guest',
        'is_unlimited' => false,
        'used' => $used,
        'limit' => $limit,
        'remaining' => max(0, $limit - $used),
        'can_export' => $canExport,
        'require_login' => !$canExport,
        'require_pro' => false
    ];
}

/**
 * Validates and consumes 1 export/copy quota.
 * Returns quota status if allowed, or false with error info if quota exceeded.
 */
function consumeDailyQuota($pdo, $user = null, $ip = null) {
    if ($ip === null) {
        $ip = getClientIpAddress();
    }

    $status = getDailyQuotaStatus($pdo, $user, $ip);

    if (!$status['can_export']) {
        return $status;
    }

    if ($status['is_unlimited']) {
        return $status;
    }

    $userId = ($user && !empty($user['id'])) ? (int)$user['id'] : null;
    $identifier = $userId ? ('u:' . $userId) : ('ip:' . $ip);

    try {
        $stmt = $pdo->prepare("
            INSERT INTO daily_export_usage (usage_date, identifier, user_id, ip_address, count)
            VALUES (CURDATE(), :identifier, :user_id, :ip, 1)
            ON DUPLICATE KEY UPDATE count = count + 1
        ");
        $stmt->execute([
            ':identifier' => $identifier,
            ':user_id' => $userId,
            ':ip' => $ip
        ]);
    } catch (Exception $e) {
        error_log("Error consuming daily quota: " . $e->getMessage());
        // If we can't write quota, still allow the export to avoid blocking users
        return $status;
    }

    // Refresh status after increment
    $status['used'] += 1;
    $status['remaining'] = max(0, $status['limit'] - $status['used']);
    $status['can_export'] = $status['used'] < $status['limit'];
    if (!$status['can_export']) {
        if ($status['plan'] === 'guest') {
            $status['require_login'] = true;
        } else {
            $status['require_pro'] = true;
        }
    }

    return $status;
}
