<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

// ===== Helpers =====
function fail($msg, $debug = null) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $msg,
        "debug"   => $debug
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$user_id = intval($_POST['user_id'] ?? 0);
if (!$user_id) fail("ইউজার আইডি পাওয়া যায়নি (Invalid user ID)");
$review = $_POST['review'] ?? 'pending';

// ===== Check existing row =====
$check = $mysqli->prepare("SELECT id FROM payment_methods WHERE user_id=?");
$check->bind_param("i", $user_id);
$check->execute();
$res = $check->get_result();
$exists = $res->num_rows > 0;
$check->close();

// ===== Dynamic fields =====
$fields = [];
$params = [];
$types  = "";

// ---- BANK ----
if (!empty($_POST['bank_name'])) {
    $fields[] = "bank_name=?";
    $params[] = trim($_POST['bank_name']);
    $types .= "s";
}

if (!empty($_POST['bank_account_name'])) {
    $fields[] = "bank_account_name=?";
    $params[] = trim($_POST['bank_account_name']);
    $types .= "s";
}

if (!empty($_POST['bank_account_number'])) {
    $fields[] = "bank_account_number=?";
    $params[] = trim($_POST['bank_account_number']);
    $types .= "s";
}

if (!empty($_POST['bank_branch'])) {
    $fields[] = "bank_branch=?";
    $params[] = trim($_POST['bank_branch']);
    $types .= "s";
}

// ---- BANK STATEMENT IMAGE / DOCUMENT ----
if (isset($_FILES['bank_statement_image']) && $_FILES['bank_statement_image']['error'] !== UPLOAD_ERR_NO_FILE) {
    if ($_FILES['bank_statement_image']['error'] !== UPLOAD_ERR_OK) {
        fail("ছবি বা ডকুমেন্ট আপলোডে সমস্যা হয়েছে (Upload Error Code: " . $_FILES['bank_statement_image']['error'] . ")");
    }

    $fileTmp  = $_FILES['bank_statement_image']['tmp_name'];
    $rawName  = $_FILES['bank_statement_image']['name'];
    $fileSize = $_FILES['bank_statement_image']['size'];
    $ext      = strtolower(pathinfo($rawName, PATHINFO_EXTENSION));

    // অনুমোদিত এক্সটেনশন (সব ধরনের ইমেজ এবং PDF)
    $allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'jfif', 'bmp', 'gif', 'avif'];
    if (!in_array($ext, $allowedExts, true)) {
        fail("অনুমোদিত ফরম্যাট: JPG, JPEG, PNG, WEBP, PDF, JFIF, BMP, GIF। অন্য কোনো ফাইল গ্রহণযোগ্য নয়।");
    }

    // MIME Type যাচাই
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime  = finfo_file($finfo, $fileTmp);
        finfo_close($finfo);

        $allowedMimes = [
            'image/jpeg', 'image/pjpeg', 'image/png', 'image/webp',
            'image/gif', 'image/bmp', 'image/x-ms-bmp', 'image/avif',
            'application/pdf', 'application/x-pdf'
        ];

        if (!in_array($mime, $allowedMimes, true)) {
            fail("অবৈধ ফাইল ফরম্যাট! দয়া করে সঠিক ছবি বা PDF ফাইল আপলোড করুন।");
        }
    }

    // সর্বোচ্চ সাইজ: ১০ মেগাবাইট (10MB)
    if ($fileSize > 10 * 1024 * 1024) {
        fail("ফাইলের আকার সর্বোচ্চ ১০ মেগাবাইট (10 MB) হতে পারবে।");
    }

    $accountName = $_POST['bank_account_name'] ?? 'statement';
    $accountName = preg_replace('/[^a-zA-Z0-9_]/', '', strtolower($accountName));
    if (empty($accountName)) $accountName = 'statement';

    $filename = "statement_{$accountName}_{$user_id}_" . time() . "_" . uniqid() . "." . $ext;

    // আপলোড ডিরেক্টরি নিশ্চিতকরণ
    $uploadDir = dirname(__DIR__, 2) . "/uploads/";
    if (!is_dir($uploadDir)) {
        $uploadDir = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/') . "/uploads/";
    }
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0777, true);
    }

    $targetPath = rtrim($uploadDir, '/\\') . "/" . $filename;
    if (!move_uploaded_file($fileTmp, $targetPath)) {
        fail("ফাইল সার্ভারে সংরক্ষণ করতে ব্যর্থ হয়েছে। ফোল্ডার পারমিশন চেক করুন।");
    }

    $fields[] = "bank_statement_image=?";
    $params[] = "uploads/" . $filename;
    $types .= "s";
}

// ---- MOBILE WALLET ----
if (isset($_POST['bkash_number']) && $_POST['bkash_number'] !== "") {
    $fields[] = "bkash_number=?";
    $params[] = trim($_POST['bkash_number']);
    $types .= "s";
}

if (isset($_POST['nagad_number']) && $_POST['nagad_number'] !== "") {
    $fields[] = "nagad_number=?";
    $params[] = trim($_POST['nagad_number']);
    $types .= "s";
}

if (isset($_POST['rocket_number']) && $_POST['rocket_number'] !== "") {
    $fields[] = "rocket_number=?";
    $params[] = trim($_POST['rocket_number']);
    $types .= "s";
}

if (!empty($review)) {
    $fields[] = "review=?";
    $params[] = trim($review);
    $types .= "s";
}

// ===== Always update date/time =====
$fields[] = "updated_date=CURDATE()";
$fields[] = "updated_time=CURTIME()";

// ===== INSERT or UPDATE =====
if (!$exists) {
    $sql = "INSERT INTO payment_methods (user_id) VALUES (?)";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $stmt->close();
}

if (!empty($fields)) {
    $sql = "UPDATE payment_methods SET " . implode(", ", $fields) . " WHERE user_id=?";
    $params[] = $user_id;
    $types .= "i";

    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $stmt->close();
}

echo json_encode([
    "success" => true,
    "message" => "পেমেন্ট মেথড ও ব্যাংক স্টেটমেন্ট সফলভাবে সংরক্ষণ করা হয়েছে ✅"
], JSON_UNESCAPED_UNICODE);
