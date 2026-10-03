<?php

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "POST method only"
    ]);
    exit;
}

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);
if (!$data) {
    $data = $_POST;
}

$shop_name = trim($data["shop_name"] ?? "");
$category = trim($data["category"] ?? "General Supplier");
$owner_name = trim($data["owner_name"] ?? "");
$phone = trim($data["phone"] ?? "");
$address = trim($data["address"] ?? "");
$initial_due = floatval($data["initial_due"] ?? 0);

if (empty($shop_name)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "দোকান বা সাপ্লায়ারের নাম প্রদান করা আবশ্যক!"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 1. Ensure table exists
$mysqli->query("CREATE TABLE IF NOT EXISTS supplier_shops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_name VARCHAR(150) NOT NULL,
    category VARCHAR(100) DEFAULT 'General Supplier',
    owner_name VARCHAR(100) NULL,
    phone VARCHAR(50) NULL,
    address VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (shop_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

$stmt = $mysqli->prepare("INSERT INTO supplier_shops (shop_name, category, owner_name, phone, address) VALUES (?, ?, ?, ?, ?)");
if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Prepare failed: " . $mysqli->error
    ]);
    exit;
}

$stmt->bind_param("sssss", $shop_name, $category, $owner_name, $phone, $address);

if ($stmt->execute()) {
    $newShopId = $stmt->insert_id;

    // If initial due is provided, create an opening balance memo
    if ($initial_due > 0) {
        $memo_no = "OPENING-" . time();
        $date = date("Y-m-d");
        $brand = "Previous Due";
        $total_amount = $initial_due;
        $paid = 0;
        $due = $initial_due;
        $remarks = "পূর্বের প্রারম্ভিক বকেয়া (Opening Due Balance)";

        $initStmt = $mysqli->prepare("INSERT INTO supplier_payment (memo_no, date, shop_name, supplier, brand, total_amount, paid, due, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        if ($initStmt) {
            $initStmt->bind_param("sssssddds", $memo_no, $date, $shop_name, $owner_name, $brand, $total_amount, $paid, $due, $remarks);
            $initStmt->execute();
            $initStmt->close();
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "সাপ্লায়ার / দোকান সফলভাবে তৈরি হয়েছে! ✅",
        "id" => $newShopId
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        "success" => false,
        "message" => "দোকান তৈরি করা সম্ভব হয়নি (সম্ভবত এই নামে দোকান ইতিমধ্যে রয়েছে): " . $stmt->error
    ], JSON_UNESCAPED_UNICODE);
}

$stmt->close();
$mysqli->close();
