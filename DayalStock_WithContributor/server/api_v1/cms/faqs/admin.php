<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../middleware/check_role.php';

// Protect this endpoint: Only 'admin' role can access
requireRole('admin');

$method = $_SERVER['REQUEST_METHOD'];

// A simple routing flag for categories vs faqs
$type = $_GET['type'] ?? 'faq'; // 'faq' or 'category'

if ($method === 'GET') {
    if ($type === 'category') {
        $stmt = $mysqli->prepare("SELECT * FROM faq_categories ORDER BY sort_order ASC");
    } else {
        $stmt = $mysqli->prepare("SELECT * FROM faqs ORDER BY category_id ASC, sort_order ASC");
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    echo json_encode(["success" => true, "data" => $data]);
    
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if ($type === 'category') {
        $name = $data['name'] ?? '';
        $slug = $data['slug'] ?? '';
        $stmt = $mysqli->prepare("INSERT INTO faq_categories (name, slug) VALUES (?, ?)");
        $stmt->bind_param("ss", $name, $slug);
    } else {
        $cat_id = $data['category_id'] ?? 0;
        $q = $data['question'] ?? '';
        $a = $data['answer'] ?? '';
        $stmt = $mysqli->prepare("INSERT INTO faqs (category_id, question, answer) VALUES (?, ?, ?)");
        $stmt->bind_param("iss", $cat_id, $q, $a);
    }
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => ucfirst($type) . " created successfully", "id" => $mysqli->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $mysqli->error]);
    }

} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? 0;
    
    if ($type === 'category') {
        $name = $data['name'] ?? '';
        $stmt = $mysqli->prepare("UPDATE faq_categories SET name = ? WHERE id = ?");
        $stmt->bind_param("si", $name, $id);
    } else {
        $q = $data['question'] ?? '';
        $a = $data['answer'] ?? '';
        $stmt = $mysqli->prepare("UPDATE faqs SET question = ?, answer = ? WHERE id = ?");
        $stmt->bind_param("ssi", $q, $a, $id);
    }
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => ucfirst($type) . " updated successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $mysqli->error]);
    }

} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? 0;
    
    if ($type === 'category') {
        $stmt = $mysqli->prepare("UPDATE faq_categories SET status = 'archived' WHERE id = ?");
    } else {
        $stmt = $mysqli->prepare("UPDATE faqs SET status = 'archived' WHERE id = ?");
    }
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => ucfirst($type) . " archived successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $mysqli->error]);
    }
}
?>
