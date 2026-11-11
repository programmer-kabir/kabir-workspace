<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';
require_once '../../leave/StudentLeaveHelper.php';

$database = new Database();
$db = $database->getConnection();
StudentLeaveHelper::ensureSchema($db);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id) || !isset($data->action)) {
    echo json_encode(["status" => "error", "message" => "user_id and action ('approve' | 'reject') are required."]);
    exit;
}

$user_id = intval($data->user_id);
$action = strtolower(trim($data->action));
$admin_id = isset($data->admin_id) ? intval($data->admin_id) : null;
$quota = isset($data->student_leave_quota) ? max(1, intval($data->student_leave_quota)) : 3;
$rejection_reason = isset($data->rejection_reason) ? trim($data->rejection_reason) : null;

if (!in_array($action, ['approve', 'reject'])) {
    echo json_encode(["status" => "error", "message" => "Invalid action. Must be 'approve' or 'reject'."]);
    exit;
}

try {
    // Check if employee exists
    $check_stmt = $db->prepare("SELECT id, user_id, student_status, student_institution FROM employees WHERE user_id = :user_id LIMIT 1");
    $check_stmt->execute([':user_id' => $user_id]);
    $emp = $check_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$emp) {
        echo json_encode(["status" => "error", "message" => "Employee record not found for user_id {$user_id}."]);
        exit;
    }

    if ($action === 'approve') {
        $update_stmt = $db->prepare("
            UPDATE employees 
            SET is_student = 1,
                student_status = 'approved',
                student_leave_quota = :quota,
                student_rejection_reason = NULL,
                student_approved_by = :admin_id,
                student_approved_at = NOW()
            WHERE user_id = :user_id
        ");
        $update_stmt->execute([
            ':quota'    => $quota,
            ':admin_id' => $admin_id,
            ':user_id'  => $user_id
        ]);

        echo json_encode([
            "status" => "success",
            "message" => "Student status approved successfully. Academic leave benefits unlocked.",
            "data" => [
                "user_id" => $user_id,
                "student_status" => "approved",
                "is_student" => 1,
                "student_leave_quota" => $quota
            ]
        ]);
    } else {
        $update_stmt = $db->prepare("
            UPDATE employees 
            SET is_student = 0,
                student_status = 'rejected',
                student_rejection_reason = :rejection_reason,
                student_approved_by = :admin_id,
                student_approved_at = NOW()
            WHERE user_id = :user_id
        ");
        $update_stmt->execute([
            ':rejection_reason' => $rejection_reason ?: 'Admin rejected student status verification.',
            ':admin_id'         => $admin_id,
            ':user_id'          => $user_id
        ]);

        echo json_encode([
            "status" => "success",
            "message" => "Student status request rejected.",
            "data" => [
                "user_id" => $user_id,
                "student_status" => "rejected",
                "is_student" => 0,
                "student_rejection_reason" => $rejection_reason
            ]
        ]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
