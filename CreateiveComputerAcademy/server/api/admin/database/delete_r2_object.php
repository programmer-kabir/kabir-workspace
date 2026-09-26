<?php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/R2Client.php';
require_once __DIR__ . '/../../../config/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed. Use POST.']);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    $data = $_POST;
}

$key = isset($data['key']) ? trim($data['key']) : '';
$prefix = isset($data['prefix']) ? trim($data['prefix']) : '';
$keys = isset($data['keys']) && is_array($data['keys']) ? $data['keys'] : [];

if (empty($key) && empty($prefix) && empty($keys)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing key, prefix, or keys array to delete.']);
    exit;
}

try {
    $r2 = new R2Client();

    // 1. Bulk delete list of keys
    if (!empty($keys)) {
        $deleted = 0;
        $failed = 0;
        foreach ($keys as $k) {
            $res = $r2->deleteObject($k);
            if ($res['success']) {
                $deleted++;
            } else {
                $failed++;
            }
        }
        echo json_encode([
            'status' => 'success',
            'message' => "Successfully deleted {$deleted} objects" . ($failed > 0 ? " ({$failed} failed)" : ""),
            'deleted_count' => $deleted,
            'failed_count' => $failed
        ]);
        exit;
    }

    // 2. Folder / Prefix recursive delete
    if (!empty($prefix)) {
        $res = $r2->deletePrefix($prefix);
        if ($res['success']) {
            echo json_encode([
                'status' => 'success',
                'message' => "Successfully deleted folder and its {$res['deleted_count']} contents.",
                'deleted_count' => $res['deleted_count'],
                'prefix' => $prefix
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to delete folder contents from R2.'
            ]);
        }
        exit;
    }

    // 3. Single object delete
    if (!empty($key)) {
        $res = $r2->deleteObject($key);
        if ($res['success']) {
            echo json_encode([
                'status' => 'success',
                'message' => "Object '{$key}' deleted successfully.",
                'key' => $key
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => isset($res['error']) ? $res['error'] : 'Failed to delete object from R2.'
            ]);
        }
        exit;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
