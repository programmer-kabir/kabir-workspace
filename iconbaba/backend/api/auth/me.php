<?php
// backend/api/auth/me.php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$user = requireAuth($pdo);

// Get favorites count and collections count for this user
$favStmt = $pdo->prepare("SELECT COUNT(*) FROM favorites WHERE user_id = :uid");
$favStmt->execute([':uid' => $user['id']]);
$favoritesCount = (int)$favStmt->fetchColumn();

$colStmt = $pdo->prepare("SELECT COUNT(*) FROM collections WHERE user_id = :uid");
$colStmt->execute([':uid' => $user['id']]);
$collectionsCount = (int)$colStmt->fetchColumn();

$downStmt = $pdo->prepare("SELECT COUNT(*) FROM downloads WHERE user_id = :uid");
$downStmt->execute([':uid' => $user['id']]);
$downloadsCount = (int)$downStmt->fetchColumn();

// Fetch active subscription if valid and not expired
$subStmt = $pdo->prepare("
    SELECT id, plan_type, team_seats, status, renews_at, ends_at, customer_portal_url
    FROM subscriptions 
    WHERE user_id = :uid AND status = 'active' AND (ends_at IS NULL OR ends_at > NOW())
    ORDER BY id DESC LIMIT 1
");
$subStmt->execute([':uid' => $user['id']]);
$activeSub = $subStmt->fetch(PDO::FETCH_ASSOC);

// If user does not have a direct subscription, check if they are an active assigned team member
if (!$activeSub) {
    try {
        $teamSubStmt = $pdo->prepare("
            SELECT s.id, s.plan_type, s.team_seats, s.status, s.renews_at, s.ends_at, s.customer_portal_url
            FROM team_members tm
            JOIN subscriptions s ON tm.subscription_id = s.id
            WHERE (tm.member_user_id = :uid OR LOWER(tm.member_email) = LOWER(:email))
              AND (tm.status = 'active' OR tm.status IS NULL)
              AND s.status = 'active' AND (s.ends_at IS NULL OR s.ends_at > NOW())
            ORDER BY s.id DESC LIMIT 1
        ");
        $teamSubStmt->execute([':uid' => $user['id'], ':email' => $user['email']]);
        $teamSub = $teamSubStmt->fetch(PDO::FETCH_ASSOC);
        if ($teamSub) {
            $activeSub = $teamSub;
            $activeSub['is_team_member'] = true;
        }
    } catch (Exception $e) {
        // Ignore if team_members table is not yet migrated
    }
}

// Check for any pending team invitations waiting for this user's approval
$pendingInvites = [];
try {
    $invStmt = $pdo->prepare("
        SELECT tm.id AS invite_id, tm.created_at, tm.subscription_id,
               s.plan_type, s.team_seats,
               owner.full_name AS owner_name, owner.username AS owner_username, owner.email AS owner_email
        FROM team_members tm
        JOIN subscriptions s ON tm.subscription_id = s.id
        JOIN users owner ON tm.owner_user_id = owner.id
        WHERE (tm.member_user_id = :uid OR LOWER(tm.member_email) = LOWER(:email))
          AND tm.status = 'pending'
          AND s.status = 'active' AND (s.ends_at IS NULL OR s.ends_at > NOW())
        ORDER BY tm.id DESC
    ");
    $invStmt->execute([':uid' => $user['id'], ':email' => $user['email']]);
    $pendingInvites = $invStmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {}

$roles = getUserRoles($user);
$isPro = ($activeSub !== false) || in_array('admin', $roles);

jsonResponse(true, [
    'user' => [
        'id' => (int)$user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'full_name' => $user['full_name'] ?: $user['username'],
        'avatar_url' => $user['avatar_url'],
        'role' => $user['role'],
        'roles' => $roles,
        'is_pro' => $isPro,
        'subscription' => $activeSub ? [
            'id' => (int)$activeSub['id'],
            'plan_type' => $activeSub['plan_type'],
            'team_seats' => (int)$activeSub['team_seats'],
            'status' => $activeSub['status'],
            'renews_at' => $activeSub['renews_at'],
            'ends_at' => $activeSub['ends_at'],
            'customer_portal_url' => $activeSub['customer_portal_url']
        ] : null,
        'pending_invites' => $pendingInvites,
        'created_at' => $user['created_at'],
        'stats' => [
            'favorites_count' => $favoritesCount,
            'collections_count' => $collectionsCount,
            'downloads_count' => $downloadsCount
        ]
    ]
]);
