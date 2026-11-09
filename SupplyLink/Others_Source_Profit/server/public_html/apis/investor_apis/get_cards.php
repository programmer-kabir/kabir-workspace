<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
requireAuth();

header("Content-Type: application/json; charset=UTF-8");

$user = getAuthenticatedUser();
$investor_id = isset($_GET["investor_id"]) && $_GET["investor_id"] !== "" 
    ? (int)$_GET["investor_id"] 
    : (int)($user['id'] ?? 0);

if ($investor_id > 0) {
    $sql = "SELECT * FROM investment_cards WHERE investor_id = ? ORDER BY id ASC";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        echo json_encode(["success" => false, "error" => $mysqli->error]);
        exit;
    }
    $stmt->bind_param("i", $investor_id);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $sql = "SELECT * FROM investment_cards ORDER BY id ASC";
    $result = $mysqli->query($sql);
}

$cards = [];
while ($row = $result->fetch_assoc()) {
    if (isset($row["id"])) $row["id"] = (int)$row["id"];
    if (isset($row["investor_id"])) $row["investor_id"] = (int)$row["investor_id"];
    $cards[] = $row;
}

echo json_encode([
    "success"     => true,
    "total_cards" => count($cards),
    "cards"       => $cards,
    "data"        => $cards
], JSON_UNESCAPED_UNICODE);

