<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "user_id is required."]);
    exit;
}

$user_id = (int)$data->user_id;
$notification_id = isset($data->notification_id) ? (int)$data->notification_id : null;
$clear_read = isset($data->clear_read) && $data->clear_read === true;

try {
    if ($clear_read) {
        $stmt = $db->prepare("DELETE FROM notifications WHERE user_id = :user_id AND is_read = 1");
        $stmt->execute([':user_id' => $user_id]);
        echo json_encode(["status" => "success", "message" => "Read notifications cleared."]);
    } else if ($notification_id) {
        $stmt = $db->prepare("DELETE FROM notifications WHERE id = :id AND user_id = :user_id");
        $stmt->execute([':id' => $notification_id, ':user_id' => $user_id]);
        echo json_encode(["status" => "success", "message" => "Notification deleted."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Provide notification_id or set clear_read to true."]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
