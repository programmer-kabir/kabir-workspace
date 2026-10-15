<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once __DIR__ . '/developer_guard.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"), true) ?? [];
$token = $data['token'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? ($_GET['token'] ?? ''));
if (strpos($token, 'Bearer ') === 0) {
    $token = substr($token, 7);
}

$devUser = verifyDeveloperAccess($db, $token);
if (!$devUser) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Forbidden: Developer or Admin access required."]);
    exit;
}

$configFile = dirname(__DIR__, 2) . '/config/maintenance_status.json';
$config = [
    "maintenance_enabled" => false,
    "allowed_roles" => ["developer", "admin"],
    "maintenance_message" => "সিস্টেম আপগ্রেড চলছে।",
    "sms_dry_run" => false,
    "updated_at" => date('Y-m-d H:i:s'),
    "updated_by" => "System"
];

if (file_exists($configFile)) {
    $read = json_decode(file_get_contents($configFile), true);
    if (is_array($read)) {
        $config = array_merge($config, $read);
    }
}

echo json_encode([
    "status" => "success",
    "data" => $config
]);
?>
