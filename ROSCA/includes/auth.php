<?php
// includes/auth.php - Session Authentication & Role Authorization Helpers

require_once __DIR__ . '/../config/db.php';

function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

function isAdmin() {
    return isLoggedIn() && (isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin');
}

function requireLogin() {
    if (!isLoggedIn()) {
        header("Location: " . url('index.php'));
        exit();
    }
}

function requireAdmin() {
    requireLogin();
    if (!isAdmin()) {
        header("Location: " . url('member/dashboard.php'));
        exit();
    }
}

function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    static $cachedUser = null;
    if ($cachedUser === null) {
        $db = getDBConnection();
        $stmt = $db->prepare("SELECT id, name, phone, role, avatar, nid_number, nominee_name, nominee_phone FROM members WHERE id = :id LIMIT 1");
        $stmt->execute(['id' => $_SESSION['user_id']]);
        $cachedUser = $stmt->fetch();
        if (!$cachedUser) {
            $cachedUser = [
                'id'    => $_SESSION['user_id'],
                'name'  => $_SESSION['user_name'] ?? 'Member',
                'phone' => $_SESSION['user_phone'] ?? '',
                'role'  => $_SESSION['user_role'] ?? 'member',
                'avatar' => ''
            ];
        }
    }
    return $cachedUser;
}

function loginUser($phone, $password) {
    $db = getDBConnection();
    $stmt = $db->prepare("SELECT * FROM members WHERE phone = :phone LIMIT 1");
    $stmt->execute(['phone' => trim($phone)]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user_id']    = $user['id'];
        $_SESSION['user_name']  = $user['name'];
        $_SESSION['user_phone'] = $user['phone'];
        $_SESSION['user_role']  = $user['role'];
        return true;
    }
    return false;
}
