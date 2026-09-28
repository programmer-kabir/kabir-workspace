<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';
$response = ["success" => false, "data" => []];
try {
    $sql = "SELECT * FROM testimonials WHERE status = 'active' ORDER BY id DESC";
    $result = $mysqli->query($sql);
    if ($result) {
        $testimonials = [];
        while ($row = $result->fetch_assoc()) {
            $testimonials[] = $row;
        }
        $response["success"] = true;
        $response["data"] = $testimonials;
    } else {
        throw new Exception("Database error: " . $mysqli->error);
    }
} catch (Exception $e) {
    http_response_code(500);
    $response["message"] = $e->getMessage();
}
header('Content-Type: application/json');
echo json_encode($response);
