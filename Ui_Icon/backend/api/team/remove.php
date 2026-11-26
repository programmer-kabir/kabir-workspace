<?php
// backend/api/team/remove.php
// Revokes an assigned team seat, making it available again

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$user = requireAuth($pdo);
$userId = (int)$user['id'];

$body = json_decode(file_get_contents('php://input'), true);
$memberId = (int)($body['member_id'] ?? 0);

if (!$memberId) {
    jsonResponse(false, null, 'Invalid member ID.', 400);
}

// Ensure the member belongs to a subscription owned by this user
$stmtCheck = $pdo->prepare("
    SELECT tm.id, tm.member_email, tm.member_user_id, tm.subscription_id, s.team_seats
    FROM team_members tm
    JOIN subscriptions s ON tm.subscription_id = s.id
    WHERE tm.id = ? AND tm.owner_user_id = ?
");
$stmtCheck->execute([$memberId, $userId]);
$item = $stmtCheck->fetch(PDO::FETCH_ASSOC);

if (!$item) {
    jsonResponse(false, null, 'Team member not found or permission denied.', 404);
}

// Delete member
$stmtDel = $pdo->prepare("DELETE FROM team_members WHERE id = ?");
$stmtDel->execute([$memberId]);

// If the removed member has a user account, notify them
if (!empty($item['member_user_id'])) {
    require_once __DIR__ . '/../../helpers/notifications.php';
    $ownerName = $user['full_name'] ?: $user['username'];
    createNotification(
        $pdo,
        'Team Seat Revoked',
        "Your seat in {$ownerName}'s team has been removed. You are now on the Free Plan.",
        'team_removed',
        (int)$item['member_user_id'],
        null,
        '/pricing',
        null,
        'users'
    );
}

// Count active and pending members
$stmtActive = $pdo->prepare("SELECT COUNT(*) FROM team_members WHERE subscription_id = ? AND status = 'active'");
$stmtActive->execute([$item['subscription_id']]);
$activeCount = (int)$stmtActive->fetchColumn();

$stmtPending = $pdo->prepare("SELECT COUNT(*) FROM team_members WHERE subscription_id = ? AND status = 'pending'");
$stmtPending->execute([$item['subscription_id']]);
$pendingCount = (int)$stmtPending->fetchColumn();

$totalSeats = ((int)$item['team_seats'] > 0) ? (int)$item['team_seats'] : 8;
$usedSeats = 1 + $activeCount;
$remainingSeats = max(0, $totalSeats - ($usedSeats + $pendingCount));

jsonResponse(true, [
    'removed_email' => $item['member_email'],
    'total_seats' => $totalSeats,
    'used_seats' => $usedSeats,
    'pending_seats' => $pendingCount,
    'remaining_seats' => $remainingSeats
], "Seat revoked or invitation cancelled successfully.");
