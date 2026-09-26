<?php
// api/run_draw.php - Secure Transactional Digital Lottery Execution API
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/auth.php';

if (!isAdmin()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access. Admin role required.']);
    exit();
}

$db = getDBConnection();

$monthMapping = [
    1  => ['name' => 'September 2026', 'date' => '2026-09-30'],
    2  => ['name' => 'October 2026',   'date' => '2026-10-31'],
    3  => ['name' => 'November 2026',  'date' => '2026-11-30'],
    4  => ['name' => 'December 2026',  'date' => '2026-12-31'],
    5  => ['name' => 'January 2027',   'date' => '2027-01-31'],
    6  => ['name' => 'February 2027',  'date' => '2027-02-28'],
    7  => ['name' => 'March 2027',     'date' => '2027-03-31'],
    8  => ['name' => 'April 2027',     'date' => '2027-04-30'],
    9  => ['name' => 'May 2027',       'date' => '2027-05-31'],
    10 => ['name' => 'June 2027',      'date' => '2027-06-30']
];

try {
    $db->beginTransaction();

    // 1. Determine next month cycle
    $stmtCycle = $db->query("SELECT COALESCE(MAX(month_cycle), 0) FROM monthly_payouts");
    $currentMaxCycle = intval($stmtCycle->fetchColumn());
    $nextCycle = $currentMaxCycle + 1;

    if ($nextCycle > 10) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'All 10 monthly payouts for this 10-month cycle have already been completed!']);
        exit();
    }

    if (!isset($monthMapping[$nextCycle])) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Invalid month cycle mapping.']);
        exit();
    }

    $monthInfo = $monthMapping[$nextCycle];

    // 2. Fetch eligible candidates (is_payout_taken = 0) with SELECT ... FOR UPDATE
    $stmtEligible = $db->query("SELECT id, name, phone, role, avatar FROM members WHERE is_payout_taken = 0 FOR UPDATE");
    $eligibleCandidates = $stmtEligible->fetchAll();

    if (empty($eligibleCandidates)) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'No eligible members remaining for lottery draw. All members have received their payouts.']);
        exit();
    }

    // 3. Select random winner using cryptographically secure random_int()
    $candidateCount = count($eligibleCandidates);
    $selectedIndex = random_int(0, $candidateCount - 1);
    $winner = $eligibleCandidates[$selectedIndex];

    // 4. Update winner status in members table
    $stmtUpdate = $db->prepare("
        UPDATE members 
        SET is_payout_taken = 1, payout_month = :payout_month 
        WHERE id = :id
    ");
    $stmtUpdate->execute([
        'payout_month' => $monthInfo['name'],
        'id'           => $winner['id']
    ]);

    // 5. Insert record into monthly_payouts table
    $stmtInsert = $db->prepare("
        INSERT INTO monthly_payouts (month_cycle, month_name, recipient_member_id, amount_paid, distribution_date, selection_type)
        VALUES (:month_cycle, :month_name, :recipient_member_id, 300000.00, :distribution_date, 'lottery')
    ");
    $stmtInsert->execute([
        'month_cycle'         => $nextCycle,
        'month_name'          => $monthInfo['name'],
        'recipient_member_id' => $winner['id'],
        'distribution_date'   => $monthInfo['date']
    ]);

    $db->commit();

    echo json_encode([
        'success' => true,
        'message' => "Congratulations! {$winner['name']} won the Month {$nextCycle} Lottery Draw!",
        'cycle_number' => $nextCycle,
        'winner' => [
            'id'                => $winner['id'],
            'name'              => $winner['name'],
            'phone'             => $winner['phone'],
            'avatar'            => $winner['avatar'],
            'payout_month'      => $monthInfo['name'],
            'distribution_date' => $monthInfo['date'],
            'amount_paid'       => 300000.00
        ]
    ]);
    exit();

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'Draw Error: ' . $e->getMessage()]);
    exit();
}
