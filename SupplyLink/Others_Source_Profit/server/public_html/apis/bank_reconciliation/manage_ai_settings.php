<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

function sendJson($status, $payload) {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    // 1. Get AI auto-audit status
    $aiEnabled = 1;
    $setRes = $mysqli->query("SELECT setting_value FROM ai_settings WHERE setting_key = 'ai_auto_audit_enabled' LIMIT 1");
    if ($setRes && $row = $setRes->fetch_assoc()) {
        $aiEnabled = intval($row['setting_value'] ?? 1);
    }

    // 2. Get keys summary (masked keys)
    $keys = [];
    $kRes = $mysqli->query("SELECT id, provider, label, is_active, error_count, last_used_at, created_at, CONCAT(SUBSTRING(api_key, 1, 6), '...', SUBSTRING(api_key, -4)) AS masked_key FROM ai_api_keys ORDER BY id DESC");
    if ($kRes) {
        while ($r = $kRes->fetch_assoc()) {
            $keys[] = $r;
        }
    }

    sendJson(200, [
        "success" => true,
        "ai_enabled" => ($aiEnabled === 1),
        "keys" => $keys
    ]);
}

if ($method === 'POST') {
    $raw = file_get_contents("php://input");
    $body = json_decode($raw, true) ?? $_POST;

    $action = strtolower(trim($body['action'] ?? ''));

    // Toggle AI mode ON / OFF
    if ($action === 'toggle') {
        $newVal = !empty($body['enabled']) ? '1' : '0';
        $stmt = $mysqli->prepare("
            INSERT INTO ai_settings (setting_key, setting_value) 
            VALUES ('ai_auto_audit_enabled', ?) 
            ON DUPLICATE KEY UPDATE setting_value = ?
        ");
        $stmt->bind_param("ss", $newVal, $newVal);
        $stmt->execute();
        $stmt->close();

        sendJson(200, [
            "success" => true,
            "message" => ($newVal === '1' ? "AI অটো-স্ক্যান সফলভাবে চালু করা হয়েছে 🟢" : "AI অটো-স্ক্যান বন্ধ করা হয়েছে (ম্যানুয়াল মোড সক্রিয়) ⚪"),
            "ai_enabled" => ($newVal === '1')
        ]);
    }

    // Add new API key
    if ($action === 'add_key') {
        $newKey = trim($body['api_key'] ?? '');
        $label  = trim($body['label'] ?? 'Gemini Key');

        if (empty($newKey)) {
            sendJson(400, ["success" => false, "message" => "API Key প্রদান করা আবশ্যক"]);
        }

        $ins = $mysqli->prepare("INSERT INTO ai_api_keys (provider, api_key, label, is_active) VALUES ('gemini', ?, ?, 1)");
        $ins->bind_param("ss", $newKey, $label);
        $ins->execute();
        $ins->close();

        sendJson(200, [
            "success" => true,
            "message" => "নতুন Gemini API Key ডাটাবেজে সফলভাবে যুক্ত হয়েছে 🎉"
        ]);
    }

    // Toggle key active status
    if ($action === 'toggle_key_status') {
        $keyId = intval($body['key_id'] ?? 0);
        $status = !empty($body['is_active']) ? 1 : 0;

        $stmt = $mysqli->prepare("UPDATE ai_api_keys SET is_active = ? WHERE id = ?");
        $stmt->bind_param("ii", $status, $keyId);
        $stmt->execute();
        $stmt->close();

        sendJson(200, [
            "success" => true,
            "message" => "Key স্ট্যাটাস আপডেট হয়েছে"
        ]);
    }

    sendJson(400, ["success" => false, "message" => "অজানা অ্যাকশন"]);
}
