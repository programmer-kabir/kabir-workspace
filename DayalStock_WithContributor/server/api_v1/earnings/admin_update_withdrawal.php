<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/check_role.php';
require_once __DIR__ . '/../helper/notification_helper.php';
require_once __DIR__ . '/../helper/email_helper.php';
header("Content-Type: application/json; charset=UTF-8");

try {
    requireRole('admin');

    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    $status = $data['status'] ?? null;
    $reason = $data['rejection_reason'] ?? null;

    if (!$id || !$status) {
        echo json_encode(["success" => false, "message" => "Missing required fields."]);
        exit;
    }

    $mysqli->begin_transaction();

    try {
        $mysqli->query("ALTER TABLE withdraw_requests ADD COLUMN rejection_reason TEXT DEFAULT NULL");
    } catch (Exception $ex) {}

    $stmt = $mysqli->prepare("SELECT author_id, amount, status FROM withdraw_requests WHERE id = ? FOR UPDATE");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $reqRes = $stmt->get_result();
    if ($reqRes->num_rows === 0) {
        $mysqli->rollback();
        echo json_encode(["success" => false, "message" => "Request not found."]);
        exit;
    }
    $req = $reqRes->fetch_assoc();

    if ($req['status'] !== 'pending') {
        $mysqli->rollback();
        echo json_encode(["success" => false, "message" => "Request is already processed."]);
        exit;
    }

    date_default_timezone_set('Asia/Dhaka');
    $processed_at = date('Y-m-d H:i:s');

    $upd = $mysqli->prepare("UPDATE withdraw_requests SET status = ?, rejection_reason = ?, processed_at = ? WHERE id = ?");
    $upd->bind_param("sssi", $status, $reason, $processed_at, $id);
    $upd->execute();

    if ($status === 'rejected') {
        // Refund balance
        $ref = $mysqli->prepare("UPDATE author_wallet SET balance = balance + ? WHERE author_id = ?");
        $ref->bind_param("di", $req['amount'], $req['author_id']);
        $ref->execute();
    } elseif ($status === 'completed') {
        // Add to total_withdrawn (if exists)
        try {
            $mysqli->query("ALTER TABLE author_wallet ADD COLUMN total_withdrawn decimal(10,4) NOT NULL DEFAULT 0.0000");
        } catch (Exception $ex) {}
        
        $add = $mysqli->prepare("UPDATE author_wallet SET total_withdrawn = total_withdrawn + ? WHERE author_id = ?");
        $add->bind_param("di", $req['amount'], $req['author_id']);
        $add->execute();
    }

    // Fetch User Info for Email/Notification
    $stmtUser = $mysqli->prepare("
        SELECT u.id as user_id, u.email, u.full_name 
        FROM authors a
        JOIN users u ON a.user_id = u.id
        WHERE a.id = ?
    ");
    $stmtUser->bind_param("i", $req['author_id']);
    $stmtUser->execute();
    $resUser = $stmtUser->get_result();
    
    if ($row = $resUser->fetch_assoc()) {
        $userId = (int)$row['user_id'];
        $email = $row['email'];
        $fullName = $row['full_name'];
        $adminId = isset($GLOBALS['user']['id']) ? (int)$GLOBALS['user']['id'] : null;
        $amountFmt = '$' . number_format($req['amount'], 2);

        if ($status === 'completed') {
            sendNotification($mysqli, [
                'user_id'     => $userId,
                'sender_id'   => $adminId,
                'sender_type' => 'admin',
                'target_role' => 'user',
                'type'        => 'general',
                'title'       => 'Withdrawal Processed 💸',
                'message'     => 'Your withdrawal request for ' . $amountFmt . ' has been processed.',
                'priority'    => 'normal'
            ]);
            sendEmail($mysqli, $email, $fullName, 'payout_approved', ['amount' => $amountFmt, 'method' => 'selected payout method'], $userId, $adminId, 'Admin');
        } else if ($status === 'rejected') {
            sendNotification($mysqli, [
                'user_id'     => $userId,
                'sender_id'   => $adminId,
                'sender_type' => 'admin',
                'target_role' => 'user',
                'type'        => 'alert',
                'title'       => 'Withdrawal Rejected ⚠️',
                'message'     => 'Your withdrawal request for ' . $amountFmt . ' was rejected. Reason: ' . $reason,
                'priority'    => 'high'
            ]);
            sendEmail($mysqli, $email, $fullName, 'payout_rejected', ['amount' => $amountFmt, 'reason' => $reason], $userId, $adminId, 'Admin');
        }
    }
    $stmtUser->close();

    $mysqli->commit();
    echo json_encode(["success" => true, "message" => "Withdrawal request updated."]);

} catch (Exception $e) {
    if (isset($mysqli)) $mysqli->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
