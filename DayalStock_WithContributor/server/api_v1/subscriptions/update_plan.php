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
    $description = trim($data['description'] ?? '');
    $price       = floatval($data['price'] ?? 0);
    $billing_cycle = $data['billing_cycle'] ?? 'monthly';
    $image_limit = intval($data['image_limit'] ?? 0);
    $video_limit = intval($data['video_limit'] ?? 0);
    $limit_period = $data['limit_period'] ?? 'monthly';

    // boolean flags
    $premium_access      = isset($data['premium_access'])      ? intval($data['premium_access'])      : 0;
    $commercial_license  = isset($data['commercial_license'])  ? intval($data['commercial_license'])  : 0;
    $attribution_required= isset($data['attribution_required'])? intval($data['attribution_required']): 1;
    $ad_free             = isset($data['ad_free'])             ? intval($data['ad_free'])             : 0;
    $priority_support    = isset($data['priority_support'])    ? intval($data['priority_support'])    : 0;
    $is_popular          = isset($data['is_popular'])          ? intval($data['is_popular'])          : 0;
    $sort_order          = intval($data['sort_order'] ?? 0);
    $is_active           = isset($data['is_active'])           ? intval($data['is_active'])           : 1;

    if (!$id || !$name || !$slug) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID, name and slug are required."]);
        exit;
    }

    // allowed billing cycles
    $allowed_billing = ['free', 'monthly', 'yearly'];
    if (!in_array($billing_cycle, $allowed_billing)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid billing_cycle value."]);
        exit;
    }

    $sql = "UPDATE subscription_plans SET
        name                = ?,
        slug                = ?,
        description         = ?,
        price               = ?,
        billing_cycle       = ?,
        image_limit         = ?,
        video_limit         = ?,
        limit_period        = ?,
        premium_access      = ?,
        commercial_license  = ?,
        attribution_required= ?,
        ad_free             = ?,
        priority_support    = ?,
        is_popular          = ?,
        sort_order          = ?,
        is_active           = ?
    WHERE id = ?";

    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param(
        "sssdssiiiiiiiiiiii",
        $name, $slug, $description, $price,
        $billing_cycle, $image_limit, $video_limit, $limit_period,
        $premium_access, $commercial_license, $attribution_required,
        $ad_free, $priority_support, $is_popular,
        $sort_order, $is_active,
        $id
    );

    if ($stmt->execute()) {
        // updated plan ফেরত পাঠাই
        $row = $mysqli->query("SELECT * FROM subscription_plans WHERE id = $id")->fetch_assoc();
        echo json_encode(["success" => true, "message" => "Plan updated successfully.", "data" => $row]);
    } else {
        throw new Exception("DB update failed: " . $mysqli->error);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
