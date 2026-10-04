<?php
// server/api/admin/payroll/save_scheme.php
require_once __DIR__ . '/../../../config/cors.php';
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../payroll/PayrollHelper.php';

$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    $schemeId = isset($data['scheme_id']) ? intval($data['scheme_id']) : 0;
    $userId = isset($data['user_id']) ? intval($data['user_id']) : 0;
    $schemeType = isset($data['scheme_type']) ? trim($data['scheme_type']) : 'MONTHLY';
    $salaryAmount = isset($data['salary_amount']) ? floatval($data['salary_amount']) : null;
    $contractAmount = isset($data['contract_amount']) ? floatval($data['contract_amount']) : null;
    $contractDurationMonths = isset($data['contract_duration_months']) ? intval($data['contract_duration_months']) : 12;
    $workingDaysPerMonth = isset($data['working_days_per_month']) ? intval($data['working_days_per_month']) : 26;
    $standardDailyHours = isset($data['standard_daily_hours']) ? floatval($data['standard_daily_hours']) : 8.00;
    $contractStartDate = isset($data['contract_start_date']) ? trim($data['contract_start_date']) : date('Y-m-d');
    $contractEndDate = isset($data['contract_end_date']) ? trim($data['contract_end_date']) : date('Y-m-d', strtotime('+1 year'));
    $status = isset($data['status']) ? trim($data['status']) : 'active';
    $notes = isset($data['notes']) ? trim($data['notes']) : null;

    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Valid user_id is required.']);
        exit();
    }

    if (!in_array($schemeType, ['MONTHLY', 'YEARLY_CONTRACT'])) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'scheme_type must be either MONTHLY or YEARLY_CONTRACT.']);
        exit();
    }

    if ($schemeType === 'MONTHLY') {
        // Monthly staff have NO end date (ongoing continuous salary scheme)
        $contractEndDate = null;
        $contractDurationMonths = null;
        $totalContractHours = null;
    } else {
        // Yearly contract has defined duration & end date
        $contractDurationMonths = isset($data['contract_duration_months']) ? intval($data['contract_duration_months']) : 12;
        $contractEndDate = !empty($data['contract_end_date']) ? trim($data['contract_end_date']) : date('Y-m-d', strtotime('+1 year'));
        $totalContractHours = $workingDaysPerMonth * $contractDurationMonths * $standardDailyHours;
    }

    // Calculate exact hourly rate using 3-pillar formula
    $hourlyRate = PayrollHelper::calculateHourlyRate(
        $schemeType,
        $salaryAmount,
        $contractAmount,
        $workingDaysPerMonth,
        $standardDailyHours,
        $contractDurationMonths
    );

    if ($schemeId > 0) {
        // Update existing scheme
        $stmt = $pdo->prepare("
            UPDATE staff_pay_schemes SET
                scheme_type = :scheme_type,
                salary_amount = :salary_amount,
                contract_amount = :contract_amount,
                contract_duration_months = :contract_duration_months,
                working_days_per_month = :working_days_per_month,
                standard_daily_hours = :standard_daily_hours,
                total_contract_hours = :total_contract_hours,
                hourly_rate = :hourly_rate,
                contract_start_date = :contract_start_date,
                contract_end_date = :contract_end_date,
                status = :status,
                notes = :notes
            WHERE id = :scheme_id AND user_id = :user_id
        ");

        $stmt->execute([
            ':scheme_type' => $schemeType,
            ':salary_amount' => $salaryAmount,
            ':contract_amount' => $contractAmount,
            ':contract_duration_months' => $contractDurationMonths,
            ':working_days_per_month' => $workingDaysPerMonth,
            ':standard_daily_hours' => $standardDailyHours,
            ':total_contract_hours' => $totalContractHours,
            ':hourly_rate' => $hourlyRate,
            ':contract_start_date' => $contractStartDate,
            ':contract_end_date' => $contractEndDate,
            ':status' => $status,
            ':notes' => $notes,
            ':scheme_id' => $schemeId,
            ':user_id' => $userId,
        ]);

        $savedId = $schemeId;
        $message = 'Pay scheme updated successfully.';
    } else {
        // If creating a new active scheme, expire previous active schemes for this user
        if ($status === 'active') {
            $stmtDeactivate = $pdo->prepare("
                UPDATE staff_pay_schemes 
                SET status = 'completed' 
                WHERE user_id = :user_id AND status = 'active'
            ");
            $stmtDeactivate->execute([':user_id' => $userId]);
        }

        $stmt = $pdo->prepare("
            INSERT INTO staff_pay_schemes (
                user_id, scheme_type, salary_amount, contract_amount,
                contract_duration_months, working_days_per_month, standard_daily_hours,
                total_contract_hours, hourly_rate, contract_start_date, contract_end_date,
                status, notes, created_at
            ) VALUES (
                :user_id, :scheme_type, :salary_amount, :contract_amount,
                :contract_duration_months, :working_days_per_month, :standard_daily_hours,
                :total_contract_hours, :hourly_rate, :contract_start_date, :contract_end_date,
                :status, :notes, NOW()
            )
        ");

        $stmt->execute([
            ':user_id' => $userId,
            ':scheme_type' => $schemeType,
            ':salary_amount' => $salaryAmount,
            ':contract_amount' => $contractAmount,
            ':contract_duration_months' => $contractDurationMonths,
            ':working_days_per_month' => $workingDaysPerMonth,
            ':standard_daily_hours' => $standardDailyHours,
            ':total_contract_hours' => $totalContractHours,
            ':hourly_rate' => $hourlyRate,
            ':contract_start_date' => $contractStartDate,
            ':contract_end_date' => $contractEndDate,
            ':status' => $status,
            ':notes' => $notes,
        ]);

        $savedId = $pdo->lastInsertId();
        $message = 'New pay scheme created successfully.';
    }

    echo json_encode([
        'status' => 'success',
        'message' => $message,
        'data' => [
            'scheme_id' => $savedId,
            'hourly_rate' => $hourlyRate,
            'total_contract_hours' => $totalContractHours,
            'wallet_summary' => PayrollHelper::getStaffWalletSummary($pdo, $userId)
        ]
    ]);

} catch (Throwable $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
