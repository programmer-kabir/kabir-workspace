<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $id = $_POST['id'] ?? null;
    $name = $_POST['name'] ?? '';
    $slug = $_POST['slug'] ?? '';
    
    if (!$id || empty($name) || empty($slug)) {
        throw new Exception("ID, Name, and Slug are required.");
    }

    $db_image_path = null;

    // Check if new image is uploaded
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = $_SERVER['DOCUMENT_ROOT'] . '/images/categories/';
        if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);

        $file_tmp = $_FILES['image']['tmp_name'];
        $file_name = time() . '_' . uniqid();
        $final_path = $upload_dir . $file_name . '.webp';

        // Convert to WebP
        $info = getimagesize($file_tmp);
        if ($info['mime'] == 'image/jpeg') $image = imagecreatefromjpeg($file_tmp);
        elseif ($info['mime'] == 'image/png') $image = imagecreatefrompng($file_tmp);
        elseif ($info['mime'] == 'image/webp') $image = imagecreatefromwebp($file_tmp);
        else throw new Exception("Only JPG, PNG and WEBP images are allowed.");

        imagewebp($image, $final_path, 80);
        imagedestroy($image);

        $db_image_path = 'images/categories/' . $file_name . '.webp';
    }

    if ($db_image_path) {
        $stmt = $mysqli->prepare("UPDATE categories SET name = ?, slug = ?, image = ? WHERE id = ?");
        $stmt->bind_param("sssi", $name, $slug, $db_image_path, $id);
    } else {
        $stmt = $mysqli->prepare("UPDATE categories SET name = ?, slug = ? WHERE id = ?");
        $stmt->bind_param("ssi", $name, $slug, $id);
    }

    if (!$stmt->execute()) {
        throw new Exception("Failed to update category: " . $stmt->error);
    }

    echo json_encode(["success" => true, "message" => "Category updated successfully"]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
