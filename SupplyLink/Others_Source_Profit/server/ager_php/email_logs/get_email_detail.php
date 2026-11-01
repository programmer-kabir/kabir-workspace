<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$id = intval($_GET['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(["success" => false, "message" => "সঠিক ইমেইল আইডি প্রদান করুন"]);
    exit;
}

$stmt = $mysqli->prepare("
    SELECT 
        id, 
        recipient, 
        sender, 
        subject, 
        category, 
        event_type, 
        related_id, 
        html_body, 
        status, 
        error_message, 
        sent_at
    FROM email_logs
    WHERE id = ?
");
$stmt->bind_param("i", $id);
$stmt->execute();
$data = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$data) {
    echo json_encode(["success" => false, "message" => "ইমেইল লগটি পাওয়া যায়নি"]);
    exit;
}

echo json_encode([
    "success" => true,
    "data"    => $data
], JSON_UNESCAPED_UNICODE);
