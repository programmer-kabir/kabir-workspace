<?php
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$response = ["success" => true, "actions" => []];

// 1. Check if is_daily column exists in installment_cards
$colCheck = $mysqli->query("SHOW COLUMNS FROM installment_cards LIKE 'is_daily'");
if ($colCheck->num_rows === 0) {
    $alter = $mysqli->query("ALTER TABLE installment_cards ADD COLUMN is_daily TINYINT(1) NOT NULL DEFAULT 0 AFTER remarks");
    if ($alter) {
        $response["actions"][] = "Added column is_daily TINYINT(1) DEFAULT 0 to installment_cards";
        $mysqli->query("ALTER TABLE installment_cards ADD INDEX idx_is_daily (is_daily)");
        $response["actions"][] = "Added index idx_is_daily to installment_cards";
    } else {
        echo json_encode(["success" => false, "error" => "Failed to add column is_daily: " . $mysqli->error]);
        exit;
    }
} else {
    $response["actions"][] = "Column is_daily already exists in installment_cards";
}

// 2. Migrate existing cards where remarks = 'daily'
$migQuery = "UPDATE installment_cards SET is_daily = 1 WHERE LOWER(TRIM(COALESCE(remarks, ''))) = 'daily'";
if ($mysqli->query($migQuery)) {
    $affected = $mysqli->affected_rows;
    $response["actions"][] = "Updated {$affected} existing card(s) to is_daily = 1 based on remarks = 'daily'";
}

// 3. Count total regular vs daily cards
$countRes = $mysqli->query("SELECT is_daily, COUNT(*) as cnt FROM installment_cards GROUP BY is_daily");
$stats = [];
while ($row = $countRes->fetch_assoc()) {
    $stats[$row['is_daily'] == 1 ? 'daily_cards' : 'regular_cards'] = (int)$row['cnt'];
}
$response["stats"] = $stats;

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
