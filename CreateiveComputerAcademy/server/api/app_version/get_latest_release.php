<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/AppVersionHelper.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    AppVersionHelper::ensureSchema($db);

    $stmt = $db->query("SELECT * FROM app_releases ORDER BY id DESC LIMIT 1");
    $latest = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$latest) {
        $latest = [
            'version' => '1.0.0',
            'release_title' => 'CCA Desktop Attendance Suite (Windows)',
            'release_notes' => "• Zero-Prompt Instant Check-In & Check-Out\n• 24 FPS Optimized Live Workstation Stream\n• 5-Minute Inactivity Watchdog\n• Mango Break & Tiffin Timer Integration\n• Auto-Start with Windows in System Tray",
            'download_url' => 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev/releases/v1.0.0/CCA-Attendance-Setup.exe',
            'file_size' => 85983232,
            'created_at' => date('Y-m-d H:i:s')
        ];
    }

    echo json_encode([
        "status" => "success",
        "latest" => $latest
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Failed to get latest release: " . $e->getMessage(),
        "latest"  => [
            'version' => '1.0.0',
            'release_title' => 'CCA Desktop Attendance Suite (Windows)',
            'release_notes' => "• Zero-Prompt Instant Check-In & Check-Out\n• 24 FPS Optimized Live Workstation Stream\n• 5-Minute Inactivity Watchdog\n• Mango Break & Tiffin Timer Integration\n• Auto-Start with Windows in System Tray",
            'download_url' => 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev/releases/v1.0.0/CCA-Attendance-Setup.exe',
            'file_size' => 85983232
        ]
    ]);
}
