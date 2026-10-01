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

// 🔹 Handle JSON or POST/multipart
$jsonData = json_decode(file_get_contents("php://input"), true);

$id = (int)($_POST['id'] ?? ($jsonData['id'] ?? 0));
$memo_no = $_POST['memo_no'] ?? ($jsonData['memo_no'] ?? '');
$date = $_POST['date'] ?? ($jsonData['date'] ?? '');
$shop_name = $_POST['shop_name'] ?? ($jsonData['shop_name'] ?? '');
$supplier = $_POST['supplier'] ?? ($jsonData['supplier'] ?? '');
$brand = $_POST['brand'] ?? ($jsonData['brand'] ?? '');
$total_amount = (float)($_POST['total_amount'] ?? ($jsonData['total_amount'] ?? 0));
$paid = (float)($_POST['paid'] ?? ($jsonData['paid'] ?? 0));
$due = (float)($_POST['due'] ?? ($jsonData['due'] ?? ($total_amount - $paid)));
$remarks = $_POST['remarks'] ?? ($jsonData['remarks'] ?? '');

$oldImage = $_POST['old_image'] ?? ($jsonData['old_image'] ?? '');
$imagePath = $oldImage;

// 🔴 ID check
if (!$id) {
  echo json_encode([
    "success" => false,
    "message" => "ID is required"
  ]);
  exit;
}

// Fetch previous record for history diff and old image
$prevResult = $mysqli->query("SELECT * FROM supplier_payment WHERE id = {$id} LIMIT 1");
$prevData = $prevResult ? $prevResult->fetch_assoc() : null;
if ($prevData && empty($oldImage)) {
  $oldImage = $prevData['image'] ?? '';
  $imagePath = $oldImage;
}

// 🔹 Handle image upload if provided
$uploadKey = null;
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
  $uploadKey = 'image';
} elseif (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
  $uploadKey = 'image_file';
} elseif (isset($_FILES['new_image']) && $_FILES['new_image']['error'] === UPLOAD_ERR_OK) {
  $uploadKey = 'new_image';
}

if ($uploadKey) {
  $uploadDir = __DIR__ . "/../../uploads/supplier_payments/";
  if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
  }

  $tmpName = $_FILES[$uploadKey]['tmp_name'];
  $originalExt = strtolower(pathinfo($_FILES[$uploadKey]['name'], PATHINFO_EXTENSION));

  $safeMemo = preg_replace('/[^A-Za-z0-9]/', '', $memo_no);
  if (empty($safeMemo)) $safeMemo = "memo_" . time();
  $safeShop = preg_replace('/[^A-Za-z0-9]/', '_', strtolower($shop_name));
  if (empty($safeShop)) $safeShop = "supplier";

  $fileName = time() . "_" . $safeShop . "_" . $safeMemo . "." . ($originalExt ?: "webp");
  $targetPath = $uploadDir . $fileName;

  if (move_uploaded_file($tmpName, $targetPath)) {
    $imagePath = "uploads/supplier_payments/" . $fileName;

    // Delete previous old image if replaced
    if (!empty($oldImage)) {
      $oldFileOnDisk = __DIR__ . "/../../" . ltrim($oldImage, "/");
      if (file_exists($oldFileOnDisk)) {
        @unlink($oldFileOnDisk);
      }
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

// 🔥 Update query
$stmt = $mysqli->prepare("UPDATE supplier_payment SET 
memo_no = ?, 
date = ?, 
shop_name = ?, 
supplier = ?, 
brand = ?, 
total_amount = ?, 
paid = ?, 
due = ?, 
image = ?,
remarks = ?
WHERE id = ?");

$stmt->bind_param(
  "sssssdddssi",
  $memo_no,
  $date,
  $shop_name,
  $supplier,
  $brand,
  $total_amount,
  $paid,
  $due,
  $imagePath,
  $remarks,
  $id
);

if ($stmt->execute()) {
  // Audit History Trail
  $changes = [];
  if ($prevData) {
    $fieldsToTrack = [
      'memo_no' => 'মেমো নম্বর',
      'date' => 'তারিখ',
      'shop_name' => 'প্রতিষ্ঠানের নাম (Shop)',
      'supplier' => 'সাপ্লায়ার',
      'brand' => 'ব্র্যান্ড',
      'total_amount' => 'মোট টাকার পরিমাণ',
      'paid' => 'পরিশোধিত টাকা (Paid)',
      'due' => 'বকেয়া টাকা (Due)',
      'remarks' => 'মন্তব্য'
    ];

    foreach ($fieldsToTrack as $field => $label) {
      $oldVal = (string)($prevData[$field] ?? '');
      $newVal = (string)($$field ?? '');

      if ($field === 'total_amount' || $field === 'paid' || $field === 'due') {
        $oldVal = (string)(float)$oldVal;
        $newVal = (string)(float)$newVal;
      }

      if ($oldVal !== $newVal) {
        $changes[$field] = [
          'label' => $label,
          'old' => $oldVal,
          'new' => $newVal
        ];
      }
    }

    if ($oldImage !== $imagePath && !empty($imagePath)) {
      $changes['image'] = [
        'label' => 'রসিদ / মেমোর ছবি',
        'old' => $oldImage,
        'new' => $imagePath
      ];
    }
  }

  $changesJson = json_encode($changes, JSON_UNESCAPED_UNICODE);
  $historyNote = count($changes) > 0 ? count($changes) . " টি তথ্য পরিবর্তন করা হয়েছে" : "পেমেন্ট তথ্য আপডেট সম্পন্ন";

  $histStmt = $mysqli->prepare("INSERT INTO supplier_payment_history (payment_id, action, changes, note) VALUES (?, 'Updated', ?, ?)");
  if ($histStmt) {
    $histStmt->bind_param("isss", $id, $changesJson, $historyNote);
    $histStmt->execute();
    $histStmt->close();
  }

  echo json_encode([
    "success" => true,
    "message" => "Payment updated successfully",
    "changes" => $changes
  ], JSON_UNESCAPED_UNICODE);
} else {
  echo json_encode([
    "success" => false,
    "message" => "Update failed",
    "error" => $stmt->error
  ]);
}