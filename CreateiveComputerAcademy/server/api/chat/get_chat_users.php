<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

$exclude_user_id = isset($data->user_id) ? intval($data->user_id) : 0;
$admins_only = isset($data->admins_only) ? (bool)$data->admins_only : false;

try {
    // Select all active users, including admins and staff
    $role_filter = $admins_only ? "AND ur.role = 'admin'" : "";
    $query = "SELECT u.id, u.name, u.email, u.phone, u.profile_picture, u.last_activity,
                     MIN(ur.role) as role_name,
                     MAX(d.name) as department_name
              FROM users u
              INNER JOIN user_roles ur ON u.id = ur.user_id
              LEFT JOIN employees e ON u.id = e.user_id
              LEFT JOIN departments d ON e.department_id = d.id
              WHERE u.status = 'active' AND u.id != :exclude_id $role_filter
              GROUP BY u.id
              ORDER BY u.name ASC";
              
    $stmt = $db->prepare($query);
    $stmt->execute([':exclude_id' => $exclude_user_id]);
    // Update last activity using PHP time (Asia/Dhaka)
    if ($exclude_user_id > 0) {
        $now = date('Y-m-d H:i:s');
        $update_act = $db->prepare("UPDATE users SET last_activity = :now WHERE id = :user_id");
        $update_act->execute([':now' => $now, ':user_id' => $exclude_user_id]);
    }
    
    $users = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $row['id'] = intval($row['id']);
        
        // Evaluate online status (active within last 5 minutes = 300 seconds)
        $online = false;
        if ($row['last_activity']) {
            $last_act_ts = strtotime($row['last_activity']);
            if ((time() - $last_act_ts) <= 300) {
                $online = true;
            }
        }
        $row['is_online'] = $online;
        
        // Format role name for readability
        $row['role_display'] = ucfirst($row['role_name']);
        
        $users[] = $row;
    }
    
    echo json_encode([
        "status" => "success",
        "users" => $users
    ]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
