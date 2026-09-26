<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

// Handle both JSON and FormData (for file uploads)
$chat_id = null;
$sender_id = null;
$message = null;
$file_path = null;
$file_name = null;
$reply_to_id = null;

if (!empty($_POST)) {
    $chat_id = isset($_POST['chat_id']) ? intval($_POST['chat_id']) : null;
    $sender_id = isset($_POST['sender_id']) ? intval($_POST['sender_id']) : null;
    $message = isset($_POST['message']) ? trim($_POST['message']) : null;
    $reply_to_id = isset($_POST['reply_to_id']) ? intval($_POST['reply_to_id']) : null;
} else {
    $data = json_decode(file_get_contents("php://input"));
    if ($data) {
        $chat_id = isset($data->chat_id) ? intval($data->chat_id) : null;
        $sender_id = isset($data->sender_id) ? intval($data->sender_id) : null;
        $message = isset($data->message) ? trim($data->message) : null;
        $reply_to_id = isset($data->reply_to_id) ? intval($data->reply_to_id) : null;
    }
}

if (!$chat_id || !$sender_id) {
    echo json_encode(["status" => "error", "message" => "Chat ID and Sender ID required."]);
    exit;
}

// Handle file upload if present
if (isset($_FILES['file'])) {
    $file = $_FILES['file'];
    $original_name = basename($file['name']);
    $file_ext = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));
    
    // Allowed extensions
    $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'txt'];
    
    if (in_array($file_ext, $allowed_extensions)) {
        // Target upload directory
        $upload_dir = '../../uploads/chat/';
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        
        // Generate unique filename
        $new_filename = uniqid('chat_', true) . '.' . $file_ext;
        $target_file = $upload_dir . $new_filename;
        
        if (move_uploaded_file($file['tmp_name'], $target_file)) {
            $file_path = 'uploads/chat/' . $new_filename;
            $file_name = $original_name;
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to upload file."]);
            exit;
        }
    } else {
        echo json_encode(["status" => "error", "message" => "File type not allowed."]);
        exit;
    }
}

// Make sure we have either message text or a file
if (empty($message) && empty($file_path)) {
    echo json_encode(["status" => "error", "message" => "Cannot send an empty message."]);
    exit;
}

try {
    // Check if sender is active
    $check_active = $db->prepare("SELECT status FROM chat_participants WHERE chat_id = :chat_id AND user_id = :sender_id LIMIT 1");
    $check_active->execute([':chat_id' => $chat_id, ':sender_id' => $sender_id]);
    $participant_row = $check_active->fetch(PDO::FETCH_ASSOC);
    if (!$participant_row || $participant_row['status'] === 'removed') {
        echo json_encode(["status" => "error", "message" => "You are no longer a participant in this group and cannot send messages."]);
        exit;
    }

    $db->beginTransaction();

    // 1. Insert message
    $query = "INSERT INTO chat_messages (chat_id, sender_id, message, file_path, file_name, reply_to_id) 
              VALUES (:chat_id, :sender_id, :message, :file_path, :file_name, :reply_to_id)";
    $stmt = $db->prepare($query);
    $stmt->execute([
        ':chat_id' => $chat_id,
        ':sender_id' => $sender_id,
        ':message' => $message,
        ':file_path' => $file_path,
        ':file_name' => $file_name,
        ':reply_to_id' => $reply_to_id
    ]);
    
    $message_id = intval($db->lastInsertId());

    // 2. Automatically mark this message as read for the sender
    $update_read = "UPDATE chat_participants 
                    SET last_read_message_id = :message_id 
                    WHERE chat_id = :chat_id AND user_id = :sender_id";
    $up_stmt = $db->prepare($update_read);
    $up_stmt->execute([
        ':message_id' => $message_id,
        ':chat_id' => $chat_id,
        ':sender_id' => $sender_id
    ]);

    // 3. Initialize receipts for all other participants (WhatsApp Style)
    $part_stmt = $db->prepare("SELECT user_id FROM chat_participants WHERE chat_id = :chat_id AND user_id != :sender_id");
    $part_stmt->execute([':chat_id' => $chat_id, ':sender_id' => $sender_id]);
    $participants = $part_stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($participants) > 0) {
        $receipt_query = "INSERT INTO chat_message_receipts (message_id, user_id) VALUES ";
        $receipt_values = [];
        $receipt_params = [];
        foreach ($participants as $index => $participant) {
            $receipt_values[] = "(:msg_id_{$index}, :usr_id_{$index})";
            $receipt_params[":msg_id_{$index}"] = $message_id;
            $receipt_params[":usr_id_{$index}"] = $participant['user_id'];
        }
        $receipt_query .= implode(", ", $receipt_values);
        $receipt_stmt = $db->prepare($receipt_query);
        $receipt_stmt->execute($receipt_params);
    }

    $db->commit();

    require_once '../../config/PusherHelper.php';
    $pusher = new PusherHelper();
    $pusher->trigger('chat-' . $chat_id, 'new-message', [
        'message_id' => $message_id,
        'sender_id' => $sender_id,
        'message' => $message,
        'file_path' => $file_path,
        'file_name' => $file_name,
        'reply_to_id' => $reply_to_id,
        'created_at' => date('Y-m-d H:i:s')
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "Message sent successfully.",
        "message_id" => $message_id,
        "file_path" => $file_path,
        "file_name" => $file_name
    ]);

} catch (PDOException $e) {
    $db->rollBack();
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
