<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/FirebaseJWT.php';

header('Content-Type: application/json');

// --- Auth Check ---
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$token = '';
if (!empty($authHeader) && str_starts_with($authHeader, 'Bearer ')) {
    $token = trim(str_replace('Bearer ', '', $authHeader));
} elseif (!empty($_GET['token'])) {
    $token = trim($_GET['token']);
}

if (empty($token)) {
    http_response_code(401);
    exit(json_encode(["success" => false, "message" => "Unauthorized: Missing token"]));
}

try {
    $payload = FirebaseJWT::verifyIdToken($token);
    $email = $payload['email'] ?? null;
    if (!$email) throw new Exception("Email not found in token");
} catch (Exception $e) {
    http_response_code(401);
    exit(json_encode(["success" => false, "message" => "Unauthorized: " . $e->getMessage()]));
}

// Get user ID
$user_stmt = $mysqli->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
$user_stmt->bind_param("s", $email);
$user_stmt->execute();
$user_res = $user_stmt->get_result();
if ($user_res->num_rows === 0) {
    http_response_code(404);
    exit(json_encode(["success" => false, "message" => "User not found"]));
}
$user = $user_res->fetch_assoc();
$user_id = $user['id'];

// --- Get POST Data ---
$input = json_decode(file_get_contents("php://input"), true);
$content_id = isset($input['content_id']) ? intval($input['content_id']) : 0;

if ($content_id <= 0) {
    http_response_code(400);
    exit(json_encode(["success" => false, "message" => "Invalid content ID"]));
}

// Check if content exists and is available
$content_stmt = $mysqli->prepare("SELECT id, author_id, exclusive_price, is_exclusive_sold FROM contents WHERE id = ? LIMIT 1");
$content_stmt->bind_param("i", $content_id);
$content_stmt->execute();
$content_res = $content_stmt->get_result();

if ($content_res->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Content not found"]);
    exit;
}

$content = $content_res->fetch_assoc();

if ($content['is_exclusive_sold']) {
    echo json_encode(["success" => false, "message" => "Content is already sold."]);
    exit;
}

if (empty($content['exclusive_price']) || $content['exclusive_price'] <= 0) {
    echo json_encode(["success" => false, "message" => "This content is not available for exclusive buyout."]);
    exit;
}

$price = $content['exclusive_price'];
$author_id = $content['author_id'];

// Start Transaction
$mysqli->begin_transaction();

try {
    // 1. Mark content as sold
    $update_content = $mysqli->prepare("UPDATE contents SET is_exclusive_sold = 1, status = 'exclusive_buyout' WHERE id = ?");
    $update_content->bind_param("i", $content_id);
    $update_content->execute();

    // 2. Insert into exclusive_buyouts (Temporarily empty transaction_id)
    $insert_buyout = $mysqli->prepare("INSERT INTO exclusive_buyouts (user_id, content_id, amount, transaction_id, status) VALUES (?, ?, ?, '', 'completed')");
    $insert_buyout->bind_param("iid", $user_id, $content_id, $price);
    $insert_buyout->execute();
    $buyout_id = $mysqli->insert_id;

    // 3. Insert into global payment transactions table for accounting
    $tx_id = "TX_DEMO_" . time() . rand(1000, 9999);
    $insert_transaction = $mysqli->prepare("INSERT INTO payment_transactions (user_id, amount, transaction_id, payment_source, source_id, payment_method, status) VALUES (?, ?, ?, 'exclusive_buyout', ?, 'stripe', 'verified')");
    $insert_transaction->bind_param("idsi", $user_id, $price, $tx_id, $buyout_id);
    $insert_transaction->execute();
    $payment_transaction_id = $mysqli->insert_id;

    // Update exclusive_buyouts with the payment_transactions ID
    $update_buyout = $mysqli->prepare("UPDATE exclusive_buyouts SET transaction_id = ? WHERE id = ?");
    $update_buyout->bind_param("si", $payment_transaction_id, $buyout_id);
    $update_buyout->execute();

    // 4. Record 100% Company/Admin earnings for the buyout (Staff model - 0% contributor split)
    $company_cut = $price; // 100% to admin
    $earning_month = date('Y-m');
    $company_earnings_sql = "
        INSERT INTO company_earnings 
        (transaction_type, source_id, total_amount, company_earned, status, earning_month, created_at) 
        VALUES ('buyout', ?, ?, ?, 'completed', ?, NOW())
    ";
    $company_stmt = $mysqli->prepare($company_earnings_sql);
    $company_stmt->bind_param("idds", $buyout_id, $price, $company_cut, $earning_month);
    $company_stmt->execute();

    // Commit Transaction
    $mysqli->commit();

    echo json_encode([
        "success" => true,
        "message" => "Payment successful! Exclusive rights purchased.",
        "transaction_id" => $tx_id
    ]);

} catch (Exception $e) {
    $mysqli->rollback();
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
