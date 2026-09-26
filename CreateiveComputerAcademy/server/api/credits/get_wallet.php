<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once __DIR__ . '/CreditHelper.php';

header('Content-Type: application/json');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));
$userId = isset($data->user_id) ? intval($data->user_id) : (isset($_GET['user_id']) ? intval($_GET['user_id']) : 0);
$portal = isset($data->portal) ? trim($data->portal) : (isset($_GET['portal']) ? trim($_GET['portal']) : 'all');

if (!$userId) {
    echo json_encode(["status" => "error", "message" => "User ID is required."]);
    exit();
}

try {
    $walletData = CreditHelper::getWallet($db, $userId, $portal);
    echo json_encode([
        "status" => "success",
        "wallet" => $walletData
    ]);
} catch (Throwable $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to fetch wallet: " . $e->getMessage()
    ]);
}
?>
