<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/r2_config.php';
require_once __DIR__ . '/../middleware/auth.php'; // SECURE: Verify Firebase Token

header("Content-Type: application/json");
try {
    $data = json_decode(file_get_contents("php://input"), true);
    $name = trim($data['name'] ?? '');
    
    // SECURE: Use the cryptographically verified email from the token
    $email = $GLOBALS['user']['email']; 
    
    $photo = $GLOBALS['token_payload']['picture'] ?? trim($data['photo'] ?? '');
    
    if (!$email) {
        echo json_encode([
            "success" => false,
            "message" => "Valid email is required from token"
        ]);
        exit;
    }
    // 1. Check if user already exists
    $checkStmt = $mysqli->prepare("SELECT id FROM users WHERE email = ?");
    $checkStmt->bind_param("s", $email);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    if ($result->num_rows > 0) {
        // User exists: fetch user data and roles
        $userRow = $result->fetch_assoc();
        $userId = $userRow['id'];
        $fetchStmt = $mysqli->prepare("
            SELECT
                u.id,
                u.name,
                u.email,
                u.photo,
                GROUP_CONCAT(ur.role ORDER BY ur.role SEPARATOR ',') AS roles
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            WHERE u.id = ?
            GROUP BY u.id
            LIMIT 1
        ");
        $fetchStmt->bind_param("i", $userId);
        $fetchStmt->execute();
        $userResult = $fetchStmt->get_result();
        $user = $userResult->fetch_assoc();
        // Convert roles to array
        $user['roles'] = $user['roles'] ? explode(',', $user['roles']) : [];
        echo json_encode([
            "success" => true,
            "message" => "Login successful",
            "user" => $user
        ]);
        exit;
    }
    // 2. First time user: Insert into users and user_roles
    $mysqli->begin_transaction();
    
    // Generate unique username
    $baseUsername = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name));
    if (empty($baseUsername)) {
        $baseUsername = 'user';
    }
    
    $username = $baseUsername;
    $isUnique = false;
    
    while (!$isUnique) {
        $checkUsernameStmt = $mysqli->prepare("SELECT id FROM users WHERE username = ?");
        $checkUsernameStmt->bind_param("s", $username);
        $checkUsernameStmt->execute();
        $resultUsername = $checkUsernameStmt->get_result();
        
        if ($resultUsername->num_rows == 0) {
            $isUnique = true;
        } else {
            $username = $baseUsername . rand(10, 9999);
        }
    }

    // Random password since they login with Google
    $randomPassword = bin2hex(random_bytes(8));
    $hashedPassword = password_hash($randomPassword, PASSWORD_DEFAULT);
    $insertUserStmt = $mysqli->prepare("
        INSERT INTO users (name, username, email, password, photo)
        VALUES (?, ?, ?, ?, ?)
    ");
    $insertUserStmt->bind_param("sssss", $name, $username, $email, $hashedPassword, $photo);
    $insertUserStmt->execute();
    
    $newUserId = $insertUserStmt->insert_id;
    
    // Handle Image Download & Conversion to WebP
    if (!empty($photo) && filter_var($photo, FILTER_VALIDATE_URL)) {
        $imageContent = @file_get_contents($photo);
        if ($imageContent !== false) {
            $image = @imagecreatefromstring($imageContent);
            if ($image !== false) {
                $uploadDir = __DIR__ . '/../../uploads/users/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0775, true);
                }
                
                $fileName = $username . '_' . $newUserId . '.webp';
                $filePath = $uploadDir . $fileName;
                
                // Save as WebP locally first
                if (imagewebp($image, $filePath, 80)) {
                    $dbPhotoPath = 'uploads/users/' . $fileName;
                    
                    // Upload to R2
                    if (class_exists('R2Helper')) {
                        $uploadSuccess = R2Helper::uploadFile($filePath, $dbPhotoPath, 'image/webp');
                        if ($uploadSuccess) {
                            // Optional: remove local file if you only want it on R2
                            @unlink($filePath);
                        }
                    }
                    
                    // Update database with the new photo path
                    $updatePhotoStmt = $mysqli->prepare("UPDATE users SET photo = ? WHERE id = ?");
                    $updatePhotoStmt->bind_param("si", $dbPhotoPath, $newUserId);
                    $updatePhotoStmt->execute();
                }
                imagedestroy($image);
            }
        }
    }

    // Assign default 'user' role
    $roleStmt = $mysqli->prepare("
        INSERT INTO user_roles (user_id, role) 
        VALUES (?, 'user')
    ");
    $roleStmt->bind_param("i", $newUserId);
    $roleStmt->execute();
    $mysqli->commit();
    // 3. Return newly created user data
    $fetchNewStmt = $mysqli->prepare("
        SELECT
            u.id,
            u.name,
            u.email,
            u.photo,
            GROUP_CONCAT(ur.role ORDER BY ur.role SEPARATOR ',') AS roles
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        WHERE u.id = ?
        GROUP BY u.id
        LIMIT 1
    ");
    $fetchNewStmt->bind_param("i", $newUserId);
    $fetchNewStmt->execute();
    $newUserResult = $fetchNewStmt->get_result();
    $newUser = $newUserResult->fetch_assoc();
    
    $newUser['roles'] = $newUser['roles'] ? explode(',', $newUser['roles']) : [];
    echo json_encode([
        "success" => true,
        "message" => "Account created and logged in successfully",
        "user" => $newUser
    ]);
} catch (Exception $e) {
    if (isset($mysqli) && $mysqli->ping()) {
        $mysqli->rollback();
    }
    
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ]);
}
?>
