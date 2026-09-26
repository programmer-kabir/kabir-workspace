<?php
require_once '../../../config/cors.php';
require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "user_id is required."]);
    exit;
}

$user_id = intval($data->user_id);

try {
    $db->beginTransaction();

    // Delete from reviewers table
    $del_rev = $db->prepare("DELETE FROM reviewers WHERE user_id = :user_id");
    $del_rev->execute([':user_id' => $user_id]);

    // Delete from employees
    $del_emp = $db->prepare("DELETE FROM employees WHERE user_id = :user_id");
    $del_emp->execute([':user_id' => $user_id]);

    // Delete from users table (cascades tokens, roles)
    $stmt = $db->prepare("DELETE FROM users WHERE id = :user_id");
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    $db->commit();

    if ($stmt->rowCount() === 0) {
        echo json_encode(["status" => "error", "message" => "Reviewer not found."]);
    } else {
        echo json_encode(["status" => "success", "message" => "Reviewer deleted successfully."]);
    }

} catch (PDOException $e) {
    $db->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
