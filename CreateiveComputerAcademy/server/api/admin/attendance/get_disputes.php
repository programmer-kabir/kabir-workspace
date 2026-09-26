<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$status = isset($_GET['status']) ? $_GET['status'] : '';

$query = "
    SELECT d.*, d.user_id as staff_id, u.name as staff_name, e.employee_code, u.profile_picture 
    FROM attendance_disputes d
    LEFT JOIN users u ON d.user_id = u.id
    LEFT JOIN employees e ON u.id = e.user_id
";

if ($status && in_array($status, ['pending', 'approved', 'rejected'])) {
    $query .= " WHERE d.status = :status";
}

$query .= " ORDER BY d.created_at DESC";

$stmt = $db->prepare($query);

if ($status && in_array($status, ['pending', 'approved', 'rejected'])) {
    $stmt->bindParam(':status', $status);
}

$stmt->execute();
$disputes = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode(["status" => "success", "data" => $disputes]);
?>
