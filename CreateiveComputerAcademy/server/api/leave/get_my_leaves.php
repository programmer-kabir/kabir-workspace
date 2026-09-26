<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->user_id)) {
    echo json_encode(["status" => "error", "message" => "User ID required."]);
    exit;
}

$query = "SELECT * FROM leave_requests WHERE user_id = :user_id ORDER BY created_at DESC";
$stmt = $db->prepare($query);
$stmt->bindParam(":user_id", $data->user_id);
$stmt->execute();

$leaves = [];
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $leaves[] = $row;
}

echo json_encode(["status" => "success", "leaves" => $leaves]);
?>
