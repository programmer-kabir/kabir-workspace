<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception("Invalid request method");
    }

    if (!isset($_GET['email']) || empty(trim($_GET['email']))) {
        throw new Exception("Email parameter is required");
    }

    $email = trim($_GET['email']);

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
        WHERE users.email = ?
        LIMIT 1
    ";

    $stmt = $mysqli->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Database prepare error: " . $mysqli->error);
    }
    
    $stmt->bind_param("s", $email);
    $stmt->execute();
    
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        $limit_data = [
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

        echo json_encode([
            "success" => true,
            "message" => "Author limit fetched successfully",
            "data" => $limit_data
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "No limit found for this email",
            "data" => null
        ]);
    }

    $stmt->close();

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch author limit",
        "error" => $e->getMessage()
    ]);
}

$mysqli->close();
