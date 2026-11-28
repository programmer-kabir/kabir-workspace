<?php
declare(strict_types=1);

namespace SunamShop\Controllers;

use SunamShop\Core\Auth;
use SunamShop\Core\Database;
use SunamShop\Core\Request;
use SunamShop\Core\Response;

final class AuthController
{
    public function register(Request $request): void
    {
        $phone = trim((string)$request->input('phone', ''));
        $fullName = trim((string)$request->input('full_name', ''));
        $password = (string)$request->input('password', '');
        $email = trim((string)$request->input('email', ''));

        // Validation
        if (empty($phone) || empty($fullName) || empty($password)) {
            Response::error('Phone, full name, and password are required.', 422);
            return;
        }

        // Validate Bangladeshi phone number: 01XXXXXXXXX or +8801XXXXXXXXX
        if (!preg_match('/^(\+?88)?01[3-9]\d{8}$/', $phone)) {
            Response::error('Invalid Bangladeshi mobile number format (e.g., 017XXXXXXXX).', 422);
            return;
        }

        if (strlen($password) < 6) {
            Response::error('Password must be at least 6 characters long.', 422);
            return;
        }

        // Standardize phone to 11 digits (e.g. 01712345678)
        $standardPhone = substr(preg_replace('/^\+?88/', '', $phone), -11);

        $db = Database::getConnection();

        // Check duplicate
        $stmt = $db->prepare('SELECT id FROM users WHERE phone = ? LIMIT 1');
        $stmt->execute([$standardPhone]);
        if ($stmt->fetch()) {
            Response::error('An account with this mobile number already exists.', 409);
            return;
        }

        $passwordHash = Auth::hashPassword($password);
        $roleId = 5; // CUSTOMER

        $insert = $db->prepare(
            'INSERT INTO users (role_id, phone, full_name, email, password_hash, status, is_phone_verified) 
             VALUES (?, ?, ?, ?, ?, "ACTIVE", 1)'
        );
        $insert->execute([
            $roleId,
            $standardPhone,
            $fullName,
            !empty($email) ? $email : null,
            $passwordHash,
        ]);

        $userId = (int)$db->lastInsertId();

        $tokenPayload = [
            'user_id'   => $userId,
            'phone'     => $standardPhone,
            'full_name' => $fullName,
            'role_id'   => $roleId,
            'role_name' => 'CUSTOMER',
        ];

        $token = Auth::generateJwt($tokenPayload);

        Response::success([
            'token' => $token,
            'user'  => $tokenPayload,
        ], 'Registration successful. Welcome to Sunam Shop!', 201);
    }

    public function login(Request $request): void
    {
        $phone = trim((string)$request->input('phone', ''));
        $password = (string)$request->input('password', '');

        if (empty($phone) || empty($password)) {
            Response::error('Mobile number and password are required.', 422);
            return;
        }

        $standardPhone = substr(preg_replace('/^\+?88/', '', $phone), -11);

        $db = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT u.id, u.role_id, u.phone, u.full_name, u.email, u.password_hash, u.status, r.name as role_name 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.phone = ? AND u.deleted_at IS NULL 
             LIMIT 1'
        );
        $stmt->execute([$standardPhone]);
        $user = $stmt->fetch();

        if (!$user || !Auth::verifyPassword($password, $user['password_hash'])) {
            Response::error('Invalid mobile number or password.', 401);
            return;
        }

        if ($user['status'] !== 'ACTIVE') {
            Response::error('Your account is currently suspended. Please contact customer support.', 403);
            return;
        }

        $tokenPayload = [
            'user_id'   => (int)$user['id'],
            'phone'     => $user['phone'],
            'full_name' => $user['full_name'],
            'email'     => $user['email'],
            'role_id'   => (int)$user['role_id'],
            'role_name' => $user['role_name'],
        ];

        $token = Auth::generateJwt($tokenPayload);

        Response::success([
            'token' => $token,
            'user'  => $tokenPayload,
        ], 'Login successful. Welcome back!');
    }

    public function me(Request $request): void
    {
        if (!$request->user) {
            Response::unauthorized();
            return;
        }

        $userId = (int)$request->user['user_id'];
        $db = Database::getConnection();

        $stmt = $db->prepare(
            'SELECT u.id, u.role_id, u.phone, u.full_name, u.email, u.status, r.name as role_name, r.display_name as role_display 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.id = ? LIMIT 1'
        );
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::notFound('User profile not found.');
            return;
        }

        Response::success($user, 'Profile retrieved successfully.');
    }
}
