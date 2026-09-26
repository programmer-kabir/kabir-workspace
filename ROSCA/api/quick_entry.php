<?php
// api/quick_entry.php - AJAX API for Cashier Daily Collection Updates (Single Member Status Update)
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/auth.php';

if (!isAdmin()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access. Admin role required.']);
    exit();
}

$db = getDBConnection();
$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
$action = $input['action'] ?? '';
$collectedBy = $_SESSION['user_id'];

try {
    if ($action === 'single') {
        $memberId       = intval($input['member_id'] ?? 0);
        $collectionDate = trim($input['collection_date'] ?? date('Y-m-d'));
        $status         = ($input['status'] ?? '') === 'paid' ? 'paid' : 'due';
        $amount         = floatval($input['amount'] ?? 1000.00);
        $notes          = trim($input['notes'] ?? '');

        if ($memberId <= 0 || empty($collectionDate) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $collectionDate)) {
            echo json_encode(['success' => false, 'message' => 'Invalid parameters or date format.']);
            exit();
        }

        $stmt = $db->prepare("
            INSERT INTO daily_collections (member_id, collection_date, amount, status, collected_by, notes)
            VALUES (:member_id, :collection_date, :amount, :status, :collected_by, :notes)
            ON DUPLICATE KEY UPDATE
                amount = VALUES(amount),
                status = VALUES(status),
                collected_by = VALUES(collected_by),
                notes = VALUES(notes)
        ");

        $stmt->execute([
            'member_id'       => $memberId,
            'collection_date' => $collectionDate,
            'amount'          => $amount,
            'status'          => $status,
            'collected_by'    => $collectedBy,
            'notes'           => $notes
        ]);

        echo json_encode([
            'success' => true,
            'message' => "Collection status updated successfully.",
            'member_id' => $memberId,
            'status' => $status
        ]);
        exit();

    } else {
        echo json_encode(['success' => false, 'message' => 'Unknown action.']);
        exit();
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    exit();
}
