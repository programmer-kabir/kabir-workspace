<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/db_setup.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    ensureAiKeysTable($mysqli);

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $stmt = $mysqli->prepare("
            SELECT id, provider, api_key, label, status, usage_count, last_used_at, created_at 
            FROM ai_api_keys 
            ORDER BY id DESC
        ");
        $stmt->execute();
        $res = $stmt->get_result();
        $keys = [];
        while ($row = $res->fetch_assoc()) {
            $rawKey = $row['api_key'];
            $maskedKey = strlen($rawKey) > 10 ? substr($rawKey, 0, 6) . '...' . substr($rawKey, -4) : '******';
            $row['masked_key'] = $maskedKey;
            $keys[] = $row;
        }
        $stmt->close();

        echo json_encode([
            "success" => true,
            "data" => $keys
        ]);
        exit;
    }

    if ($method === 'POST') {
        $rawInput = file_get_contents('php://input');
        $input = json_decode($rawInput, true) ?: $_POST;

        $action = $input['action'] ?? 'add';

        if ($action === 'add') {
            $apiKey = trim($input['api_key'] ?? '');
            $label = trim($input['label'] ?? 'Gemini Key');
            $provider = trim($input['provider'] ?? 'gemini');

            if (empty($apiKey)) {
                throw new Exception("API Key cannot be empty.");
            }

            $stmt = $mysqli->prepare("INSERT INTO ai_api_keys (provider, api_key, label, status) VALUES (?, ?, ?, 'active')");
            if (!$stmt) {
                throw new Exception("DB Error: " . $mysqli->error);
            }
            $stmt->bind_param("sss", $provider, $apiKey, $label);
            if (!$stmt->execute()) {
                if ($mysqli->errno === 1062) {
                    throw new Exception("This API Key already exists in the system.");
                }
                throw new Exception("Failed to save key: " . $stmt->error);
            }
            $stmt->close();

            echo json_encode([
                "success" => true,
                "message" => "AI API Key added successfully."
            ]);
            exit;
        }

        if ($action === 'toggle_status') {
            $id = (int) ($input['id'] ?? 0);
            $newStatus = trim($input['status'] ?? 'active');
            if (!in_array($newStatus, ['active', 'inactive', 'rate_limited'])) {
                $newStatus = 'active';
            }

            $stmt = $mysqli->prepare("UPDATE ai_api_keys SET status = ? WHERE id = ?");
            $stmt->bind_param("si", $newStatus, $id);
            $stmt->execute();
            $stmt->close();

            echo json_encode([
                "success" => true,
                "message" => "Status updated successfully."
            ]);
            exit;
        }

        if ($action === 'delete') {
            $id = (int) ($input['id'] ?? 0);
            if ($id <= 0) throw new Exception("Invalid key ID.");

            $stmt = $mysqli->prepare("DELETE FROM ai_api_keys WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $stmt->close();

            echo json_encode([
                "success" => true,
                "message" => "API Key deleted successfully."
            ]);
            exit;
        }

        if ($action === 'reset_counts') {
            $mysqli->query("UPDATE ai_api_keys SET usage_count = 0, status = 'active'");
            echo json_encode([
                "success" => true,
                "message" => "All key usage metrics reset successfully."
            ]);
            exit;
        }
    }

    if ($method === 'DELETE') {
        $id = (int) ($_GET['id'] ?? 0);
        if ($id <= 0) throw new Exception("Invalid key ID.");

        $stmt = $mysqli->prepare("DELETE FROM ai_api_keys WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->close();

        echo json_encode([
            "success" => true,
            "message" => "API Key deleted successfully."
        ]);
        exit;
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
