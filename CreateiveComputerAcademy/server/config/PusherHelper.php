<?php
class PusherHelper {
    // ⚠️ TODO: Replace these with your actual Pusher Keys ⚠️
    private $app_id = '2188221';
    private $key = '82a63711fed4b73bd74d';
    private $secret = '2c2b6d614bb47f7928a4';
    private $cluster = 'ap2'; // e.g., 'mt1', 'ap2'

    public function trigger($channel, $event, $data) {
        $host = "api-{$this->cluster}.pusher.com";
        $path = "/apps/{$this->app_id}/events";
        
        $payload = json_encode([
            "name" => $event,
            "channel" => $channel,
            "data" => json_encode($data) // Pusher requires data to be a stringified JSON
        ]);

        $body_md5 = md5($payload);
        $timestamp = time();

        $query_params = [
            "auth_key" => $this->key,
            "auth_timestamp" => $timestamp,
            "auth_version" => "1.0",
            "body_md5" => $body_md5
        ];

        // Sort query params
        ksort($query_params);
        $query_string = http_build_query($query_params);

        $string_to_sign = "POST\n$path\n$query_string";
        $auth_signature = hash_hmac('sha256', $string_to_sign, $this->secret);

        $url = "https://$host$path?$query_string&auth_signature=$auth_signature";

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);

        $response = curl_exec($ch);
        $http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $http_status == 200;
    }
}
?>
