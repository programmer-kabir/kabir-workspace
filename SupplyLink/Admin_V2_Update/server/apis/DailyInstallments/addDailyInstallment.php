<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header('Content-Type: application/json; charset=UTF-8');
date_default_timezone_set('Asia/Dhaka');
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    // Only POST allowed
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            "success" => false,
            "message" => "Method not allowed. Use POST."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);
    if (!is_array($data) || empty($data)) {
        $data = $_POST;
    }

    $amount   = isset($data['amount']) ? (float)$data['amount'] : 0.0;
    $date     = isset($data['date']) ? trim($data['date']) : '';
    $receiver = isset($data['receiver']) ? trim((string)$data['receiver']) : '';
    $userId   = isset($data['userId']) ? (int)$data['userId'] : 0;
    $cardId   = isset($data['cardId']) ? (int)$data['cardId'] : 0;

    // VALIDATION
    if ($userId <= 0 || $cardId <= 0 || $amount <= 0 || empty($date) || empty($receiver)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "All fields (userId, cardId, amount, date, receiver) are required and must be valid!"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 🔥 DUPLICATE CHECK (Only 1 installment entry per card per date)
    $stmt = $mysqli->prepare("
        SELECT id FROM daily_installments 
        WHERE cardId = ? AND date = ? LIMIT 1
    ");
    $stmt->bind_param("is", $cardId, $date);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows > 0) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "এই কার্ডের জন্য ({$date}) তারিখে ইতিমধ্যে কিস্তি যুক্ত করা হয়েছে ❌"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $stmt->close();

    // 🔥 INSERT
    $stmt = $mysqli->prepare("
        INSERT INTO daily_installments 
        (userId, cardId, amount, date, receiver, created_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
    ");

    $stmt->bind_param("iidss", $userId, $cardId, $amount, $date, $receiver);
    $stmt->execute();

    $insertId = $stmt->insert_id;
    $stmt->close();

    // 🔥 FETCH CREATED RECORD
    $stmt = $mysqli->prepare("SELECT * FROM daily_installments WHERE id = ?");
    $stmt->bind_param("i", $insertId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($row) {
        $row['id']     = (int)$row['id'];
        $row['userId'] = (int)$row['userId'];
        $row['cardId'] = (int)$row['cardId'];
        $row['amount'] = (float)$row['amount'];
    }

    echo json_encode([
        "success" => true,
        "message" => "Payment Added Successfully ✅",
        "data"    => $row
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}