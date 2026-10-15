<?php
require_once __DIR__ . '/env.php';

class PusherHelper {
    public static function trigger($channel, $event, $data) {
        $app_id = env('PUSHER_APP_ID', '2188221');
        $key = env('PUSHER_KEY', '82a63711fed4b73bd74d');
        $secret = env('PUSHER_SECRET', '2c2b6d614bb47f7928a4');
        $cluster = env('PUSHER_CLUSTER', 'ap2');

        $host = "api-" . $cluster . ".pusher.com";
        $path = "/apps/" . $app_id . "/events";
        
        $payload = json_encode([
            "name" => $event,
            "channel" => $channel,
            "data" => json_encode($data) // Pusher requires data to be a stringified JSON
        ]);

        $body_md5 = md5($payload);
        $timestamp = time();

        $query_params = [
            "auth_key" => $key,
            "auth_timestamp" => $timestamp,
            "auth_version" => "1.0",
            "body_md5" => $body_md5
        ];

        // Sort query params
        ksort($query_params);
        $query_string = http_build_query($query_params);

        $string_to_sign = "POST\n$path\n$query_string";
        $auth_signature = hash_hmac('sha256', $string_to_sign, $secret);

        $url = "https://$host$path?$query_string&auth_signature=$auth_signature";

        $ch = curl_init($url);
        if (!$ch) return false;
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);

        $response = curl_exec($ch);
        $http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $http_status == 200;
    }
}
?>
