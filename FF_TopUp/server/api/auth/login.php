<?php
require_once __DIR__ . '/../../helpers/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Only POST method is allowed', null, 405);
}

$input = getJsonInput();

// Identifier can be Email, Phone, Account UID, or in-game Player UID!
$identifier = strtolower(trim($input['identifier'] ?? $input['email'] ?? $input['uid'] ?? ''));
$password   = $input['password'] ?? '';

if (empty($identifier)) {
    sendResponse(false, 'প্লেয়ার UID, ইমেইল অথবা মোবাইল নাম্বার লিখুন', null, 400);
}

if (empty($password)) {
    sendResponse(false, 'পাসওয়ার্ড দিন', null, 400);
}

try {
    // 1. Search user by Email, Phone, Account UID, OR Player UID in `players` table
    $stmt = $pdo->prepare("
        SELECT u.* FROM users u
        LEFT JOIN players p ON p.user_id = u.uid
        WHERE LOWER(u.email) = ? 
           OR u.phone = ? 
           OR u.uid = ? 
           OR p.player_uid = ?
        LIMIT 1
    ");
    $stmt->execute([$identifier, $identifier, $identifier, $identifier]);
    $user = $stmt->fetch();

    if (!$user) {
        sendResponse(false, 'এই UID বা ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি! সঠিক তথ্য দিন বা নতুন অ্যাকাউন্ট খুলুন।', null, 404);
    }

    // 2. Super Admin Initial Password Fallback (admin123 or whatever admin enters if hash is NULL)
    $isSuperAdmin = ($user['role'] === 'admin' || $user['email'] === 'jahidulr24@gmail.com' || $user['email'] === 'admin@topupbd.com');
    $passwordValid = false;

    if (!empty($user['password_hash'])) {
        $passwordValid = password_verify($password, $user['password_hash']);
    } elseif ($isSuperAdmin) {
        // If super admin has no password hash yet, set it to the provided password or admin123
        $newHash = password_hash($password, PASSWORD_BCRYPT);
        $updateHash = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $updateHash->execute([$newHash, $user['id']]);
        $passwordValid = true;
    }

    if (!$passwordValid) {
        sendResponse(false, 'ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।', null, 401);
    }

    // 3. Update Last Active
    $updateStmt = $pdo->prepare("UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?");
    $updateStmt->execute([$user['id']]);

    // 4. Fetch linked player profiles if any
    $playersStmt = $pdo->prepare("SELECT player_uid, player_nickname, game_name FROM players WHERE user_id = ?");
    $playersStmt->execute([$user['uid']]);
    $savedPlayers = $playersStmt->fetchAll();

    $userData = [
        'uid' => $user['uid'],
        'displayName' => $user['display_name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'role' => $user['role'],
        'walletBalance' => (float)$user['wallet_balance'],
        'photoURL' => $user['photo_url'] ?: "https://api.dicebear.com/7.x/bottts/svg?seed=" . md5($user['uid']),
        'savedPlayers' => $savedPlayers,
        'createdAt' => $user['created_at'],
        'token' => 'topup_session_' . bin2hex(random_bytes(16))
    ];

    sendResponse(true, 'লগইন সফল হয়েছে! স্বাগতম, ' . $user['display_name'], $userData, 200);
} catch (Exception $e) {
    sendResponse(false, 'লগইন করতে সমস্যা হয়েছে: ' . $e->getMessage(), null, 500);
}
