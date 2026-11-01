<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../helpers/mailer.php';

header("Content-Type: application/json; charset=UTF-8");

$raw = file_get_contents("php://input");
$data = json_decode($raw, true) ?? $_POST;

$id = intval($data['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(["success" => false, "message" => "সঠিক আইডি প্রদান করুন"]);
    exit;
}

$stmt = $mysqli->prepare("SELECT id, recipient, sender, subject, category, event_type, related_id, html_body FROM email_logs WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$mail = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$mail) {
    echo json_encode(["success" => false, "message" => "ইমেইল রেকর্ডটি পাওয়া যায়নি"]);
    exit;
}

// Resend using sl_smtp_send
$res = sl_smtp_send(
    $mail['recipient'], 
    $mail['subject'], 
    $mail['html_body'], 
    $mail['sender'], 
    [], 
    [
        'category'   => $mail['category'],
        'event_type' => $mail['event_type'] . '_resend',
        'related_id' => $mail['related_id']
    ]
);

if ($res['success']) {
    echo json_encode(["success" => true, "message" => "ইমেইলটি পুনরায় সফলভাবে পাঠানো হয়েছে!"]);
} else {
    echo json_encode(["success" => false, "message" => "পুনরায় পাঠানো ব্যর্থ: " . ($res['error'] ?? 'Unknown error')]);
}
