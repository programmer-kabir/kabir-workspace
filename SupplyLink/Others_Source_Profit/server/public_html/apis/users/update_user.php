<?php
ob_start();
session_start();
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
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        fail("Only POST request is allowed");
    }

    $raw = file_get_contents("php://input");
    $jsonData = json_decode($raw, true) ?? [];

    $id = intval($_POST['id'] ?? $_POST['user_id'] ?? $jsonData['id'] ?? $jsonData['user_id'] ?? 0);
    if (!$id) {
        fail("User ID is required");
    }

    // Fetch existing user data first
    $stmtOld = $mysqli->prepare("SELECT * FROM users WHERE id = ? LIMIT 1");
    $stmtOld->bind_param("i", $id);
    $stmtOld->execute();
    $oldUser = $stmtOld->get_result()->fetch_assoc();
    $stmtOld->close();

    if (!$oldUser) {
        fail("ইউজার পাওয়া যায়নি");
    }

    // Input data
    $name      = trim($_POST['name'] ?? $jsonData['name'] ?? $oldUser['name']);
    $mobile    = trim($_POST['mobile'] ?? $jsonData['mobile'] ?? $oldUser['mobile']);
    $emailRaw  = isset($_POST['email']) ? trim($_POST['email']) : (isset($jsonData['email']) ? trim($jsonData['email']) : $oldUser['email']);
    $email     = ($emailRaw === '') ? null : $emailRaw;
    $id_number = trim($_POST['id_number'] ?? $jsonData['id_number'] ?? $oldUser['id_number']);
    $address   = trim($_POST['address'] ?? $jsonData['address'] ?? $oldUser['address']);

    // Actor / Editor information
    $actorId   = intval($_POST['actor_id'] ?? $jsonData['actor_id'] ?? $_SESSION['user']['id'] ?? 0);
    $actorName = trim($_POST['actor_name'] ?? $jsonData['actor_name'] ?? $_SESSION['user']['name'] ?? 'অ্যাডমিন / স্টাফ');
    $actorRole = trim($_POST['actor_role'] ?? $jsonData['actor_role'] ?? (is_array($_SESSION['user']['role'] ?? null) ? implode(',', $_SESSION['user']['role']) : ($_SESSION['user']['role'] ?? 'admin')));

    if ($name === '' || $mobile === '') {
        fail("নাম এবং মোবাইল নম্বর খালি রাখা যাবে না");
    }

    // Optional email validation
    if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fail("ইমেইল এড্রেসটি সঠিক নয়");
    }

    // Photo upload handling if a file was provided
    $photoPathDb = $oldUser['photo'];
    $newPhotoUploaded = false;

    if (!empty($_FILES['photo']['name']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        if ($_FILES['photo']['size'] > 5 * 1024 * 1024) {
            fail("ছবির সাইজ সর্বোচ্চ 5MB হতে পারবে");
        }

        $tmpName = $_FILES['photo']['tmp_name'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime  = finfo_file($finfo, $tmpName);
        finfo_close($finfo);

        $allowed = [
            "image/jpeg" => "jpg",
            "image/png"  => "png",
            "image/webp" => "webp",
        ];

        if (!isset($allowed[$mime])) {
            fail("ছবি শুধুমাত্র JPG, PNG অথবা WEBP ফরম্যাটের হতে হবে");
        }

        $ext = $allowed[$mime];
        $base = strtolower($name);
        $base = preg_replace('/\s+/', '_', $base);
        $base = preg_replace('/[^a-z0-9_]/', '', $base);
        $base = trim($base, '_');
        if ($base === '') $base = 'user';

        $uploadDir = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/') . "/uploads/";
        if (!is_dir($uploadDir)) {
            $uploadDir = dirname(__DIR__, 2) . "/uploads/";
        }
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0777, true);
        }

        $filename = $base . "_" . time() . "." . $ext;
        $destPath = $uploadDir . $filename;

        if (move_uploaded_file($tmpName, $destPath)) {
            $photoPathDb = "uploads/" . $filename;
            $newPhotoUploaded = true;
        }
    }

    // Calculate changed fields (Old vs New Diff)
    $changedFields = [];
    if ($oldUser['name'] !== $name) {
        $changedFields[] = ['field' => 'name', 'label' => 'নাম (Name)', 'old' => $oldUser['name'], 'new' => $name];
    }
    if ($oldUser['mobile'] !== $mobile) {
        $changedFields[] = ['field' => 'mobile', 'label' => 'মোবাইল (Mobile)', 'old' => $oldUser['mobile'], 'new' => $mobile];
    }
    $oldEmailNormalized = trim($oldUser['email'] ?? '');
    $newEmailNormalized = trim($email ?? '');
    if ($oldEmailNormalized !== $newEmailNormalized) {
        $changedFields[] = ['field' => 'email', 'label' => 'ইমেইল (Email)', 'old' => $oldEmailNormalized, 'new' => $newEmailNormalized];
    }
    if (trim($oldUser['id_number'] ?? '') !== $id_number) {
        $changedFields[] = ['field' => 'id_number', 'label' => 'আইডি নম্বর (ID)', 'old' => $oldUser['id_number'] ?? '', 'new' => $id_number];
    }
    if (trim($oldUser['address'] ?? '') !== $address) {
        $changedFields[] = ['field' => 'address', 'label' => 'ঠিকানা (Address)', 'old' => $oldUser['address'] ?? '', 'new' => $address];
    }
    if ($newPhotoUploaded) {
        $changedFields[] = ['field' => 'photo', 'label' => 'প্রোফাইল ছবি (Photo)', 'old' => 'পূর্বের ছবি', 'new' => 'নতুন ছবি আপলোড'];
    }

    // Update user in Database
    $updateStmt = $mysqli->prepare("
        UPDATE users 
        SET name = ?, mobile = ?, email = ?, id_number = ?, address = ?, photo = ?
        WHERE id = ?
    ");
    $updateStmt->bind_param("ssssssi", $name, $mobile, $email, $id_number, $address, $photoPathDb, $id);
    $updateStmt->execute();
    $updateStmt->close();

    $updatedUser = [
        'id'        => $id,
        'name'      => $name,
        'mobile'    => $mobile,
        'email'     => $email,
        'id_number' => $id_number,
        'address'   => $address,
        'photo'     => $photoPathDb
    ];

    // Trigger Automated Email Notifications (Admin Audit Diff + User Notification)
    try {
        require_once __DIR__ . '/../helpers/mailer.php';
        sendUserEditNotification($updatedUser, $oldUser, $changedFields, [
            'id'   => $actorId,
            'name' => $actorName,
            'role' => $actorRole
        ]);
    } catch (Throwable $mailErr) {
        error_log("User edit email error: " . $mailErr->getMessage());
    }

    // Activity Log
    try {
        require_once __DIR__ . '/../helpers/log_activity.php';
        logActivity(
            'users',
            'update',
            "User {$name} (#{$id}) profile updated",
            'user',
            $id,
            null,
            [
                'actor_id' => $actorId,
                'actor_name' => $actorName,
                'changed_fields' => $changedFields
            ]
        );
    } catch (Throwable $logErr) {
        error_log("User edit activity log error: " . $logErr->getMessage());
    }

    if (ob_get_length()) ob_clean();
    echo json_encode([
        "success"        => true,
        "message"        => "ইউজার তথ্য সফলভাবে আপডেট হয়েছে 🎉",
        "changed_count"  => count($changedFields),
        "changed_fields" => $changedFields,
        "user"           => $updatedUser
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    if (ob_get_length()) ob_clean();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "ইউজার আপডেট ব্যর্থ হয়েছে",
        "error"   => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}