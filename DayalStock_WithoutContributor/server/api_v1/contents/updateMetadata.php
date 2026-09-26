<?php
ini_set("display_errors", 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

try {
    if (!isset($mysqli) || !$mysqli) {
        throw new Exception('Database connection error.');
    }

    $userEmail = $GLOBALS['user']['email'];
    if (!$userEmail) throw new Exception("Unauthorized. Please log in.");
    
    $authStmt = $mysqli->prepare("SELECT authors.id FROM authors INNER JOIN users ON authors.user_id = users.id WHERE users.email = ? LIMIT 1");
    $authStmt->bind_param("s", $userEmail);
    $authStmt->execute();
    $authRes = $authStmt->get_result();
    
    if ($authRes->num_rows === 0) {
        throw new Exception('You are not authorized to edit content.');
    }
    $authorId = (int) $authRes->fetch_assoc()['id'];
    $authStmt->close();

    $contentId = !empty($_POST['content_id']) ? (int) $_POST['content_id'] : null;
    $title = trim($_POST['title'] ?? '');
    $categoryId = !empty($_POST['category_id']) ? (int) $_POST['category_id'] : null;
    $subcategoryId = !empty($_POST['subcategory_id']) ? (int) $_POST['subcategory_id'] : null;
    $contentType = trim($_POST['content_type'] ?? '');
    $licenseType = trim($_POST['license_type'] ?? 'free');
    $aiGenerated = ($_POST['ai_generated'] ?? 'no') === 'yes' ? 1 : 0;
    $tagsText = trim($_POST['tags'] ?? '');
    $description = trim($_POST['description'] ?? '');

    if (!$contentId || !$title || !$categoryId || !$contentType) {
        throw new Exception('Content ID, title, category, and content type are required.');
    }

    $isPremium = $licenseType === 'premium' ? 1 : 0;
    $status = 'pending';

    // Generate base slug from title
    $baseSlug = strtolower(trim($title));
    $baseSlug = preg_replace('/[^a-z0-9]+/', '-', $baseSlug);
    $baseSlug = trim($baseSlug, '-');
    if ($baseSlug === '') {
        $baseSlug = 'content';
    }

    $finalSlug = $baseSlug;
    $slugCounter = 1;
    
    // Check for uniqueness
    while (true) {
        $slugCheckStmt = $mysqli->prepare("SELECT id FROM contents WHERE slug = ? AND id != ?");
        $slugCheckStmt->bind_param("si", $finalSlug, $contentId);
        $slugCheckStmt->execute();
        $slugCheckRes = $slugCheckStmt->get_result();
        $slugCheckStmt->close();
        
        if ($slugCheckRes->num_rows === 0) {
            break; // Unique slug found
        }
        $finalSlug = $baseSlug . '-' . $slugCounter;
        $slugCounter++;
    }

    $mysqli->begin_transaction();

    // Verify ownership
    $checkStmt = $mysqli->prepare("SELECT id FROM contents WHERE id = ? AND author_id = ?");
    $checkStmt->bind_param("ii", $contentId, $authorId);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows === 0) {
        throw new Exception("Content not found or you don't have permission.");
    }
    $checkStmt->close();

    // Update contents table
    $updateQuery = "
        UPDATE contents SET 
            title = ?, 
            slug = ?,
            description = ?, 
            main_category_id = ?, 
            subcategory_id = ?, 
            content_type = ?, 
            is_premium = ?, 
            license_type = ?, 
            ai_generated = ?, 
            status = ? 
        WHERE id = ?
    ";
    
    $updateStmt = $mysqli->prepare($updateQuery);
    $updateStmt->bind_param("sssiisisisi", 
        $title, $finalSlug, $description, $categoryId, $subcategoryId, 
        $contentType, $isPremium, $licenseType, $aiGenerated, $status, $contentId
    );
    
    if (!$updateStmt->execute()) {
        throw new Exception("Failed to update content metadata: " . $updateStmt->error);
    }
    $updateStmt->close();

    // Handle tags
    $mysqli->query("DELETE FROM content_tags WHERE content_id = " . $contentId);
    if (!empty($tagsText)) {
        $tagsArray = array_map('trim', explode(',', $tagsText));
        $tagsArray = array_unique(array_filter($tagsArray));
        
        $insertTagStmt = $mysqli->prepare("INSERT IGNORE INTO tags (name, slug) VALUES (?, ?)");
        $findTagStmt = $mysqli->prepare("SELECT id FROM tags WHERE name = ? LIMIT 1");
        $linkTagStmt = $mysqli->prepare("INSERT INTO content_tags (content_id, tag_id) VALUES (?, ?)");

        foreach ($tagsArray as $tagName) {
            $tagSlug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $tagName)));
            $insertTagStmt->bind_param("ss", $tagName, $tagSlug);
            $insertTagStmt->execute();

            $findTagStmt->bind_param("s", $tagName);
            $findTagStmt->execute();
            $tagRes = $findTagStmt->get_result();
            if ($tagRow = $tagRes->fetch_assoc()) {
                $tagId = $tagRow['id'];
                $linkTagStmt->bind_param("ii", $contentId, $tagId);
                $linkTagStmt->execute();
            }
        }
    }

    $mysqli->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Metadata updated and submitted for review successfully.'
    ]);

} catch (Exception $e) {
    if (isset($mysqli) && $mysqli && $mysqli->connect_errno === 0) {
        $mysqli->rollback();
    }
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
