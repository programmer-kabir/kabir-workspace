<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/FirebaseJWT.php';
// Note: $mysqli must be available. Endpoints should require db.php before auth.php.

if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

$token = '';
if (!empty($authHeader) && str_starts_with($authHeader, 'Bearer ')) {
    $token = trim(str_replace('Bearer ', '', $authHeader));
} else if (!empty($_GET['token'])) {
    $token = trim($_GET['token']);
}

if (empty($token)) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized - Missing Token"]);
    exit;
}

try {
    // 1. Verify the Firebase JWT Token cryptographically
    $payload = FirebaseJWT::verifyIdToken($token);
    
    $email = $payload['email'] ?? null;
    $firebase_uid = $payload['sub'] ?? null;

    if (!$email) {
        throw new Exception("Email not found in token");
    }

    // 2. Lookup the user in the database
    if (isset($mysqli)) {
        $stmt = $mysqli->prepare("
            SELECT u.id, u.email, u.status, GROUP_CONCAT(ur.role SEPARATOR ',') as roles 
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            WHERE u.email = ?
            GROUP BY u.id, u.email
            LIMIT 1
        ");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $userRow = $result->fetch_assoc();
            
            // Block if user is not active (e.g., suspended or deactivated)
            if (isset($userRow['status']) && $userRow['status'] !== 'active') {
                http_response_code(403);
                echo json_encode([
                    "success" => false, 
                    "message" => "Your account is " . htmlspecialchars($userRow['status']) . ". Please contact support."
                ]);
                exit;
            }

            $userRow['roles'] = $userRow['roles'] ? explode(',', $userRow['roles']) : ['user'];
            
            // Set global user array for endpoints to use securely
            $GLOBALS['user'] = $userRow;
        } else {
            // User not in DB yet (maybe first login). Just set email.
            $GLOBALS['user'] = ['id' => 0, 'email' => $email, 'roles' => ['user']];
        }
        $stmt->close();
    } else {
        // If DB isn't loaded (which shouldn't happen), just set email
        $GLOBALS['user'] = ['id' => 0, 'email' => $email, 'roles' => []];
    }
    
    $GLOBALS['token_payload'] = $payload;

} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized - " . $e->getMessage()]);
    exit;
}
