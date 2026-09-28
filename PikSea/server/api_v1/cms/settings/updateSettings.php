<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php'; // Ensures user is authenticated
require_once __DIR__ . '/../../middleware/FirebaseJWT.php';
// Check if admin
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
    http_response_code(401);
    exit(json_encode(["success" => false, "message" => "Unauthorized"]));
}
$token = trim(str_replace('Bearer ', '', $authHeader));
try {
    $payload = FirebaseJWT::verifyIdToken($token);
    $email = $payload['email'] ?? null;
    
    // Verify admin in DB
    $user_stmt = $mysqli->prepare("SELECT role FROM users WHERE email = ?");
    $user_stmt->bind_param("s", $email);
    $user_stmt->execute();
    $user_res = $user_stmt->get_result();
    if ($user_res->num_rows === 0) {
        throw new Exception("User not found");
    }
    $user_data = $user_res->fetch_assoc();
    if ($user_data['role'] !== 'admin') {
        throw new Exception("Only admins can update settings");
    }
} catch (Exception $e) {
    http_response_code(403);
    exit(json_encode(["success" => false, "message" => $e->getMessage()]));
}
$response = ["success" => false, "message" => ""];
// Function to handle image upload
function uploadImage($fileInputName, $uploadDir = "../../../images/settings/") {
    if (isset($_FILES[$fileInputName]) && $_FILES[$fileInputName]['error'] === UPLOAD_ERR_OK) {
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        $ext = pathinfo($_FILES[$fileInputName]['name'], PATHINFO_EXTENSION);
        $filename = $fileInputName . '_' . time() . '.' . $ext;
        $targetFile = $uploadDir . $filename;
        
        if (move_uploaded_file($_FILES[$fileInputName]['tmp_name'], $targetFile)) {
            return 'images/settings/' . $filename;
        }
    }
    return null;
}
try {
    $mysqli->begin_transaction();
    // Handle normal text settings sent via POST
    foreach ($_POST as $key => $value) {
        // If it's a JSON string, we just store it as string
        $valToStore = $value;
        
        $stmt = $mysqli->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        $stmt->bind_param("sss", $key, $valToStore, $valToStore);
        $stmt->execute();
    }
    // Handle Image Uploads
    $imageFields = ['site_logo', 'hero_bg_image', 'join_pro_image'];
    foreach ($imageFields as $field) {
        $uploadedPath = uploadImage($field);
        if ($uploadedPath) {
            $stmt = $mysqli->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
            $stmt->bind_param("sss", $field, $uploadedPath, $uploadedPath);
            $stmt->execute();
        }
    }
    $mysqli->commit();
    $response["success"] = true;
    $response["message"] = "Settings updated successfully.";
} catch (Exception $e) {
    $mysqli->rollback();
    $response["message"] = "Error updating settings: " . $e->getMessage();
}
header('Content-Type: application/json');
echo json_encode($response);
