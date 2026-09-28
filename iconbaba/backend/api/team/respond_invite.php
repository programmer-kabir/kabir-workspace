<?php
// backend/api/team/respond_invite.php
// Allows an invited user to Approve/Accept or Decline a Team Plan invitation

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../helpers/notifications.php';

$user = requireAuth($pdo);
$userId = (int)$user['id'];
$userEmail = strtolower(trim($user['email']));

$body = json_decode(file_get_contents('php://input'), true);
$inviteId = (int)($body['invite_id'] ?? ($body['id'] ?? 0));
$action = strtolower(trim($body['action'] ?? ''));

if (!$inviteId) {
    jsonResponse(false, null, 'Invalid invitation ID.', 400);
}

if (!in_array($action, ['accept', 'approve', 'decline', 'reject'])) {
    jsonResponse(false, null, 'Invalid action. Must be accept or decline.', 400);
}

// 1. Fetch invitation and verify it belongs to this user
$stmt = $pdo->prepare("
    SELECT tm.id, tm.subscription_id, tm.owner_user_id, tm.member_email, tm.status,
           s.plan_type, s.team_seats, s.status AS sub_status, s.ends_at,
           owner.full_name AS owner_name, owner.username AS owner_username
    FROM team_members tm
    JOIN subscriptions s ON tm.subscription_id = s.id
    JOIN users owner ON tm.owner_user_id = owner.id
    WHERE tm.id = ? AND (tm.member_user_id = ? OR LOWER(tm.member_email) = ?)
    LIMIT 1
");
$stmt->execute([$inviteId, $userId, $userEmail]);
$invite = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$invite) {
    jsonResponse(false, null, 'Invitation not found or not addressed to you.', 404);
}

if ($invite['sub_status'] !== 'active' || (!empty($invite['ends_at']) && strtotime($invite['ends_at']) <= time())) {
    jsonResponse(false, null, 'This team subscription is no longer active.', 400);
}

// Helper: update the invitee's original team_invite notification for history
$updateInviteNotif = function($status) use ($pdo, $userId, $inviteId) {
    try {
        $msg = $status === 'accept' ? '✓ You accepted this team invitation.' : '✓ You declined this team invitation.';
        $stmt = $pdo->prepare("
            UPDATE notifications 
            SET message = ?, type = 'system', is_read = 1, action_data = NULL
            WHERE user_id = ? AND type = 'team_invite' 
              AND JSON_EXTRACT(action_data, '$.invite_id') = ?
        ");
        $stmt->execute([$msg, $userId, $inviteId]);
    } catch (Exception $e) {
        error_log("Failed to update team_invite notification: " . $e->getMessage());
    }
};

$responderName = $user['full_name'] ?: $user['username'] ?: $userEmail;

if ($action === 'accept' || $action === 'approve') {
    // Check if team capacity is already reached
    $totalSeats = ((int)$invite['team_seats'] > 0) ? (int)$invite['team_seats'] : 8;
    $stmtActive = $pdo->prepare("SELECT COUNT(*) FROM team_members WHERE subscription_id = ? AND status = 'active'");
    $stmtActive->execute([$invite['subscription_id']]);
    $activeCount = (int)$stmtActive->fetchColumn();

    // 1 owner + activeCount
    if ((1 + $activeCount) >= $totalSeats) {
        jsonResponse(false, null, 'All seats in this team have already been filled.', 400);
    }

    // Update status to active
    $updateStmt = $pdo->prepare("
        UPDATE team_members
        SET status = 'active', member_user_id = ?
        WHERE id = ?
    ");
    $updateStmt->execute([$userId, $inviteId]);

    // Update invitee's original invite notification
    $updateInviteNotif('accept');

    // Notify the owner that their invite was accepted
    createNotification(
        $pdo,
        'Team Invitation Accepted! 🎉',
        "{$responderName} ({$userEmail}) accepted your invitation and joined your team.",
        'team_approved',
        (int)$invite['owner_user_id'],
        null,
        '/billing',
        null,
        'users'
    );

    $ownerName = $invite['owner_name'] ?: $invite['owner_username'] ?: 'the team owner';
    jsonResponse(true, [
        'status' => 'active',
        'is_pro' => true
    ], "Invitation accepted! You now have full PRO access under {$ownerName}'s team.");

} else {
    // Decline / Reject: remove the invite so the seat is returned to the owner
    $delStmt = $pdo->prepare("DELETE FROM team_members WHERE id = ?");
    $delStmt->execute([$inviteId]);

    // Update invitee's original invite notification
    $updateInviteNotif('decline');

    // Notify the owner that their invite was declined
    createNotification(
        $pdo,
        'Team Invitation Declined',
        "{$responderName} ({$userEmail}) declined your team invitation. The seat has been returned.",
        'team_declined',
        (int)$invite['owner_user_id'],
        null,
        '/billing',
        null,
        'users'
    );

    jsonResponse(true, [
        'status' => 'declined'
    ], "Team invitation declined.");
}
