<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

$authorId = isset($_GET["author_id"]) ? (int) $_GET["author_id"] : 0;
$mode = isset($_GET["mode"]) ? $_GET["mode"] : "yearly"; // yearly or monthly
$year = isset($_GET["year"]) ? (int) $_GET["year"] : (int) date("Y");
$month = isset($_GET["month"]) ? (int) $_GET["month"] : (int) date("m");

if ($authorId <= 0) {
    echo json_encode([
        "success" => false,
        "message" => "author_id is required.",
        "data" => []
    ]);
    exit;
}

if ($mode === "monthly") {
    // Group by Day for the selected Year and Month
    $sql = "
        SELECT 
            DATE_FORMAT(dh.downloaded_at, '%Y-%m-%d') AS label,
            COUNT(dh.id) AS downloads
        FROM downloads_history dh
        JOIN contents c ON dh.content_id = c.id
        WHERE c.author_id = ? 
          AND YEAR(dh.downloaded_at) = ? 
          AND MONTH(dh.downloaded_at) = ?
        GROUP BY label
        ORDER BY label ASC
    ";
    
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        echo json_encode(["success" => false, "message" => "Query error: " . $mysqli->error]);
        exit;
    }
    $stmt->bind_param("iii", $authorId, $year, $month);

} else {
    // Group by Month for the selected Year
    $sql = "
        SELECT 
            DATE_FORMAT(dh.downloaded_at, '%b') AS label,
            MONTH(dh.downloaded_at) AS sort_month,
            COUNT(dh.id) AS downloads
        FROM downloads_history dh
        JOIN contents c ON dh.content_id = c.id
        WHERE c.author_id = ? 
          AND YEAR(dh.downloaded_at) = ?
        GROUP BY sort_month, label
        ORDER BY sort_month ASC
    ";
    
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        echo json_encode(["success" => false, "message" => "Query error: " . $mysqli->error]);
        exit;
    }
    $stmt->bind_param("ii", $authorId, $year);
}

$stmt->execute();
$result = $stmt->get_result();

$history = [];
while ($row = $result->fetch_assoc()) {
    $history[] = [
        "label" => $row["label"],
        "downloads" => (int) $row["downloads"]
    ];
}

$stmt->close();

echo json_encode([
    "success" => true,
    "author_id" => $authorId,
    "mode" => $mode,
    "year" => $year,
    "month" => $month,
    "data" => $history
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
