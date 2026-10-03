<?php

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json");

// Disable default mysqli exception mode to prevent unhandled 500 errors
if (function_exists('mysqli_report')) {
    mysqli_report(MYSQLI_REPORT_OFF);
}

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

try {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);
    if (!$data) {
        $data = $_POST;
    }

    $shop_name = trim($data["shop_name"] ?? "");
    $amount = floatval($data["amount"] ?? 0);
    $date = trim($data["date"] ?? date("Y-m-d"));
    if (empty($date)) $date = date("Y-m-d");
    $payment_method = trim($data["payment_method"] ?? "Cash");
    $remarks = trim($data["remarks"] ?? "");
    $auto_cash_out = isset($data["auto_cash_out"]) ? filter_var($data["auto_cash_out"], FILTER_VALIDATE_BOOLEAN) : true;

    if (empty($shop_name) || $amount <= 0) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "দোকানের নাম এবং পরিশোধের টাকার পরিমাণ প্রদান করা আবশ্যক!"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Safely get owner name if supplier_shops exists
    $supplier_owner = $shop_name;
    try {
        $shopResult = @$mysqli->query("SELECT owner_name FROM supplier_shops WHERE LOWER(TRIM(shop_name)) = LOWER(TRIM('" . $mysqli->real_escape_string($shop_name) . "')) LIMIT 1");
        if ($shopResult && $shopRow = $shopResult->fetch_assoc()) {
            if (!empty($shopRow['owner_name']) && $shopRow['owner_name'] !== '-') {
                $supplier_owner = $shopRow['owner_name'];
            }
        }
    } catch (Throwable $t) {}

    // Auto fix missing AUTO_INCREMENT on table if needed
    try {
        @$mysqli->query("ALTER TABLE supplier_payment MODIFY id INT NOT NULL AUTO_INCREMENT");
    } catch (Throwable $t) {}

    // Calculate next safe ID in case AUTO_INCREMENT is missing
    $nextIdRes = $mysqli->query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM supplier_payment");
    $nextIdRow = $nextIdRes ? $nextIdRes->fetch_assoc() : null;
    $nextId = $nextIdRow ? (int)$nextIdRow['next_id'] : 1;
    if ($nextId <= 0) $nextId = 1;

    // 1. Create a payment ledger entry
    $memo_no = "PAY-" . time();
    $fullRemarks = "বকেয়া পরিশোধ (" . $payment_method . ")" . ($remarks ? ": " . $remarks : "");
    $brand = "Payment / পরিশোধ";
    $zeroAmount = 0.0;
    $dueVal = -$amount;
    $emptyImage = "";

    // In ledger: total_amount = 0, paid = $amount, due = -$amount, image = ""
    $stmt = $mysqli->prepare("INSERT INTO supplier_payment (id, memo_no, date, shop_name, supplier, brand, total_amount, paid, due, image, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    if (!$stmt) {
        // Fallback without image column if it doesn't match
        $stmt = $mysqli->prepare("INSERT INTO supplier_payment (memo_no, date, shop_name, supplier, brand, total_amount, paid, due, image, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        if ($stmt) {
            $stmt->bind_param("sssssdddss", $memo_no, $date, $shop_name, $supplier_owner, $brand, $zeroAmount, $amount, $dueVal, $emptyImage, $fullRemarks);
        } else {
            $stmt = $mysqli->prepare("INSERT INTO supplier_payment (memo_no, date, shop_name, supplier, brand, total_amount, paid, due, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssssddds", $memo_no, $date, $shop_name, $supplier_owner, $brand, $zeroAmount, $amount, $dueVal, $fullRemarks);
        }
    } else {
        $stmt->bind_param("isssssdddss", $nextId, $memo_no, $date, $shop_name, $supplier_owner, $brand, $zeroAmount, $amount, $dueVal, $emptyImage, $fullRemarks);
    }

    if (!$stmt->execute()) {
        echo json_encode([
            "success" => false,
            "message" => "পেমেন্ট সম্পন্ন করতে ব্যর্থ: " . $stmt->error
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $paymentId = $stmt->insert_id ?: $nextId;
    $stmt->close();

    // Log history
    try {
        @$mysqli->query("CREATE TABLE IF NOT EXISTS supplier_payment_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            payment_id INT NOT NULL,
            action VARCHAR(50) DEFAULT 'Payment',
            changes JSON NULL,
            note VARCHAR(255) NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX (payment_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        @$mysqli->query("ALTER TABLE supplier_payment_history MODIFY id INT NOT NULL AUTO_INCREMENT");

        $nextHistRes = $mysqli->query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM supplier_payment_history");
        $nextHistRow = $nextHistRes ? $nextHistRes->fetch_assoc() : null;
        $nextHistId = $nextHistRow ? (int)$nextHistRow['next_id'] : 1;

        $note = "বকেয়া পরিশোধ ৳ " . number_format($amount) . " সম্পন্ন (" . $payment_method . ")";
        $histStmt = $mysqli->prepare("INSERT INTO supplier_payment_history (id, payment_id, action, note) VALUES (?, ?, 'Payment', ?)");
        if ($histStmt) {
            $histStmt->bind_param("iis", $nextHistId, $paymentId, $note);
            $histStmt->execute();
            $histStmt->close();
        }
    } catch (Throwable $t) {}

    echo json_encode([
        "success" => true,
        "message" => "বকেয়া পরিশোধ সফলভাবে সম্পন্ন হয়েছে! ৳ " . number_format($amount),
        "id" => $paymentId
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "সার্ভার এরর: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

$mysqli->close();

