<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $author_id = isset($_GET['author_id']) ? (int)$_GET['author_id'] : 0;
    $email = isset($_GET['email']) ? trim($_GET['email']) : '';

    $sql = "
        SELECT 
            h.id,
            h.author_id,
            h.old_level_id,
            h.new_level_id,
            h.published_files_at_change,
            h.downloads_at_change,
            h.changed_reason,
            h.created_at,
            u.name AS author_name,
            u.username AS author_username,
            u.photo AS author_avatar,
            u.email AS author_email,
            IFNULL(old_r.level_name, CONCAT('Level ', h.old_level_id)) AS old_level_name,
            IFNULL(old_r.badge_color, '#6B7280') AS old_badge_color,
            IFNULL(new_r.level_name, CONCAT('Level ', h.new_level_id)) AS new_level_name,
            IFNULL(new_r.badge_color, '#3B82F6') AS new_badge_color
        FROM author_level_history h
        INNER JOIN authors a ON h.author_id = a.id
        INNER JOIN users u ON a.user_id = u.id
        LEFT JOIN author_level_rules old_r ON h.old_level_id = old_r.id
        LEFT JOIN author_level_rules new_r ON h.new_level_id = new_r.id
    ";

    $params = [];
    $types = "";

    if ($author_id > 0) {
        $sql .= " WHERE h.author_id = ?";
        $params[] = $author_id;
        $types .= "i";
    } elseif (!empty($email)) {
        $sql .= " WHERE u.email = ?";
        $params[] = $email;
        $types .= "s";
    }

    $sql .= " ORDER BY h.id DESC LIMIT 100";

    if (!empty($params)) {
        $stmt = $mysqli->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $res = $stmt->get_result();
    } else {
        $res = $mysqli->query($sql);
    }

    $history = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $history[] = [
                "id" => (int)$row["id"],
                "author_id" => (int)$row["author_id"],
                "author_name" => $row["author_name"],
                "author_username" => $row["author_username"],
                "author_avatar" => $row["author_avatar"],
                "author_email" => $row["author_email"],
                "old_level_id" => (int)$row["old_level_id"],
                "old_level_name" => $row["old_level_name"],
                "old_badge_color" => $row["old_badge_color"],
                "new_level_id" => (int)$row["new_level_id"],
                "new_level_name" => $row["new_level_name"],
                "new_badge_color" => $row["new_badge_color"],
                "published_files_at_change" => (int)$row["published_files_at_change"],
                "downloads_at_change" => (int)$row["downloads_at_change"],
                "changed_reason" => $row["changed_reason"],
                "created_at" => $row["created_at"]
            ];
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "Author level history fetched successfully",
        "count" => count($history),
        "data" => $history
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

$mysqli->close();
