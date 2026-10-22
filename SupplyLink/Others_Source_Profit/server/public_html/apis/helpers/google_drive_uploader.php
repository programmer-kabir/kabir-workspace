<?php
/**
 * Google Drive Uploader Helper
 * Handles OAuth2 JWT signing and file uploading to Google Drive v3
 */

class GoogleDriveUploader {
    private $credentialsPath;
    private $folderId;

    public function __construct($credentialsPath, $folderId) {
        $this->credentialsPath = $credentialsPath;
        $this->folderId = $folderId;
    }

    private function base64UrlEncode($data) {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    /**
     * Get OAuth2 Access Token using Service Account JWT
     */
    public function getAccessToken() {
        if (!file_exists($this->credentialsPath)) {
            throw new Exception("Credentials file not found at: " . $this->credentialsPath);
        }

        $creds = json_decode(file_get_contents($this->credentialsPath), true);
        if (!$creds || empty($creds['client_email']) || empty($creds['private_key'])) {
            throw new Exception("Invalid service account credentials JSON.");
        }

        $now = time();
        $header_b64 = $this->base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $claim_b64 = $this->base64UrlEncode(json_encode([
            'iss' => $creds['client_email'],
            'scope' => 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
            'aud' => 'https://oauth2.googleapis.com/token',
            'exp' => $now + 3600,
            'iat' => $now
        ]));

        $payload = $header_b64 . '.' . $claim_b64;
        $signature = '';
        if (!openssl_sign($payload, $signature, $creds['private_key'], 'SHA256')) {
            throw new Exception("OpenSSL signing failed: " . openssl_error_string());
        }

        $jwt = $payload . '.' . $this->base64UrlEncode($signature);

        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt
        ]));
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($response, true);
        if ($httpCode !== 200 || empty($data['access_token'])) {
            throw new Exception("Google OAuth failed (HTTP $httpCode): " . ($data['error_description'] ?? $response));
        }

        return $data['access_token'];
    }

    /**
     * Upload binary content as file to Google Drive folder
     */
    public function uploadFile($filename, $content, $mimeType = 'application/pdf') {
        $accessToken = $this->getAccessToken();

        $boundary = '-------' . md5(time());
        $delimiter = "\r\n--" . $boundary . "\r\n";
        $close_delim = "\r\n--" . $boundary . "--";

        $metadata = [
            'name' => $filename,
            'parents' => [$this->folderId]
        ];

        $multipartRequestBody =
            $delimiter .
            'Content-Type: application/json; charset=UTF-8' . "\r\n\r\n" .
            json_encode($metadata) .
            $delimiter .
            'Content-Type: ' . $mimeType . "\r\n\r\n" .
            $content .
            $close_delim;

        $url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink';
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $multipartRequestBody);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: multipart/related; boundary=' . $boundary,
            'Content-Length: ' . strlen($multipartRequestBody)
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($response, true);
        if ($httpCode >= 400 || empty($data['id'])) {
            $msg = $data['error']['message'] ?? $response;
            if ($httpCode === 404) {
                $msg .= " (অনুগ্রহ করে গুগল ড্রাইভ ফোল্ডারটিতে 'drive-reporter@supplylink-report.iam.gserviceaccount.com' কে Editor হিসেবে Share করুন)";
            }
            throw new Exception("Drive upload failed (HTTP $httpCode): " . $msg);
        }

        return $data;
    }
}
