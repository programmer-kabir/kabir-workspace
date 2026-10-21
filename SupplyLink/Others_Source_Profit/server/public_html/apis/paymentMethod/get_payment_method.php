<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json");

// ===== ERROR HANDLER =====
function apiError($message, $debug = null, $code = 400) {
    http_response_code($code);
    echo json_encode([
        "success" => false,
        "message" => $message,
        "debug" => $debug
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// ===== INPUT =====
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if (!$user_id) {
    apiError("Invalid user_id");
}

// ===== QUERY =====
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

if (!$stmt->execute()) {
    apiError("Query failed", $stmt->error);
}

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => true,
        "data" => null,
        "message" => "No payment method found"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$row = $result->fetch_assoc();

// ===== BUILD RESPONSE =====
$response = [
    "user_id" => (int)$row["user_id"],
    "review"=> $row["review"],
    "remarks"=> $row["remarks"],
    "bank" => [
        "bank_name" => $row["bank_name"],
        "bank_account_name" => $row["bank_account_name"],
        "bank_account_number" => $row["bank_account_number"],
        "bank_branch" => $row["bank_branch"],
        "bank_statement_image" => $row["bank_statement_image"],
    ],

    "mobile_wallet" => [
        "bkash" => $row["bkash_number"],
        "nagad" => $row["nagad_number"],
        "rocket" => $row["rocket_number"],
    ],

    "updated_at" => $row["updated_date"]
        ? $row["updated_date"] . " " . $row["updated_time"]
        : null
];

echo json_encode([
    "success" => true,
    "data" => $response
], JSON_UNESCAPED_UNICODE);
