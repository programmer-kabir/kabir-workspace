<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=utf-8");
date_default_timezone_set('Asia/Dhaka');

$decision_at = date('Y-m-d H:i:s');

$id          = intval($_POST['id'] ?? 0);
$action_name = strtolower(trim($_POST['action_name'] ?? ''));
$remarks     = trim($_POST['remarks'] ?? '');
$decision_by = intval($_POST['decision_by'] ?? 0);

if (!$id) { echo json_encode(["success"=>false,"message"=>"Missing id"]); exit; }
if (!in_array($action_name, ['approved','rejected'])) { echo json_encode(["success"=>false,"message"=>"Invalid action_name"]); exit; }
if ($remarks === '') { echo json_encode(["success"=>false,"message"=>"Reason (remarks) is required"]); exit; }
if (!$decision_by) { echo json_encode(["success"=>false,"message"=>"Missing decision_by"]); exit; }

$find = $mysqli->prepare("SELECT * FROM profit_history WHERE id=? LIMIT 1");
$find->bind_param("i", $id);
$find->execute();
$row = $find->get_result()->fetch_assoc();

if (!$row) { echo json_encode(["success"=>false,"message"=>"No record found"]); exit; }
if (strtolower($row['action_name']) !== 'pending') {
  echo json_encode(["success"=>false,"message"=>"This request is not pending anymore","current_action"=>$row['action_name']]);
  exit;
}

$up = $mysqli->prepare("
  UPDATE profit_history
  SET action_name=?, remarks=?, decision_by=?, decision_at=?
  WHERE id=? AND action_name='pending'
");
$up->bind_param("ssisi", $action_name, $remarks, $decision_by, $decision_at, $id);

if ($up->execute() && $up->affected_rows > 0) {
  $row['action_name'] = $action_name;
  $row['remarks'] = $remarks;
  $row['decision_by'] = $decision_by;
  $row['decision_at'] = $decision_at;

  echo json_encode(["success"=>true,"message"=>"Updated successfully","data"=>$row]);
  exit;
}

echo json_encode(["success"=>false,"message"=>"Update failed or already updated"]);
