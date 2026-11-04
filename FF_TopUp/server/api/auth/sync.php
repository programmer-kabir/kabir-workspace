<?php
require_once __DIR__ . '/../../helpers/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Only POST method is allowed', null, 405);
}

$input = getJsonInput();

$uid         = trim($input['uid'] ?? '');
$displayName = trim($input['displayName'] ?? 'BD Gamer');
$email       = strtolower(trim($input['email'] ?? ''));
$photoUrl    = trim($input['photoURL'] ?? '');
$phone       = trim($input['phone'] ?? '');

if (empty($uid)) {
    sendResponse(false, 'UID is required for sync', null, 400);
}

// Super admin rule
$isSuperAdmin = ($email === 'jahidulr24@gmail.com' || $email === 'admin@topupbd.com');
$role = $isSuperAdmin ? 'admin' : 'user';

try {
    // 1. Check if user exists by UID or Email
    $stmt = $pdo->prepare("SELECT * FROM users WHERE uid = ? OR (email != '' AND LOWER(email) = ?) LIMIT 1");
    $stmt->execute([$uid, $email]);
    $existing = $stmt->fetch();

    if ($existing) {
        $finalRole = $isSuperAdmin ? 'admin' : ($existing['role'] ?? 'user');
        $update = $pdo->prepare("
            UPDATE users SET 
                display_name = COALESCE(NULLIF(?, ''), display_name),
                email = COALESCE(NULLIF(?, ''), email),
                photo_url = COALESCE(NULLIF(?, ''), photo_url),
                role = ?,
                last_active = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        $update->execute([$displayName, $email, $photoUrl, $finalRole, $existing['id']]);

        $userData = [
            'uid' => $existing['uid'],
            'displayName' => $displayName ?: $existing['display_name'],
            'email' => $email ?: $existing['email'],
            'phone' => $existing['phone'],
            'role' => $finalRole,
            'walletBalance' => (float)$existing['wallet_balance'],
            'photoURL' => $photoUrl ?: $existing['photo_url']
        ];
        sendResponse(true, 'User synced with database', $userData, 200);
    } else {
        // Insert new user
        $insert = $pdo->prepare("
            INSERT INTO users (uid, display_name, email, phone, role, wallet_balance, photo_url)
            VALUES (?, ?, ?, ?, ?, 0.00, ?)
        ");
        $insert->execute([$uid, $displayName, $email, $phone, $role, $photoUrl]);

        $userData = [
            'uid' => $uid,
            'displayName' => $displayName,
            'email' => $email,
            'phone' => $phone,
            'role' => $role,
            'walletBalance' => 0.00,
            'photoURL' => $photoUrl
        ];
        sendResponse(true, 'User created and synced with database', $userData, 201);
    }
} catch (Exception $e) {
    sendResponse(false, 'Failed to sync user: ' . $e->getMessage(), null, 500);
}

