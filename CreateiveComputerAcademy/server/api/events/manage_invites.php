<?php
// server/api/events/manage_invites.php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'EventDbHelper.php';
require_once 'EventAuthHelper.php';
require_once '../notifications/notification_helper.php';

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();
EventDbHelper::ensureSchema($db);

$user = EventAuthHelper::getAuthenticatedUser($db);
if (!$user) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Authentication required."]);
    exit;
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
if (empty($action) && !empty($input['action'])) {
    $action = $input['action'];
}

try {
    switch ($action) {
        // 1. Get all active staff members with their invite status for a specific event
        case 'get_event_staff_status':
            $eventId = (int)($_GET['event_id'] ?? ($input['event_id'] ?? 0));
            if (!$eventId) {
                echo json_encode(["status" => "error", "message" => "Event ID is required."]);
                exit;
            }

            // Check manage permission
            $evStmt = $db->prepare("SELECT * FROM team_events WHERE id = :eid LIMIT 1");
            $evStmt->execute([':eid' => $eventId]);
            $event = $evStmt->fetch(PDO::FETCH_ASSOC);
            if (!$event) {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Event not found."]);
                exit;
            }

            if (!EventAuthHelper::canManage($user, $event)) {
                http_response_code(403);
                echo json_encode(["status" => "error", "message" => "Permission denied."]);
                exit;
            }

            $query = "SELECT u.id, u.name, u.email, u.phone, u.profile_picture,
                             COALESCE(e.designation, 'Staff Member') as designation,
                             COALESCE(e.employee_code, '') as employee_code,
                             ep.id as participant_id,
                             ep.rsvp_status,
                             ep.total_paid,
                             ep.guest_count,
                             CASE WHEN ep.id IS NOT NULL THEN 1 ELSE 0 END as is_invited
                      FROM users u
                      LEFT JOIN employees e ON u.id = e.user_id
                      LEFT JOIN event_participants ep ON ep.user_id = u.id AND ep.event_id = :eid
                      WHERE u.status = 'active'
                      ORDER BY is_invited DESC, u.name ASC";

            $stmt = $db->prepare($query);
            $stmt->execute([':eid' => $eventId]);
            $staffList = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                "status" => "success",
                "data"   => $staffList
            ]);
            break;

        // 2. Invite one or multiple staff members
        case 'invite_staff':
            $eventId = (int)($input['event_id'] ?? 0);
            $userIds = $input['user_ids'] ?? [];
            if (is_numeric($userIds)) {
                $userIds = [(int)$userIds];
            }

            if (!$eventId || empty($userIds) || !is_array($userIds)) {
                echo json_encode(["status" => "error", "message" => "Event ID and valid user IDs are required."]);
                exit;
            }

            $evStmt = $db->prepare("SELECT * FROM team_events WHERE id = :eid LIMIT 1");
            $evStmt->execute([':eid' => $eventId]);
            $event = $evStmt->fetch(PDO::FETCH_ASSOC);
            if (!$event) {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Event not found."]);
                exit;
            }

            if (!EventAuthHelper::canManage($user, $event)) {
                http_response_code(403);
                echo json_encode(["status" => "error", "message" => "Permission denied."]);
                exit;
            }

            $partStmt = $db->prepare("INSERT INTO event_participants (event_id, user_id, rsvp_status) 
                                      VALUES (:eid, :uid, 'invited')
                                      ON DUPLICATE KEY UPDATE 
                                          rsvp_status = IF(rsvp_status = 'not_going', 'invited', rsvp_status),
                                          updated_at = NOW()");

            $invitedCount = 0;
            foreach ($userIds as $uid) {
                $uid = (int)$uid;
                if ($uid <= 0) continue;

                $partStmt->execute([':eid' => $eventId, ':uid' => $uid]);
                $invitedCount++;

                // Trigger in-app & pusher notification
                NotificationHelper::sendToUser(
                    $db,
                    $uid,
                    $user['id'],
                    "Team Event Invitation: {$event['title']} 🎉",
                    "You have been invited to {$event['title']} ({$event['event_date']})! Please Accept or Decline your invitation.",
                    'event_invite',
                    'staff',
                    '/events',
                    'high',
                    ['event_id' => $eventId]
                );
            }

            echo json_encode([
                "status"  => "success",
                "message" => "Successfully sent {$invitedCount} invitation(s)!"
            ]);
            break;

        // 3. Uninvite / Remove a staff member from event
        case 'uninvite_staff':
            $eventId = (int)($input['event_id'] ?? 0);
            $targetUserId = (int)($input['user_id'] ?? 0);

            if (!$eventId || !$targetUserId) {
                echo json_encode(["status" => "error", "message" => "Event ID and User ID are required."]);
                exit;
            }

            $evStmt = $db->prepare("SELECT * FROM team_events WHERE id = :eid LIMIT 1");
            $evStmt->execute([':eid' => $eventId]);
            $event = $evStmt->fetch(PDO::FETCH_ASSOC);
            if (!$event || !EventAuthHelper::canManage($user, $event)) {
                http_response_code(403);
                echo json_encode(["status" => "error", "message" => "Permission denied."]);
                exit;
            }

            // Check if user has already paid contributions
            $conStmt = $db->prepare("SELECT COUNT(*) FROM event_contributions WHERE event_id = :eid AND user_id = :uid AND status = 'verified'");
            $conStmt->execute([':eid' => $eventId, ':uid' => $targetUserId]);
            if ((int)$conStmt->fetchColumn() > 0) {
                echo json_encode(["status" => "error", "message" => "Cannot uninvite a member who has already contributed money. Settle their payment first."]);
                exit;
            }

            $delStmt = $db->prepare("DELETE FROM event_participants WHERE event_id = :eid AND user_id = :uid");
            $delStmt->execute([':eid' => $eventId, ':uid' => $targetUserId]);

            echo json_encode([
                "status"  => "success",
                "message" => "Staff member removed from this event."
            ]);
            break;

        default:
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Invalid action specified."]);
            break;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

