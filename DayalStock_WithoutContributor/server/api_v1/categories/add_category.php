<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $name = isset($_POST['name']) ? trim($_POST['name']) : '';
    $slug = isset($_POST['slug']) ? trim(preg_replace('/[\r\n\t]+/', '', $_POST['slug'])) : '';
    $parent_id = !empty($_POST['parent_id']) ? $_POST['parent_id'] : null;
    
    $db_image_path = ''; 

    if (empty($name) || empty($slug)) {
        throw new Exception("Name and Slug are required.");
    }

    // Image Upload Logic (WebP Conversion)
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

        // Path for database
        $db_image_path = 'images/categories/' . $file_name . '.webp';
    }

    $stmt = $mysqli->prepare("INSERT INTO categories (parent_id, name, slug, image) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("isss", $parent_id, $name, $slug, $db_image_path);
    
    if (!$stmt->execute()) {
        throw new Exception("Failed to add category: " . $stmt->error);
    }

    echo json_encode(["success" => true, "message" => "Category added successfully"]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
