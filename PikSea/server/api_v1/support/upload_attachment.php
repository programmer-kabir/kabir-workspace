<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $user = $GLOBALS['user'];
    if (!isset($_FILES['attachment'])) {
        echo json_encode(['success' => false, 'message' => 'No file uploaded']);
        exit;
    }

    $file = $_FILES['attachment'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'message' => 'Upload error: ' . $file['error']]);
        exit;
    }

    // Determine upload directory
    $uploadDir = __DIR__ . '/../../uploads/support/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0775, true);
    }

    $fileName = uniqid('support_') . '_' . time() . '.webp';
    $filePath = $uploadDir . $fileName;

    $fileType = mime_content_type($file['tmp_name']);
    
    // Process image to WebP
    if (strpos($fileType, 'image/') === 0) {
        $image = null;
        switch ($fileType) {
            case 'image/jpeg':
            case 'image/jpg':
                $image = imagecreatefromjpeg($file['tmp_name']);
                break;
            case 'image/png':
                $image = imagecreatefrompng($file['tmp_name']);
                break;
            case 'image/gif':
                $image = imagecreatefromgif($file['tmp_name']);
                break;
            case 'image/webp':
                // Already WebP, just copy it
                if (move_uploaded_file($file['tmp_name'], $filePath)) {
                    $dbPath = 'uploads/support/' . $fileName;
                    echo json_encode(['success' => true, 'url' => $dbPath]);
                    exit;
                }
                break;
            default:
                echo json_encode(['success' => false, 'message' => 'Unsupported image format']);
                exit;
        }

        if ($image) {
            imagepalettetotruecolor($image);
            imagewebp($image, $filePath, 80);
            imagedestroy($image);

            $dbPath = 'uploads/support/' . $fileName;
        } else {
             echo json_encode(['success' => false, 'message' => 'Failed to process image']);
             exit;
        }
    } else {
        // If not an image, just return error
        echo json_encode(['success' => false, 'message' => 'Please upload an image file']);
        exit;
    }

    $dbPath = 'uploads/support/' . $fileName;

    echo json_encode(['success' => true, 'url' => $dbPath]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
