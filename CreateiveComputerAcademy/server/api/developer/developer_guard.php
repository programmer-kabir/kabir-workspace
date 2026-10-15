<?php
// Developer Security Guard
function verifyDeveloperAccess($db, $token) {
    if (empty($token)) {
        return false;
    }

    $stmt = $db->prepare(
        "SELECT u.id, u.name, u.email 
         FROM user_tokens ut
         INNER JOIN users u ON ut.user_id = u.id
         WHERE ut.token = :token AND ut.expires_at > NOW()
         LIMIT 1"
    );
    $stmt->execute([':token' => $token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        return false;
    }

    $rstmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = :uid");
    $rstmt->execute([':uid' => $user['id']]);
    $roles = $rstmt->fetchAll(PDO::FETCH_COLUMN);

    if (!in_array('developer', $roles) && !in_array('admin', $roles)) {
        return false;
    }

    $user['roles'] = $roles;
    return $user;
}
?>
