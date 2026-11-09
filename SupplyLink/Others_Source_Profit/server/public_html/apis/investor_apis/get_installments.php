<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
requireAuth();

header("Content-Type: application/json; charset=UTF-8");

$cardNo = $_GET["investment_card_no"] ?? $_GET["card_id"] ?? "";

if (!empty($cardNo)) {
    $sql = "SELECT ii.*, u.name AS signature_by_name 
            FROM investment_installments ii 
            LEFT JOIN users u ON u.id = ii.signature_by
            WHERE ii.investment_card_no = ?
            ORDER BY ii.id DESC";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        echo json_encode(["success" => false, "error" => $mysqli->error]);
        exit;
    }
    $stmt->bind_param("s", $cardNo);
    $stmt->execute();
    $result = $stmt->get_result();
} else {
    $user = getAuthenticatedUser();
    $uid = (int)($user['id'] ?? 0);
    if ($uid > 0) {
        $sql = "SELECT ii.*, u.name AS signature_by_name 
                FROM investment_installments ii 
                LEFT JOIN users u ON u.id = ii.signature_by
                WHERE ii.investor_id = ? 
                ORDER BY ii.id DESC";
        $stmt = $mysqli->prepare($sql);
        $stmt->bind_param("i", $uid);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $mysqli->query("SELECT ii.*, u.name AS signature_by_name 
                                  FROM investment_installments ii 
                                  LEFT JOIN users u ON u.id = ii.signature_by
                                  ORDER BY ii.id DESC LIMIT 500");
    }
}

$data = [];
while ($row = $result->fetch_assoc()) {
    if (isset($row["id"])) $row["id"] = (int)$row["id"];
    if (isset($row["investor_id"])) $row["investor_id"] = (int)$row["investor_id"];
    $data[] = $row;
}

echo json_encode([
    "success"     => true,
    "total_count" => count($data),
    "count"       => count($data),
    "data"        => $data
], JSON_UNESCAPED_UNICODE);

