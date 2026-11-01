<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json");

$hasFilter = isset($_GET["investment_card_no"]) && $_GET["investment_card_no"] !== "";

// যদি filter থাকে:
if ($hasFilter) {
    $cardNo = $_GET["investment_card_no"];

    $sql = "SELECT * FROM investment_installments 
            WHERE investment_card_no = ?
            ORDER BY id DESC";

    $stmt = $mysqli->prepare($sql);

    if (!$stmt) {
        echo json_encode([
            "success" => false,
            "error"   => "Prepare failed: " . $mysqli->error
        ]);
        exit;
    }

    $stmt->bind_param("s", $cardNo);
    $stmt->execute();
    $result = $stmt->get_result();
}
// যদি কোনো filter না থাকে → সব ডাটা নিয়ে আসো
else {
    $sql = "SELECT * FROM investment_installments ORDER BY id DESC";
    $result = $mysqli->query($sql);

    if (!$result) {
        echo json_encode([
            "success" => false,
            "error"   => "Query failed: " . $mysqli->error
        ]);
        exit;
    }
}

$data = [];

while ($row = $result->fetch_assoc()) {
    if (isset($row["id"])) {
        $row["id"] = (int) $row["id"];
    }
    $data[] = $row;
}

echo json_encode([
    "success" => true,
    "filtered" => $hasFilter ? true : false,
    "count"   => count($data),
    "data"    => $data
], JSON_UNESCAPED_UNICODE);
