<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/check_role.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    requireRole('admin');

    // Create tables if they don't exist
    try {
        $mysqli->query("CREATE TABLE IF NOT EXISTS support_tickets (
            id VARCHAR(50) PRIMARY KEY,
            user_id INT NOT NULL,
            department ENUM('Billing', 'Technical', 'Copyright', 'General') DEFAULT 'General',
            subject VARCHAR(255) NOT NULL,
            priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
            status ENUM('Open', 'Pending_Reply', 'Resolved', 'Closed') DEFAULT 'Open',
            assigned_admin_id INT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX (user_id),
            INDEX (status)
        )");
        
        $mysqli->query("CREATE TABLE IF NOT EXISTS ticket_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ticket_id VARCHAR(50) NOT NULL,
            sender_id INT NOT NULL,
            message TEXT NOT NULL,
            attachment_url VARCHAR(500) DEFAULT NULL,
            is_admin_reply BOOLEAN DEFAULT 0,
            is_internal_note BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX (ticket_id)
        )");
    } catch (Exception $ex) {}

    $status = $_GET['status'] ?? 'all';
    $priority = $_GET['priority'] ?? 'all';
    
    $query = "
        SELECT 
            t.*,
            u.name as user_name,
            u.email as user_email
        FROM support_tickets t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE 1=1
    ";
    
    $params = [];
    $types = "";
    
    if ($status !== 'all') {
        $query .= " AND t.status = ?";
        $params[] = $status;
        $types .= "s";
    }
    
    if ($priority !== 'all') {
        $query .= " AND t.priority = ?";
        $params[] = $priority;
        $types .= "s";
    }
    
    // Urgent tickets first, then newest
    $query .= " ORDER BY CASE WHEN t.priority = 'Urgent' AND t.status != 'Closed' THEN 1 ELSE 2 END ASC, t.updated_at DESC";
    
    $stmt = $mysqli->prepare($query);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $data = [];
    $stats = ['total' => 0, 'open' => 0, 'unanswered' => 0, 'closed' => 0];
    
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
        
        $stats['total']++;
        if ($row['status'] === 'Open') $stats['open']++;
        if ($row['status'] === 'Pending_Reply') $stats['unanswered']++;
        if ($row['status'] === 'Closed' || $row['status'] === 'Resolved') $stats['closed']++;
    }
    
    echo json_encode([
        "success" => true,
        "data" => $data,
        "stats" => $stats
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
