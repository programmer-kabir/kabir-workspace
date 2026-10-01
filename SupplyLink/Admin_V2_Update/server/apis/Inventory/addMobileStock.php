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
        "message" => "Method not allowed"
    ]);

    exit;
}

// ======================
// FORM DATA
// ======================

$date = $_POST["date"] ?? null;
$brand = $_POST["brand"] ?? "";
$model = $_POST["model"] ?? "";
$variant = $_POST["variant"] ?? "";
$color = $_POST["color"] ?? "";
$purchase_price = $_POST["purchase_price"] ?? 0;
$mrp = $_POST["mrp"] ?? 0;
$supplier = $_POST["supplier"] ?? "";
$status = $_POST["status"] ?? "available";

// ======================
// DATABASE SCHEMA CHECKS
// ======================
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Mobile'");
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS image VARCHAR(255) NULL");
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS variant VARCHAR(100) NULL");
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS color VARCHAR(50) NULL");
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(12,2) DEFAULT 0");
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS mrp DECIMAL(12,2) DEFAULT 0");
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS supplier VARCHAR(150) NULL");
$mysqli->query("ALTER TABLE Stock_Inventory ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available'");

// ======================
// IMAGE UPLOAD (OPTIONAL)
// ======================
$imagePath = null;

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

    $extension = strtolower(pathinfo(
        $_FILES[$uploadKey]["name"],
        PATHINFO_EXTENSION
    ));

    if (in_array($extension, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
        $fileName = time() . "_" . uniqid() . "." . $extension;
        $destination = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES[$uploadKey]["tmp_name"], $destination)) {
            $imagePath = "uploads/mobile/" . $fileName;
        }
    }
}

$category = $_POST["category"] ?? "Mobile";

$stmt = $mysqli->prepare("
    INSERT INTO Stock_Inventory
    (
        date,
        category,
        brand,
        model,
        image,
        variant,
        color,
        purchase_price,
        mrp,
        supplier,
        status
    )
    VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => $mysqli->error
    ]);
    exit;
}

$stmt->bind_param(
    "sssssssddss",
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
    $status
);

if ($stmt->execute()) {
    $newStockId = $mysqli->insert_id;

    // Log history
    $mysqli->query("CREATE TABLE IF NOT EXISTS Stock_Inventory_History (
        id INT AUTO_INCREMENT PRIMARY KEY,
        stock_id INT NOT NULL,
        action VARCHAR(50) DEFAULT 'Updated',
        changes JSON NULL,
        note VARCHAR(255) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX (stock_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $initialData = [
        'category' => $category,
        'brand' => $brand,
        'model' => $model,
        'variant' => $variant,
        'color' => $color,
        'purchase_price' => $purchase_price,
        'mrp' => $mrp,
        'supplier' => $supplier,
        'status' => $status,
        'date' => $date
    ];
    $initJson = json_encode($initialData, JSON_UNESCAPED_UNICODE);
    $histStmt = $mysqli->prepare("INSERT INTO Stock_Inventory_History (stock_id, action, changes, note) VALUES (?, 'Created', ?, 'প্রাথমিক স্টক এন্ট্রি সম্পন্ন')");
    if ($histStmt) {
        $histStmt->bind_param("is", $newStockId, $initJson);
        $histStmt->execute();
        $histStmt->close();
    }

    echo json_encode([
        "success" => true,
        "message" => "Stock added successfully",
        "id" => $newStockId
    ]);

} else {

    echo json_encode([
        "success" => false,
        "message" => "Insert failed",
        "error" => $stmt->error
    ]);
}

$stmt->close();
$mysqli->close();

?>