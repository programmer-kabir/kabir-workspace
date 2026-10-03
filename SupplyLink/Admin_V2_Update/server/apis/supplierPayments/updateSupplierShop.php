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

$id = intval($data["id"] ?? 0);
$shop_name = trim($data["shop_name"] ?? "");
$category = trim($data["category"] ?? "General Supplier");
$owner_name = trim($data["owner_name"] ?? "");
$phone = trim($data["phone"] ?? "");
$address = trim($data["address"] ?? "");

if ($id <= 0 || empty($shop_name)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "আইডি এবং দোকানের নাম আবশ্যক!"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Get previous shop name to sync supplier_payment if renamed
$oldShopResult = $mysqli->query("SELECT shop_name FROM supplier_shops WHERE id = {$id} LIMIT 1");
$oldShopRow = $oldShopResult ? $oldShopResult->fetch_assoc() : null;
$oldShopName = $oldShopRow ? $oldShopRow['shop_name'] : '';

$stmt = $mysqli->prepare("UPDATE supplier_shops SET shop_name = ?, category = ?, owner_name = ?, phone = ?, address = ? WHERE id = ?");
if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Prepare failed: " . $mysqli->error
    ]);
    exit;
}

$stmt->bind_param("sssssi", $shop_name, $category, $owner_name, $phone, $address, $id);

if ($stmt->execute()) {
    // If shop name changed, update supplier_payment table records as well
    if (!empty($oldShopName) && $oldShopName !== $shop_name) {
        $syncStmt = $mysqli->prepare("UPDATE supplier_payment SET shop_name = ?, supplier = ? WHERE shop_name = ?");
        if ($syncStmt) {
            $syncStmt->bind_param("sss", $shop_name, $owner_name, $oldShopName);
            $syncStmt->execute();
            $syncStmt->close();
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "সাপ্লায়ার তথ্য সফলভাবে আপডেট হয়েছে! ✅"
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        "success" => false,
        "message" => "আপডেট ব্যর্থ হয়েছে: " . $stmt->error
    ], JSON_UNESCAPED_UNICODE);
}

$stmt->close();
$mysqli->close();
