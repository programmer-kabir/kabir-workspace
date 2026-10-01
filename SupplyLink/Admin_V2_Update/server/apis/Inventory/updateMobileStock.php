<?php

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "POST only"
    ]);
    exit;
}

$id = (int)($_POST["id"] ?? 0);

if (!$id) {
    echo json_encode([
        "success" => false,
        "message" => "Missing ID"
    ]);
    exit;
}

$date = $_POST["date"] ?? "";
$category = $_POST["category"] ?? "Mobile";
$brand = $_POST["brand"] ?? "";
$model = $_POST["model"] ?? "";
$variant = $_POST["variant"] ?? "";
$color = $_POST["color"] ?? "";
$purchase_price = $_POST["purchase_price"] ?? 0;
$mrp = $_POST["mrp"] ?? 0;
$supplier = $_POST["supplier"] ?? "";
$status = $_POST["status"] ?? "available";

// Ensure category column and image column and history table exist
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Mobile'");
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS image VARCHAR(255) NULL");
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS variant VARCHAR(100) NULL");
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS color VARCHAR(50) NULL");
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(12,2) DEFAULT 0");
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS mrp DECIMAL(12,2) DEFAULT 0");
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS supplier VARCHAR(150) NULL");
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available'");

$oldImage = $_POST["old_image"] ?? "";
$imagePath = $oldImage;

$uploadKey = null;
if (isset($_FILES["image"]) && $_FILES["image"]["error"] === UPLOAD_ERR_OK) {
    $uploadKey = "image";
} elseif (isset($_FILES["image_file"]) && $_FILES["image_file"]["error"] === UPLOAD_ERR_OK) {
    $uploadKey = "image_file";
} elseif (isset($_FILES["new_image"]) && $_FILES["new_image"]["error"] === UPLOAD_ERR_OK) {
    $uploadKey = "new_image";
}

if ($uploadKey) {
    $uploadDir = __DIR__ . "/../../uploads/mobile/";

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $ext = strtolower(pathinfo(
        $_FILES[$uploadKey]["name"],
        PATHINFO_EXTENSION
    ));

    if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
        $fileName = time() . "_" . uniqid() . "." . $ext;
        $destination = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES[$uploadKey]["tmp_name"], $destination)) {
            $imagePath = "uploads/mobile/" . $fileName;

            // Delete old image if exists
            if (!empty($oldImage)) {
                $oldFileOnDisk = __DIR__ . "/../../" . ltrim($oldImage, "/");
                if (file_exists($oldFileOnDisk)) {
                    @unlink($oldFileOnDisk);
                }
            }
        }
    }
}
$mysqli->query("CREATE TABLE IF NOT EXISTS Stock_Inventory_History (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT NOT NULL,
    action VARCHAR(50) DEFAULT 'Updated',
    changes JSON NULL,
    note VARCHAR(255) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX (stock_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

// Fetch previous record to compute diff
$prevResult = $mysqli->query("SELECT * FROM Stock_Inventory WHERE id = {$id} LIMIT 1");
$prevData = $prevResult ? $prevResult->fetch_assoc() : null;

$stmt = $mysqli->prepare("
UPDATE Stock_Inventory SET
date=?,
category=?,
brand=?,
model=?,
image=?,
variant=?,
color=?,
purchase_price=?,
mrp=?,
supplier=?,
status=?
WHERE id=?
");

$stmt->bind_param(
    "sssssssddssi",
    $date,
    $category,
    $brand,
    $model,
    $imagePath,
    $variant,
    $color,
    $purchase_price,
    $mrp,
    $supplier,
    $status,
    $id
);

if ($stmt->execute()) {
    // Record History Audit Trail
    $changes = [];
    if ($prevData) {
        $fieldsToTrack = [
            'category' => 'ক্যাটাগরি',
            'brand' => 'ব্র্যান্ড',
            'model' => 'মডেল',
            'variant' => 'স্পেসিফিকেশন/ভ্যারিয়েন্ট',
            'color' => 'কালার',
            'purchase_price' => 'ক্রয়মূল্য',
            'mrp' => 'বিক্রয়মূল্য (MRP)',
            'supplier' => 'সাপ্লায়ার',
            'status' => 'স্ট্যাটাস',
            'date' => 'তারিখ'
        ];

        foreach ($fieldsToTrack as $field => $label) {
            $oldVal = (string)($prevData[$field] ?? '');
            $newVal = (string)($$field ?? '');
            
            // Normalize floats
            if ($field === 'purchase_price' || $field === 'mrp') {
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
                'label' => 'ছবি',
                'old' => $oldImage,
                'new' => $imagePath
            ];
        }
    }

    $actionName = isset($changes['status']) ? 'Status Changed' : 'Updated';
    $changesJson = json_encode($changes, JSON_UNESCAPED_UNICODE);
    $historyNote = count($changes) > 0 ? count($changes) . " টি তথ্য পরিবর্তন করা হয়েছে" : "তথ্য আপডেট সম্পন্ন";

    $histStmt = $mysqli->prepare("INSERT INTO Stock_Inventory_History (stock_id, action, changes, note) VALUES (?, ?, ?, ?)");
    if ($histStmt) {
        $histStmt->bind_param("isss", $id, $actionName, $changesJson, $historyNote);
        $histStmt->execute();
        $histStmt->close();
    }

    echo json_encode([
        "success" => true,
        "message" => "Updated successfully",
        "changes" => $changes
    ], JSON_UNESCAPED_UNICODE);

} else {
    echo json_encode([
        "success" => false,
        "error" => $stmt->error
    ], JSON_UNESCAPED_UNICODE);
}