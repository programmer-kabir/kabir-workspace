<?php
require_once __DIR__ . '/../../helpers/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Only POST method is allowed', null, 405);
}

$input = getJsonInput();

$name      = trim($input['name'] ?? $input['displayName'] ?? '');
$email     = strtolower(trim($input['email'] ?? ''));
$phone     = trim($input['phone'] ?? '');
$playerUid = trim($input['playerUid'] ?? $input['uid'] ?? '');
$password  = $input['password'] ?? '';

// 1. Validation
if (empty($name)) {
    sendResponse(false, 'আপনার পুরো নাম লিখুন', null, 400);
}

if (empty($email) && empty($phone) && empty($playerUid)) {
    sendResponse(false, 'প্লেয়ার UID, ইমেইল অথবা মোবাইল নাম্বার দিতে হবে', null, 400);
}

if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(false, 'সঠিক ইমেইল এড্রেস লিখুন', null, 400);
}

if (strlen($password) < 6) {
    sendResponse(false, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে', null, 400);
}

// 2. Check if Email or Phone already registered
if (!empty($email)) {
    $checkEmail = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1");
    $checkEmail->execute([$email]);
    if ($checkEmail->fetch()) {
        sendResponse(false, 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে! সরাসরি লগইন করুন।', ['field' => 'email'], 409);
    }
}

if (!empty($phone)) {
    $checkPhone = $pdo->prepare("SELECT id FROM users WHERE phone = ? LIMIT 1");
    $checkPhone->execute([$phone]);
    if ($checkPhone->fetch()) {
        sendResponse(false, 'এই মোবাইল নাম্বার দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে!', ['field' => 'phone'], 409);
    }
}

// 3. Password Hashing (Bcrypt)
$passwordHash = password_hash($password, PASSWORD_BCRYPT);

// 4. Generate Unique User ID
$uid = 'usr_' . bin2hex(random_bytes(8));
$avatarSeed = !empty($email) ? md5($email) : md5($uid);
$photoUrl = "https://api.dicebear.com/7.x/bottts/svg?seed={$avatarSeed}";

// Check if Super Admin
$isSuperAdmin = ($email === 'jahidulr24@gmail.com' || $email === 'admin@topupbd.com');
$role = $isSuperAdmin ? 'admin' : 'user';

// If email is empty, create an identifier email for the account
$finalEmail = $email ?: (!empty($phone) ? "{$phone}@topupbd.com" : "{$playerUid}@topupbd.com");

// 5. Insert User into MySQL `users` Table
try {
    $insertStmt = $pdo->prepare("
        INSERT INTO users (uid, display_name, email, phone, password_hash, role, wallet_balance, photo_url)
        VALUES (?, ?, ?, ?, ?, ?, 0.00, ?)
    ");
    $insertStmt->execute([$uid, $name, $finalEmail, $phone, $passwordHash, $role, $photoUrl]);

    // If playerUid was provided, register in `players` table too!
    if (!empty($playerUid)) {
        try {
            $playerStmt = $pdo->prepare("
                INSERT INTO players (user_id, player_uid, player_nickname, game_name, server_name)
                VALUES (?, ?, ?, 'Free Fire', 'BD Server')
                ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
            ");
            $playerStmt->execute([$uid, $playerUid, $name]);
        } catch (Exception $e) {
            // ignore duplicate
        }
    }

    $userData = [
        'uid' => $uid,
        'displayName' => $name,
        'email' => $finalEmail,
        'phone' => $phone,
        'playerUid' => $playerUid,
        'role' => $role,
        'walletBalance' => 0.00,
        'photoURL' => $photoUrl,
        'createdAt' => date('c')
    ];

    sendResponse(true, 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! স্বাগতম TopUp BD তে।', $userData, 201);
} catch (Exception $e) {
    sendResponse(false, 'রেজিস্ট্রেশন করতে সমস্যা হয়েছে: ' . $e->getMessage(), null, 500);
}
