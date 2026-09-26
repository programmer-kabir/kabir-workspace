<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $parent_id = $_GET['parent_id'] ?? null;

    // parent_id দিলে শুধু ওই parent-এর subcategory আসবে
    if ($parent_id !== null && $parent_id !== '') {

        $stmt = $mysqli->prepare("
            SELECT *
            FROM categories
            WHERE parent_id = ?
            ORDER BY id ASC
        ");

        $stmt->bind_param("i", $parent_id);
        $stmt->execute();

        $result = $stmt->get_result();

    } else {
        // parent_id না দিলে সব category + subcategory আসবে
        $sql = "
            SELECT *
            FROM categories
            ORDER BY
                CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END,
                parent_id ASC,
                id ASC
        ";

        $result = $mysqli->query($sql);

        if (!$result) {
            throw new Exception($mysqli->error);
        }
    }

    $categories = [];

    while ($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }

    echo json_encode([
        "success" => true,
        "data" => $categories
    ]);

} catch (Exception $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}