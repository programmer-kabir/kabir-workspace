<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/r2_config.php';

require_once __DIR__ . '/../middleware/auth.php';

require_once __DIR__ . '/../middleware/rate_limit.php';
applyRateLimit($mysqli, 'author', 30, 60);


header("Content-Type: application/json; charset=UTF-8");

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Invalid request method");
    }

    // SECURE: Use verified email from Firebase JWT, ignore frontend input
    $email = $GLOBALS['user']['email'] ?? '';
    
    if (empty($email)) {
        throw new Exception("Unauthorized. Email is required from authentication token.");
    }
    
    $name = isset($_POST['name']) ? trim($_POST['name']) : '';
    $bio = isset($_POST['bio']) ? trim($_POST['bio']) : '';
    $website = isset($_POST['website']) ? trim($_POST['website']) : '';

    // Check if author exists for this email
    $sql = "SELECT authors.id, authors.user_id, users.photo FROM authors INNER JOIN users ON authors.user_id = users.id WHERE users.email = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Author not found for this email");
    }
    
    $author = $result->fetch_assoc();
    $authorId = $author['id'];
    $userId = $author['user_id'];
    $avatarPath = !empty($author['photo']) ? $author['photo'] : '';

    // Handle avatar upload
    if (isset($_FILES['avatar'])) {
        if ($_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
            $uploadDirectory = __DIR__ . '/../../images/avatars/';
            if (!is_dir($uploadDirectory)) {
                if (!mkdir($uploadDirectory, 0775, true)) {
                    error_log("Failed to create directory: " . $uploadDirectory);
                }
            }

            $sourcePath = $_FILES['avatar']['tmp_name'];
            $info = @getimagesize($sourcePath);
            if ($info) {
                $mime = $info['mime'];
                $image = null;
                
                if ($mime === 'image/jpeg') {
                    $image = @imagecreatefromjpeg($sourcePath);
                } elseif ($mime === 'image/png') {
                    $image = @imagecreatefrompng($sourcePath);
                } elseif ($mime === 'image/webp') {
                    $image = @imagecreatefromwebp($sourcePath);
                }
                
                if ($image) {
                    $fileName = 'avatar-' . $authorId . '-' . time() . '.webp';
                    $destinationPath = $uploadDirectory . $fileName;
                    
                    if (imagewebp($image, $destinationPath, 80)) {
                        $r2Key = 'uploads/users/' . $fileName;
                        if (R2Helper::uploadFile($destinationPath, $r2Key, 'image/webp')) {
                            $avatarPath = $r2Key;
                            @unlink($destinationPath); // clean up local temp file
                        } else {
                            error_log("Failed to upload avatar to R2: " . $fileName);
                        }
                    } else {
                        error_log("imagewebp failed to write to " . $destinationPath);
                    }
                    imagedestroy($image);
                } else {
                    error_log("Failed to create image resource from uploaded file. Mime: " . $mime);
                }
            } else {
                error_log("getimagesize failed for " . $sourcePath);
            }
        } else {
            error_log("Avatar upload error code: " . $_FILES['avatar']['error']);
        }
    }

    // Update users table (photo and name)
    if (!empty($name) || !empty($avatarPath)) {
        $userUpdateSql = "UPDATE users SET photo = COALESCE(?, photo), name = IF(? != '', ?, name) WHERE id = ?";
        $userUpdateStmt = $mysqli->prepare($userUpdateSql);
        $userUpdateStmt->bind_param("sssi", $avatarPath, $name, $name, $userId);
        $userUpdateStmt->execute();
        $userUpdateStmt->close();
    }

    // Update author table
    $updateSql = "UPDATE authors SET bio = ?, website = ? WHERE id = ?";
    $updateStmt = $mysqli->prepare($updateSql);
    $updateStmt->bind_param("ssi", $bio, $website, $authorId);
    
    if (!$updateStmt->execute()) {
        throw new Exception("Failed to update author: " . $updateStmt->error);
    }

    echo json_encode([
        "success" => true,
        "message" => "Profile updated successfully",
        "avatar" => $avatarPath
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to update profile",
        "error" => $e->getMessage()
    ]);
}
