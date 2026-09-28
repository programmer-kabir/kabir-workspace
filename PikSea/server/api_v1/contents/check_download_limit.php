<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helper/download_permission.php';

header("Content-Type: application/json; charset=UTF-8");

try {
    $data       = json_decode(file_get_contents("php://input"), true);
    $email      = trim($data['email']      ?? '');
    $content_id = (int) ($data['content_id'] ?? 0);

    // ── Resolve user ────────────────────────────────────────────────────────
    if (!$email) {
        echo json_encode(["success" => false, "message" => "Please login to download assets."]);
        exit;
    }

    $user_stmt = $mysqli->prepare("SELECT u.id, GROUP_CONCAT(ur.role SEPARATOR ',') as roles FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id WHERE u.email = ? GROUP BY u.id LIMIT 1");
    $user_stmt->bind_param("s", $email);
    $user_stmt->execute();
    $user_res = $user_stmt->get_result();
    if ($user_res->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Please login to download assets."]);
        exit;
    }
    $user_row  = $user_res->fetch_assoc();
    $user_id   = (int) $user_row['id'];
    $user_roles = $user_row['roles'] ? explode(',', $user_row['roles']) : ['user'];


    // ── Check permission ─────────────────────────────────────────────────────
    $perm = getDownloadPermission($mysqli, $user_id, $content_id, $user_roles);

    if (!$perm['allowed']) {
        echo json_encode([
            "success"          => false,
            "message"          => $perm['message'],
            "upgrade_required" => $perm['upgrade_required'] ?? false,
            "total"            => $perm['total']   ?? 0,
            "limit"            => $perm['limit']   ?? 0,
            "period"           => $perm['period']  ?? 'daily',
            "image_limit"      => $perm['image_limit'] ?? 0,
            "video_limit"      => $perm['video_limit'] ?? 0,
            "image_total"      => $perm['image_total'] ?? 0,
            "video_total"      => $perm['video_total'] ?? 0,
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Download allowed",
        "total"   => $perm['total'],
        "limit"   => $perm['limit'],
        "period"  => $perm['period'],
        "image_limit" => $perm['image_limit'] ?? 0,
        "video_limit" => $perm['video_limit'] ?? 0,
        "image_total" => $perm['image_total'] ?? 0,
        "video_total" => $perm['video_total'] ?? 0,
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
