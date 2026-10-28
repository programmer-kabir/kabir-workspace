<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/cors.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    // 1. Find max ID
    $maxRes = $mysqli->query("SELECT MAX(id) AS max_id FROM investment_withdraw_requests WHERE id > 0");
    $maxRow = $maxRes->fetch_assoc();
    $nextId = max(1, intval($maxRow['max_id'] ?? 0) + 1);

    // 2. If any row has id = 0, update it to nextId
    $zeroRes = $mysqli->query("SELECT id FROM investment_withdraw_requests WHERE id = 0");
    $fixedZeroCount = 0;
    if ($zeroRes && $zeroRes->num_rows > 0) {
        $uStmt = $mysqli->prepare("UPDATE investment_withdraw_requests SET id = ? WHERE id = 0 LIMIT 1");
        $uStmt->bind_param("i", $nextId);
        $uStmt->execute();
        $fixedZeroCount = $uStmt->affected_rows;
        $uStmt->close();
        $nextId++;
    }

    // 3. Ensure id has AUTO_INCREMENT
    $mysqli->query("ALTER TABLE investment_withdraw_requests MODIFY COLUMN id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT");
    $mysqli->query("ALTER TABLE investment_withdraw_requests AUTO_INCREMENT = {$nextId}");

    echo json_encode([
        "success" => true,
        "message" => "Table checked and updated successfully!",
        "fixed_zero_id" => ($fixedZeroCount > 0 ? "ID 0 was changed to " . ($nextId - 1) : "No ID 0 found"),
        "next_auto_increment" => $nextId
    ], JSON_UNESCAPED_UNICODE);

} catch (\Throwable $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
