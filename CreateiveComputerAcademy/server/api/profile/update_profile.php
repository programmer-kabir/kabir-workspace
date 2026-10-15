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

if(!isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "User ID is required."]);
    exit;
}

$user_id = (int)$data->user_id;
$name = isset($data->name) ? trim($data->name) : null;
$phone = isset($data->phone) ? trim($data->phone) : null;
$username = isset($data->username) ? strtolower(trim($data->username)) : null;

// Validate username if provided
if ($username !== null && !empty($username)) {
    // Only allow lowercase alphanumeric, underscore, dot (3-40 chars)
    if (!preg_match('/^[a-z0-9_.]{3,40}$/', $username)) {
        echo json_encode([
            "status" => "error", 
            "message" => "Username must be 3-40 characters and only contain letters (a-z), numbers, underscores (_), and dots (.)."
        ]);
        exit;
    }
    
    // Check if taken by another user
    try {
        $chk = $db->prepare("SELECT id FROM users WHERE username = :uname AND id != :uid LIMIT 1");
        $chk->execute([':uname' => $username, ':uid' => $user_id]);
        if ($chk->rowCount() > 0) {
            echo json_encode([
                "status" => "error", 
                "message" => "Username '@" . $username . "' is already taken. Please choose another one."
            ]);
            exit;
        }
    } catch (Exception $e) {}
}

$fields = [];
$params = [':user_id' => $user_id];

if ($name !== null && !empty($name)) {
    $fields[] = "name = :name";
    $params[':name'] = $name;
}
if ($phone !== null) {
    $fields[] = "phone = :phone";
    $params[':phone'] = $phone;
}
if ($username !== null) {
    $fields[] = "username = :username";
    $params[':username'] = !empty($username) ? $username : null;
}

if (empty($fields)) {
    echo json_encode(["status" => "error", "message" => "No profile fields to update."]);
    exit;
}

try {
    $query = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :user_id";
    $stmt = $db->prepare($query);
    
    if($stmt->execute($params)) {
        echo json_encode([
            "status" => "success", 
            "message" => "Profile updated successfully.",
            "data" => [
                "name" => $name,
                "phone" => $phone,
                "username" => $username
            ]
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update profile."]);
    }
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
