<?php
ob_start();

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    if (ob_get_length()) ob_clean();
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "error" => "Invalid request method"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Read JSON body
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input["id"]) || $input["id"] === "") {
    if (ob_get_length()) ob_clean();
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Missing field: id"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$id = (int) $input["id"];

if ($id <= 0) {
    if (ob_get_length()) ob_clean();
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Invalid id"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $mysqli->begin_transaction();

    // 1. Check row exists
    $check = $mysqli->prepare("SELECT id FROM investment_installments WHERE id=? LIMIT 1");
    if ($check) {
        $check->bind_param("i", $id);
        $check->execute();
        $res = $check->get_result();
        if ($res->num_rows === 0) {
            $check->close();
            $mysqli->rollback();
            if (ob_get_length()) ob_clean();
            echo json_encode([
                "success" => false,
                "error" => "কিস্তি পাওয়া যায়নি (Installment not found)"
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $check->close();
    }

    // 2. Delete from investment_installments
    $sql = "DELETE FROM investment_installments WHERE id = ?";
    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $mysqli->error);
    }
    $stmt->bind_param("i", $id);
    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }
    $affected = $stmt->affected_rows;
    $stmt->close();

    // 3. Remove associated cash-in entry (isolated catch)
    try {
        $cashRef = "inv_inst_" . $id;
        $delCash = $mysqli->prepare("DELETE FROM cash WHERE refId = ?");
        if ($delCash) {
            $delCash->bind_param("s", $cashRef);
            $delCash->execute();
            $delCash->close();
        }
    } catch (Throwable $cashErr) {
        error_log("Cash delete non-fatal error: " . $cashErr->getMessage());
    }

    // 4. Remove associated edit requests if table exists (isolated catch)
    try {
        $delEdits = $mysqli->prepare("DELETE FROM investment_installment_edits WHERE installment_id = ?");
        if ($delEdits) {
            $delEdits->bind_param("i", $id);
            $delEdits->execute();
            $delEdits->close();
        }
    } catch (Throwable $editErr) {
        error_log("Edits delete non-fatal error: " . $editErr->getMessage());
    }

    $mysqli->commit();

    if (ob_get_length()) ob_clean();
    echo json_encode([
        "success" => true,
        "message" => "কিস্তি ও সংশ্লিষ্ট ক্যাশ সফলভাবে মুছে ফেলা হয়েছে",
        "affected_rows" => $affected
    ], JSON_UNESCAPED_UNICODE);
    exit;

} catch (Throwable $e) {
    if ($mysqli && $mysqli->connect_errno === 0) {
        @$mysqli->rollback();
    }
    if (ob_get_length()) ob_clean();
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "সার্ভার এরর: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
