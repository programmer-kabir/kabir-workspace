<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "error" => "Invalid request method"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

$edit_id     = (int)($input["edit_id"] ?? 0);
$action      = trim($input["action"] ?? ""); // 'approved' | 'rejected'
$reviewer_id = (int)($input["reviewer_id"] ?? 0);
$review_note = trim($input["review_note"] ?? "");

if ($edit_id <= 0 || !in_array($action, ["approved", "rejected"]) || $reviewer_id <= 0) {
    echo json_encode(["success" => false, "error" => "সঠিক প্যারামিটার দিন"]);
    exit;
}

// 1. Fetch Edit Request
$stmt = $mysqli->prepare("
    SELECT * 
    FROM other_asset_edits 
    WHERE id = ? 
    LIMIT 1
");

if (!$stmt) {
    echo json_encode(["success" => false, "error" => "DB error: " . $mysqli->error]);
    exit;
}

$stmt->bind_param("i", $edit_id);
$stmt->execute();
$edit = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$edit) {
    echo json_encode(["success" => false, "error" => "অনুরোধটি পাওয়া যায়নি"]);
    exit;
}

if ($edit["status"] !== "pending") {
    echo json_encode([
        "success" => false, 
        "error" => "এই অনুরোধটি ইতিপূর্বেই " . ($edit["status"] === "approved" ? "অনুমোদিত" : "বাতিল") . " হয়েছে।"
    ]);
    exit;
}

// 2. Fetch Reviewer Name
$reviewerName = "অ্যাডমিন/ডেভেলপার";
$stmtRev = $mysqli->prepare("SELECT name FROM users WHERE id = ? LIMIT 1");
if ($stmtRev) {
    $stmtRev->bind_param("i", $reviewer_id);
    $stmtRev->execute();
    $resRev = $stmtRev->get_result()->fetch_assoc();
    if ($resRev && !empty($resRev["name"])) {
        $reviewerName = $resRev["name"];
    }
    $stmtRev->close();
}

$asset_id               = (int)$edit["asset_id"];
$cash_id                = !empty($edit["cash_id"]) ? (int)$edit["cash_id"] : null;
$old_price              = (float)$edit["old_purchase_price"];
$new_price              = (float)$edit["new_purchase_price"];
$new_name               = $edit["new_asset_name"];
$new_category           = $edit["new_category"];
$new_date               = $edit["new_purchase_date"];
$new_vendor             = $edit["new_vendor_info"];
$new_reg                = $edit["new_reg_no"];
$new_contact            = $edit["new_contact_person"];
$new_business           = $edit["new_business_type"];
$new_share_pct          = $edit["new_share_percentage"] !== null ? (float)$edit["new_share_percentage"] : null;
$new_share_units        = $edit["new_share_units"] !== null ? (int)$edit["new_share_units"] : null;
$new_div_freq           = $edit["new_dividend_frequency"];
$new_rem                = $edit["new_remarks"];

$now = date("Y-m-d H:i:s");

if ($action === "approved") {
    // 3. Update other_assets table row
    $updAsset = $mysqli->prepare("
        UPDATE other_assets
        SET
            asset_name = ?,
            category = ?,
            share_percentage = ?,
            share_units = ?,
            business_type = ?,
            reg_no = ?,
            contact_person = ?,
            dividend_frequency = ?,
            purchase_price = ?,
            purchase_date = ?,
            vendor_info = ?,
            remarks = ?
        WHERE id = ?
    ");

    if (!$updAsset) {
        echo json_encode(["success" => false, "error" => "Asset update prepare failed: " . $mysqli->error]);
        exit;
    }

    $updAsset->bind_param(
        "ssdissssssssi",
        $new_name,
        $new_category,
        $new_share_pct,
        $new_share_units,
        $new_business,
        $new_reg,
        $new_contact,
        $new_div_freq,
        $new_price,
        $new_date,
        $new_vendor,
        $new_rem,
        $asset_id
    );

    if (!$updAsset->execute()) {
        echo json_encode(["success" => false, "error" => "Asset update failed: " . $updAsset->error]);
        exit;
    }
    $updAsset->close();

    // 4. Update linked Cash Out entry (if cash_id exists)
    if ($cash_id > 0) {
        $auditRemark = " [অ্যাসেট ক্রয়মূল্য সংশোধিত: পূর্বের ৳" . number_format($old_price, 2) . " থেকে ৳" . number_format($new_price, 2) . " - অনুমোদক: " . $reviewerName . "]";
        $purpose = ($new_category === 'company_share')
            ? ("কোম্পানি শেয়ারে বিনিয়োগ: " . $new_name . ($new_share_pct ? " (" . $new_share_pct . "%)" : ""))
            : ("অ্যাসেট ক্রয়: " . $new_name . ($new_vendor ? " (" . $new_vendor . ")" : ""));

        $updCash = $mysqli->prepare("
            UPDATE cash
            SET
                amount = ?,
                date = ?,
                purpose = ?,
                remarks = CONCAT(COALESCE(remarks, ''), ?),
                approved_by = ?,
                approved_at = ?
            WHERE id = ?
        ");

        if ($updCash) {
            $updCash->bind_param(
                "dsssisi",
                $new_price,
                $new_date,
                $purpose,
                $auditRemark,
                $reviewer_id,
                $now,
                $cash_id
            );
            $updCash->execute();
            $updCash->close();
        }
    }

    // 5. Update other_asset_edits
    $updEdit = $mysqli->prepare("
        UPDATE other_asset_edits
        SET 
            status = 'approved',
            reviewed_by = ?,
            reviewed_at = ?,
            review_note = ?,
            updated_at = ?
        WHERE id = ?
    ");
    $updEdit->bind_param("isssi", $reviewer_id, $now, $review_note, $now, $edit_id);
    $updEdit->execute();
    $updEdit->close();

    echo json_encode([
        "success" => true,
        "message" => "অ্যাসেট সংশোধনের অনুরোধ সফলভাবে অনুমোদিত হয়েছে এবং ক্যাশ রেকর্ড আপডেট করা হয়েছে।"
    ], JSON_UNESCAPED_UNICODE);
    exit;

} else {
    // Rejected: keep other_assets and cash rows untouched, update other_asset_edits
    $updEdit = $mysqli->prepare("
        UPDATE other_asset_edits
        SET 
            status = 'rejected',
            reviewed_by = ?,
            reviewed_at = ?,
            review_note = ?,
            updated_at = ?
        WHERE id = ?
    ");
    $updEdit->bind_param("isssi", $reviewer_id, $now, $review_note, $now, $edit_id);
    $updEdit->execute();
    $updEdit->close();

    echo json_encode([
        "success" => true,
        "message" => "অ্যাসেট সংশোধনের অনুরোধটি বাতিল করা হয়েছে। মূল অ্যাসেট ও ক্যাশ লেনদেন অপরিবর্তিত থাকবে।"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
