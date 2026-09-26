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

date_default_timezone_set('Asia/Dhaka');

$input = json_decode(file_get_contents("php://input"), true);
if (!$input || empty($input['settings']) || !is_array($input['settings'])) {
    echo json_encode(["status" => "error", "message" => "Settings array is required."]);
    exit();
}

try {
    // Ensure table exists
    CreditHelper::getSystemSetting($db, 'reviewer_approval_credit', 1);

    $db->beginTransaction();

    $bdNow = date('Y-m-d H:i:s');
    $stmt = $db->prepare("
        INSERT INTO system_settings (setting_key, setting_value, updated_at) 
        VALUES (:key, :val, :updated_at) 
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = :updated_at
    ");

    foreach ($input['settings'] as $key => $val) {
        if (trim($key) !== '') {
            $stmt->execute([
                ':key' => trim($key),
                ':val' => trim((string)$val),
                ':updated_at' => $bdNow
            ]);
        }
    }

    $db->commit();

    echo json_encode([
        "status" => "success",
        "message" => "System settings updated successfully."
    ]);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
