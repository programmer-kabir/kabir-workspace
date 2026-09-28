<?php
// backend/database/update_pricing_plans.php
require_once __DIR__ . '/../config/database.php';

// Add user_count and extra_seat_price columns if not already present
$columns = $pdo->query("SHOW COLUMNS FROM pricing_plans")->fetchAll(PDO::FETCH_COLUMN);

if (!in_array('user_count', $columns)) {
    $pdo->exec("ALTER TABLE pricing_plans ADD COLUMN user_count INT NOT NULL DEFAULT 1 AFTER billing_period");
    echo "✓ Added user_count column.\n";
}

if (!in_array('extra_seat_price', $columns)) {
    $pdo->exec("ALTER TABLE pricing_plans ADD COLUMN extra_seat_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER user_count");
    echo "✓ Added extra_seat_price column.\n";
}

// Clear and seed Solo and Team plans matching user reference
$pdo->exec("TRUNCATE TABLE pricing_plans");

$plans = [
    [
        'name' => 'Free',
        'price' => 0.00,
        'billing_period' => 'forever',
        'user_count' => 1,
        'extra_seat_price' => 0.00,
        'features' => json_encode([
            'Access 5,000+ vector icons',
            'Outlined and filled styles',
            'Personal & commercial use (with attribution)',
            'SVG source files',
            'Standard PNG files (up to 64px)'
        ]),
        'cta_text' => 'Start Free',
        'cta_url' => '/',
        'is_popular' => 0,
        'display_order' => 1
    ],
    [
        'name' => 'Solo',
        'price' => 99.00,
        'billing_period' => 'yr',
        'user_count' => 1,
        'extra_seat_price' => 0.00,
        'features' => json_encode([
            'Access all icons',
            'New icons every week',
            'Commercial use',
            'SVG source files',
            'PNG files',
            'Figma file (.fig)',
            'React & Vue'
        ]),
        'cta_text' => 'Choose Solo',
        'cta_url' => '/pricing',
        'is_popular' => 0,
        'display_order' => 2
    ],
    [
        'name' => 'Team',
        'price' => 249.00,
        'billing_period' => 'yr',
        'user_count' => 5,
        'extra_seat_price' => 20.00,
        'features' => json_encode([
            'Access all icons',
            'New icons every week',
            'Commercial use',
            'SVG source files',
            'PNG files',
            'Figma file (.fig)',
            'React & Vue'
        ]),
        'cta_text' => 'Choose Team',
        'cta_url' => '/pricing',
        'is_popular' => 1,
        'display_order' => 3
    ]
];


$stmt = $pdo->prepare("
    INSERT INTO pricing_plans (name, price, billing_period, user_count, extra_seat_price, features, cta_text, cta_url, is_popular, display_order, is_active)
    VALUES (:name, :price, :billing_period, :user_count, :extra_seat_price, :features, :cta_text, :cta_url, :is_popular, :display_order, 1)
");

foreach ($plans as $p) {
    $stmt->execute($p);
    echo "✓ Seeded plan: {$p['name']} ({$p['price']}/{$p['billing_period']})\n";
}

echo "Pricing plans updated successfully!\n";
