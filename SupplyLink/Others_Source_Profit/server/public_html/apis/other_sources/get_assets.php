<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$query = "
    SELECT 
        a.id,
        a.asset_name,
        a.category,
        a.share_percentage,
        a.share_units,
        a.business_type,
        a.reg_no,
        a.contact_person,
        a.dividend_frequency,
        a.purchase_price,
        a.selling_price,
        a.sale_profit,
        a.purchase_date,
        a.sale_date,
        a.vendor_info,
        a.buyer_name,
        a.buyer_mobile,
        a.cash_id,
        a.status,
        a.remarks,
        a.created_at,
        
        -- Active Agreement Info
        ag.id AS agreement_id,
        ag.lessee_name,
        ag.lessee_mobile,
        ag.lessee_nid,
        ag.agreement_type,
        ag.monthly_rent,
        ag.due_day,
        ag.start_date AS agreement_start_date,
        ag.security_deposit,
        ag.status AS agreement_status,
        
        -- Financial calculations
        COALESCE(c.total_collected, 0) AS total_collected,
        COALESCE(c.collections_count, 0) AS collections_count,

        -- Pending Edit Request
        (SELECT e.id FROM other_asset_edits e WHERE e.asset_id = a.id AND e.status = 'pending' LIMIT 1) AS pending_edit_id,
        (SELECT e.new_purchase_price FROM other_asset_edits e WHERE e.asset_id = a.id AND e.status = 'pending' LIMIT 1) AS pending_new_price

    FROM other_assets a
    
    LEFT JOIN other_asset_agreements ag 
        ON ag.asset_id = a.id AND ag.status = 'active'
        
    LEFT JOIN (
        SELECT 
            asset_id,
            SUM(amount) AS total_collected,
            COUNT(id) AS collections_count
        FROM other_asset_collections
        WHERE status = 'Paid'
        GROUP BY asset_id
    ) c ON c.asset_id = a.id

    ORDER BY a.id DESC
";

$result = $mysqli->query($query);
if (!$result) {
    echo json_encode([
        "success" => false,
        "message" => "Database query failed: " . $mysqli->error
    ]);
    exit;
}

$assets = [];
$total_investment = 0;
$total_recovery = 0;

while ($row = $result->fetch_assoc()) {
    $price = floatval($row['purchase_price']);
    $collected = floatval($row['total_collected']);
    $remaining = max(0, $price - $collected);
    $recovery_pct = $price > 0 ? min(100, round(($collected / $price) * 100, 1)) : 0;

    $row['purchase_price']     = $price;
    $row['share_percentage']   = ($row['share_percentage'] !== null) ? floatval($row['share_percentage']) : null;
    $row['share_units']        = ($row['share_units'] !== null) ? intval($row['share_units']) : null;
    $row['selling_price']      = ($row['selling_price'] !== null) ? floatval($row['selling_price']) : null;
    $row['sale_profit']        = ($row['sale_profit'] !== null) ? floatval($row['sale_profit']) : null;
    $row['total_collected']    = $collected;
    $row['remaining_capital']  = $remaining;
    $row['recovery_percentage']= $recovery_pct;
    $row['monthly_rent']       = floatval($row['monthly_rent'] ?? 0);
    $row['collections_count']  = intval($row['collections_count'] ?? 0);

    $total_investment += $price;
    $total_recovery   += $collected;

    $assets[] = $row;
}

echo json_encode([
    "success" => true,
    "summary" => [
        "total_assets"     => count($assets),
        "total_investment" => $total_investment,
        "total_recovery"   => $total_recovery,
        "total_remaining"  => max(0, $total_investment - $total_recovery),
        "overall_roi_pct"  => $total_investment > 0 ? round(($total_recovery / $total_investment) * 100, 1) : 0
    ],
    "data" => $assets
], JSON_UNESCAPED_UNICODE);
