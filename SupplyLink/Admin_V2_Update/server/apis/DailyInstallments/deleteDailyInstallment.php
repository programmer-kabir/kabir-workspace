<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header('Content-Type: application/json; charset=UTF-8');
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);
    if (!is_array($data) || empty($data)) {
        $data = $_POST;
    }

    $id = isset($data['id']) ? (int)$data['id'] : 0;

    // VALIDATION
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Valid ID is required!"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // EXIST CHECK
    $stmt = $mysqli->prepare("SELECT id FROM daily_installments WHERE id = ? LIMIT 1");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Installment not found ❌"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $stmt->close();

    // DELETE
    $stmt = $mysqli->prepare("DELETE FROM daily_installments WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();

    echo json_encode([
        "success" => true,
        "message" => "Installment deleted ✅",
        "deleted_id" => $id
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}