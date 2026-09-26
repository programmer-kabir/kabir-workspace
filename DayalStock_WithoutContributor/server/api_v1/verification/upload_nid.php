<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/r2_config.php';
require_once __DIR__ . '/../middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(["success" => false, "message" => "Invalid request method."]);
        exit;
    }

    $user_id = $GLOBALS['user']['id'];
    
    // Get author id
    $stmt = $mysqli->prepare("SELECT id FROM authors WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    
    if ($res->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Author profile not found."]);
        exit;
    }
    
    $author = $res->fetch_assoc();
    $author_id = (int) $author['id'];
    
    $document_type = trim($_POST['document_type'] ?? 'National ID');
    
    $full_name = trim($_POST['full_name'] ?? '');
    if (empty($full_name)) {
        echo json_encode(["success" => false, "message" => "Full Name is required."]);
        exit;
    }

    $date_of_birth = trim($_POST['date_of_birth'] ?? '');
    if (empty($date_of_birth)) {
        echo json_encode(["success" => false, "message" => "Date of Birth is required."]);
        exit;
    }

    $nid_number = trim($_POST['nid_number'] ?? '');
    if (empty($nid_number)) {
        echo json_encode(["success" => false, "message" => "NID Number is required."]);
        exit;
    }

    $front_path = trim($_POST['front_image_key'] ?? '');
    $back_path = trim($_POST['back_image_key'] ?? '');
    $selfie_path = trim($_POST['selfie_image_key'] ?? '');

    if (empty($front_path) || empty($back_path) || empty($selfie_path)) {
        echo json_encode(["success" => false, "message" => "Front image, back image, and selfie keys are required."]);
        exit;
    }

    // Insert or update
    $stmt = $mysqli->prepare("INSERT INTO author_identities (author_id, full_name, document_type, nid_number, date_of_birth, front_image_path, back_image_path, selfie_image_path, status, rejection_reason) 
                              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL) 
                              ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), document_type = VALUES(document_type), nid_number = VALUES(nid_number), date_of_birth = VALUES(date_of_birth), front_image_path = VALUES(front_image_path), back_image_path = VALUES(back_image_path), selfie_image_path = VALUES(selfie_image_path), status = 'pending', rejection_reason = NULL");
    $stmt->bind_param("isssssss", $author_id, $full_name, $document_type, $nid_number, $date_of_birth, $front_path, $back_path, $selfie_path);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Identity verification submitted successfully!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to save verification data."]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
