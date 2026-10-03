<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../helpers/cash_helper.php';

header('Content-Type: application/json; charset=UTF-8');
date_default_timezone_set('Asia/Dhaka');
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed. Use POST."], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);
    if (!is_array($data) || empty($data)) {
        $data = $_POST;
    }

    $id            = isset($data['id']) ? (int)$data['id'] : 0;
    $amount        = isset($data['amount']) ? (float)$data['amount'] : null;
    $date          = isset($data['date']) ? trim($data['date']) : '';
    $receiver      = isset($data['receiver']) ? trim((string)$data['receiver']) : '';
    $cardId        = isset($data['cardId']) ? (int)$data['cardId'] : 0;
    $updatedBy     = isset($data['updated_by']) ? (int)$data['updated_by'] : null;
    $updateReason  = trim($data['update_reason'] ?? '');

    // Validation
    if ($id <= 0 || $amount === null || $amount <= 0 || empty($date) || empty($receiver) || $cardId <= 0) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "All fields (id, amount, date, receiver, cardId) are required!"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Duplicate Check (same card + same date, except current row)
    $stmt = $mysqli->prepare("
        SELECT id
        FROM daily_installments
        WHERE cardId = ?
          AND date = ?
          AND id != ?
        LIMIT 1
    ");

    $stmt->bind_param("isi", $cardId, $date, $id);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows > 0) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "এই কার্ডের জন্য ({$date}) তারিখে ইতিমধ্যে অন্য একটি এন্ট্রি রয়েছে ❌"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $stmt->close();

    $updateAt = date("Y-m-d H:i:s");

    // Update
    $stmt = $mysqli->prepare("
        UPDATE daily_installments
        SET
            amount = ?,
            date = ?,
            receiver = ?,
            update_by = ?,
            update_at = ?,
            update_reason = ?
        WHERE id = ?
    ");

    $stmt->bind_param(
        "dssissi",
        $amount,
        $date,
        $receiver,
        $updatedBy,
        $updateAt,
        $updateReason,
        $id
    );

    $stmt->execute();
    $stmt->close();

    // Updated Data
    $stmt = $mysqli->prepare("SELECT * FROM daily_installments WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($row) {
        $row['id']     = (int)$row['id'];
        $row['userId'] = (int)$row['userId'];
        $row['cardId'] = (int)$row['cardId'];
        $row['amount'] = (float)$row['amount'];

        // Auto-sync with Cash In table
        syncDailyInstallmentCash($mysqli, $id, $row['cardId'], $row['userId'], $row['amount'], $row['date'], $row['receiver']);
    }

    echo json_encode([
        "success" => true,
        "message" => "Payment Updated Successfully ✅",
        "data"    => $row
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}