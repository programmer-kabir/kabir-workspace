<?php
// backend/api/admin/billing/stats.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';

$admin = requireAdmin($pdo);

// 1. Total Revenue
$revStmt = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid'");
$totalRevenue = (float)$revStmt->fetchColumn();

// 2. Total Payments Count
$totalPayments = (int)$pdo->query("SELECT COUNT(*) FROM payments WHERE status = 'paid'")->fetchColumn();

// 3. Active Subscribers Count
$activeSubscribers = (int)$pdo->query("
    SELECT COUNT(*) 
    FROM subscriptions 
    WHERE status = 'active' 
      AND (ends_at IS NULL OR ends_at > NOW())
")->fetchColumn();

// 4. Plan Counts
$soloCount = (int)$pdo->query("
    SELECT COUNT(*) 
    FROM subscriptions 
    WHERE plan_type = 'solo' AND status = 'active' AND (ends_at IS NULL OR ends_at > NOW())
")->fetchColumn();

$teamCount = (int)$pdo->query("
    SELECT COUNT(*) 
    FROM subscriptions 
    WHERE plan_type = 'team' AND status = 'active' AND (ends_at IS NULL OR ends_at > NOW())
")->fetchColumn();

// 5. Total All-time Subscriptions (active + cancelled + expired)
$totalSubscriptionsAllTime = (int)$pdo->query("SELECT COUNT(*) FROM subscriptions")->fetchColumn();

jsonResponse(true, [
    'total_revenue' => $totalRevenue,
    'total_payments' => $totalPayments,
    'active_subscribers' => $activeSubscribers,
    'total_subscriptions_all' => $totalSubscriptionsAllTime,
    'plans' => [
        'solo' => $soloCount,
        'team' => $teamCount
    ]
]);
