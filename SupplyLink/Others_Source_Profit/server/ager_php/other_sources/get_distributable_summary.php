<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$month = trim($_GET['month'] ?? date('Y-m'));
if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
    $month = date('Y-m');
}

// Ensure table exists
$mysqli->query("
    CREATE TABLE IF NOT EXISTS `other_source_monthly_distributions` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `billing_month` VARCHAR(10) NOT NULL UNIQUE,
        `card_profit` DECIMAL(15,2) DEFAULT 0.00,
        `others_profit` DECIMAL(15,2) DEFAULT 0.00,
        `others_investor_percent` DECIMAL(5,2) DEFAULT 70.00,
        `others_investor_pool` DECIMAL(15,2) DEFAULT 0.00,
        `others_company_pool` DECIMAL(15,2) DEFAULT 0.00,
        `total_investor_pool` DECIMAL(15,2) DEFAULT 0.00,
        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");

// 1. Total collections for this month
$stmt = $mysqli->prepare("
    SELECT 
        COALESCE(SUM(c.amount), 0) AS total_others_profit,
        COUNT(c.id) AS total_collected_count
    FROM other_asset_collections c
    WHERE c.billing_month = ? AND c.status = 'Paid'
");
$stmt->bind_param("s", $month);
$stmt->execute();
$overall = $stmt->get_result()->fetch_assoc();
$stmt->close();

$total_others_profit = floatval($overall['total_others_profit'] ?? 0);
$total_collected_count = intval($overall['total_collected_count'] ?? 0);

// 2. Category Breakdown
$catStmt = $mysqli->prepare("
    SELECT 
        a.category,
        COALESCE(SUM(c.amount), 0) AS category_total,
        COUNT(c.id) AS count
    FROM other_asset_collections c
    JOIN other_assets a ON a.id = c.asset_id
    WHERE c.billing_month = ? AND c.status = 'Paid'
    GROUP BY a.category
");
$catStmt->bind_param("s", $month);
$catStmt->execute();
$catRes = $catStmt->get_result();

$breakdown = [];
while ($row = $catRes->fetch_assoc()) {
    $breakdown[] = [
        "category" => $row['category'],
        "amount"   => floatval($row['category_total']),
        "count"    => intval($row['count'])
    ];
}
$catStmt->close();

// 3. Saved Distribution Config (if any)
$saved_distribution = null;
$distStmt = $mysqli->prepare("
    SELECT * FROM other_source_monthly_distributions WHERE billing_month = ?
");
if ($distStmt) {
    $distStmt->bind_param("s", $month);
    $distStmt->execute();
    $saved_distribution = $distStmt->get_result()->fetch_assoc();
    $distStmt->close();
}

echo json_encode([
    "success"               => true,
    "month"                 => $month,
    "total_others_profit"   => $total_others_profit,
    "total_collected_count" => $total_collected_count,
    "breakdown"             => $breakdown,
    "saved_distribution"    => $saved_distribution
], JSON_UNESCAPED_UNICODE);
