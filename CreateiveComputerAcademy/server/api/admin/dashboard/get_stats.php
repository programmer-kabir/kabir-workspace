<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$today = date('Y-m-d');

try {
    // Total Staff
    $stmt1 = $db->query("SELECT COUNT(*) as total FROM user_roles WHERE role IN ('staff', 'manager', 'instructor')");
    $total_staff = $stmt1->fetch(PDO::FETCH_ASSOC)['total'];

    // Present Today (Only 'Present')
    $stmt2 = $db->prepare("SELECT COUNT(*) as present FROM attendance WHERE date = :today AND status = 'Present'");
    $stmt2->bindParam(':today', $today);
    $stmt2->execute();
    $present_today = (int) $stmt2->fetch(PDO::FETCH_ASSOC)['present'];

    // Leave Today
    $stmtLeave = $db->prepare("SELECT COUNT(*) as on_leave FROM attendance WHERE date = :today AND status = 'Leave'");
    $stmtLeave->bindParam(':today', $today);
    $stmtLeave->execute();
    $leave_today = (int) $stmtLeave->fetch(PDO::FETCH_ASSOC)['on_leave'];

    // Absent Today
    $absent_today = max(0, (int)$total_staff - $present_today - $leave_today);

    // Tasks Completed
    $stmt3 = $db->query("SELECT COUNT(*) as completed FROM tasks WHERE status = 'Completed'");
    $tasks_completed = (int) $stmt3->fetch(PDO::FETCH_ASSOC)['completed'];

    // Pending Approvals (Leaves + Review Tasks)
    $stmt4 = $db->query("SELECT COUNT(*) as pending_leaves FROM leave_requests WHERE status = 'Pending'");
    $pending_leaves = (int) $stmt4->fetch(PDO::FETCH_ASSOC)['pending_leaves'];

    $stmt5 = $db->query("SELECT COUNT(*) as review_tasks FROM tasks WHERE status = 'In Review'");
    $review_tasks = (int) $stmt5->fetch(PDO::FETCH_ASSOC)['review_tasks'];

    echo json_encode([
        "status" => "success",
        "data" => [
            "total_staff" => (int) $total_staff,
            "present_today" => $present_today,
            "leave_today" => $leave_today,
            "absent_today" => $absent_today,
            "tasks_completed" => $tasks_completed,
            "pending_approvals" => [
                "total" => $pending_leaves + $review_tasks,
                "leaves" => $pending_leaves,
                "tasks" => $review_tasks
            ]
        ]
    ]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
