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
$mark_all = isset($data->mark_all) && $data->mark_all === true;
$portal = isset($data->portal) ? trim($data->portal) : null;

try {
    if ($mark_all) {
        $query = "UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = :user_id AND is_read = 0";
        $params = [':user_id' => $user_id];
        if ($portal) {
            $query .= " AND (portal = :portal OR portal = 'all')";
            $params[':portal'] = $portal;
        }
        $stmt = $db->prepare($query);
        $stmt->execute($params);

        echo json_encode(["status" => "success", "message" => "All notifications marked as read."]);
    } else if ($notification_id) {
        $stmt = $db->prepare("UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = :id AND user_id = :user_id");
        $stmt->execute([':id' => $notification_id, ':user_id' => $user_id]);

        echo json_encode(["status" => "success", "message" => "Notification marked as read."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Provide notification_id or set mark_all to true."]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
