<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
if (file_exists('../credits/CreditHelper.php')) {
    require_once '../credits/CreditHelper.php';
}

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

try {
    // Ensure table & seed defaults if not exists
    CreditHelper::getSystemSetting($db, 'reviewer_approval_credit', 1);

    $stmt = $db->query("SELECT setting_key, setting_value, description FROM system_settings");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $settings = [];
    foreach ($rows as $row) {
        $key = $row['setting_key'];
        $val = $row['setting_value'];
        $settings[$key] = is_numeric($val) ? (float)$val : $val;
    }

    echo json_encode([
        "status" => "success",
        "settings" => $settings,
        "details" => $rows
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
