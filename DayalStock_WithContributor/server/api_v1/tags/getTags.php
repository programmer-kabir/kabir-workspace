<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $search = isset($_GET["search"]) ? trim($_GET["search"]) : "";

    $limit = isset($_GET["limit"]) ? (int) $_GET["limit"] : 20;
    $limit = max(1, min($limit, 50));

    if ($search !== "") {
        $searchLike = "%" . $search . "%";
        $startsWith = $search . "%";

        $sql = "
            SELECT id, name, slug
            FROM tags
            WHERE status = 'active'
              AND name LIKE ?
            ORDER BY
                CASE
                    WHEN LOWER(name) = LOWER(?) THEN 1
                    WHEN LOWER(name) LIKE LOWER(?) THEN 2
                    ELSE 3
                END,
                name ASC
            LIMIT ?
        ";

        $stmt = $mysqli->prepare($sql);

        if (!$stmt) {
            throw new Exception($mysqli->error);
        }

        $stmt->bind_param(
            "sssi",
            $searchLike,
            $search,
            $startsWith,
            $limit
        );

        $stmt->execute();
        $result = $stmt->get_result();

    } else {
        $sql = "
            SELECT id, name, slug
            FROM tags
            WHERE status = 'active'
            ORDER BY name ASC
            LIMIT ?
        ";

        $stmt = $mysqli->prepare($sql);

        if (!$stmt) {
            throw new Exception($mysqli->error);
        }

        $stmt->bind_param("i", $limit);
        $stmt->execute();
        $result = $stmt->get_result();
    }

    $tags = [];

    while ($row = $result->fetch_assoc()) {
        $tags[] = $row;
    }

    echo json_encode([
        "success" => true,
        "message" => "Tags fetched successfully",
        "count" => count($tags),
        "data" => $tags
    ]);

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}