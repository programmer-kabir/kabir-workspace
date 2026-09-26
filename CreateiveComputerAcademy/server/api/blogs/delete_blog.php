<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'BlogDbHelper.php';

$database = new Database();
$db = $database->getConnection();
BlogDbHelper::ensureSchema($db);

$data = json_decode(file_get_contents("php://input"));

if (!$data || empty($data->id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Blog ID is required."]);
    exit;
}

$blog_id = (int)$data->id;

try {
    // Delete associated comments, reads, reactions, and the blog itself
    $db->prepare("DELETE FROM blog_comments WHERE blog_id = :id")->execute([':id' => $blog_id]);
    $db->prepare("DELETE FROM blog_reads WHERE blog_id = :id")->execute([':id' => $blog_id]);
    $db->prepare("DELETE FROM blog_reactions WHERE blog_id = :id")->execute([':id' => $blog_id]);
    
    $stmt = $db->prepare("DELETE FROM academy_blogs WHERE id = :id");
    $stmt->execute([':id' => $blog_id]);

    echo json_encode([
        "status" => "success",
        "message" => "Blog post deleted successfully."
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
