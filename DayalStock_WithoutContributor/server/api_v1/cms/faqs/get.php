<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get all published categories
    $catStmt = $mysqli->prepare("SELECT id, name, slug, description FROM faq_categories WHERE status = 'published' ORDER BY sort_order ASC, id ASC");
    if (!$catStmt) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error"]);
        exit;
    }
    $catStmt->execute();
    $catResult = $catStmt->get_result();
    
    $categories = [];
    $categoryIds = [];
    while ($row = $catResult->fetch_assoc()) {
        $row['items'] = [];
        $categories[$row['id']] = $row;
        $categoryIds[] = $row['id'];
    }
    $catStmt->close();

    // Get all published FAQs for those categories
    if (!empty($categoryIds)) {
        $idsStr = implode(',', $categoryIds);
        $faqStmt = $mysqli->prepare("SELECT id, category_id, question, answer FROM faqs WHERE status = 'published' AND category_id IN ($idsStr) ORDER BY sort_order ASC, id ASC");
        $faqStmt->execute();
        $faqResult = $faqStmt->get_result();
        
        while ($faqRow = $faqResult->fetch_assoc()) {
            $catId = $faqRow['category_id'];
            unset($faqRow['category_id']);
            $categories[$catId]['items'][] = $faqRow;
        }
        $faqStmt->close();
    }

    echo json_encode(["success" => true, "data" => array_values($categories)]);
    $mysqli->close();
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
?>
