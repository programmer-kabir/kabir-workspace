<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->user_id) || !isset($data->current_password) || !isset($data->new_password)) {
    echo json_encode(["status" => "error", "message" => "All fields are required."]);
    exit;
}

$user_id = $data->user_id;
$current_password = $data->current_password;
$new_password = $data->new_password;

// Verify current password
$query = "SELECT password FROM users WHERE id = :id LIMIT 1";
$stmt = $db->prepare($query);
$stmt->bindParam(":id", $user_id);
$stmt->execute();

if($stmt->rowCount() == 0) {
    echo json_encode(["status" => "error", "message" => "User not found."]);
    exit;
}

$row = $stmt->fetch(PDO::FETCH_ASSOC);

if(!password_verify($current_password, $row['password'])) {
    echo json_encode(["status" => "error", "message" => "Current password is incorrect."]);
    exit;
}

// Hash new password
$hashed_password = password_hash($new_password, PASSWORD_DEFAULT);

$update_query = "UPDATE users SET password = :password WHERE id = :id";
$update_stmt = $db->prepare($update_query);
$update_stmt->bindParam(":password", $hashed_password);
$update_stmt->bindParam(":id", $user_id);

if($update_stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Password updated successfully."]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to update password."]);
}
?>
