<?php
// server/api/events/get_event_details.php
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

$eventId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if (!$eventId) {
    echo json_encode(["status" => "error", "message" => "Event ID is required."]);
    exit;
}

try {
    // 1. Fetch Event
    $stmt = $db->prepare("SELECT e.*, 
                                 u_creator.name AS creator_name,
                                 u_lead.name AS lead_name,
                                 u_lead.phone AS lead_phone
                          FROM team_events e
                          LEFT JOIN users u_creator ON e.created_by = u_creator.id
                          LEFT JOIN users u_lead ON e.lead_user_id = u_lead.id
                          WHERE e.id = :eid LIMIT 1");
    $stmt->execute([':eid' => $eventId]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Event not found."]);
        exit;
    }

    $canManage = EventAuthHelper::canManage($user, $event);

    // 2. Fetch Participants
    $partStmt = $db->prepare(
        "SELECT ep.*, u.name, u.username, u.email, u.phone, u.profile_picture,
                (SELECT COALESCE(SUM(ec.amount), 0) FROM event_contributions ec WHERE ec.event_id = ep.event_id AND ec.user_id = ep.user_id AND ec.status = 'verified') AS total_verified_paid
         FROM event_participants ep
         INNER JOIN users u ON ep.user_id = u.id
         WHERE ep.event_id = :eid
         ORDER BY ep.rsvp_status = 'going' DESC, u.name ASC"
    );
    $partStmt->execute([':eid' => $eventId]);
    $participants = $partStmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Fetch Expenses
    $expStmt = $db->prepare(
        "SELECT ee.*, u.name AS paid_by_name, u_app.name AS approved_by_name
         FROM event_expenses ee
         INNER JOIN users u ON ee.paid_by = u.id
         LEFT JOIN users u_app ON ee.approved_by = u_app.id
         WHERE ee.event_id = :eid
         ORDER BY ee.created_at DESC"
    );
    $expStmt->execute([':eid' => $eventId]);
    $expenses = $expStmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Fetch Contributions
    $conStmt = $db->prepare(
        "SELECT ec.*, u.name AS user_name, u.phone AS user_phone, u_v.name AS verified_by_name
         FROM event_contributions ec
         INNER JOIN users u ON ec.user_id = u.id
         LEFT JOIN users u_v ON ec.verified_by = u_v.id
         WHERE ec.event_id = :eid
         ORDER BY ec.created_at DESC"
    );
    $conStmt->execute([':eid' => $eventId]);
    $contributions = $conStmt->fetchAll(PDO::FETCH_ASSOC);

    // 5. Fetch Media
    $medStmt = $db->prepare(
        "SELECT em.*, u.name AS uploader_name
         FROM event_media em
         INNER JOIN users u ON em.user_id = u.id
         WHERE em.event_id = :eid
         ORDER BY em.created_at DESC"
    );
    $medStmt->execute([':eid' => $eventId]);
    $media = $medStmt->fetchAll(PDO::FETCH_ASSOC);

    // 6. Calculate Real-time Financial Ledger
    $totalCollected = 0.0;
    foreach ($contributions as $c) {
        if ($c['status'] === 'verified') {
            $totalCollected += (float)$c['amount'];
        }
    }

    $totalSpent = 0.0;
    foreach ($expenses as $ex) {
        if ($ex['status'] === 'approved') {
            $totalSpent += (float)$ex['amount'];
        }
    }

    $cashInHand = round($totalCollected - $totalSpent, 2);

    $goingCount = 0;
    $totalGuests = 0;
    foreach ($participants as &$p) {
        $p['total_paid'] = (float)$p['total_verified_paid'];
        if ($p['rsvp_status'] === 'going') {
            $goingCount++;
            $totalGuests += (int)$p['guest_count'];
        }
    }

    $activeHeads = $goingCount + $totalGuests;
    $actualPerHead = $activeHeads > 0 ? round($totalSpent / $activeHeads, 2) : 0.0;

    $summary = [
        "total_collected" => round($totalCollected, 2),
        "total_spent"     => round($totalSpent, 2),
        "cash_in_hand"    => $cashInHand,
        "confirmed_staff" => $goingCount,
        "total_guests"    => $totalGuests,
        "active_heads"    => $activeHeads,
        "actual_per_head" => $actualPerHead
    ];

    echo json_encode([
        "status"        => "success",
        "event"         => $event,
        "summary"       => $summary,
        "participants"  => $participants,
        "expenses"      => $expenses,
        "contributions" => $contributions,
        "media"         => $media,
        "can_manage"    => $canManage,
        "current_user_id"=> $user['id']
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

