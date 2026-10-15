<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once __DIR__ . '/developer_guard.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"), true) ?? [];
$token = $data['token'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
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
    "updated_by" => $devUser['name'] ?? 'Developer'
];

if (file_exists($configFile)) {
    $read = json_decode(file_get_contents($configFile), true);
    if (is_array($read)) {
        $config = array_merge($config, $read);
    }
}

if (isset($data['maintenance_enabled'])) {
    $config['maintenance_enabled'] = (bool)$data['maintenance_enabled'];
}

if (isset($data['sms_dry_run'])) {
    $config['sms_dry_run'] = (bool)$data['sms_dry_run'];
}

if (isset($data['maintenance_message']) && !empty(trim($data['maintenance_message']))) {
    $config['maintenance_message'] = trim($data['maintenance_message']);
}

$config['updated_at'] = date('Y-m-d H:i:s');
$config['updated_by'] = $devUser['name'] ?? 'Developer';

file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// Optional Pusher broadcast
try {
    if (file_exists(dirname(__DIR__, 2) . '/config/PusherHelper.php')) {
        require_once dirname(__DIR__, 2) . '/config/PusherHelper.php';
        $pusher = new PusherHelper();
        $pusher->trigger('community-channel', 'system-maintenance-update', [
            'maintenance_enabled' => $config['maintenance_enabled'],
            'message' => $config['maintenance_message'],
            'updated_by' => $config['updated_by']
        ]);
    }
} catch (Exception $pe) {
    // Suppress pusher errors
}

echo json_encode([
    "status" => "success",
    "message" => "Maintenance and safety configuration updated successfully.",
    "data" => $config
]);
?>
