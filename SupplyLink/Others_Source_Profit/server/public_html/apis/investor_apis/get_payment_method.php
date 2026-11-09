<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
requireAuth();

header("Content-Type: application/json; charset=UTF-8");

$user = getAuthenticatedUser();
$user_id = isset($_GET['user_id']) ? (int)$_GET['user_id'] : (int)($user['id'] ?? 0);

if (!$user_id) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid user_id"]);
    exit;
}

$stmt = $mysqli->prepare("
    SELECT
        user_id,
        bank_name,
        bank_account_name,
        bank_account_number,
        bank_branch,
        bank_statement_image,
        bkash_number,
        nagad_number,
        rocket_number,
        updated_date,
        review,
        remarks,
        updated_time
    FROM payment_methods
    WHERE user_id = ?
    LIMIT 1
");

$stmt->bind_param("i", $user_id);
$stmt->execute();
$res = $stmt->get_result()->fetch_assoc();

echo json_encode([
    "success" => true,
    "data" => $res ?: null
], JSON_UNESCAPED_UNICODE);
