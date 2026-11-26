<?php
// backend/api/admin/faq/save.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../helpers/response.php';
require_once __DIR__ . '/../../../helpers/auth.php';
require_once __DIR__ . '/../../../helpers/audit.php';

$admin = requireAdmin($pdo);

$data = getJsonInput();
$id = (int)($data['id'] ?? 0);
$category = trim($data['category'] ?? 'General');
$question = trim($data['question'] ?? '');
$answer = trim($data['answer'] ?? '');
$displayOrder = isset($data['display_order']) ? (int)$data['display_order'] : (isset($data['sort_order']) ? (int)$data['sort_order'] : 0);
$status = isset($data['status']) && in_array($data['status'], ['draft', 'published']) 
    ? $data['status'] 
    : (isset($data['is_active']) ? ($data['is_active'] ? 'published' : 'draft') : 'published');

if (empty($question) || empty($answer)) {
    jsonResponse(false, null, 'Question and answer are both required.', 400);
}

try {
    if ($id > 0) {
        $stmt = $pdo->prepare("
            UPDATE faq_items 
            SET category = :category, question = :question, answer = :answer,
                display_order = :display_order, status = :status, updated_at = NOW()
            WHERE id = :id
        ");
        $stmt->execute([
            ':category' => $category,
            ':question' => $question,
            ':answer' => $answer,
            ':display_order' => $displayOrder,
            ':status' => $status,
            ':id' => $id
        ]);

        logAdminAction($pdo, $admin['id'], 'update_faq', 'faq', $id, ['question' => $question]);

        jsonResponse(true, ['id' => $id], 'FAQ item updated successfully.');
    } else {
        $stmt = $pdo->prepare("
            INSERT INTO faq_items 
            (category, question, answer, display_order, status, created_at, updated_at)
            VALUES 
            (:category, :question, :answer, :display_order, :status, NOW(), NOW())
        ");
        $stmt->execute([
            ':category' => $category,
            ':question' => $question,
            ':answer' => $answer,
            ':display_order' => $displayOrder,
            ':status' => $status
        ]);
        $newId = (int)$pdo->lastInsertId();

        logAdminAction($pdo, $admin['id'], 'create_faq', 'faq', $newId, ['question' => $question]);

        jsonResponse(true, ['id' => $newId], 'FAQ item created successfully.', 201);
    }
} catch (Exception $e) {
    jsonResponse(false, null, 'Failed to save FAQ item: ' . $e->getMessage(), 500);
}
