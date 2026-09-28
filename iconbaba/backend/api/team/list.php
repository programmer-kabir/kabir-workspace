<?php
// backend/api/team/list.php
// Returns seat usage and team members for the logged-in team owner or member

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$user = requireAuth($pdo);
$userId = (int)$user['id'];
$userEmail = strtolower($user['email']);

// 1. Check if user owns an active team subscription
$stmtSub = $pdo->prepare("
    SELECT id, plan_type, team_seats, status, renews_at, ends_at
    FROM subscriptions
    WHERE user_id = ? AND plan_type = 'team' AND status = 'active' AND (ends_at IS NULL OR ends_at > NOW())
    ORDER BY id DESC LIMIT 1
");
$stmtSub->execute([$userId]);
$sub = $stmtSub->fetch(PDO::FETCH_ASSOC);

if (!$sub) {
    jsonResponse(true, [
        'is_team' => false,
        'message' => 'No active team subscription found for this user.'
    ]);
}

$subId = (int)$sub['id'];
$totalSeats = ((int)$sub['team_seats'] > 0) ? (int)$sub['team_seats'] : 8;

// 2. Fetch all assigned members for this subscription
$stmtMembers = $pdo->prepare("
    SELECT tm.id, tm.member_email, tm.member_user_id, tm.role, 
           COALESCE(tm.status, 'active') AS status, tm.created_at,
           u.full_name, u.username, u.avatar_url
    FROM team_members tm
    LEFT JOIN users u ON tm.member_user_id = u.id OR LOWER(u.email) = LOWER(tm.member_email)
    WHERE tm.subscription_id = ?
    ORDER BY tm.id ASC
");
$stmtMembers->execute([$subId]);
$membersList = $stmtMembers->fetchAll(PDO::FETCH_ASSOC);

$activeCount = 0;
$pendingCount = 0;
foreach ($membersList as $m) {
    if (($m['status'] ?? 'active') === 'pending') {
        $pendingCount++;
    } else {
        $activeCount++;
    }
}

// Active seats: 1 (Owner) + confirmed members
$activeSeats = 1 + $activeCount;
$remainingSeats = max(0, $totalSeats - ($activeSeats + $pendingCount));

jsonResponse(true, [
    'is_team' => true,
    'subscription_id' => $subId,
    'total_seats' => $totalSeats,
    'used_seats' => $activeSeats,
    'pending_seats' => $pendingCount,
    'remaining_seats' => $remainingSeats,
    'owner' => [
        'user_id' => $userId,
        'name' => $user['full_name'] ?: $user['username'],
        'email' => $user['email'],
        'role' => 'Owner',
        'is_owner' => true,
        'created_at' => $sub['renews_at']
    ],
    'members' => array_map(function($m) {
        return [
            'id' => (int)$m['id'],
            'email' => $m['member_email'],
            'name' => $m['full_name'] ?: ($m['username'] ?: explode('@', $m['member_email'])[0]),
            'username' => $m['username'] ?? null,
            'role' => $m['role'] ?: 'Member',
            'status' => $m['status'] ?: 'pending',
            'is_pending' => ($m['status'] === 'pending'),
            'is_registered' => !empty($m['member_user_id']) || !empty($m['username']),
            'created_at' => $m['created_at']
        ];
    }, $membersList)
]);
