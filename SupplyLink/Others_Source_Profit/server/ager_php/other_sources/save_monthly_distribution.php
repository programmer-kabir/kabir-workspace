<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$raw = file_get_contents("php://input");
$body = json_decode($raw, true);

if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid JSON payload"]);
    exit;
}

$billing_month          = trim($body['billing_month'] ?? '');
$card_profit            = floatval($body['card_profit'] ?? 0);
$others_profit          = floatval($body['others_profit'] ?? 0);
$others_investor_percent= floatval($body['others_investor_percent'] ?? 70);
$others_investor_pool   = floatval($body['others_investor_pool'] ?? 0);
$others_company_pool    = floatval($body['others_company_pool'] ?? 0);

$rental_profit          = floatval($body['rental_profit'] ?? 0);
$rental_investor_percent= floatval($body['rental_investor_percent'] ?? $others_investor_percent);
$rental_investor_pool   = floatval($body['rental_investor_pool'] ?? 0);
$rental_company_pool    = floatval($body['rental_company_pool'] ?? 0);

$share_profit           = floatval($body['share_profit'] ?? 0);
$share_investor_percent = floatval($body['share_investor_percent'] ?? $others_investor_percent);
$share_investor_pool    = floatval($body['share_investor_pool'] ?? 0);
$share_company_pool     = floatval($body['share_company_pool'] ?? 0);

$total_investor_pool    = floatval($body['total_investor_pool'] ?? 0);

if (!preg_match('/^\d{4}-\d{2}$/', $billing_month)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid billing month. Format must be YYYY-MM"]);
    exit;
}

$stmt = $mysqli->prepare("
    INSERT INTO other_source_monthly_distributions
        (billing_month, card_profit, others_profit, others_investor_percent, others_investor_pool, others_company_pool, 
         rental_profit, rental_investor_percent, rental_investor_pool, rental_company_pool,
         share_profit, share_investor_percent, share_investor_pool, share_company_pool,
         total_investor_pool)
    VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        card_profit             = VALUES(card_profit),
        others_profit           = VALUES(others_profit),
        others_investor_percent = VALUES(others_investor_percent),
        others_investor_pool    = VALUES(others_investor_pool),
        others_company_pool     = VALUES(others_company_pool),
        rental_profit           = VALUES(rental_profit),
        rental_investor_percent = VALUES(rental_investor_percent),
        rental_investor_pool    = VALUES(rental_investor_pool),
        rental_company_pool     = VALUES(rental_company_pool),
        share_profit            = VALUES(share_profit),
        share_investor_percent  = VALUES(share_investor_percent),
        share_investor_pool     = VALUES(share_investor_pool),
        share_company_pool      = VALUES(share_company_pool),
        total_investor_pool     = VALUES(total_investor_pool),
        updated_at              = CURRENT_TIMESTAMP
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Prepare failed: " . $mysqli->error]);
    exit;
}

$stmt->bind_param(
    "sdddddddddddddd",
    $billing_month,
    $card_profit,
    $others_profit,
    $others_investor_percent,
    $others_investor_pool,
    $others_company_pool,
    $rental_profit,
    $rental_investor_percent,
    $rental_investor_pool,
    $rental_company_pool,
    $share_profit,
    $share_investor_percent,
    $share_investor_pool,
    $share_company_pool,
    $total_investor_pool
);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Monthly Others Source & Business Share distribution saved successfully",
        "billing_month" => $billing_month
    ], JSON_UNESCAPED_UNICODE);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Execution failed: " . $stmt->error]);
}
$stmt->close();
