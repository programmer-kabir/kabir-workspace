<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$month = trim($_GET['month'] ?? date('Y-m'));
if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
    $month = date('Y-m');
}

$query = "
    SELECT 
        ag.id AS agreement_id,
        ag.asset_id,
        ag.lessee_name,
        ag.lessee_mobile,
        ag.agreement_type,
        ag.monthly_rent,
        ag.due_day,
        ag.start_date,
        ag.end_date,
        
        a.asset_name,
        a.category,
        a.purchase_price,

        -- Collection Record for this month
        c.id AS collection_id,
        c.amount AS paid_amount,
        c.collection_date,
        c.payment_method,
        c.status AS collection_status,
        c.cash_id,
        c.remarks

    FROM other_asset_agreements ag
    JOIN other_assets a ON a.id = ag.asset_id
    LEFT JOIN other_asset_collections c 
        ON c.agreement_id = ag.id AND c.billing_month = ?
    WHERE (
        c.id IS NOT NULL
        OR (
            ag.status = 'active'
            AND DATE_FORMAT(ag.start_date, '%Y-%m') <= ?
            AND (ag.end_date IS NULL OR DATE_FORMAT(ag.end_date, '%Y-%m') >= ?)
        )
    )
    ORDER BY ag.due_day ASC, a.asset_name ASC
";

$stmt = $mysqli->prepare($query);
if (!$stmt) {
    echo json_encode(["success" => false, "message" => "Query prepare failed: " . $mysqli->error]);
    exit;
}

$stmt->bind_param("sss", $month, $month, $month);
$stmt->execute();
$result = $stmt->get_result();

$items = [];
$total_expected  = 0;
$total_collected = 0;
$paid_count      = 0;
$unpaid_count    = 0;

while ($row = $result->fetch_assoc()) {
    $monthly_rent = floatval($row['monthly_rent']);
    $is_paid      = ($row['collection_status'] === 'Paid');
    $paid_amount  = $is_paid ? floatval($row['paid_amount']) : 0;

    $total_expected  += $monthly_rent;
    $total_collected += $paid_amount;

    if ($is_paid) {
        $paid_count++;
    } else {
        $unpaid_count++;
    }

    $row['monthly_rent'] = $monthly_rent;
    $row['paid_amount']  = $paid_amount;
    $row['is_paid']      = $is_paid;
    $row['billing_month']= $month;

    $items[] = $row;
}
$stmt->close();

$total_due = max(0, $total_expected - $total_collected);

echo json_encode([
    "success" => true,
    "month"   => $month,
    "summary" => [
        "total_expected"  => $total_expected,
        "total_collected" => $total_collected,
        "total_due"       => $total_due,
        "paid_count"      => $paid_count,
        "unpaid_count"    => $unpaid_count,
        "total_agreements"=> count($items),
        "collection_rate" => $total_expected > 0 ? round(($total_collected / $total_expected) * 100, 1) : 0
    ],
    "data" => $items
], JSON_UNESCAPED_UNICODE);
