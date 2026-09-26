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

if (!isset($data->sender_id) || !isset($data->receiver_id) || !isset($data->amount)) {
    echo json_encode(["status" => "error", "message" => "Missing required fields (sender_id, receiver_id, amount)."]);
    exit();
}

$senderId = intval($data->sender_id);
$receiverId = intval($data->receiver_id);
$amount = intval($data->amount);
$notes = isset($data->notes) ? trim($data->notes) : '';

$res = CreditHelper::transferCredits($db, $senderId, $receiverId, $amount, $notes);
echo json_encode($res);
?>
