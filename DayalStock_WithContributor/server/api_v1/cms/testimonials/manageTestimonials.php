<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/auth.php';
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
    $user_stmt = $mysqli->prepare("SELECT role FROM users WHERE email = ?");
    $user_stmt->bind_param("s", $email);
    $user_stmt->execute();
    $user_res = $user_stmt->get_result();
    if ($user_res->num_rows === 0) throw new Exception("User not found");
    $user_data = $user_res->fetch_assoc();
    if ($user_data['role'] !== 'admin') throw new Exception("Only admins can manage testimonials");
} catch (Exception $e) {
    http_response_code(403);
    exit(json_encode(["success" => false, "message" => $e->getMessage()]));
}
$method = $_SERVER['REQUEST_METHOD'];
$response = ["success" => false, "message" => ""];
// Function to handle avatar upload
function uploadAvatar($fileInputName, $uploadDir = "../../../images/testimonials/") {
    if (isset($_FILES[$fileInputName]) && $_FILES[$fileInputName]['error'] === UPLOAD_ERR_OK) {
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        $ext = pathinfo($_FILES[$fileInputName]['name'], PATHINFO_EXTENSION);
        $filename = 'avatar_' . time() . '.' . $ext;
        if (move_uploaded_file($_FILES[$fileInputName]['tmp_name'], $uploadDir . $filename)) {
            return 'images/testimonials/' . $filename;
        }
    }
    return null;
}
if ($method === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'add') {
        $name = $_POST['name'] ?? '';
        $designation = $_POST['designation'] ?? '';
        $message = $_POST['message'] ?? '';
        $status = $_POST['status'] ?? 'active';
        $avatar_url = uploadAvatar('avatar') ?? '';
        
        $stmt = $mysqli->prepare("INSERT INTO testimonials (name, designation, message, avatar_url, status) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $name, $designation, $message, $avatar_url, $status);
        if ($stmt->execute()) {
            $response["success"] = true;
            $response["message"] = "Testimonial added successfully.";
        } else {
            $response["message"] = "Error adding: " . $stmt->error;
        }
    } 
    elseif ($action === 'update') {
        $id = (int)($_POST['id'] ?? 0);
        $name = $_POST['name'] ?? '';
        $designation = $_POST['designation'] ?? '';
        $message = $_POST['message'] ?? '';
        $status = $_POST['status'] ?? 'active';
        
        $avatar_url = uploadAvatar('avatar');
        if ($avatar_url) {
            $stmt = $mysqli->prepare("UPDATE testimonials SET name=?, designation=?, message=?, avatar_url=?, status=? WHERE id=?");
            $stmt->bind_param("sssssi", $name, $designation, $message, $avatar_url, $status, $id);
        } else {
            $stmt = $mysqli->prepare("UPDATE testimonials SET name=?, designation=?, message=?, status=? WHERE id=?");
            $stmt->bind_param("ssssi", $name, $designation, $message, $status, $id);
        }
        
        if ($stmt->execute()) {
            $response["success"] = true;
            $response["message"] = "Testimonial updated successfully.";
        } else {
            $response["message"] = "Error updating: " . $stmt->error;
        }
    }
    elseif ($action === 'delete') {
        $id = (int)($_POST['id'] ?? 0);
        $stmt = $mysqli->prepare("DELETE FROM testimonials WHERE id=?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            $response["success"] = true;
            $response["message"] = "Testimonial deleted successfully.";
        } else {
            $response["message"] = "Error deleting: " . $stmt->error;
        }
    } else {
        $response["message"] = "Invalid action.";
    }
} else {
    // GET request (admin view all)
    $result = $mysqli->query("SELECT * FROM testimonials ORDER BY id DESC");
    $testimonials = [];
    while ($row = $result->fetch_assoc()) {
        $testimonials[] = $row;
    }
    $response["success"] = true;
    $response["data"] = $testimonials;
}
header('Content-Type: application/json');
echo json_encode($response);
