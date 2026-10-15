<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/database.php';
require_once '../../config/storage.php';
require_once '../../config/r2.php';

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

    $file_tmp = $_FILES['image']['tmp_name'];
    $file_name = $_FILES['image']['name'];
    $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

    $allowed_exts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!in_array($file_ext, $allowed_exts)) {
        echo json_encode(["status" => "error", "message" => "Invalid file format."]);
        exit;
    }

    // Dynamic storage provider & folder path from admin settings
    $targetProvider = determineUploadProvider($file_ext, 'profile');
    $configuredFolder = getStorageFolderPath('profile'); // e.g. 'uploads/profiles'
    $new_file_name = $type . '_' . $user_id . '_' . time() . '.' . $file_ext;

    $savedSuccessfully = false;
    $db_path = '';

    // Provider 1: Cloudflare R2
    if ($targetProvider === 'r2') {
        $r2Key = trim($configuredFolder, '/') . '/' . $new_file_name;
        $mimeType = mime_content_type($file_tmp) ?: 'image/' . $file_ext;
        try {
            $r2 = new R2Client();
            $uploadResult = $r2->uploadFile($file_tmp, $r2Key, $mimeType);
            if ($uploadResult && !empty($uploadResult['url'])) {
                $db_path = $uploadResult['url'];
                $savedSuccessfully = true;
            }
        } catch (Exception $e) {
            error_log("R2 Profile Upload Error: " . $e->getMessage());
            // Fallback to local
            $targetProvider = 'local';
        }
    }

    // Provider 2: Local Hostinger Web Server (or failover)
    if (!$savedSuccessfully) {
        $upload_dir = __DIR__ . '/../../' . trim($configuredFolder, '/') . '/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        $destination = $upload_dir . $new_file_name;

        if (move_uploaded_file($file_tmp, $destination)) {
            $db_path = trim($configuredFolder, '/') . '/' . $new_file_name;
            $savedSuccessfully = true;
        }
    }

    if ($savedSuccessfully) {
        $column = $type === 'profile' ? 'profile_picture' : 'cover_picture';
        $query = "UPDATE users SET $column = :path WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':path', $db_path);
        $stmt->bindParam(':id', $user_id);
        
        if($stmt->execute()) {
            echo json_encode([
                "status" => "success", 
                "message" => ucfirst($type) . " picture updated successfully.", 
                "path" => $db_path,
                "provider" => $targetProvider
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to update database."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to save file."]);
    }
}
?>
