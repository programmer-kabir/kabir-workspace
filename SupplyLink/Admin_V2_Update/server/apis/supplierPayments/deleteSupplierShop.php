<?php

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "DELETE" && $_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed"
    ]);
    exit;
}

$id = intval($_GET["id"] ?? ($_POST["id"] ?? 0));

if ($id <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Shop ID required"
    ]);
    exit;
}

$stmt = $mysqli->prepare("DELETE FROM supplier_shops WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "সাপ্লায়ার প্রোফাইল সফলভাবে মুছে ফেলা হয়েছে! 🗑️"
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Delete failed: " . $stmt->error
    ], JSON_UNESCAPED_UNICODE);
}

$stmt->close();
$mysqli->close();
