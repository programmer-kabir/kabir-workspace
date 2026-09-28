<?php
// backend/api/subscriptions/my.php
// Returns the logged-in user's subscription details and complete payment history with receipt links

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$user = requireAuth($pdo);
$userId = (int)$user['id'];

// 1. Fetch user's subscription
$stmtSub = $pdo->prepare("
    SELECT id, plan_type, team_seats, lemonsqueezy_customer_id, lemonsqueezy_subscription_id,
           status, renews_at, ends_at, customer_portal_url, created_at, updated_at
    FROM subscriptions
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 1
");
$stmtSub->execute([$userId]);
$sub = $stmtSub->fetch(PDO::FETCH_ASSOC);

if ($sub) {
    $sub['id'] = (int)$sub['id'];
    $sub['team_seats'] = (int)$sub['team_seats'];

    if ($sub['plan_type'] === 'team') {
        $totalSeats = max(5, $sub['team_seats']);
        $usedCount = 1; // Owner
        try {
            $stmtTmCount = $pdo->prepare("SELECT COUNT(*) FROM team_members WHERE subscription_id = ?");
            $stmtTmCount->execute([$sub['id']]);
            $usedCount += (int)$stmtTmCount->fetchColumn();
        } catch (Exception $e) {}

        $sub['total_seats'] = $totalSeats;
        $sub['used_seats'] = $usedCount;
        $sub['remaining_seats'] = max(0, $totalSeats - $usedCount);
    }
} else {
    // Check if the user is an active team member
    $stmtTeam = $pdo->prepare("
        SELECT s.id, s.plan_type, s.team_seats, s.status, s.renews_at, s.ends_at,
               tm.role AS team_role, tm.created_at AS joined_at,
               owner.full_name AS owner_name, owner.username AS owner_username, owner.email AS owner_email
        FROM team_members tm
        JOIN subscriptions s ON tm.subscription_id = s.id
        JOIN users owner ON tm.owner_user_id = owner.id
        WHERE tm.member_user_id = ? AND tm.status = 'active'
        LIMIT 1
    ");
    $stmtTeam->execute([$userId]);
    $teamSub = $stmtTeam->fetch(PDO::FETCH_ASSOC);

    if ($teamSub) {
        $sub = [
            'id' => (int)$teamSub['id'],
            'plan_type' => 'team_member', // special plan type for the UI
            'team_seats' => (int)$teamSub['team_seats'],
            'status' => $teamSub['status'],
            'renews_at' => $teamSub['renews_at'],
            'ends_at' => $teamSub['ends_at'],
            'is_team_member' => true,
            'team_role' => $teamSub['team_role'],
            'joined_at' => $teamSub['joined_at'],
            'owner' => [
                'name' => $teamSub['owner_name'] ?: $teamSub['owner_username'],
                'email' => $teamSub['owner_email']
            ]
        ];
    } else {
        $sub = null;
    }
}

// 2. Fetch all payments history for this user with linked plan details
$stmtPayments = $pdo->prepare("
    SELECT p.id, p.subscription_id, p.lemonsqueezy_order_id, p.order_number, 
           p.amount, p.currency, p.status, p.payment_method, p.card_brand, p.card_last_four, 
           p.receipt_url, p.created_at,
           COALESCE(s.plan_type, (SELECT plan_type FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1), 'solo') AS plan_type,
           COALESCE(s.team_seats, (SELECT team_seats FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1), 1) AS team_seats,
           COALESCE(s.renews_at, (SELECT renews_at FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1)) AS renews_at,
           COALESCE(s.ends_at, (SELECT ends_at FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1)) AS ends_at
    FROM payments p
    LEFT JOIN subscriptions s ON p.subscription_id = s.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC, p.id DESC
");
$stmtPayments->execute([$userId, $userId, $userId, $userId, $userId]);
$payments = $stmtPayments->fetchAll(PDO::FETCH_ASSOC);

$totalSpent = 0.0;
foreach ($payments as &$pmt) {
    $pmt['id'] = (int)$pmt['id'];
    $pmt['subscription_id'] = $pmt['subscription_id'] ? (int)$pmt['subscription_id'] : null;
    $pmt['amount'] = (float)$pmt['amount'];
    $pmt['team_seats'] = (int)$pmt['team_seats'];
    if ($pmt['plan_type'] === 'team') {
        $totalS = max(5, $pmt['team_seats']);
        $usedS = (isset($sub['used_seats']) && $sub) ? $sub['used_seats'] : 1;
        $pmt['total_seats'] = $totalS;
        $pmt['used_seats'] = $usedS;
        $pmt['remaining_seats'] = max(0, $totalS - $usedS);
    }
    if ($pmt['status'] === 'paid') {
        $totalSpent += $pmt['amount'];
    }
}
unset($pmt);

jsonResponse(true, [
    'customer' => [
        'name' => $user['full_name'] ?: $user['username'],
        'email' => $user['email'],
        'user_id' => $userId
    ],
    'subscription' => $sub,
    'payments' => $payments,
    'total_spent' => round($totalSpent, 2),
    'total_payments' => count($payments),
    'is_pro' => ($sub && $sub['status'] === 'active' && (empty($sub['ends_at']) || strtotime($sub['ends_at']) > time()))
]);
