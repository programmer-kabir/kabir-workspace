<?php
// backend/helpers/pusher.php
// Lightweight Pusher REST API Client for IconBaba real-time events.
// Works without any third-party PHP dependencies.

define('PUSHER_APP_ID', '2197683');
define('PUSHER_KEY', '4af7213fc2bbb411c2ef');
define('PUSHER_SECRET', '85acc212ad2c329b10a7');
define('PUSHER_CLUSTER', 'ap2');

/**
 * Triggers a real-time event via Pusher REST API.
 * 
 * @param string|array $channels Channel name or array of channel names (e.g. 'user-12' or 'public-notifications')
 * @param string $event Event name (e.g. 'team_invite', 'notification')
 * @param mixed $data Data payload to deliver to clients
 * @return bool True if successfully triggered
 */
function triggerPusherEvent($channels, string $event, $data): bool {
    $appId   = PUSHER_APP_ID;
    $key     = PUSHER_KEY;
    $secret  = PUSHER_SECRET;
    $cluster = PUSHER_CLUSTER;

    if (empty($appId) || empty($key) || empty($secret)) {
        return false;
    }

    $channelList = is_array($channels) ? $channels : [$channels];
    
    $payload = [
        'name' => $event,
        'channels' => $channelList,
        'data' => is_string($data) ? $data : json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    ];

    $body = json_encode($payload);
    $bodyMd5 = md5($body);
    $authTimestamp = time();
    $authVersion = '1.0';

    $path = "/apps/{$appId}/events";
    $queryString = "auth_key={$key}&auth_timestamp={$authTimestamp}&auth_version={$authVersion}&body_md5={$bodyMd5}";
    
    $stringToSign = "POST\n{$path}\n{$queryString}";
    $authSignature = hash_hmac('sha256', $stringToSign, $secret);

    $url = "https://api-{$cluster}.pusher.com{$path}?{$queryString}&auth_signature={$authSignature}";

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json'
        ],
        CURLOPT_TIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => true
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError || $httpCode >= 400) {
        error_log("Pusher trigger failed (HTTP {$httpCode}): {$curlError} - Body: {$response}");
        return false;
    }

    return true;
}
