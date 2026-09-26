<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helper/email_helper.php';

header("Content-Type: application/json; charset=UTF-8");

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

try {
    // Get JSON POST body
    $data = json_decode(file_get_contents("php://input"));

    if (!$data) {
        throw new Exception("Invalid request data");
    }

    $fullName = isset($data->fullName) ? trim($data->fullName) : '';
    $email = isset($data->email) ? trim($data->email) : '';
    $username = isset($data->username) ? trim($data->username) : '';
    $portfolioUrl = isset($data->portfolio) ? trim($data->portfolio) : '';
    $contentType = isset($data->contentType) ? trim($data->contentType) : '';
    $motivation = isset($data->motivation) ? trim($data->motivation) : '';

    if (empty($portfolioUrl) || empty($contentType) || empty($motivation)) {
        echo json_encode(["success" => false, "message" => "Portfolio, content type, and motivation are required"]);
        exit();
    }

    // 1. Check if the user is already a contributor (author) using their email
    $authorCheckSql = "
        SELECT authors.id 
        FROM authors 
        INNER JOIN users ON authors.user_id = users.id 
        WHERE users.email = ?
    ";
    $stmtAuthor = $mysqli->prepare($authorCheckSql);
    if (!$stmtAuthor) throw new Exception($mysqli->error);
    
    $stmtAuthor->bind_param("s", $email);
    $stmtAuthor->execute();
    $stmtAuthor->store_result();
    
    if ($stmtAuthor->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "You already have a contributor account with this email."]);
        $stmtAuthor->close();
        exit();
    }
    $stmtAuthor->close();


    // 4. (Optional) Check if the user has already submitted a pending application
    $appCheckSql = "SELECT id FROM contributor_applications WHERE email = ? AND status = 'pending'";
    $stmtApp = $mysqli->prepare($appCheckSql);
    if (!$stmtApp) throw new Exception($mysqli->error);

    $stmtApp->bind_param("s", $email);
    $stmtApp->execute();
    $stmtApp->store_result();
    
    if ($stmtApp->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "You already have a pending application. Please wait for our team to review it."]);
        $stmtApp->close();
        exit();
    }
    $stmtApp->close();

    // 5. If all checks pass, Insert the application into the database
    $insertSql = "
        INSERT INTO contributor_applications 
        (full_name, email, portfolio_url, content_type, motivation, status) 
        VALUES (?, ?, ?, ?, ?, 'pending')
    ";
    
    $stmtInsert = $mysqli->prepare($insertSql);
    if (!$stmtInsert) throw new Exception($mysqli->error);

    $stmtInsert->bind_param("sssss", $fullName, $email, $portfolioUrl, $contentType, $motivation);
    
    if ($stmtInsert->execute()) {
        
        // 6. Get user_id from email to use in notification
        $user_id = 0;
        $stmtUid = $mysqli->prepare("SELECT id FROM users WHERE email = ?");
        if ($stmtUid) {
            $stmtUid->bind_param("s", $email);
            $stmtUid->execute();
            $resUid = $stmtUid->get_result();
            if ($rowUid = $resUid->fetch_assoc()) {
                $user_id = $rowUid['id'];
            }
            $stmtUid->close();
        }

        // Notify Admin — user_id = sender (এই user), sender_id = sender user id, sender_type = 'user', target_role = 'admin'
        $notif_sql = "
            INSERT INTO notifications (user_id, sender_id, sender_type, target_role, type, title, message, link, priority) 
            VALUES ($user_id, $user_id, 'user', 'admin', 'new_application', 'Action Required: New Contributor Application', 'Applicant $fullName has submitted their portfolio for review. Please evaluate their application to join the Dayal Stock contributor network.', '/admin/applications', 'normal')
        ";
        $mysqli->query($notif_sql);

        // Send email to applicant using email helper
        sendEmail(
            $mysqli,
            $email,
            $fullName,
            'contributor_application_received',
            [],
            $user_id,
            null,
            null
        );


        echo json_encode([
            "success" => true,
            "message" => "Application submitted successfully! Our team will review it soon."
        ]);
    } else {
        throw new Exception($stmtInsert->error);
    }
    
    $stmtInsert->close();

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Failed to submit application",
        "error" => $e->getMessage()
    ]);
}

$mysqli->close();
