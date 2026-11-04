<?php
// server/api/events/settle_event.php
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

if (!EventAuthHelper::canManage($user)) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Permission denied. Only Developer or Admin can settle events."]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$eventId   = (int)($input['event_id'] ?? 0);
$markClose = isset($input['mark_closed']) ? (bool)$input['mark_closed'] : false;

if (!$eventId) {
    echo json_encode(["status" => "error", "message" => "Event ID is required."]);
    exit;
}

try {
    // 1. Calculate Total Approved Expenses
    $expQuery = $db->prepare("SELECT COALESCE(SUM(amount), 0) AS total_spent FROM event_expenses WHERE event_id = :eid AND status = 'approved'");
    $expQuery->execute([':eid' => $eventId]);
    $totalSpent = (float)$expQuery->fetchColumn();

    // 2. Fetch Confirmed Participants
    $partQuery = $db->prepare(
        "SELECT ep.id, ep.user_id, ep.guest_count,
                (SELECT COALESCE(SUM(ec.amount), 0) FROM event_contributions ec WHERE ec.event_id = ep.event_id AND ec.user_id = ep.user_id AND ec.status = 'verified') AS total_paid
         FROM event_participants ep
         WHERE ep.event_id = :eid AND ep.rsvp_status = 'going'"
    );
    $partQuery->execute([':eid' => $eventId]);
    $goingList = $partQuery->fetchAll(PDO::FETCH_ASSOC);

    $totalGoingStaff = count($goingList);
    $totalGuests = 0;
    foreach ($goingList as $g) {
        $totalGuests += (int)$g['guest_count'];
    }

    $activeHeads = $totalGoingStaff + $totalGuests;
    if ($activeHeads <= 0) {
        echo json_encode(["status" => "error", "message" => "Cannot settle: No confirmed participants found."]);
        exit;
    }

    $actualPerHead = round($totalSpent / $activeHeads, 2);

    // 3. Update each participant's share and balance
    $updPart = $db->prepare("UPDATE event_participants 
        SET total_paid  = :paid,
            final_share = :share,
            balance     = :bal,
            settled_at  = NOW()
        WHERE id = :pid");

    foreach ($goingList as $item) {
        $headCount   = 1 + (int)$item['guest_count'];
        $finalShare  = round($actualPerHead * $headCount, 2);
        $totalPaid   = (float)$item['total_paid'];
        $balance     = round($totalPaid - $finalShare, 2);

        $updPart->execute([
            ':paid'  => $totalPaid,
            ':share' => $finalShare,
            ':bal'   => $balance,
            ':pid'   => $item['id']
        ]);
    }

    // 4. Update team_events table
    $newStatus = $markClose ? 'completed' : 'settling';
    $updEvent = $db->prepare("UPDATE team_events 
        SET total_spent      = :spent,
            settled_per_head = :per_head,
            settled_at       = NOW(),
            status           = :st
        WHERE id = :eid");
    $updEvent->execute([
        ':spent'    => $totalSpent,
        ':per_head' => $actualPerHead,
        ':st'       => $newStatus,
        ':eid'      => $eventId
    ]);

    echo json_encode([
        "status"          => "success",
        "message"         => "Event financial settlement calculated successfully!",
        "total_spent"     => $totalSpent,
        "active_heads"    => $activeHeads,
        "settled_per_head"=> $actualPerHead,
        "event_status"    => $newStatus
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

