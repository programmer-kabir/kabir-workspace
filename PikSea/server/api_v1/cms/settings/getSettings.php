<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
// Prepare a JSON response structure
$response = [
    "success" => false,
    "data" => []
];
try {
    $sql = "SELECT setting_key, setting_value FROM settings";
    $result = $mysqli->query($sql);
    if ($result) {
        $settings = [];
        while ($row = $result->fetch_assoc()) {
            // Attempt to decode JSON, otherwise leave as string
            $val = $row['setting_value'];
            $decoded = json_decode($val, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $settings[$row['setting_key']] = $decoded;
            } else {
                $settings[$row['setting_key']] = $val;
            }
        }
        
        $response["success"] = true;
        $response["data"] = $settings;
    } else {
        throw new Exception("Database error: " . $mysqli->error);
    }
} catch (Exception $e) {
    http_response_code(500);
    $response["message"] = $e->getMessage();
}
header('Content-Type: application/json');
echo json_encode($response);
