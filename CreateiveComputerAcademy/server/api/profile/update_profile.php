<?php
require_once '../../config/database.php';
require_once '../../config/cors.php';
require_once '../leave/StudentLeaveHelper.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

// Ensure self-healing DB schema for student attributes
StudentLeaveHelper::ensureSchema($db);

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput);

$user_id = $data->user_id ?? ($_POST['user_id'] ?? ($_GET['user_id'] ?? null));

if(!$user_id) {
    echo json_encode(["status" => "error", "message" => "User ID is required."]);
    exit;
}

$user_id = (int)$user_id;
$rawName = $data->name ?? ($_POST['name'] ?? null);
$name = $rawName !== null ? trim($rawName) : null;

$rawPhone = $data->phone ?? ($_POST['phone'] ?? null);
$phone = $rawPhone !== null ? trim($rawPhone) : null;

$rawUsername = $data->username ?? ($_POST['username'] ?? null);
$username = $rawUsername !== null ? strtolower(trim($rawUsername)) : null;

// Validate username if provided
if ($username !== null && !empty($username)) {
    // Only allow lowercase alphanumeric, underscore, dot (3-40 chars)
    if (!preg_match('/^[a-z0-9_.]{3,40}$/', $username)) {
        echo json_encode([
            "status" => "error", 
            "message" => "Username must be 3-40 characters and only contain letters (a-z), numbers, underscores (_), and dots (.)."
        ]);
        exit;
    }
    
    // Check if taken by another user
    try {
        $chk = $db->prepare("SELECT id FROM users WHERE username = :uname AND id != :uid LIMIT 1");
        $chk->execute([':uname' => $username, ':uid' => $user_id]);
        if ($chk->rowCount() > 0) {
            echo json_encode([
                "status" => "error", 
                "message" => "Username '@" . $username . "' is already taken. Please choose another one."
            ]);
            exit;
        }
    } catch (Exception $e) {}
}

$fields = [];
$params = [':user_id' => $user_id];

if ($name !== null && !empty($name)) {
    $fields[] = "name = :name";
    $params[':name'] = $name;
}
if ($phone !== null) {
    $fields[] = "phone = :phone";
    $params[':phone'] = $phone;
}
if ($username !== null) {
    $fields[] = "username = :username";
    $params[':username'] = !empty($username) ? $username : null;
}

// Student & Academic fields
$chkEmp = $db->prepare("SELECT id, is_student, student_status, student_institution, student_level, institution_type FROM employees WHERE user_id = :uid LIMIT 1");
$chkEmp->execute([':uid' => $user_id]);
$empRow = $chkEmp->fetch(PDO::FETCH_ASSOC);

$currentStudentStatus = $empRow['student_status'] ?? (!empty($empRow['is_student']) ? 'approved' : 'none');
$resultingStudentStatus = $currentStudentStatus;

$is_student_val = null;
if (isset($data->is_student) || isset($_POST['is_student'])) {
    $rawIsStudent = $data->is_student ?? $_POST['is_student'];
    $is_student_val = (!empty($rawIsStudent) && $rawIsStudent !== 'false' && $rawIsStudent !== '0') ? 1 : 0;
}

$institution_type_val = null;
if (isset($data->institution_type) || isset($_POST['institution_type'])) {
    $institution_type_val = trim($data->institution_type ?? $_POST['institution_type']);
}

$student_institution_val = null;
if (isset($data->student_institution) || isset($_POST['student_institution'])) {
    $student_institution_val = trim($data->student_institution ?? $_POST['student_institution']);
}

$student_level_val = null;
if (isset($data->student_level) || isset($_POST['student_level'])) {
    $student_level_val = trim($data->student_level ?? $_POST['student_level']);
}

$empUpdates = [];
$empParams = [':uid' => $user_id];

if ($is_student_val !== null) {
    if ($is_student_val == 1) {
        if ($currentStudentStatus === 'approved') {
            $resultingStudentStatus = 'approved';
        } else {
            // New request or previously rejected -> set to 'pending' for admin review
            $resultingStudentStatus = 'pending';
            $empUpdates[] = "student_status = :student_status";
            $empParams[':student_status'] = 'pending';
            $empUpdates[] = "student_rejection_reason = NULL";
        }
        $empUpdates[] = "is_student = :is_student";
        $empParams[':is_student'] = 1;
    } else {
        $resultingStudentStatus = 'none';
        $empUpdates[] = "is_student = :is_student";
        $empParams[':is_student'] = 0;
        $empUpdates[] = "student_status = :student_status";
        $empParams[':student_status'] = 'none';
    }
}
if ($institution_type_val !== null) {
    $empUpdates[] = "institution_type = :institution_type";
    $empParams[':institution_type'] = $institution_type_val;
}
if ($student_institution_val !== null) {
    $empUpdates[] = "student_institution = :student_institution";
    $empParams[':student_institution'] = $student_institution_val;
}
if ($student_level_val !== null) {
    $empUpdates[] = "student_level = :student_level";
    $empParams[':student_level'] = $student_level_val;
}

if (empty($fields) && empty($empUpdates)) {
    echo json_encode(["status" => "error", "message" => "No profile fields to update."]);
    exit;
}

try {
    if (!empty($fields)) {
        $query = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->execute($params);
    }
    
    // Update employee table for student details
    if (!empty($empUpdates)) {
        $chkEmp = $db->prepare("SELECT id FROM employees WHERE user_id = :uid LIMIT 1");
        $chkEmp->execute([':uid' => $user_id]);
        $empRow = $chkEmp->fetch(PDO::FETCH_ASSOC);

        if ($empRow) {
            $empSql = "UPDATE employees SET " . implode(', ', $empUpdates) . " WHERE user_id = :uid";
            $empStmt = $db->prepare($empSql);
            $empStmt->execute($empParams);
        } else {
            $insCols = ['user_id'];
            $insVals = [':uid'];
            foreach ($empParams as $pKey => $pVal) {
                if ($pKey === ':uid') continue;
                $insCols[] = substr($pKey, 1);
                $insVals[] = $pKey;
            }
            $insSql = "INSERT INTO employees (" . implode(', ', $insCols) . ") VALUES (" . implode(', ', $insVals) . ")";
            $insStmt = $db->prepare($insSql);
            $insStmt->execute($empParams);
        }
    }

    echo json_encode([
        "status" => "success", 
        "message" => "Profile updated successfully.",
        "data" => [
            "name" => $name,
            "phone" => $phone,
            "username" => $username,
            "is_student" => $is_student_val,
            "student_status" => $resultingStudentStatus,
            "institution_type" => $institution_type_val,
            "student_institution" => $student_institution_val,
            "student_level" => $student_level_val
        ]
    ]);
} catch(PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
