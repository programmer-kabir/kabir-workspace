<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
requireAuth();

$isAdminOrStaff = hasRole(['admin', 'developer', 'manager', 'staff', 'data_entry']);

header("Content-Type: application/json");

// ================= ERROR HANDLER =================
function apiError($message, $debug = null, $code = 500) {
    http_response_code($code);

    $res = [
        "success" => false,
        "message" => $message
    ];

    if ($debug !== null) {
        $res["debug"] = $debug;
    }

    echo json_encode($res, JSON_UNESCAPED_UNICODE);
    exit;
}
// =================================================

if ($isAdminOrStaff) {
    $sql = "
        SELECT 
            u.id,
            u.name,
            u.mobile,
            u.email,
            u.id_number,
            u.address,
            u.password,
            u.photo,
            GROUP_CONCAT(DISTINCT ur.role) AS roles
        FROM users u
        LEFT JOIN user_roles ur 
            ON ur.user_id = u.id
        GROUP BY 
            u.id,
            u.name,
            u.mobile,
            u.email,
            u.id_number,
            u.address,
            u.password,
            u.photo
        ORDER BY u.id ASC
    ";
} else {
    // Non-admin (Investors): Only return safe public info (id, name, photo) for leaderboard/cards, NO PASSWORDS/SENSITIVE DATA!
    $sql = "
        SELECT 
            u.id,
            u.name,
            u.photo,
            GROUP_CONCAT(DISTINCT ur.role) AS roles
        FROM users u
        LEFT JOIN user_roles ur 
            ON ur.user_id = u.id
        GROUP BY 
            u.id,
            u.name,
            u.photo
        ORDER BY u.id ASC
    ";
}

$result = $mysqli->query($sql);

if (!$result) {
    apiError("Query failed", $mysqli->error);
}
// =========================================================


// ================= RESULT BUILD =================
$data = [];

while ($row = $result->fetch_assoc()) {

    $row["id"] = (int) $row["id"];

    // roles string → array
    $row["roles"] = !empty($row["roles"])
        ? explode(",", $row["roles"])
        : [];

    $data[] = $row;
}
// =================================================


// ================= FINAL RESPONSE =================

// ================= ACTIVITY LOG : USERS LIST VIEW =================
try {
    if (!empty($_SESSION['user']['id'])) {
        require_once __DIR__ . '/../helpers/log_activity.php';

        logActivity(
            "users",
            "view",
            "Viewed users list",
            null,
            null,
            null,
            [
                "total_users" => count($data),
                "actor_id" => (int)$_SESSION['user']['id'],
                "actor_role" => $_SESSION['user']['role'] ?? null
            ]
        );
    }
} catch (Throwable $e) {
    // silently ignore
}

echo json_encode([
    "success" => true,
    "total"   => count($data),
    "data"    => $data
], JSON_UNESCAPED_UNICODE);
