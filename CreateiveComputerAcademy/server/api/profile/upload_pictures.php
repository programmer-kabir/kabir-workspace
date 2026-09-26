<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if(!isset($_POST['user_id']) || !isset($_POST['type'])) {
        echo json_encode(["status" => "error", "message" => "Missing required fields."]);
        exit;
    }

    $user_id = $_POST['user_id'];
    $type = $_POST['type']; // 'profile' or 'cover'

    if (!in_array($type, ['profile', 'cover'])) {
        echo json_encode(["status" => "error", "message" => "Invalid image type."]);
        exit;
    }

    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(["status" => "error", "message" => "No valid file uploaded."]);
        exit;
    }

    $upload_dir = '../../uploads/profiles/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    $file_tmp = $_FILES['image']['tmp_name'];
    $file_name = $_FILES['image']['name'];
    $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

    $allowed_exts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!in_array($file_ext, $allowed_exts)) {
        echo json_encode(["status" => "error", "message" => "Invalid file format."]);
        exit;
    }

    $new_file_name = $type . '_' . $user_id . '_' . time() . '.' . $file_ext;
    $destination = $upload_dir . $new_file_name;

    if (move_uploaded_file($file_tmp, $destination)) {
        // Update database
        $column = $type === 'profile' ? 'profile_picture' : 'cover_picture';
        $db_path = 'uploads/profiles/' . $new_file_name;

        $query = "UPDATE users SET $column = :path WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':path', $db_path);
        $stmt->bindParam(':id', $user_id);
        
        if($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => ucfirst($type) . " picture updated successfully.", "path" => $db_path]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to update database."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to save file."]);
    }
}
?>
