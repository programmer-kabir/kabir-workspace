<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/check_role.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    requireRole('admin');
    
    // Ensure table exists just in case
    try {
        $mysqli->query("CREATE TABLE IF NOT EXISTS withdraw_requests (
            id bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
            author_id bigint(20) NOT NULL,
            amount decimal(10,2) NOT NULL,
            payment_method varchar(255) NOT NULL,
            payment_details text NOT NULL,
            status enum('pending','completed','rejected') DEFAULT 'pending',
            rejection_reason text DEFAULT NULL,
            requested_at timestamp NULL DEFAULT current_timestamp(),
            processed_at timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
        )");
    } catch (Exception $ex) {}
    
    // Ensure columns exist if table was already created
    try {
        $mysqli->query("ALTER TABLE withdraw_requests ADD COLUMN rejection_reason TEXT DEFAULT NULL");
    } catch (Exception $ex) {}
    try {
        $mysqli->query("ALTER TABLE withdraw_requests ADD COLUMN requested_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP");
    } catch (Exception $ex) {}
    try {
        $mysqli->query("ALTER TABLE withdraw_requests ADD COLUMN processed_at TIMESTAMP NULL DEFAULT NULL");
    } catch (Exception $ex) {}

    // Clean up accidental UTC columns that were added earlier
    try {
        $mysqli->query("ALTER TABLE withdraw_requests DROP COLUMN created_at");
    } catch (Exception $ex) {}
    try {
        $mysqli->query("ALTER TABLE withdraw_requests DROP COLUMN updated_at");
    } catch (Exception $ex) {}

    // Fix empty statuses and enforce enum if it wasn't done
    try {
        $mysqli->query("ALTER TABLE withdraw_requests MODIFY COLUMN status ENUM('pending', 'completed', 'rejected') DEFAULT 'pending'");
        $mysqli->query("UPDATE withdraw_requests SET status = 'pending' WHERE status = '' OR status IS NULL");
    } catch (Exception $ex) {}

    $status = $_GET['status'] ?? 'all';
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $offset = ($page - 1) * $limit;
    
    // Count total records
    $countQuery = "SELECT COUNT(*) as total FROM withdraw_requests w";
    if ($status !== 'all') {
        $countQuery .= " WHERE w.status = ?";
        $cStmt = $mysqli->prepare($countQuery);
        $cStmt->bind_param("s", $status);
    } else {
        $cStmt = $mysqli->prepare($countQuery);
    }
    $cStmt->execute();
    $totalRecords = $cStmt->get_result()->fetch_assoc()['total'];
    $totalPages = ceil($totalRecords / $limit);
    
    $query = "
        SELECT 
            w.id, w.author_id, w.amount, w.payment_method, w.payment_details, w.status, w.rejection_reason, w.requested_at, w.processed_at,
            u.name as author_name, u.username, u.email as user_email
        FROM withdraw_requests w
        JOIN authors a ON w.author_id = a.id
        JOIN users u ON a.user_id = u.id
    ";
    
    if ($status !== 'all') {
        $query .= " WHERE w.status = ? ORDER BY w.requested_at DESC LIMIT ? OFFSET ?";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("sii", $status, $limit, $offset);
    } else {
        $query .= " ORDER BY w.requested_at DESC LIMIT ? OFFSET ?";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("ii", $limit, $offset);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    
    echo json_encode([
        "success" => true, 
        "data" => $data,
        "pagination" => [
            "total_records" => $totalRecords,
            "total_pages" => $totalPages,
            "current_page" => $page,
            "limit" => $limit
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
