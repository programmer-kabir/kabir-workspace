<?php

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json");

// OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(200);
  exit;
}

// Only POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  http_response_code(405);
  echo json_encode([
    "success" => false,
    "message" => "Use POST request"
  ]);
  exit;
}

// 🔹 Handle JSON or POST
$jsonData = json_decode(file_get_contents("php://input"), true);

$memo_no = $_POST['memo_no'] ?? ($jsonData['memo_no'] ?? '');
$date = $_POST['date'] ?? ($jsonData['date'] ?? date('Y-m-d'));
$shop_name = $_POST['shop_name'] ?? ($jsonData['shop_name'] ?? '');
$supplier = $_POST['supplier'] ?? ($jsonData['supplier'] ?? '');
$brand = $_POST['brand'] ?? ($jsonData['brand'] ?? '');
$total_amount = floatval($_POST['total_amount'] ?? ($jsonData['total_amount'] ?? 0));
$paid = floatval($_POST['paid'] ?? ($jsonData['paid'] ?? 0));
$due = floatval($_POST['due'] ?? ($jsonData['due'] ?? ($total_amount - $paid)));
$remarks = $_POST['remarks'] ?? ($jsonData['remarks'] ?? '');
$auto_cash_out = isset($_POST['auto_cash_out']) ? filter_var($_POST['auto_cash_out'], FILTER_VALIDATE_BOOLEAN) : (isset($jsonData['auto_cash_out']) ? filter_var($jsonData['auto_cash_out'], FILTER_VALIDATE_BOOLEAN) : true);

// 🔹 Upload folder
$uploadDir = __DIR__ . "/../../uploads/supplier_payments/";
$dbPath = "";

if (!is_dir($uploadDir)) {
  mkdir($uploadDir, 0777, true);
}

// 🔥 Handle image
$uploadKey = null;
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
  $uploadKey = 'image';
} elseif (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
  $uploadKey = 'image_file';
}

if ($uploadKey) {
  $tmpName = $_FILES[$uploadKey]['tmp_name'];
  $originalExt = strtolower(pathinfo($_FILES[$uploadKey]['name'], PATHINFO_EXTENSION));

  $safeMemo = preg_replace('/[^A-Za-z0-9]/', '', $memo_no);
  if (empty($safeMemo)) $safeMemo = "memo_" . time();
  $safeShop = preg_replace('/[^A-Za-z0-9]/', '_', strtolower($shop_name));
  if (empty($safeShop)) $safeShop = "supplier";

  $fileName = time() . "_" . $safeShop . "_" . $safeMemo . "." . ($originalExt ?: "webp");
  $targetPath = $uploadDir . $fileName;

  // Try convert to webp if GD library available
  $imageInfo = @getimagesize($tmpName);
  if ($imageInfo !== false && function_exists('imagecreatefromjpeg') && function_exists('imagewebp')) {
    $mime = $imageInfo['mime'];
    $image = null;
    switch ($mime) {
      case 'image/jpeg':
        $image = @imagecreatefromjpeg($tmpName);
        break;
      case 'image/png':
        $image = @imagecreatefrompng($tmpName);
        break;
      case 'image/gif':
        $image = @imagecreatefromgif($tmpName);
        break;
      case 'image/webp':
        $image = @imagecreatefromwebp($tmpName);
        break;
    }

    if ($image) {
      $webpFileName = time() . "_" . $safeShop . "_" . $safeMemo . ".webp";
      $webpTargetPath = $uploadDir . $webpFileName;
      if (imagewebp($image, $webpTargetPath, 80)) {
        imagedestroy($image);
        $dbPath = "uploads/supplier_payments/" . $webpFileName;
      }
    }
  }

  // Fallback to normal move_uploaded_file
  if (empty($dbPath)) {
    if (move_uploaded_file($tmpName, $targetPath)) {
      $dbPath = "uploads/supplier_payments/" . $fileName;
    }
  }
}

// Auto fix missing AUTO_INCREMENT on table if needed
try {
  @$mysqli->query("ALTER TABLE supplier_payment MODIFY id INT NOT NULL AUTO_INCREMENT");
} catch (Throwable $t) {}

// Ensure history table exists
try {
  @$mysqli->query("CREATE TABLE IF NOT EXISTS supplier_payment_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      payment_id INT NOT NULL,
      action VARCHAR(50) DEFAULT 'Updated',
      changes JSON NULL,
      note VARCHAR(255) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX (payment_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
  @$mysqli->query("ALTER TABLE supplier_payment_history MODIFY id INT NOT NULL AUTO_INCREMENT");
} catch (Throwable $t) {}

// Calculate next safe ID in case AUTO_INCREMENT is missing
$nextIdRes = $mysqli->query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM supplier_payment");
$nextIdRow = $nextIdRes ? $nextIdRes->fetch_assoc() : null;
$nextId = $nextIdRow ? (int)$nextIdRow['next_id'] : 1;
if ($nextId <= 0) $nextId = 1;

// 🔥 Insert query with explicit ID to guarantee no duplicate '0'
$stmt = $mysqli->prepare("INSERT INTO supplier_payment 
(id, memo_no, date, shop_name, supplier, brand, total_amount, paid, due, image, remarks) 
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

if (!$stmt) {
  // Fallback if id column format differs
  $stmt = $mysqli->prepare("INSERT INTO supplier_payment 
  (memo_no, date, shop_name, supplier, brand, total_amount, paid, due, image, remarks) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  $stmt->bind_param(
    "sssssdddss",
    $memo_no,
    $date,
    $shop_name,
    $supplier,
    $brand,
    $total_amount,
    $paid,
    $due,
    $dbPath,
    $remarks
  );
} else {
  $stmt->bind_param(
    "isssssdddss",
    $nextId,
    $memo_no,
    $date,
    $shop_name,
    $supplier,
    $brand,
    $total_amount,
    $paid,
    $due,
    $dbPath,
    $remarks
  );
}

if ($stmt->execute()) {
  $newPaymentId = $stmt->insert_id ?: $nextId;

  // Log initial creation
  $initialData = [
    'memo_no' => $memo_no,
    'date' => $date,
    'shop_name' => $shop_name,
    'supplier' => $supplier,
    'brand' => $brand,
    'total_amount' => $total_amount,
    'paid' => $paid,
    'due' => $due,
    'remarks' => $remarks
  ];
  $initJson = json_encode($initialData, JSON_UNESCAPED_UNICODE);
  $noteMsg = "নতুন পণ্য ক্রয় এন্ট্রি সম্পন্ন" . ($paid > 0 ? " (পরিশোধ: ৳" . number_format($paid) . ")" : "");

  try {
    $nextHistRes = $mysqli->query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM supplier_payment_history");
    $nextHistRow = $nextHistRes ? $nextHistRes->fetch_assoc() : null;
    $nextHistId = $nextHistRow ? (int)$nextHistRow['next_id'] : 1;

    $histStmt = $mysqli->prepare("INSERT INTO supplier_payment_history (id, payment_id, action, changes, note) VALUES (?, ?, 'Created', ?, ?)");
    if ($histStmt) {
      $histStmt->bind_param("iiss", $nextHistId, $newPaymentId, $initJson, $noteMsg);
      $histStmt->execute();
      $histStmt->close();
    }
  } catch (Throwable $t) {}

  echo json_encode([
    "success" => true,
    "message" => "পণ্য ক্রয় ও পেমেন্ট সফলভাবে সম্পন্ন হয়েছে!",
    "id" => $newPaymentId
  ], JSON_UNESCAPED_UNICODE);
} else {
  echo json_encode([
    "success" => false,
    "message" => "Insert failed",
    "error" => $stmt->error
  ], JSON_UNESCAPED_UNICODE);
}