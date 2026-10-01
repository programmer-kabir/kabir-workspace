<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php'; // SECURE: Verify Firebase Token

header("Content-Type: application/json");

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    $userId = $GLOBALS['user']['id'];
    if (!$userId) {
        throw new Exception('User not authenticated');
    }

    $name = $_POST['name'] ?? '';
    $username = $_POST['username'] ?? '';
    $country = $_POST['location'] ?? '';
    
    // Check if username is already taken by someone else
    if (!empty($username)) {
        $stmt = $mysqli->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
        $stmt->bind_param("si", $username, $userId);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            echo json_encode(["success" => false, "message" => "Username is already taken"]);
            exit;
        }
    }

    $dbPhotoPath = null;
    // Handle Photo Upload
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = __DIR__ . '/../../uploads/users/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }
        
        $fileName = $username . '_' . $userId . '_' . time() . '.webp';
        $filePath = $uploadDir . $fileName;
        
        // Convert to webp
        $imageType = exif_imagetype($_FILES['photo']['tmp_name']);
        $image = null;
        switch ($imageType) {
            case IMAGETYPE_JPEG:
                $image = @imagecreatefromjpeg($_FILES['photo']['tmp_name']);
                break;
            case IMAGETYPE_PNG:
                $image = @imagecreatefrompng($_FILES['photo']['tmp_name']);
                break;
            case IMAGETYPE_WEBP:
                $image = @imagecreatefromwebp($_FILES['photo']['tmp_name']);
                break;
            case IMAGETYPE_GIF:
                $image = @imagecreatefromgif($_FILES['photo']['tmp_name']);
                break;
        }
        
        if ($image !== false) {
            if (imagewebp($image, $filePath, 80)) {
                $dbPhotoPath = 'uploads/users/' . $fileName;
            }
            imagedestroy($image);
        }
    }

    if ($dbPhotoPath) {
        $query = "UPDATE users SET name = ?, username = ?, country = ?, photo = ? WHERE id = ?";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("ssssi", $name, $username, $country, $dbPhotoPath, $userId);
        $stmt->execute();
    } else {
        $query = "UPDATE users SET name = ?, username = ?, country = ? WHERE id = ?";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("sssi", $name, $username, $country, $userId);
        $stmt->execute();
    }

    // Fetch updated user
    $fetchStmt = $mysqli->prepare("SELECT * FROM users WHERE id = ?");
    $fetchStmt->bind_param("i", $userId);
    $fetchStmt->execute();
    $updatedUser = $fetchStmt->get_result()->fetch_assoc();

    echo json_encode([
        "success" => true,
        "message" => "Profile updated successfully",
        "user" => $updatedUser
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ]);
}
?>
