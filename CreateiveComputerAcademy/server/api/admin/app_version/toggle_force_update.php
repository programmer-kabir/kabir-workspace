<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../config/AppVersionHelper.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    AppVersionHelper::ensureSchema($db);

    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input) {
        $input = $_POST;
    }

    $id = isset($input['id']) ? intval($input['id']) : 0;
    $version = isset($input['version']) ? trim($input['version']) : '';

    if (empty($id) && empty($version)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Release id or version is required."]);
        exit();
    }

    if ($id > 0) {
        $stmt = $db->prepare("UPDATE app_releases SET is_mandatory = IF(is_mandatory = 1, 0, 1) WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $fetch = $db->prepare("SELECT id, version, is_mandatory FROM app_releases WHERE id = :id");
        $fetch->execute([':id' => $id]);
    } else {
        $stmt = $db->prepare("UPDATE app_releases SET is_mandatory = IF(is_mandatory = 1, 0, 1) WHERE version = :ver");
        $stmt->execute([':ver' => $version]);
        $fetch = $db->prepare("SELECT id, version, is_mandatory FROM app_releases WHERE version = :ver");
        $fetch->execute([':ver' => $version]);
    }

    $row = $fetch->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        "status"       => "success",
        "message"      => "Force update status toggled successfully.",
        "release"      => $row,
        "is_mandatory" => $row ? intval($row['is_mandatory']) : 0
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Failed to toggle force update: " . $e->getMessage()
    ]);
}
