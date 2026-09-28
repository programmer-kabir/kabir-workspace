<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header("Content-Type: application/json");


try {

    $data = json_decode(file_get_contents("php://input"), true);

    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = trim($data['password'] ?? '');

    if (!$name || !$email || !$password) {
        echo json_encode([
            "success" => false,
            "message" => "All fields are required"
        ]);
        exit;
    }

    // Email Exists Check
    $check = $mysqli->prepare(
        "SELECT id FROM users WHERE email = ?"
    );
    $check->bind_param("s", $email);
    $check->execute();
    $result = $check->get_result();

    if ($result->num_rows > 0) {
        echo json_encode([
            "success" => false,
            "message" => "Email already exists"
        ]);
        exit;
    }

    // Password Hash
    $hashedPassword = password_hash(
        $password,
        PASSWORD_DEFAULT
    );

    $photo = null;

    $mysqli->begin_transaction();

    // users table e insert (role column নেই এখন)
    $stmt = $mysqli->prepare(
        "INSERT INTO users
        (name,email,password,photo)
        VALUES (?,?,?,?)"
    );

    $stmt->bind_param(
        "ssss",
        $name,
        $email,
        $hashedPassword,
        $photo
    );

    $stmt->execute();
    $newUserId = $stmt->insert_id;

    // user_roles table e default 'user' role insert
    $roleStmt = $mysqli->prepare(
        "INSERT INTO user_roles (user_id, role) VALUES (?, 'user')"
    );
    $roleStmt->bind_param("i", $newUserId);
    $roleStmt->execute();

    $mysqli->commit();

    echo json_encode([
        "success" => true,
        "message" => "User registered successfully",
        "user_id" => $newUserId
    ]);

} catch (Exception $e) {

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}