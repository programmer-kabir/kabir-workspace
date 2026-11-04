<?php
// server/api/events/update_rsvp.php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'EventDbHelper.php';
require_once 'EventAuthHelper.php';

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

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$eventId    = (int)($input['event_id'] ?? 0);
$rsvpStatus = trim($input['rsvp_status'] ?? 'going');
$guestCount = (int)($input['guest_count'] ?? 0);
$guestNames = trim($input['guest_names'] ?? '');

if (!$eventId) {
    echo json_encode(["status" => "error", "message" => "Event ID is required."]);
    exit;
}

if (!in_array($rsvpStatus, ['going', 'not_going', 'tentative'])) {
    $rsvpStatus = 'going';
}

try {
    $stmt = $db->prepare("INSERT INTO event_participants (event_id, user_id, rsvp_status, guest_count, guest_names)
        VALUES (:eid, :uid, :rsvp, :guests, :names)
        ON DUPLICATE KEY UPDATE 
            rsvp_status = :rsvp,
            guest_count = :guests,
            guest_names = :names,
            updated_at  = NOW()");

    $stmt->execute([
        ':eid'    => $eventId,
        ':uid'    => $user['id'],
        ':rsvp'   => $rsvpStatus,
        ':guests' => max(0, $guestCount),
        ':names'  => $guestNames
    ]);

    echo json_encode([
        "status"  => "success",
        "message" => "RSVP updated successfully!"
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

