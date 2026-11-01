<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

header("Content-Type: application/json; charset=UTF-8");

// ==========================================
// 1. Ensure Table Exists
// ==========================================
$createTableSql = "
CREATE TABLE IF NOT EXISTS cash_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name_bn VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    type ENUM('in', 'out', 'both') NOT NULL DEFAULT 'out',
    is_company_expense TINYINT(1) NOT NULL DEFAULT 0,
    allowed_roles VARCHAR(100) NOT NULL DEFAULT 'all',
    color_bg VARCHAR(100) NOT NULL DEFAULT 'bg-slate-500/15',
    color_text VARCHAR(100) NOT NULL DEFAULT 'text-slate-300',
    color_border VARCHAR(100) NOT NULL DEFAULT 'border-slate-500/30',
    icon VARCHAR(50) DEFAULT 'FaTag',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_company_expense (is_company_expense)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

if (!$mysqli->query($createTableSql)) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Table creation failed: " . $mysqli->error]);
    exit;
}

// ==========================================
// 2. Auto-Seed Initial Categories if Empty
// ==========================================
$checkCount = $mysqli->query("SELECT COUNT(*) AS total FROM cash_categories");
$countRow = $checkCount ? $checkCount->fetch_assoc() : null;
$total = $countRow ? (int)$countRow['total'] : 0;

if ($total === 0) {
    $seedCategories = [
        // ---------- CASH IN CATEGORIES ----------
        [
            'slug' => 'invest',
            'name_bn' => 'বিনিয়োগ',
            'name_en' => 'Investment',
            'type' => 'in',
            'is_company_expense' => 0,
            'allowed_roles' => 'all',
            'color_bg' => 'bg-blue-500/15',
            'color_text' => 'text-blue-400',
            'color_border' => 'border-blue-500/30',
            'icon' => 'FaHandHoldingUsd',
            'sort_order' => 1
        ],
        [
            'slug' => 'installment',
            'name_bn' => 'কিস্তি',
            'name_en' => 'Installment',
            'type' => 'in',
            'is_company_expense' => 0,
            'allowed_roles' => 'all',
            'color_bg' => 'bg-emerald-500/15',
            'color_text' => 'text-emerald-400',
            'color_border' => 'border-emerald-500/30',
            'icon' => 'FaReceipt',
            'sort_order' => 2
        ],
        [
            'slug' => 'daily-installment',
            'name_bn' => 'দৈনিক কিস্তি',
            'name_en' => 'Daily Installment',
            'type' => 'in',
            'is_company_expense' => 0,
            'allowed_roles' => 'all',
            'color_bg' => 'bg-cyan-500/15',
            'color_text' => 'text-cyan-400',
            'color_border' => 'border-cyan-500/30',
            'icon' => 'FaClock',
            'sort_order' => 3
        ],
        [
            'slug' => 'downpayment',
            'name_bn' => 'ডাউন পেমেন্ট',
            'name_en' => 'Down Payment',
            'type' => 'in',
            'is_company_expense' => 0,
            'allowed_roles' => 'all',
            'color_bg' => 'bg-amber-500/15',
            'color_text' => 'text-amber-400',
            'color_border' => 'border-amber-500/30',
            'icon' => 'FaMoneyCheckAlt',
            'sort_order' => 4
        ],
        [
            'slug' => 'loan-return',
            'name_bn' => 'লোন ফেরত',
            'name_en' => 'Loan Return',
            'type' => 'in',
            'is_company_expense' => 0,
            'allowed_roles' => 'all',
            'color_bg' => 'bg-pink-500/15',
            'color_text' => 'text-pink-400',
            'color_border' => 'border-pink-500/30',
            'icon' => 'FaUndoAlt',
            'sort_order' => 5
        ],
        [
            'slug' => 'rental_income',
            'name_bn' => 'রেন্টাল আয়',
            'name_en' => 'Rental Income',
            'type' => 'in',
            'is_company_expense' => 0,
            'allowed_roles' => 'all',
            'color_bg' => 'bg-purple-500/15',
            'color_text' => 'text-purple-400',
            'color_border' => 'border-purple-500/30',
            'icon' => 'FaHome',
            'sort_order' => 6
        ],
        [
            'slug' => 'share_dividend',
            'name_bn' => 'শেয়ার লভ্যাংশ',
            'name_en' => 'Share Dividend',
            'type' => 'in',
            'is_company_expense' => 0,
            'allowed_roles' => 'all',
            'color_bg' => 'bg-teal-500/15',
            'color_text' => 'text-teal-400',
            'color_border' => 'border-teal-500/30',
            'icon' => 'FaChartPie',
            'sort_order' => 7
        ],
        [
            'slug' => 'asset_sale',
            'name_bn' => 'অ্যাসেট বিক্রয়',
            'name_en' => 'Asset Sale',
            'type' => 'in',
            'is_company_expense' => 0,
            'allowed_roles' => 'all',
            'color_bg' => 'bg-sky-500/15',
            'color_text' => 'text-sky-400',
            'color_border' => 'border-sky-500/30',
            'icon' => 'FaCoins',
            'sort_order' => 8
        ],
        [
            'slug' => 'security_deposit',
            'name_bn' => 'জামানত গ্রহণ',
            'name_en' => 'Security Deposit',
            'type' => 'in',
            'is_company_expense' => 0,
            'allowed_roles' => 'all',
            'color_bg' => 'bg-yellow-500/15',
            'color_text' => 'text-yellow-400',
            'color_border' => 'border-yellow-500/30',
            'icon' => 'FaShieldAlt',
            'sort_order' => 9
        ],
        // ---------- CASH OUT CATEGORIES ----------
        [
            'slug' => 'office-expense',
            'name_bn' => 'অফিস খরচ',
            'name_en' => 'Office Expense',
            'type' => 'out',
            'is_company_expense' => 1,
            'allowed_roles' => 'all',
            'color_bg' => 'bg-amber-500/15',
            'color_text' => 'text-amber-400',
            'color_border' => 'border-amber-500/30',
            'icon' => 'FaBuilding',
            'sort_order' => 10
        ],
        [
            'slug' => 'purchase',
            'name_bn' => 'কেনাকাটা / বাজার',
            'name_en' => 'Purchase',
            'type' => 'out',
            'is_company_expense' => 1,
            'allowed_roles' => 'all',
            'color_bg' => 'bg-rose-500/15',
            'color_text' => 'text-rose-400',
            'color_border' => 'border-rose-500/30',
            'icon' => 'FaShoppingCart',
            'sort_order' => 11
        ],
        [
            'slug' => 'salary',
            'name_bn' => 'বেতন',
            'name_en' => 'Salary',
            'type' => 'out',
            'is_company_expense' => 1,
            'allowed_roles' => 'all',
            'color_bg' => 'bg-purple-500/15',
            'color_text' => 'text-purple-400',
            'color_border' => 'border-purple-500/30',
            'icon' => 'FaUserTie',
            'sort_order' => 12
        ],
        [
            'slug' => 'rent',
            'name_bn' => 'অফিস ভাড়া',
            'name_en' => 'Rent',
            'type' => 'out',
            'is_company_expense' => 1,
            'allowed_roles' => 'all',
            'color_bg' => 'bg-orange-500/15',
            'color_text' => 'text-orange-400',
            'color_border' => 'border-orange-500/30',
            'icon' => 'FaStore',
            'sort_order' => 13
        ],
        [
            'slug' => 'bill',
            'name_bn' => 'ইউটিলিটি / বিদ্যুৎ বিল',
            'name_en' => 'Utility Bill',
            'type' => 'out',
            'is_company_expense' => 1,
            'allowed_roles' => 'all',
            'color_bg' => 'bg-yellow-500/15',
            'color_text' => 'text-yellow-400',
            'color_border' => 'border-yellow-500/30',
            'icon' => 'FaLightbulb',
            'sort_order' => 14
        ],
        [
            'slug' => 'loan-repayment',
            'name_bn' => 'লোন পরিশোধ',
            'name_en' => 'Loan Repayment',
            'type' => 'out',
            'is_company_expense' => 0,
            'allowed_roles' => 'admin,developer',
            'color_bg' => 'bg-blue-500/15',
            'color_text' => 'text-blue-400',
            'color_border' => 'border-blue-500/30',
            'icon' => 'FaFileInvoiceDollar',
            'sort_order' => 15
        ],
        [
            'slug' => 'loan-given',
            'name_bn' => 'লোন প্রদান',
            'name_en' => 'Loan Given',
            'type' => 'out',
            'is_company_expense' => 0,
            'allowed_roles' => 'admin,developer',
            'color_bg' => 'bg-indigo-500/15',
            'color_text' => 'text-indigo-400',
            'color_border' => 'border-indigo-500/30',
            'icon' => 'FaHandHolding',
            'sort_order' => 16
        ],
        [
            'slug' => 'investor-payout',
            'name_bn' => 'ইনভেস্টর পেআউট',
            'name_en' => 'Investor Payout',
            'type' => 'out',
            'is_company_expense' => 0,
            'allowed_roles' => 'admin,developer',
            'color_bg' => 'bg-emerald-500/15',
            'color_text' => 'text-emerald-400',
            'color_border' => 'border-emerald-500/30',
            'icon' => 'FaWallet',
            'sort_order' => 17
        ],
        [
            'slug' => 'profit-payout',
            'name_bn' => 'প্রফিট পেআউট',
            'name_en' => 'Profit Payout',
            'type' => 'out',
            'is_company_expense' => 0,
            'allowed_roles' => 'admin,developer',
            'color_bg' => 'bg-green-500/15',
            'color_text' => 'text-green-400',
            'color_border' => 'border-green-500/30',
            'icon' => 'FaChartLine',
            'sort_order' => 18
        ],
        [
            'slug' => 'asset_purchase',
            'name_bn' => 'অ্যাসেট ক্রয়',
            'name_en' => 'Asset Purchase',
            'type' => 'out',
            'is_company_expense' => 0,
            'allowed_roles' => 'admin,developer',
            'color_bg' => 'bg-cyan-500/15',
            'color_text' => 'text-cyan-400',
            'color_border' => 'border-cyan-500/30',
            'icon' => 'FaBoxOpen',
            'sort_order' => 19
        ],
        [
            'slug' => 'share_investment',
            'name_bn' => 'শেয়ার বিনিয়োগ',
            'name_en' => 'Share Investment',
            'type' => 'out',
            'is_company_expense' => 0,
            'allowed_roles' => 'admin,developer',
            'color_bg' => 'bg-teal-500/15',
            'color_text' => 'text-teal-400',
            'color_border' => 'border-teal-500/30',
            'icon' => 'FaBuilding',
            'sort_order' => 20
        ],
        [
            'slug' => 'others',
            'name_bn' => 'অন্যান্য',
            'name_en' => 'Others',
            'type' => 'both',
            'is_company_expense' => 1,
            'allowed_roles' => 'all',
            'color_bg' => 'bg-slate-500/15',
            'color_text' => 'text-slate-300',
            'color_border' => 'border-slate-500/30',
            'icon' => 'FaTag',
            'sort_order' => 99
        ],
    ];

    $insStmt = $mysqli->prepare("
        INSERT IGNORE INTO cash_categories 
        (slug, name_bn, name_en, type, is_company_expense, allowed_roles, color_bg, color_text, color_border, icon, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    if ($insStmt) {
        foreach ($seedCategories as $cat) {
            $insStmt->bind_param(
                "ssssisssssi",
                $cat['slug'],
                $cat['name_bn'],
                $cat['name_en'],
                $cat['type'],
                $cat['is_company_expense'],
                $cat['allowed_roles'],
                $cat['color_bg'],
                $cat['color_text'],
                $cat['color_border'],
                $cat['icon'],
                $cat['sort_order']
            );
            $insStmt->execute();
        }
        $insStmt->close();
    }
}

// ==========================================
// 3. Fetch Categories with optional type filter
// ==========================================
$filterType = isset($_GET['type']) ? trim(strtolower($_GET['type'])) : '';

if ($filterType === 'in') {
    $stmt = $mysqli->prepare("SELECT * FROM cash_categories WHERE status = 'active' AND (type = 'in' OR type = 'both') ORDER BY sort_order ASC, id ASC");
} else if ($filterType === 'out') {
    $stmt = $mysqli->prepare("SELECT * FROM cash_categories WHERE status = 'active' AND (type = 'out' OR type = 'both') ORDER BY sort_order ASC, id ASC");
} else {
    $stmt = $mysqli->prepare("SELECT * FROM cash_categories WHERE status = 'active' ORDER BY sort_order ASC, id ASC");
}

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Query prepare failed: " . $mysqli->error]);
    exit;
}

$stmt->execute();
$res = $stmt->get_result();
$categories = [];

while ($row = $res->fetch_assoc()) {
    $categories[] = [
        'id'                 => (int)$row['id'],
        'slug'               => $row['slug'],
        'name_bn'            => $row['name_bn'],
        'name_en'            => $row['name_en'],
        'type'               => $row['type'],
        'is_company_expense' => (int)$row['is_company_expense'] === 1,
        'allowed_roles'      => array_map('trim', explode(',', strtolower($row['allowed_roles']))),
        'color_bg'           => $row['color_bg'],
        'color_text'         => $row['color_text'],
        'color_border'       => $row['color_border'],
        'icon'               => $row['icon'],
        'sort_order'         => (int)$row['sort_order'],
    ];
}
$stmt->close();

echo json_encode([
    "success" => true,
    "total"   => count($categories),
    "data"    => $categories
], JSON_UNESCAPED_UNICODE);
