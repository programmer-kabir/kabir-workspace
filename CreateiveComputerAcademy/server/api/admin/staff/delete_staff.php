<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';
$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "user_id is required."]);
    exit;
}

$user_id = intval($data->user_id);

try {
    // Deleting the user will CASCADE delete: user_roles, employees, user_tokens, task assignments
    $stmt = $db->prepare("DELETE FROM users WHERE id = :user_id");
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        echo json_encode(["status" => "error", "message" => "Staff member not found."]);
    } else {
        echo json_encode(["status" => "success", "message" => "Staff member deleted successfully."]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
