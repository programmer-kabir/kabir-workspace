<?php
ob_start();
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function fail($msg, $debug = null) {
    if (ob_get_length()) ob_clean();
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $msg,
        "debug"   => $debug
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // ✅ Only POST
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        if (ob_get_length()) ob_clean();
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ================== INPUT ==================
    $name       = trim($_POST['name'] ?? '');
    $mobile     = trim($_POST['mobile'] ?? '');
    $email      = trim($_POST['email'] ?? '');
    if ($email === '') $email = null;
    $id_type    = trim($_POST['id_type'] ?? '');
    $id_number  = trim($_POST['id_number'] ?? '');
    $address    = trim($_POST['address'] ?? '');
    $start_date = !empty($_POST['start_date']) ? trim($_POST['start_date']) : date('Y-m-d');
    $password   = !empty($_POST['password']) ? trim($_POST['password']) : '12345';
    $role       = trim($_POST['role'] ?? '');

    // ================== VALIDATION ==================
    if ($name === '' || $mobile === '' || $id_number === '' || $address === '' || $role === '') {
        fail("প্রয়োজনীয় সকল তথ্য পূরণ করুন");
    }

    // ================== DUPLICATE CHECK ==================
    $chkStmt = $mysqli->prepare("SELECT id, name, mobile, id_number FROM users WHERE mobile = ? OR id_number = ? LIMIT 1");
    if ($chkStmt) {
        $chkStmt->bind_param("ss", $mobile, $id_number);
        $chkStmt->execute();
        $existUser = $chkStmt->get_result()->fetch_assoc();
        $chkStmt->close();

        if ($existUser) {
            if ($existUser['mobile'] === $mobile) {
                fail("এই মোবাইল নম্বর ({$mobile}) দিয়ে ইতোমধ্যে একজন ইউজার ({$existUser['name']}, আইডি #{$existUser['id']}) নিবন্ধিত রয়েছে।");
            } else {
                fail("এই আইডি/এনআইডি নম্বর ({$id_number}) দিয়ে ইতোমধ্যে একজন ইউজার ({$existUser['name']}, আইডি #{$existUser['id']}) নিবন্ধিত রয়েছে।");
            }
        }
    }

    // ================== PHOTO UPLOAD ==================
    $photoPathDb   = null;
    $photoBase64   = null;
    $fullPhotoPath = null;
    $filename      = null;

    if (!empty($_FILES['photo']['name'])) {

        if ($_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
            fail("Photo upload error", $_FILES['photo']['error']);
        }

        // size limit 5MB
        if ($_FILES['photo']['size'] > 5 * 1024 * 1024) {
            fail("Image too large (max 5MB)");
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

        // ✅ filename from user name
        $base = strtolower($name);
        $base = preg_replace('/\s+/', '_', $base);
        $base = preg_replace('/[^a-z0-9_]/', '', $base);
        $base = trim($base, '_');
        if ($base === '') $base = 'user';

        // ✅ uploads folder
        $uploadDir = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/') . "/uploads/";
        if (!is_dir($uploadDir)) {
            $uploadDir = dirname(__DIR__, 2) . "/uploads/";
        }
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0777, true);
        }

        // ✅ duplicate handling: _1, _2, ...
        $filename = $base . "." . $ext;
        $i = 1;
        while (file_exists($uploadDir . $filename)) {
            $filename = $base . "_" . $i . "." . $ext;
            $i++;
        }

        $destPath = $uploadDir . $filename;
        if (!move_uploaded_file($tmpName, $destPath)) {
            fail("Failed to save image");
        }

        $fullPhotoPath = $destPath;
        $photoPathDb = "uploads/" . $filename;

        // Base64 encode for guaranteed immediate offline email rendering
        $imgRaw = @file_get_contents($destPath);
        if ($imgRaw !== false) {
            $photoBase64 = "data:image/" . $ext . ";base64," . base64_encode($imgRaw);
        }
    }

    // ================== TRANSACTION ==================
    $mysqli->begin_transaction();

    // ================== INSERT users ==================
    $stmt = $mysqli->prepare("
        INSERT INTO users
        (name, mobile, email, id_type, id_number, address, start_date, password, photo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "sssssssss",
        $name,
        $mobile,
        $email,
        $id_type,
        $id_number,
        $address,
        $start_date,
        $password,
        $photoPathDb
    );

    $stmt->execute();
    
    // Multi-tier reliable insert ID resolution
    $user_id = $stmt->insert_id ?: $mysqli->insert_id;

    if (!$user_id) {
        $lastQ = $mysqli->query("SELECT LAST_INSERT_ID() AS lid");
        if ($lastQ && $row = $lastQ->fetch_assoc()) {
            $user_id = (int)$row['lid'];
        }
    }

    if (!$user_id) {
        $findStmt = $mysqli->prepare("SELECT id FROM users WHERE mobile = ? ORDER BY id DESC LIMIT 1");
        $findStmt->bind_param("s", $mobile);
        $findStmt->execute();
        $res = $findStmt->get_result()->fetch_assoc();
        $user_id = (int)($res['id'] ?? 0);
        $findStmt->close();
    }

    if (!$user_id) {
        $maxQ = $mysqli->query("SELECT MAX(id) AS mid FROM users");
        if ($maxQ && $row = $maxQ->fetch_assoc()) {
            $user_id = (int)$row['mid'];
        }
    }

    if (!$user_id) {
        throw new Exception("User insert failed");
    }

    // ================== INSERT user_roles ==================
    $stmtRole = $mysqli->prepare("
        INSERT INTO user_roles (user_id, role, assigned_at)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE assigned_at = NOW()
    ");
    $stmtRole->bind_param("is", $user_id, $role);
    $stmtRole->execute();
    $stmtRole->close();

    // Commit DB changes before triggering external mail notification
    $mysqli->commit();

    // ================== SEND EMAIL NOTIFICATION TO ADMIN ==================
    $photoUrl = !empty($photoPathDb) ? ("https://api.supplylinkbd.com/" . $photoPathDb) : null;
    try {
        require_once __DIR__ . '/../helpers/mailer.php';
        sendNewUserRegistrationNotification([
            'user_id'      => $user_id,
            'name'         => $name,
            'email'        => $email,
            'role'         => $role,
            'mobile'       => $mobile,
            'id_type'      => $id_type,
            'id_number'    => $id_number,
            'address'         => $address,
            'start_date'      => $start_date,
            'photo_url'       => $photoUrl,
            'photo_db'        => $photoPathDb,
            'full_photo_path' => $fullPhotoPath,
            'photo_base64'    => $photoBase64
        ]);
    } catch (Throwable $mailErr) {
        error_log("New user mail notification failed: " . $mailErr->getMessage());
    }

    if (ob_get_length()) ob_clean();
    echo json_encode([
        "success" => true,
        "message" => "নতুন ইউজার সফলভাবে তৈরি হয়েছে 🎉",
        "user_id" => (int)$user_id,
        "name"    => $name,
        "role"    => $role,
        "mobile"  => $mobile,
        "email"   => $email,
        "photo"   => $photoPathDb
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    try { $mysqli->rollback(); } catch (Throwable $t) {}

    if (ob_get_length()) ob_clean();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "User create failed",
        "error"   => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
