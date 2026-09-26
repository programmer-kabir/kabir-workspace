<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->user_id) || !isset($data->name) || !isset($data->phone)) {
    echo json_encode(["status" => "error", "message" => "Missing required parameters."]);
    exit;
}

$user_id = $data->user_id;
$name = trim($data->name);
$phone = trim($data->phone);

if(empty($name)) {
    echo json_encode(["status" => "error", "message" => "Name cannot be empty."]);
    exit;
}

try {
    $query = "UPDATE users SET name = :name, phone = :phone WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':phone', $phone);
    $stmt->bindParam(':user_id', $user_id);
    
    if($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Profile updated successfully."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update profile."]);
    }
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
