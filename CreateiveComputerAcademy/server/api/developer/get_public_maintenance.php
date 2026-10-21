<?php
require_once '../../config/cors.php';

$configFile = dirname(__DIR__, 2) . '/config/maintenance_status.json';

$enabled = false;
$message = "সিস্টেম আপগ্রেড ও অপটিমাইজেশন চলছে। সাময়িক অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত।";
$updatedBy = "Developer";
$updatedAt = null;

if (file_exists($configFile)) {
    $data = json_decode(file_get_contents($configFile), true);
    if (is_array($data)) {
        $enabled = !empty($data['maintenance_enabled']);
        if (!empty($data['maintenance_message'])) {
            $message = $data['maintenance_message'];
        }
        if (!empty($data['updated_by'])) {
            $updatedBy = $data['updated_by'];
        }
        if (!empty($data['updated_at'])) {
            $updatedAt = $data['updated_at'];
        }
    }
}

echo json_encode([
    "status" => "success",
    "maintenance_enabled" => $enabled,
    "maintenance_message" => $message,
    "updated_by" => $updatedBy,
    "updated_at" => $updatedAt
]);
?>
