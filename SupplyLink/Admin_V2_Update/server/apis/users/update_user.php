<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

// Ensure History Table Exists
$mysqli->query("
CREATE TABLE IF NOT EXISTS `user_edit_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `changes` TEXT NOT NULL,
  `edited_by` VARCHAR(255) DEFAULT 'Admin',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");

function fail($msg, $debug = null, $code = 400) {
    http_response_code($code);
    echo json_encode([
        "success" => false,
        "message" => $msg,
        "debug"   => $debug
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Only POST allowed
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        fail("Only POST request is allowed", null, 405);
    }

    // Input fields
    $id         = intval($_POST['id'] ?? 0);
    $name       = trim($_POST['name'] ?? '');
    $mobile     = trim($_POST['mobile'] ?? '');
    $id_type    = trim($_POST['id_type'] ?? 'smart_nid');
    $id_number  = trim($_POST['id_number'] ?? '');
    $address    = trim($_POST['address'] ?? '');
    $start_date = !empty($_POST['start_date']) ? trim($_POST['start_date']) : null;
    $password   = trim($_POST['password'] ?? '');

    // Validation
    if (!$id) {
        fail("User ID is required");
    }
    if ($name === '') {
        fail("Name field is required");
    }
    if ($mobile === '') {
        fail("Mobile field is required");
    }

    // Fetch existing user data
    $stmt = $mysqli->prepare("
        SELECT u.id, u.user_id, u.name, u.mobile, u.id_type, u.id_number, u.address, u.start_date, u.password, u.photo
        FROM users u
        WHERE u.id = ?
    ");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $dbUser = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$dbUser) {
        fail("User not found");
    }

    // Ensure targetUserId is valid (fallback to id if user_id is null/0)
    $targetUserId = !empty($dbUser['user_id']) ? (int)$dbUser['user_id'] : (int)$dbUser['id'];
    if ($targetUserId <= 0) {
        $targetUserId = (int)$id;
    }

    // Multi-role processing
    $rolesInput = $_POST['roles'] ?? $_POST['role'] ?? '';
    $newRoles = [];
    if (is_array($rolesInput)) {
        $newRoles = $rolesInput;
    } else if (is_string($rolesInput) && trim($rolesInput) !== '') {
        $newRoles = explode(',', $rolesInput);
    }
    $newRoles = array_values(array_unique(array_filter(array_map('trim', array_map('strtolower', $newRoles)))));
    if (empty($newRoles)) {
        $newRoles = ['customer'];
    }

    // Existing roles
    $existingRoles = [];
    $stmtRoles = $mysqli->prepare("SELECT role FROM user_roles WHERE user_id = ? ORDER BY id ASC");
    $stmtRoles->bind_param("i", $targetUserId);
    $stmtRoles->execute();
    $resRoles = $stmtRoles->get_result();
    while ($rRow = $resRoles->fetch_assoc()) {
        $existingRoles[] = strtolower($rRow['role']);
    }
    $stmtRoles->close();

    $sortedOldRoles = $existingRoles;
    $sortedNewRoles = $newRoles;
    sort($sortedOldRoles);
    sort($sortedNewRoles);
    $rolesChanged = ($sortedOldRoles !== $sortedNewRoles);

    // Keep previous password if empty
    $finalPassword = ($password !== '') ? $password : ($dbUser['password'] ?: '12345');

    // Photo Upload handling (optional)
    $photoPathDb = null;

    if (!empty($_FILES['photo']['name'])) {
        if ($_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
            fail("Photo upload error", $_FILES['photo']['error']);
        }

        // size limit 2MB
        if ($_FILES['photo']['size'] > 2 * 1024 * 1024) {
            fail("Image too large (max 2MB)");
        }

        $tmpName = $_FILES['photo']['tmp_name'];

        // mime check
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime  = finfo_file($finfo, $tmpName);
        finfo_close($finfo);

        $allowed = [
            "image/jpeg" => "jpg",
            "image/png"  => "png",
            "image/webp" => "webp",
        ];

        if (!isset($allowed[$mime])) {
            fail("Invalid image type. Only JPG/PNG/WEBP allowed", $mime);
        }

        $ext = $allowed[$mime];

        // filename from user name
        $base = strtolower($name);
        $base = preg_replace('/\s+/', '_', $base);
        $base = preg_replace('/[^a-z0-9_]/', '', $base);
        $base = trim($base, '_');
        if ($base === '') $base = 'user_' . ($targetUserId ?: $id);

        // upload directory
        $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');
        $uploadDir = $docRoot ? $docRoot . "/uploads/" : __DIR__ . "/../../uploads/";
        if (!is_dir($uploadDir)) {
            $uploadDir = __DIR__ . "/../../uploads/";
        }
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // duplicate handling
        $filename = $base . "." . $ext;
        $i = 1;
        while (file_exists($uploadDir . $filename)) {
            $filename = $base . "_" . $i . "." . $ext;
            $i++;
        }

        if (!move_uploaded_file($tmpName, $uploadDir . $filename)) {
            fail("Failed to save image");
        }

        $photoPathDb = "uploads/" . $filename;
    }

    // 📋 Detect Field Changes for Edit History
    $changes = [];

    if ($name !== '' && $name !== ($dbUser['name'] ?? '')) {
        $changes[] = [
            'field' => 'Full Name',
            'old'   => $dbUser['name'] ?? 'N/A',
            'new'   => $name
        ];
    }
    if ($mobile !== '' && $mobile !== ($dbUser['mobile'] ?? '')) {
        $changes[] = [
            'field' => 'Mobile Number',
            'old'   => $dbUser['mobile'] ?? 'N/A',
            'new'   => $mobile
        ];
    }
    if ($rolesChanged) {
        $changes[] = [
            'field' => 'Assigned Roles',
            'old'   => !empty($existingRoles) ? implode(', ', array_map('ucfirst', $existingRoles)) : 'None',
            'new'   => implode(', ', array_map('ucfirst', $newRoles))
        ];
    }
    if ($id_type !== '' && $id_type !== ($dbUser['id_type'] ?? '')) {
        $changes[] = [
            'field' => 'ID Type',
            'old'   => $dbUser['id_type'] ?: 'smart_nid',
            'new'   => $id_type
        ];
    }
    if ($id_number !== ($dbUser['id_number'] ?? '')) {
        $changes[] = [
            'field' => 'ID Number',
            'old'   => $dbUser['id_number'] ?: 'None',
            'new'   => $id_number ?: 'None'
        ];
    }
    if ($address !== ($dbUser['address'] ?? '')) {
        $changes[] = [
            'field' => 'Address',
            'old'   => $dbUser['address'] ?: 'None',
            'new'   => $address ?: 'None'
        ];
    }
    if ($start_date !== ($dbUser['start_date'] ?? '')) {
        $changes[] = [
            'field' => 'Joining Date',
            'old'   => $dbUser['start_date'] ?: 'None',
            'new'   => $start_date ?: 'None'
        ];
    }
    if ($password !== '' && $password !== ($dbUser['password'] ?? '')) {
        $changes[] = [
            'field' => 'Password',
            'old'   => '••••••',
            'new'   => 'Updated'
        ];
    }
    if ($photoPathDb !== null) {
        $changes[] = [
            'field' => 'Profile Photo',
            'old'   => $dbUser['photo'] ? 'Previous Photo' : 'Default Avatar',
            'new'   => 'New Photo Uploaded'
        ];
    }

    // Begin Transaction
    $mysqli->begin_transaction();

    // Update Users Table (Ensure user_id is also set)
    if ($photoPathDb !== null) {
        $update = $mysqli->prepare("
            UPDATE users 
            SET user_id = ?, name = ?, mobile = ?, id_type = ?, id_number = ?, address = ?, start_date = ?, password = ?, photo = ? 
            WHERE id = ?
        ");
        $update->bind_param("issssssssi", $targetUserId, $name, $mobile, $id_type, $id_number, $address, $start_date, $finalPassword, $photoPathDb, $id);
    } else {
        $update = $mysqli->prepare("
            UPDATE users 
            SET user_id = ?, name = ?, mobile = ?, id_type = ?, id_number = ?, address = ?, start_date = ?, password = ? 
            WHERE id = ?
        ");
        $update->bind_param("isssssssi", $targetUserId, $name, $mobile, $id_type, $id_number, $address, $start_date, $finalPassword, $id);
    }

    $update->execute();
    $update->close();

    // Sync Roles in user_roles Table
    if ($rolesChanged) {
        $delRoles = $mysqli->prepare("DELETE FROM user_roles WHERE user_id = ?");
        $delRoles->bind_param("i", $targetUserId);
        $delRoles->execute();
        $delRoles->close();

        $inRole = $mysqli->prepare("INSERT INTO user_roles (user_id, role, assigned_at) VALUES (?, ?, NOW())");
        foreach ($newRoles as $r) {
            $inRole->bind_param("is", $targetUserId, $r);
            $inRole->execute();
        }
        $inRole->close();
    }

    // 📝 Log Edit History if changes were made
    if (!empty($changes)) {
        $changesJson = json_encode($changes, JSON_UNESCAPED_UNICODE);
        $editedBy = "Admin";
        
        $logStmt = $mysqli->prepare("
            INSERT INTO user_edit_history (user_id, changes, edited_by, created_at)
            VALUES (?, ?, ?, NOW())
        ");
        $logStmt->bind_param("iss", $targetUserId, $changesJson, $editedBy);
        $logStmt->execute();
        $logStmt->close();
    }

    $mysqli->commit();

    echo json_encode([
        "success"       => true,
        "message"       => "User updated successfully",
        "user_id"       => $targetUserId,
        "roles"         => $newRoles,
        "changes_count" => count($changes),
        "photo"         => $photoPathDb ?? $dbUser['photo']
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    try { $mysqli->rollback(); } catch (Throwable $t) {}
    fail("User update failed: " . $e->getMessage(), null, 500);
}