<?php
// server/api/events/create_event.php
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

if (!EventAuthHelper::canManage($user)) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Permission denied. Only Developer or Admin can create events."]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$title             = trim($input['title'] ?? '');
$eventType         = trim($input['event_type'] ?? 'feast');
$eventDate         = trim($input['event_date'] ?? date('Y-m-d'));
$location          = trim($input['location'] ?? '');
$description       = trim($input['description'] ?? '');
$bannerImage       = trim($input['banner_image'] ?? ($input['image_url'] ?? ''));
$estimatedBudget   = (float)($input['estimated_budget'] ?? 0);
$targetPerHead     = (float)($input['target_per_head'] ?? 0);
$collectionNumber  = trim($input['collection_number'] ?? '');
$collectionNote    = trim($input['collection_note'] ?? '');
$leadUserId        = !empty($input['lead_user_id']) ? (int)$input['lead_user_id'] : $user['id'];
$allowGuest        = isset($input['allow_guest']) ? (int)$input['allow_guest'] : 1;
$guestFee          = (float)($input['guest_fee'] ?? $targetPerHead);

if (empty($title)) {
    echo json_encode(["status" => "error", "message" => "Event title is required."]);
    exit;
}

try {
    $stmt = $db->prepare("INSERT INTO team_events (
        title, event_type, event_date, location, description, banner_image,
        estimated_budget, target_per_head, collection_number, collection_note, 
        status, created_by, lead_user_id, allow_guest, guest_fee
    ) VALUES (
        :title, :event_type, :event_date, :location, :description, :banner_image,
        :estimated_budget, :target_per_head, :collection_number, :collection_note,
        'active', :created_by, :lead_user_id, :allow_guest, :guest_fee
    )");

    $stmt->execute([
        ':title'            => $title,
        ':event_type'       => $eventType,
        ':event_date'       => $eventDate,
        ':location'         => $location,
        ':description'      => $description,
        ':banner_image'     => $bannerImage ?: null,
        ':estimated_budget' => $estimatedBudget,
        ':target_per_head'  => $targetPerHead,
        ':collection_number'=> $collectionNumber,
        ':collection_note'  => $collectionNote,
        ':created_by'       => $user['id'],
        ':lead_user_id'     => $leadUserId,
        ':allow_guest'      => $allowGuest,
        ':guest_fee'        => $guestFee
    ]);

    $eventId = (int)$db->lastInsertId();

    // 1. Always mark the creator / lead as 'going'
    $creatorStmt = $db->prepare("INSERT INTO event_participants (event_id, user_id, rsvp_status) VALUES (:eid, :uid, 'going')");
    $creatorStmt->execute([':eid' => $eventId, ':uid' => $user['id']]);
    if ($leadUserId && $leadUserId !== (int)$user['id']) {
        $creatorStmt->execute([':eid' => $eventId, ':uid' => $leadUserId]);
    }

    // 2. Handle invitations (all active staff OR selective)
    $inviteScope = trim($input['invite_scope'] ?? 'all'); // 'all', 'selective', 'none'
    $targetUids = [];

    if ($inviteScope === 'all') {
        $staffQuery = $db->query("SELECT u.id FROM users u WHERE u.status = 'active'");
        $targetUids = $staffQuery->fetchAll(PDO::FETCH_COLUMN);
    } elseif ($inviteScope === 'selective' && !empty($input['invited_user_ids']) && is_array($input['invited_user_ids'])) {
        $targetUids = $input['invited_user_ids'];
    }

    $partStmt = $db->prepare("INSERT IGNORE INTO event_participants (event_id, user_id, rsvp_status) VALUES (:eid, :uid, 'invited')");
    foreach ($targetUids as $sUid) {
        $sUid = (int)$sUid;
        if ($sUid <= 0 || $sUid === (int)$user['id'] || $sUid === $leadUserId) continue;

        $partStmt->execute([':eid' => $eventId, ':uid' => $sUid]);

        // Send Notification
        NotificationHelper::sendToUser(
            $db,
            $sUid,
            $user['id'],
            "Team Event Invitation: {$title} 🎉",
            "You have been invited to {$title} on {$eventDate}! Please Accept or Decline your invitation.",
            'event_invite',
            'staff',
            '/events',
            'high',
            ['event_id' => $eventId]
        );
    }

    echo json_encode([
        "status"   => "success",
        "message"  => "Team event created successfully with invitations sent!",
        "event_id" => $eventId
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

