<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

header('Content-Type: application/json');

$userId = $GLOBALS['user']['id'] ?? 0;
if ($userId <= 0) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "User not found"]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$contentId = $input['content_id'] ?? 0;

if (!$contentId) {
    echo json_encode(["success" => false, "message" => "Content ID is required"]);
    exit;
}

// Fetch content details
$stmt = $mysqli->prepare("SELECT id, title, slug, exclusive_price, is_exclusive_sold FROM contents WHERE id = ?");
$stmt->bind_param("i", $contentId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Content not found"]);
    exit;
}

$content = $result->fetch_assoc();

if ($content['is_exclusive_sold']) {
    echo json_encode(["success" => false, "message" => "This item is already sold"]);
    exit;
}

if (!$content['exclusive_price'] || $content['exclusive_price'] <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid price for this item"]);
    exit;
}

// Ensure env variables are set
$apiKey = getenv('LEMON_SQUEEZY_API_KEY');
$storeId = getenv('LEMON_SQUEEZY_STORE_ID');
$variantId = getenv('LEMON_SQUEEZY_EXCLUSIVE_BUYOUT_VARIANT_ID');

if (!$apiKey || !$storeId || !$variantId) {
    Logger::log("Missing Lemon Squeezy environment variables for create_checkout.php", "ERROR");
    echo json_encode(["success" => false, "message" => "Server configuration error"]);
    exit;
}

// Prepare Lemon Squeezy Create Checkout API payload
// The custom_price is in cents! So $10 is 1000.
$priceInCents = (int)round((float)$content['exclusive_price'] * 100);

$payload = [
    "data" => [
        "type" => "checkouts",
        "attributes" => [
            "custom_price" => $priceInCents,
            "checkout_data" => [
                "email" => $GLOBALS['user']['email'] ?? "",
                "custom" => [
                    "user_id" => (string)$userId,
                    "content_id" => (string)$contentId,
                    "type" => "exclusive_buyout"
                ]
            ],
            "product_options" => [
                "name" => "Exclusive Buyout - " . $content['title']
            ],
            "checkout_options" => [
                "embed" => true,
                "media" => false,
                "logo" => false,
                "desc" => false,
                "discount" => false
            ]
        ],
        "relationships" => [
            "store" => [
                "data" => [
                    "type" => "stores",
                    "id" => (string)$storeId
                ]
            ],
            "variant" => [
                "data" => [
                    "type" => "variants",
                    "id" => (string)$variantId
                ]
            ]
        ]
    ]
];

$ch = curl_init('https://api.lemonsqueezy.com/v1/checkouts');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/vnd.api+json',
    'Content-Type: application/vnd.api+json',
    'Authorization: Bearer ' . $apiKey
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300) {
    $resData = json_decode($response, true);
    $checkoutUrl = $resData['data']['attributes']['url'] ?? '';
    if ($checkoutUrl) {
        echo json_encode([
            "success" => true,
            "checkout_url" => $checkoutUrl
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to get checkout URL"]);
    }
} else {
    Logger::log("Lemon Squeezy API Error: " . $response, "ERROR");
    echo json_encode([
        "success" => false,
        "message" => "Failed to create checkout session",
        "lemon_squeezy_response" => json_decode($response, true)
    ]);
}
