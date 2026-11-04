<?php
// server/api/events/get_events.php
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

try {
    $canGlobalManage = EventAuthHelper::canManage($user);

    $query = "SELECT e.*, 
                     u_creator.name AS creator_name,
                     u_lead.name AS lead_name,
                     u_lead.phone AS lead_phone,
                     (SELECT COUNT(*) FROM event_participants ep WHERE ep.event_id = e.id AND ep.rsvp_status = 'going') AS confirmed_count,
                     (SELECT COALESCE(SUM(ec.amount), 0) FROM event_contributions ec WHERE ec.event_id = e.id AND ec.status = 'verified') AS total_collected_live,
                     (SELECT COALESCE(SUM(ee.amount), 0) FROM event_expenses ee WHERE ee.event_id = e.id AND ee.status = 'approved') AS total_spent_live,
                     my_p.rsvp_status AS my_rsvp,
                     my_p.guest_count AS my_guests,
                     my_p.total_paid AS my_paid,
                     my_p.final_share AS my_share,
                     my_p.balance AS my_balance
              FROM team_events e
              LEFT JOIN users u_creator ON e.created_by = u_creator.id
              LEFT JOIN users u_lead ON e.lead_user_id = u_lead.id
              LEFT JOIN event_participants my_p ON my_p.event_id = e.id AND my_p.user_id = :my_uid
              ORDER BY e.event_date DESC, e.id DESC";

    $stmt = $db->prepare($query);
    $stmt->execute([':my_uid' => $user['id']]);
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format numbers and add permissions
    foreach ($events as &$ev) {
        $ev['total_collected']   = (float)$ev['total_collected_live'];
        $ev['total_spent']       = (float)$ev['total_spent_live'];
        $ev['cash_in_hand']      = round($ev['total_collected'] - $ev['total_spent'], 2);
        $ev['confirmed_count']   = (int)$ev['confirmed_count'];
        $ev['my_paid']           = (float)($ev['my_paid'] ?? 0);
        $ev['my_share']          = (float)($ev['my_share'] ?? 0);
        $ev['my_balance']        = (float)($ev['my_balance'] ?? 0);
        $ev['can_manage']        = $canGlobalManage || ((int)$ev['created_by'] === (int)$user['id']) || ((int)$ev['lead_user_id'] === (int)$user['id']);
    }

    echo json_encode([
        "status" => "success",
        "data"   => $events,
        "is_manager" => $canGlobalManage
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>

