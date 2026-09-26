<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();
date_default_timezone_set('Asia/Dhaka');

$json_data = json_decode(file_get_contents("php://input"));
$action = isset($_POST['action']) ? $_POST['action'] : (isset($json_data->action) ? $json_data->action : 'get');

function getParam($key, $post, $json) {
    if (isset($post[$key])) return $post[$key];
    if (isset($json->$key)) return $json->$key;
    return null;
}

try {
    if ($action === 'get') {
        // Get comments for a task
        $task_id = getParam('task_id', $_POST, $json_data);
        $task_id = $task_id ? intval($task_id) : 0;
        if (!$task_id) {
            echo json_encode(["status" => "error", "message" => "Task ID required."]);
            exit;
        }

        $query = "SELECT tc.id, tc.task_id, tc.user_id, tc.comment, tc.image,
                         tc.created_at,
                         u.name as user_name, u.profile_picture,
                         (SELECT role FROM user_roles WHERE user_id = u.id LIMIT 1) as user_role
                  FROM task_comments tc
                  INNER JOIN users u ON tc.user_id = u.id
                  WHERE tc.task_id = :task_id
                  ORDER BY tc.created_at ASC";

        $stmt = $db->prepare($query);
        $stmt->execute([':task_id' => $task_id]);

        $comments = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $row['id'] = intval($row['id']);
            $row['user_id'] = intval($row['user_id']);
            $comments[] = $row;
        }

        echo json_encode(["status" => "success", "comments" => $comments]);

    } elseif ($action === 'add') {
        // Add a new comment
        $task_id  = getParam('task_id', $_POST, $json_data);
        $user_id  = getParam('user_id', $_POST, $json_data);
        $comment  = getParam('comment', $_POST, $json_data);
        
        $task_id = $task_id ? intval($task_id) : 0;
        $user_id = $user_id ? intval($user_id) : 0;
        $comment = $comment ? trim($comment) : '';

        if (!$task_id || !$user_id) {
            echo json_encode(["status" => "error", "message" => "Task ID and User ID are required."]);
            exit;
        }

        $imagePath = null;

        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../../uploads/comments/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $fileTmpPath = $_FILES['image']['tmp_name'];
            $fileType = mime_content_type($fileTmpPath);
            $fileName = uniqid() . '_' . time() . '.webp';
            $dest_path = $uploadDir . $fileName;

            $image = null;
            if ($fileType == 'image/jpeg' || $fileType == 'image/jpg') {
                $image = imagecreatefromjpeg($fileTmpPath);
            } elseif ($fileType == 'image/png') {
                $image = imagecreatefrompng($fileTmpPath);
            } elseif ($fileType == 'image/gif') {
                $image = imagecreatefromgif($fileTmpPath);
            } elseif ($fileType == 'image/webp') {
                $image = imagecreatefromwebp($fileTmpPath);
            }

            if ($image !== null) {
                imagewebp($image, $dest_path, 80);
                imagedestroy($image);
                $imagePath = 'uploads/comments/' . $fileName;
            }
        }

        if (!$comment && !$imagePath) {
            echo json_encode(["status" => "error", "message" => "Comment text or image is required."]);
            exit;
        }

        $insert = $db->prepare("INSERT INTO task_comments (task_id, user_id, comment, image, created_at) VALUES (:task_id, :user_id, :comment, :image, NOW())");
        $insert->execute([
            ':task_id' => $task_id,
            ':user_id' => $user_id,
            ':comment' => $comment,
            ':image'   => $imagePath
        ]);

        $new_id = $db->lastInsertId();

        // Send notification to task participants
        require_once '../notifications/notification_helper.php';
        // Get user name for comment title
        $u_stmt = $db->prepare("SELECT name FROM users WHERE id = :uid LIMIT 1");
        $u_stmt->execute([':uid' => $user_id]);
        $commenter_name = $u_stmt->fetchColumn() ?: 'Someone';

        NotificationHelper::sendToTaskParticipants(
            $db,
            $task_id,
            $user_id,
            "New Comment by {$commenter_name}",
            mb_strimwidth($comment ?: "Sent an image attachment", 0, 100, "..."),
            "comment_added",
            "staff",
            "/tasks",
            "normal",
            ["task_id" => $task_id, "comment_id" => $new_id]
        );

        // Fetch the newly created comment with user info
        $fetch = $db->prepare("SELECT tc.id, tc.task_id, tc.user_id, tc.comment, tc.image,
                                       tc.created_at,
                                       u.name as user_name, u.profile_picture,
                                       (SELECT role FROM user_roles WHERE user_id = u.id LIMIT 1) as user_role
                               FROM task_comments tc
                               INNER JOIN users u ON tc.user_id = u.id
                               WHERE tc.id = :id");
        $fetch->execute([':id' => $new_id]);
        $new_comment = $fetch->fetch(PDO::FETCH_ASSOC);
        $new_comment['id'] = intval($new_comment['id']);

        // Trigger Pusher event for live comments
        require_once __DIR__ . '/../../config/PusherHelper.php';
        $pusher = new PusherHelper();
        $pusher->trigger('task-comments-' . $task_id, 'new-comment', $new_comment);

        echo json_encode(["status" => "success", "comment" => $new_comment]);

    } elseif ($action === 'update') {
        // Edit a comment (only by the comment author)
        $comment_id = getParam('comment_id', $_POST, $json_data);
        $user_id    = getParam('user_id', $_POST, $json_data);
        $comment    = getParam('comment', $_POST, $json_data);
        
        $comment_id = $comment_id ? intval($comment_id) : 0;
        $user_id = $user_id ? intval($user_id) : 0;
        $comment = $comment ? trim($comment) : '';

        if (!$comment_id || !$user_id) {
            echo json_encode(["status" => "error", "message" => "Comment ID, and User ID are required."]);
            exit;
        }

        // Only the original author can edit
        $check = $db->prepare("SELECT id FROM task_comments WHERE id = :id AND user_id = :user_id");
        $check->execute([':id' => $comment_id, ':user_id' => $user_id]);

        if ($check->rowCount() === 0) {
            echo json_encode(["status" => "error", "message" => "Not authorized to edit this comment."]);
            exit;
        }

        $update = $db->prepare("UPDATE task_comments SET comment = :comment WHERE id = :id");
        $update->execute([':comment' => $comment, ':id' => $comment_id]);

        echo json_encode(["status" => "success", "message" => "Comment updated."]);

    } elseif ($action === 'delete') {
        // Delete a comment (only by the comment author)
        $comment_id = getParam('comment_id', $_POST, $json_data);
        $user_id    = getParam('user_id', $_POST, $json_data);
        
        $comment_id = $comment_id ? intval($comment_id) : 0;
        $user_id = $user_id ? intval($user_id) : 0;

        if (!$comment_id || !$user_id) {
            echo json_encode(["status" => "error", "message" => "Comment ID and User ID required."]);
            exit;
        }

        // Verify ownership OR admin role
        $check = $db->prepare("SELECT tc.id FROM task_comments tc 
                                LEFT JOIN user_roles ur ON ur.user_id = :user_id AND ur.role = 'admin'
                                WHERE tc.id = :comment_id AND (tc.user_id = :user_id2 OR ur.user_id IS NOT NULL)");
        $check->execute([':comment_id' => $comment_id, ':user_id' => $user_id, ':user_id2' => $user_id]);

        if ($check->rowCount() === 0) {
            echo json_encode(["status" => "error", "message" => "Not authorized to delete this comment."]);
            exit;
        }

        $delete = $db->prepare("DELETE FROM task_comments WHERE id = :id");
        $delete->execute([':id' => $comment_id]);

        echo json_encode(["status" => "success", "message" => "Comment deleted."]);
    }

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
