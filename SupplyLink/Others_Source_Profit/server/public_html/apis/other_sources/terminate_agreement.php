<?php
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);
if (!is_array($data) || empty($data)) {
    $data = $_POST;
}

$agreement_id = intval($data['agreement_id'] ?? 0);
$end_date     = trim($data['end_date'] ?? date('Y-m-d'));
$reason       = trim($data['reason'] ?? 'ভাড়া পরিশোধ না করায় চুক্তি বাতিল ও সম্পদ অফিসে ফেরত নেওয়া হয়েছে');

if ($agreement_id <= 0) {
    echo json_encode(["success" => false, "message" => "চুক্তি আইডি প্রদান করুন"], JSON_UNESCAPED_UNICODE);
    exit;
}

$mysqli->begin_transaction();
try {
    $stmt = $mysqli->prepare("
        SELECT ag.id, ag.asset_id, ag.lessee_name, ag.status, a.asset_name 
        FROM other_asset_agreements ag
        LEFT JOIN other_assets a ON a.id = ag.asset_id
        WHERE ag.id = ? FOR UPDATE
    ");
    $stmt->bind_param("i", $agreement_id);
    $stmt->execute();
    $ag = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$ag) {
        throw new Exception("চুক্তিটি পাওয়া যায়নি");
    }

    if ($ag['status'] !== 'active') {
        throw new Exception("চুক্তিটি ইতিমধ্যে " . $ag['status'] . " অবস্থায় আছে");
    }

    // 1. Terminate agreement
    $upAg = $mysqli->prepare("UPDATE other_asset_agreements SET status = 'terminated', end_date = ? WHERE id = ?");
    $upAg->bind_param("si", $end_date, $agreement_id);
    $upAg->execute();
    $upAg->close();

    // 2. Asset returns to In Stock / Active
    $note = "[চুক্তি বাতিল ও ফেরত]: গ্রহীতা " . $ag['lessee_name'] . " (" . $end_date . ") - " . $reason;
    $upAst = $mysqli->prepare("UPDATE other_assets SET status = 'active', remarks = CONCAT(COALESCE(remarks,''), '\n', ?) WHERE id = ?");
    $upAst->bind_param("si", $note, $ag['asset_id']);
    $upAst->execute();
    $upAst->close();

    $mysqli->commit();

    // 🚀 Send Automated Email to Admin
    try {
        require_once __DIR__ . '/../helpers/mailer.php';
        $mailData = [
            'agreement_id' => $agreement_id,
            'asset_id'     => $ag['asset_id'],
            'asset_name'   => $ag['asset_name'] ?? ('Asset #' . $ag['asset_id']),
            'lessee_name'  => $ag['lessee_name'] ?? 'Payer',
            'end_date'     => $end_date,
            'reason'       => $reason,
        ];
        sendAssetEventNotification('agreement_terminated', $mailData);
    } catch (Throwable $e) {
        error_log("Agreement termination email error: " . $e->getMessage());
    }

    echo json_encode([
        "success" => true,
        "message" => "চুক্তি সফলভাবে বাতিল করা হয়েছে এবং সম্পদটি অফিসে ফেরত নেওয়া হয়েছে (In Stock)। এখন এটি পুনরায় ভাড়া বা বিক্রয় করা যাবে।"
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    $mysqli->rollback();
    echo json_encode(["success" => false, "message" => "ব্যর্থ: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
