<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

require_once __DIR__ . '/../middleware/check_role.php'; // auth.php ও এর ভেতরে আছে

header("Content-Type: application/json; charset=UTF-8");
// 🔒 শুধু admin দেখতে পারবে
requireRole('admin');
try {
    $sql = "SELECT * FROM subscription_plans ORDER BY id ASC";
    $result = $mysqli->query($sql);

    $plans = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $plans[] = $row;
        }
    }

    echo json_encode(["success" => true, "data" => $plans]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
