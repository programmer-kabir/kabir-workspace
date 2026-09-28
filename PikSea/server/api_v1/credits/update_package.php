<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/check_role.php';

header("Content-Type: application/json; charset=UTF-8");

// 🔒 শুধু admin পারবে
requireRole('admin');

try {
    $data = json_decode(file_get_contents("php://input"), true);

    $id          = intval($data['id'] ?? 0);
    $name        = trim($data['name'] ?? '');
    $slug        = trim($data['slug'] ?? '');
    $price       = floatval($data['price'] ?? 0);
    $expiry_days = intval($data['expiry_days'] ?? 365);
    $image_limit = intval($data['image_limit'] ?? 0);
    $video_limit = intval($data['video_limit'] ?? 0);
    
    $sort_order  = intval($data['sort_order'] ?? 0);
    $is_active   = isset($data['is_active']) ? intval($data['is_active']) : 1;

    if (!$name || !$slug) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Name and slug are required."]);
        exit;
    }
    
    // Auto generate description based on limits
    $descParts = [];
    if ($image_limit > 0) $descParts[] = "$image_limit images";
    if ($video_limit > 0) $descParts[] = "$video_limit videos";
    
    $description = "";
    if (count($descParts) > 0) {
        $last = array_pop($descParts);
        if (count($descParts) > 0) {
            $description = "Download up to " . implode(", ", $descParts) . " & " . $last;
        } else {
            $description = "Download up to " . $last;
        }
    }

    if ($id > 0) {
        // UPDATE existing
        $sql = "UPDATE credit_packages SET
            name = ?, slug = ?, description = ?, price = ?, expiry_days = ?,
            image_limit = ?, video_limit = ?,
            sort_order = ?, is_active = ?
        WHERE id = ?";

        $stmt = $mysqli->prepare($sql);
        $stmt->bind_param("sssdiiiiii", 
            $name, $slug, $description, $price, $expiry_days,
            $image_limit, $video_limit,
            $sort_order, $is_active, $id
        );
    } else {
        // INSERT new
        $sql = "INSERT INTO credit_packages 
            (name, slug, description, price, expiry_days, image_limit, video_limit, sort_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $mysqli->prepare($sql);
        $stmt->bind_param("sssdiiiii", 
            $name, $slug, $description, $price, $expiry_days,
            $image_limit, $video_limit,
            $sort_order, $is_active
        );
    }

    if ($stmt->execute()) {
        $target_id = $id > 0 ? $id : $mysqli->insert_id;
        $row = $mysqli->query("SELECT * FROM credit_packages WHERE id = $target_id")->fetch_assoc();
        echo json_encode(["success" => true, "message" => "Package saved successfully.", "data" => $row]);
    } else {
        throw new Exception("DB save failed: " . $mysqli->error);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
