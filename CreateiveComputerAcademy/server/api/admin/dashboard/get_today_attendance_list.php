<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$today = date('Y-m-d');

try {
    $query = "
        SELECT 
            u.id, u.name, u.profile_picture,
            e.designation,
            a.id as attendance_id, a.check_in, a.check_out, a.status as attendance_status,
            (
                SELECT lr.type 
                FROM leave_requests lr 
                WHERE lr.user_id = u.id 
                  AND lr.status = 'Approved' 
                  AND :today BETWEEN lr.start_date AND lr.end_date 
                ORDER BY lr.id DESC 
                LIMIT 1
            ) as leave_type,
            (
                SELECT lr.reason 
                FROM leave_requests lr 
                WHERE lr.user_id = u.id 
                  AND lr.status = 'Approved' 
                  AND :today BETWEEN lr.start_date AND lr.end_date 
                ORDER BY lr.id DESC 
                LIMIT 1
            ) as leave_reason
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN attendance a ON u.id = a.user_id AND a.date = :today
        WHERE ur.role IN ('staff', 'manager', 'instructor') AND u.status = 'active'
        GROUP BY u.id
        ORDER BY u.name ASC
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':today', $today);
    $stmt->execute();

    $present = [];
    $absent = [];
    $leave = [];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $attStatus = strtolower($row['attendance_status'] ?? '');
        $isOnLeave = ($attStatus === 'leave') || !empty($row['leave_type']);

        if ($isOnLeave) {
            $leave[] = $row;
        } elseif ($row['attendance_id'] && in_array($attStatus, ['present', 'late', 'half day', 'in_progress', 'completed'])) {
            $present[] = $row;
        } elseif ($row['attendance_id'] && !empty($row['check_in']) && $attStatus !== 'absent' && $attStatus !== 'leave') {
            $present[] = $row;
        } else {
            $absent[] = $row;
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "present" => $present,
            "absent"  => $absent,
            "leave"   => $leave
        ]
    ]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
