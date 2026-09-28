<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/check_role.php';

header("Content-Type: application/json; charset=UTF-8");

// 🔒 শুধু admin দেখতে পারবে
requireRole('admin');

try {
    $sql = "SELECT * FROM credit_packages ORDER BY sort_order ASC, id ASC";
    $result = $mysqli->query($sql);

    $packages = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $packages[] = $row;
        }
    }

    echo json_encode(["success" => true, "data" => $packages]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
