<?php
$env = parse_ini_file(__DIR__ . '/.env');
$apiKey = $env['LEMON_SQUEEZY_API_KEY'];

$ch = curl_init('https://api.lemonsqueezy.com/v1/variants?filter[product_id]=1751114');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/vnd.api+json',
    'Authorization: Bearer ' . $apiKey
]);
$response = curl_exec($ch);
curl_close($ch);
echo $response;
