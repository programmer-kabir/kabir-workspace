<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $email = isset($_GET["email"]) ? trim($_GET["email"]) : "";

    $sql = "
        SELECT 
            authors.id AS author_id,
            authors.user_id AS author_user_id,
            users.name AS user_name,
            users.username AS user_username,
            users.photo AS user_photo,
            users.cover_photo AS user_cover_photo,
            users.email AS user_email,
            users.country as user_country,
            authors.bio AS author_bio,
            IFNULL((SELECT SUM(downloads_count) FROM contents WHERE contents.author_id = authors.id), 0) AS total_downloads,
            authors.website,
            authors.created_at AS author_created_at,
            users.created_at AS user_created_at,

            GROUP_CONCAT(ur.role ORDER BY ur.role SEPARATOR ',') AS user_roles,
            (SELECT COUNT(*) FROM contents WHERE contents.author_id = authors.id AND contents.status IN ('published', 'exclusive_buyout')) AS published_files,
            (SELECT COUNT(*) FROM contents WHERE contents.author_id = authors.id AND contents.status = 'pending') AS pending_files

        FROM authors
        INNER JOIN users ON authors.user_id = users.id
        LEFT JOIN user_roles ur ON ur.user_id = users.id
    ";

    if ($email !== "") {
        $sql .= " WHERE users.email = ?";
    }

    $sql .= " GROUP BY authors.id, users.id ORDER BY authors.id DESC";

    $stmt = $mysqli->prepare($sql);

    if (!$stmt) {
        throw new Exception($mysqli->error);
    }

    if ($email !== "") {
        $stmt->bind_param("s", $email);
    }

    $rulesSql = "SELECT * FROM author_level_rules WHERE is_active = 1 ORDER BY level_number DESC";
    $rulesResult = $mysqli->query($rulesSql);
    $rules = [];
    if ($rulesResult) {
        while ($r = $rulesResult->fetch_assoc()) {
            $rules[] = $r;
        }
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $authors = [];

    while ($row = $result->fetch_assoc()) {
        $totalDownloads = (int) $row["total_downloads"];
        $publishedFiles = (int) $row["published_files"];
        
        $levelName = "New Contributor";
        $badgeColor = "#6B7280";
        $levelNumber = 0;

        foreach ($rules as $rule) {
            if ($publishedFiles >= (int)$rule['min_published_files'] && $totalDownloads >= (int)$rule['min_total_downloads']) {
                $levelName = $rule['level_name'];
                $badgeColor = $rule['badge_color'];
                $levelNumber = (int)$rule['level_number'];
                break;
            }
        }

        $effectiveName = !empty($row["user_name"]) ? $row["user_name"] : "Contributor";
        $effectiveUsername = !empty($row["user_username"]) ? $row["user_username"] : "";
        $effectiveAvatar = !empty($row["user_photo"]) ? $row["user_photo"] : "";
        $effectiveCover = !empty($row["user_cover_photo"]) ? $row["user_cover_photo"] : "";

        $authors[] = [
            "id" => (int) $row["author_id"],
            "_id" => (int) $row["author_id"],
            "user_id" => (int) $row["author_user_id"],
            "name" => $effectiveName,
            "full_name" => $effectiveName,
            "author_name" => $effectiveName,
            "username" => $effectiveUsername,
            "author_username" => $effectiveUsername,
            "avatar" => $effectiveAvatar,
            "avater" => $effectiveAvatar,
            "photo" => $effectiveAvatar,
            "author_avatar" => $effectiveAvatar,
            "cover_photo" => $effectiveCover,
            "cover" => $effectiveCover,
            "author_cover_photo" => $effectiveCover,
            "email" => $row["user_email"],
            "bio" => $row["author_bio"],
            "country" => $row["user_country"],
            
            "website" => $row["website"],
            "total_downloads" => $totalDownloads,
            "published_files" => $publishedFiles,
            "pending_files" => (int) $row["pending_files"],
            "level" => [
                "name" => $levelName,
                "badge_color" => $badgeColor,
                "level_number" => $levelNumber
            ],
            "created_at" => $row["author_created_at"]
        ];
    }

    $stmt->close();

    echo json_encode([
        "success" => true,
        "message" => "Authors fetched successfully",
        "count" => count($authors),
        "data" => $authors
    ]);

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to fetch authors",
        "error" => $e->getMessage()
    ]);
}

$mysqli->close();