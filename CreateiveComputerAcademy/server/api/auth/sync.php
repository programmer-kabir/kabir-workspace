<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if(isset($data->email)) {
    $email = $data->email;
    $name = isset($data->name) ? $data->name : 'Staff Member';
    
    // Check if user exists
    $query = "SELECT id, name, email, phone, status, profile_picture, cover_picture FROM users WHERE email = :email LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    
    if($stmt->rowCount() > 0) {
        // User exists
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $user_id = $row['id'];
        
        // Fetch all roles for this user
        $role_query = "SELECT role FROM user_roles WHERE user_id = :user_id";
        $role_stmt = $db->prepare($role_query);
        $role_stmt->bindParam(':user_id', $user_id);
        $role_stmt->execute();
        
        $roles = [];
        while($r = $role_stmt->fetch(PDO::FETCH_ASSOC)) {
            $roles[] = $r['role'];
        }

        // Role restriction check
        $required_role = isset($data->role) ? trim($data->role) : null;
        if ($required_role && !in_array($required_role, $roles)) {
            echo json_encode(["status" => "error", "message" => "Access denied. Role mismatch."]);
            exit;
        }
        
        $row['roles'] = $roles;
        
        // Fetch employee/reviewer details if any
        if ($required_role === 'reviewer') {
            $rev_query = "SELECT r.reviewer_code AS employee_code, r.designation, NULL AS department_name 
                          FROM reviewers r
                          WHERE r.user_id = :user_id LIMIT 1";
            $rev_stmt = $db->prepare($rev_query);
            $rev_stmt->bindParam(':user_id', $user_id);
            $rev_stmt->execute();
            $emp_row = $rev_stmt->rowCount() > 0 ? $rev_stmt->fetch(PDO::FETCH_ASSOC) : ['employee_code' => null, 'designation' => null, 'department_name' => null];
            $row['employee_code'] = $emp_row['employee_code'];
            $row['designation'] = $emp_row['designation'];
            $row['department_name'] = $emp_row['department_name'];
        } else {
            $emp_query = "SELECT e.employee_code, e.designation, d.name AS department_name 
                          FROM employees e
                          LEFT JOIN departments d ON e.department_id = d.id
                          WHERE e.user_id = :user_id LIMIT 1";
            $emp_stmt = $db->prepare($emp_query);
            $emp_stmt->bindParam(':user_id', $user_id);
            $emp_stmt->execute();
            $emp_row = $emp_stmt->rowCount() > 0 ? $emp_stmt->fetch(PDO::FETCH_ASSOC) : ['employee_code' => null, 'designation' => null, 'department_name' => null];
            $row['employee_code'] = $emp_row['employee_code'];
            $row['designation'] = $emp_row['designation'];
            $row['department_name'] = $emp_row['department_name'];
        }

        echo json_encode([
            "status" => "success",
            "message" => "User synced successfully",
            "user" => $row
        ]);
    } else {
        // User does not exist, create new user
        $dummy_password = password_hash(bin2hex(random_bytes(8)), PASSWORD_DEFAULT);
        
        $insert_query = "INSERT INTO users (name, email, password) VALUES (:name, :email, :password)";
        $insert_stmt = $db->prepare($insert_query);
        $insert_stmt->bindParam(':name', $name);
        $insert_stmt->bindParam(':email', $email);
        $insert_stmt->bindParam(':password', $dummy_password);
        
        if($insert_stmt->execute()) {
            $new_user_id = $db->lastInsertId();
            
            // By default, assign 'student' role (as a basic user)
            // An admin will need to manually assign 'staff' role from the admin panel
            $role_insert = "INSERT INTO user_roles (user_id, role) VALUES (:user_id, 'student')";
            $role_insert_stmt = $db->prepare($role_insert);
            $role_insert_stmt->bindParam(':user_id', $new_user_id);
            $role_insert_stmt->execute();

            echo json_encode([
                "status" => "success",
                "message" => "User created and synced successfully",
                "user" => [
                    "id" => $new_user_id,
                    "name" => $name,
                    "email" => $email,
                    "status" => "active",
                    "roles" => ["student"]
                ]
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Unable to create user in MySQL."]);
        }
    }
} else {
    echo json_encode(["status" => "error", "message" => "Email is required for sync."]);
}
?>
