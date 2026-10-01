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

// 🔹 Get data
$memo_no = $_POST['memo_no'] ?? '';
$date = $_POST['date'] ?? '';
$shop_name = $_POST['shop_name'] ?? '';
$supplier = $_POST['supplier'] ?? '';
$brand = $_POST['brand'] ?? '';
$total_amount = $_POST['total_amount'] ?? 0;
$paid = $_POST['paid'] ?? 0;
$due = $_POST['due'] ?? 0;
$remarks = $_POST['remarks'] ?? '';

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

// Ensure history table exists
$mysqli->query("CREATE TABLE IF NOT EXISTS supplier_payment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT NOT NULL,
    action VARCHAR(50) DEFAULT 'Updated',
    changes JSON NULL,
    note VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

// 🔥 Insert query
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

if ($stmt->execute()) {
  $newPaymentId = $mysqli->insert_id;

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
  $histStmt = $mysqli->prepare("INSERT INTO supplier_payment_history (payment_id, action, changes, note) VALUES (?, 'Created', ?, 'নতুন সাপ্লায়ার পেমেন্ট এন্ট্রি সম্পন্ন')");
  if ($histStmt) {
    $histStmt->bind_param("is", $newPaymentId, $initJson);
    $histStmt->execute();
    $histStmt->close();
  }

  echo json_encode([
    "success" => true,
    "message" => "Payment added successfully",
    "id" => $newPaymentId
  ]);
} else {
  echo json_encode([
    "success" => false,
    "message" => "Insert failed",
    "error" => $stmt->error
  ]);
}