<?php
// backend/api/team/add.php
// Assigns a team seat to an invited colleague / designer email address

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../helpers/notifications.php';

$user = requireAuth($pdo);
$userId = (int)$user['id'];
$userEmail = strtolower(trim($user['email']));

$body = json_decode(file_get_contents('php://input'), true);
$rawIdentifier = trim($body['identifier'] ?? ($body['email'] ?? ($body['username'] ?? '')));
$rawIdentifier = ltrim($rawIdentifier, '@');

if (empty($rawIdentifier)) {
    jsonResponse(false, null, 'Please provide a valid email address or username.', 400);
}

$cleanLower = strtolower($rawIdentifier);

if ($cleanLower === strtolower($user['email']) || $cleanLower === strtolower($user['username'])) {
    jsonResponse(false, null, 'You are already the owner of this team.', 400);
}

// 1. Fetch owner's active team subscription
$stmtSub = $pdo->prepare("
    SELECT id, team_seats, status, ends_at
    FROM subscriptions
    WHERE user_id = ? AND plan_type = 'team' AND status = 'active' AND (ends_at IS NULL OR ends_at > NOW())
    ORDER BY id DESC LIMIT 1
");
$stmtSub->execute([$userId]);
$sub = $stmtSub->fetch(PDO::FETCH_ASSOC);

if (!$sub) {
    jsonResponse(false, null, 'No active team subscription found.', 403);
}

$subId = (int)$sub['id'];
$totalSeats = ((int)$sub['team_seats'] > 0) ? (int)$sub['team_seats'] : 8;

// 2. Count existing members
$stmtCount = $pdo->prepare("SELECT COUNT(*) FROM team_members WHERE subscription_id = ?");
$stmtCount->execute([$subId]);
$existingCount = (int)$stmtCount->fetchColumn();

// Owner is 1 seat, so remaining is totalSeats - (1 + existingCount)
if ((1 + $existingCount) >= $totalSeats) {
    jsonResponse(false, ['error_code' => 'SEATS_FULL'], "All {$totalSeats} team seats are already allocated. Upgrade your plan to add more seats.", 400);
}

// 3. User MUST be registered on IconBaba first (search by email OR username)
$stmtUser = $pdo->prepare("
    SELECT id, full_name, username, email 
    FROM users 
    WHERE LOWER(email) = ? OR LOWER(username) = ? 
    LIMIT 1
");
$stmtUser->execute([$cleanLower, $cleanLower]);
$registeredUser = $stmtUser->fetch(PDO::FETCH_ASSOC);

if (!$registeredUser) {
    jsonResponse(false, [
        'error_code' => 'USER_NOT_FOUND',
        'query' => $rawIdentifier
    ], "No registered account found with '{$rawIdentifier}'. Your teammate must create an account on IconBaba first before you can assign them a seat.", 404);
}

$registeredUserId = (int)$registeredUser['id'];
$canonicalEmail = strtolower($registeredUser['email']);
$displayName = $registeredUser['full_name'] ?: $registeredUser['username'];

// Verify they aren't the owner
if ($registeredUserId === $userId) {
    jsonResponse(false, null, 'You are already the owner of this team.', 400);
}

// 4. Check if user already assigned in this team
$stmtExists = $pdo->prepare("SELECT id FROM team_members WHERE subscription_id = ? AND (LOWER(member_email) = ? OR member_user_id = ?)");
$stmtExists->execute([$subId, $canonicalEmail, $registeredUserId]);
if ($stmtExists->fetchColumn()) {
    jsonResponse(false, ['error_code' => 'ALREADY_ASSIGNED'], "This user ({$displayName}) is already assigned to a seat in your team.", 400);
}

// 5. Insert member as status = 'pending'
$stmtInsert = $pdo->prepare("
    INSERT INTO team_members (subscription_id, owner_user_id, member_email, member_user_id, role, status, created_at)
    VALUES (?, ?, ?, ?, 'member', 'pending', NOW())
");
$stmtInsert->execute([$subId, $userId, $canonicalEmail, $registeredUserId]);
$newMemberId = (int)$pdo->lastInsertId();

// Trigger instant notification to the invited user
$ownerDisplayName = $user['full_name'] ?: $user['username'];
createNotification(
    $pdo,
    'Team Plan Invitation',
    "{$ownerDisplayName} invited you to join their Team Plan on IconBaba! Approve the invitation to activate unlimited PRO downloads.",
    'team_invite',
    $registeredUserId,
    null,
    '/billing',
    [
        'invite_id' => $newMemberId,
        'owner_name' => $ownerDisplayName,
        'owner_email' => $user['email']
    ],
    'users'
);

$stmtActiveCount = $pdo->prepare("SELECT COUNT(*) FROM team_members WHERE subscription_id = ? AND status = 'active'");
$stmtActiveCount->execute([$subId]);
$activeCount = (int)$stmtActiveCount->fetchColumn();

$stmtPendingCount = $pdo->prepare("SELECT COUNT(*) FROM team_members WHERE subscription_id = ? AND status = 'pending'");
$stmtPendingCount->execute([$subId]);
$pendingCount = (int)$stmtPendingCount->fetchColumn();

$activeSeats = 1 + $activeCount; // Owner + approved members
$remainingSeats = max(0, $totalSeats - ($activeSeats + $pendingCount));

jsonResponse(true, [
    'member_id' => (int)$pdo->lastInsertId(),
    'email' => $canonicalEmail,
    'username' => $registeredUser['username'],
    'name' => $displayName,
    'status' => 'pending',
    'total_seats' => $totalSeats,
    'used_seats' => $activeSeats,
    'pending_seats' => $pendingCount,
    'remaining_seats' => $remainingSeats
], "Invitation sent to {$displayName} ({$canonicalEmail})! The seat will be activated once they approve the invitation.");
