<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception("Invalid request method");
    }

    $sql = "
        SELECT 
            authors.id AS author_id,
            users.name AS user_name,
            users.email AS user_email,
            users.photo AS user_photo,
            aul.id AS limit_id,
            aul.permission_type,
            aul.weekly_upload_limit,
            aul.max_file_size_mb,
            aul.uploads_this_week,
            aul.last_upload_date
        FROM author_upload_limits aul
        INNER JOIN authors ON aul.author_id = authors.id
        INNER JOIN users ON authors.user_id = users.id
        ORDER BY aul.id DESC
    ";

    $result = $mysqli->query($sql);

    if (!$result) {
        throw new Exception("Database error: " . $mysqli->error);
    }

    $authors_limits = [];
    while ($row = $result->fetch_assoc()) {
        $authors_limits[] = [
            "author_id" => (int) $row["author_id"],
            "name" => !empty($row["user_name"]) ? $row["user_name"] : "Contributor",
            "email" => $row["user_email"],
            "photo" => $row["user_photo"],
            "limit_id" => $row["limit_id"] !== null ? (int) $row["limit_id"] : null,
            "permission_type" => $row["permission_type"],
            "weekly_upload_limit" => (int) $row["weekly_upload_limit"],
            "max_file_size_mb" => (int) $row["max_file_size_mb"],
            "uploads_this_week" => (int) $row["uploads_this_week"],
            "last_upload_date" => $row["last_upload_date"]
        ];
    }

    echo json_encode([
        "success" => true,
        "message" => "Author limits fetched successfully",
        "data" => $authors_limits
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch author limits",
        "error" => $e->getMessage()
    ]);
}

$mysqli->close();
