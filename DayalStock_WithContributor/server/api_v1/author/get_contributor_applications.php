<?php
require_once '../config/cors.php';
require_once '../config/db.php';
// require_once '../middleware/check_role.php';

// header("Content-Type: application/json");

// // 🔒 Only admin can see contributor requests
// // requireRole('admin'); // Assuming admin is required, you can uncomment if auth is fully hooked up here

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}

$status = isset($_GET['status']) ? $_GET['status'] : 'pending';

$sql = "SELECT c.id, c.full_name, c.email, u.username, c.portfolio_url, c.content_type, c.motivation, c.status, c.created_at 
        FROM contributor_applications c
        LEFT JOIN users u ON c.email = u.email ";

if ($status !== 'all') {
    $sql .= " WHERE c.status = ? ";
}
$sql .= " ORDER BY c.created_at DESC";

$stmt = $mysqli->prepare($sql);

if ($status !== 'all') {
    $stmt->bind_param("s", $status);
}

$stmt->execute();
$result = $stmt->get_result();
$applications = [];

while ($row = $result->fetch_assoc()) {
    $applications[] = $row;
}

$stmt->close();
$mysqli->close();

echo json_encode([
    "success" => true,
    "data" => $applications
]);
?>
