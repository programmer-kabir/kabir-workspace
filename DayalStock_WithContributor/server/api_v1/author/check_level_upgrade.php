<?php
require_once '../config/cors.php';
require_once '../config/db.php';
// Include authentication check if necessary, e.g. requireRole('admin') or similar
// For this script, we can assume it's called internally or via authenticated admin

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
$author_id = isset($input['author_id']) ? (int)$input['author_id'] : 0;

if ($author_id <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid author ID"]);
    exit;
}

// 1. Get exact count of published files for this author
$countSql = "SELECT COUNT(id) AS total_published FROM contents WHERE author_id = ? AND status = 'published'";
$countStmt = $mysqli->prepare($countSql);
$countStmt->bind_param("i", $author_id);
$countStmt->execute();
$total_published = (int)$countStmt->get_result()->fetch_assoc()['total_published'];
$countStmt->close();

// 2. Get current author info
$authInfoSql = "SELECT level_id, total_downloads FROM authors WHERE id = ?";
$authInfoStmt = $mysqli->prepare($authInfoSql);
$authInfoStmt->bind_param("i", $author_id);
$authInfoStmt->execute();
$authorData = $authInfoStmt->get_result()->fetch_assoc();
$authInfoStmt->close();

if (!$authorData) {
    echo json_encode(["success" => false, "message" => "Author not found"]);
    exit;
}

$current_level_id = (int)$authorData['level_id'];
$total_downloads = (int)$authorData['total_downloads'];
$new_level_id = $current_level_id;
$upgraded = false;

// 3. Find the highest eligible level
$levelSql = "SELECT id, level_number, level_name FROM author_level_rules 
             WHERE is_active = 1 
             AND min_published_files <= ? 
             AND min_total_downloads <= ? 
             ORDER BY level_number DESC LIMIT 1";
$levelStmt = $mysqli->prepare($levelSql);
$levelStmt->bind_param("ii", $total_published, $total_downloads);
$levelStmt->execute();
$levelRes = $levelStmt->get_result();

if ($newLevel = $levelRes->fetch_assoc()) {
    $new_level_id = (int)$newLevel['id'];
    
    // 4. Upgrade if new level is higher
    if ($new_level_id > $current_level_id) {
        $upgraded = true;
        
        // Update author table
        $updAuthSql = "UPDATE authors SET level_id = ?, total_published_files = ?, level_updated_at = NOW() WHERE id = ?";
        $updAuthStmt = $mysqli->prepare($updAuthSql);
        $updAuthStmt->bind_param("iii", $new_level_id, $total_published, $author_id);
        $updAuthStmt->execute();
        $updAuthStmt->close();
        
        // Insert into history
        $histSql = "INSERT INTO author_level_history (author_id, old_level_id, new_level_id, published_files_at_change, downloads_at_change, changed_reason) 
                    VALUES (?, ?, ?, ?, ?, 'Automatic level upgrade on file approval or manual check')";
        $histStmt = $mysqli->prepare($histSql);
        $histStmt->bind_param("iiiii", $author_id, $current_level_id, $new_level_id, $total_published, $total_downloads);
        $histStmt->execute();
        $histStmt->close();
    } else {
        // Just update the total published files count in case it was out of sync
        $updAuthSql = "UPDATE authors SET total_published_files = ? WHERE id = ?";
        $updAuthStmt = $mysqli->prepare($updAuthSql);
        $updAuthStmt->bind_param("ii", $total_published, $author_id);
        $updAuthStmt->execute();
        $updAuthStmt->close();
    }
}
$levelStmt->close();
$mysqli->close();

echo json_encode([
    "success" => true, 
    "message" => $upgraded ? "Author level upgraded successfully" : "Author files count updated, no level change",
    "data" => [
        "author_id" => $author_id,
        "total_published_files" => $total_published,
        "total_downloads" => $total_downloads,
        "old_level_id" => $current_level_id,
        "new_level_id" => $new_level_id,
        "upgraded" => $upgraded
    ]
]);
?>
