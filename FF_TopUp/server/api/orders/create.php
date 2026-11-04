<?php
require_once __DIR__ . '/../../helpers/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Only POST method is allowed', null, 405);
}

$input = getJsonInput();

$uid             = trim($input['uid'] ?? '');
$playerNickname  = trim($input['playerNickname'] ?? 'BD_WARRIOR');
$gameName        = trim($input['gameName'] ?? 'Free Fire');
$serverName      = trim($input['server'] ?? 'BD Server');
$packageId       = trim($input['packageId'] ?? '');
$amount          = (float)($input['amount'] ?? 0);
$method          = trim($input['method'] ?? 'bKash');
$senderNumber    = trim($input['senderNumber'] ?? '');
$trxId           = trim($input['trxId'] ?? '');
$userId          = trim($input['userId'] ?? 'guest');

// 1. Validations
if (empty($uid) || strlen($uid) < 6 || !ctype_digit($uid)) {
    sendResponse(false, 'সঠিক ৮-১০ ডিজিটের প্লেয়ার UID দিন (শুধুমাত্র সংখ্যা)', null, 400);
}

if (empty($packageId)) {
    sendResponse(false, 'প্যাকেজ সিলেক্ট করুন', null, 400);
}

if (empty($trxId)) {
    sendResponse(false, 'TrxID দিতে হবে', null, 400);
}

$cleanTrx = strtoupper(trim($trxId));

// 2. Anti-fraud Duplicate TrxID Check
$checkStmt = $pdo->prepare("SELECT id, status, created_at FROM orders WHERE UPPER(trx_id) = ? LIMIT 1");
$checkStmt->execute([$cleanTrx]);
$existingOrder = $checkStmt->fetch();

if ($existingOrder) {
    sendResponse(false, '⚠️ এই TrxID দিয়ে ইতিমধ্যে একটি অর্ডার রয়েছে (অর্ডার নং: ' . $existingOrder['id'] . ')! একই TrxID বারবার ব্যবহার করা যাবে না।', [
        'reason' => 'duplicate_trx',
        'existing_order_id' => $existingOrder['id']
    ], 409);
}

// 3. Verify Package & Fetch Canonical Details
$pkgStmt = $pdo->prepare("
    SELECT pkg.*, p.title AS product_name, p.category 
    FROM packages pkg 
    JOIN products p ON pkg.product_id = p.id 
    WHERE pkg.id = ? AND pkg.is_active = 1 
    LIMIT 1
");
$pkgStmt->execute([$packageId]);
$pkg = $pkgStmt->fetch();

if (!$pkg) {
    sendResponse(false, 'সিলেক্ট করা প্যাকেজটি খুঁজে পাওয়া যায়নি', null, 404);
}

if ($amount <= 0) {
    $amount = (float)$pkg['price'];
}

// 4. Save or Update in Dedicated `players` Table
$playerId = null;
try {
    $playerUpsert = $pdo->prepare("
        INSERT INTO players (user_id, player_uid, player_nickname, game_name, server_name)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            player_nickname = VALUES(player_nickname),
            updated_at = CURRENT_TIMESTAMP
    ");
    $playerUpsert->execute([$userId, $uid, $playerNickname, $gameName, $serverName]);

    // Get the player's primary key ID
    $getPlayerStmt = $pdo->prepare("SELECT id FROM players WHERE user_id = ? AND player_uid = ? LIMIT 1");
    $getPlayerStmt->execute([$userId, $uid]);
    $playerRow = $getPlayerStmt->fetch();
    if ($playerRow) {
        $playerId = (int)$playerRow['id'];
    }
} catch (Exception $e) {
    // Graceful fallback
}

// 5. Generate Order ID
$orderId = 'TOP-' . mt_rand(10000, 99999);

// 6. Clean Insert into Normalized `orders` Table
try {
    $status = ($method === 'Wallet Balance') ? 'Processing' : 'Pending';

    $insertStmt = $pdo->prepare("
        INSERT INTO orders (
            id, user_id, player_id, player_uid, package_id,
            amount, payment_method, sender_number, trx_id, status
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?
        )
    ");

    $insertStmt->execute([
        $orderId, $userId, $playerId, $uid, $packageId,
        $amount, $method, $senderNumber, $cleanTrx, $status
    ]);

    $orderData = [
        'id' => $orderId,
        'userId' => $userId,
        'playerId' => $playerId,
        'uid' => $uid,
        'playerNickname' => $playerNickname,
        'game' => $gameName,
        'server' => $serverName,
        'packageId' => $packageId,
        'packageName' => $pkg['name'],
        'productName' => $pkg['product_name'],
        'diamonds' => (int)$pkg['diamonds'],
        'amount' => $amount,
        'method' => $method,
        'senderNumber' => $senderNumber,
        'trxId' => $cleanTrx,
        'status' => $status,
        'createdAt' => date('c')
    ];

    sendResponse(true, 'অর্ডার সফলভাবে গ্রহণ করা হয়েছে! ১-৩ মিনিটের মধ্যে ডায়মন্ড পাঠানো হবে।', $orderData, 201);
} catch (Exception $e) {
    sendResponse(false, 'অর্ডার সেভ করতে সমস্যা হয়েছে: ' . $e->getMessage(), null, 500);
}
