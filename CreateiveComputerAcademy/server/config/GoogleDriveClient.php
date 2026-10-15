<?php
/**
 * GoogleDriveClient - High-Speed Pure PHP Google Drive v3 API Client
 * Creative Computer Academy
 *
 * Uses native PHP OpenSSL and cURL (Zero Composer dependencies).
 * Authenticates via Google Service Account JWT (RS256).
 */

class GoogleDriveClient {
    private $credentialsPath;
    private $credentials = null;
    private $tokenCachePath;

    public function __construct($credentialsPath = null) {
        $this->credentialsPath = $credentialsPath ?: (__DIR__ . '/google_drive_credentials.json');
        $this->tokenCachePath = __DIR__ . '/google_drive_token_cache.json';
        $this->loadCredentials();
    }

    /**
     * Checks if credentials file is present and valid
     */
    public function isConfigured() {
        if (!empty($this->credentials['refresh_token']) && !empty($this->credentials['client_id'])) {
            return true;
        }
        return !empty($this->credentials['client_email']) && !empty($this->credentials['private_key']);
    }

    /**
     * Loads and parses the Service Account / OAuth JSON
     */
    private function loadCredentials() {
        if (!file_exists($this->credentialsPath)) {
            return;
        }
        $raw = @file_get_contents($this->credentialsPath);
        if ($raw) {
            $this->credentials = @json_decode($raw, true);
        }
    }

    /**
     * Base64Url encode helper
     */
    private function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Obtains an OAuth2 Access Token using Refresh Token OR RS256 Service Account JWT assertion
     */
    public function getAccessToken() {
        if (!$this->isConfigured()) {
            throw new Exception("Google Drive credentials not configured. Please place google_drive_credentials.json.");
        }

        // 2A. If User OAuth2 (Refresh Token - Personal 5TB Drive)
        if (!empty($this->credentials['refresh_token'])) {
            // Check cached oauth token
            if (file_exists($this->tokenCachePath)) {
                $cache = @json_decode(@file_get_contents($this->tokenCachePath), true);
                if (!empty($cache['access_token']) && 
                    !empty($cache['expires_at']) && 
                    time() < ($cache['expires_at'] - 120) &&
                    ($cache['auth_type'] ?? '') === 'oauth'
                ) {
                    return $cache['access_token'];
                }
                // Delete old service account or expired cache
                @unlink($this->tokenCachePath);
            }

            // If credentials file already has an active access token
            if (!empty($this->credentials['access_token']) && 
                !empty($this->credentials['expires_at']) && 
                time() < ($this->credentials['expires_at'] - 120)
            ) {
                return $this->credentials['access_token'];
            }

            $tokenUrl = 'https://oauth2.googleapis.com/token';
            $postData = http_build_query([
                'client_id' => $this->credentials['client_id'],
                'client_secret' => $this->credentials['client_secret'],
                'refresh_token' => $this->credentials['refresh_token'],
                'grant_type' => 'refresh_token'
            ]);

            $ch = curl_init($tokenUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);
            $res = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $json = @json_decode($res, true);
            if ($httpCode !== 200 || empty($json['access_token'])) {
                $err = $json['error_description'] ?? ($json['error'] ?? 'OAuth token refresh error');
                throw new Exception("Google Drive OAuth Token Error ({$httpCode}): {$err}");
            }

            $accessToken = $json['access_token'];
            $expiresIn = intval($json['expires_in'] ?? 3600);

            @file_put_contents($this->tokenCachePath, json_encode([
                'access_token' => $accessToken,
                'expires_at'   => time() + $expiresIn,
                'auth_type'    => 'oauth'
            ]));

            return $accessToken;
        }

        // 2B. Generate JWT for Service Account
        $now = time();
        $header = ['alg' => 'RS256', 'typ' => 'JWT'];
        $claims = [
            'iss' => $this->credentials['client_email'],
            'scope' => 'https://www.googleapis.com/auth/drive',
            'aud' => $this->credentials['token_uri'] ?? 'https://oauth2.googleapis.com/token',
            'exp' => $now + 3600,
            'iat' => $now
        ];

        $encodedHeader = $this->base64UrlEncode(json_encode($header));
        $encodedClaims = $this->base64UrlEncode(json_encode($claims));
        $signingInput = "{$encodedHeader}.{$encodedClaims}";

        $privateKey = $this->credentials['private_key'];
        $signature = '';
        $success = openssl_sign($signingInput, $signature, $privateKey, OPENSSL_ALGO_SHA256);

        if (!$success) {
            throw new Exception("Failed to sign Google Service Account JWT with OpenSSL.");
        }

        $jwt = "{$signingInput}." . $this->base64UrlEncode($signature);

        // 3. Request Access Token from Google OAuth2
        $tokenUrl = $this->credentials['token_uri'] ?? 'https://oauth2.googleapis.com/token';
        $postData = http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt
        ]);

        $ch = curl_init($tokenUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        $res = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $json = @json_decode($res, true);
        if ($httpCode !== 200 || empty($json['access_token'])) {
            $err = $json['error_description'] ?? ($json['error'] ?? 'Unknown token exchange error');
            throw new Exception("Google OAuth2 Token Error ({$httpCode}): {$err}");
        }

        $accessToken = $json['access_token'];
        $expiresIn = intval($json['expires_in'] ?? 3600);

        // Save cache
        @file_put_contents($this->tokenCachePath, json_encode([
            'access_token' => $accessToken,
            'expires_at' => $now + $expiresIn
        ]));

        return $accessToken;
    }

    /**
     * Uploads a local file to Google Drive (Multipart Upload)
     *
     * @param string $filePath Full local file path or tmp_name
     * @param string $fileName Target name on Drive
     * @param string $mimeType e.g. 'image/vnd.adobe.photoshop', 'image/jpeg'
     * @param string|null $parentFolderId Google Drive Folder ID
     * @return array ['status' => 'success', 'file_id' => string, 'view_url' => string, 'download_url' => string]
     */
    public function uploadFile($filePath, $fileName, $mimeType = 'application/octet-stream', $parentFolderId = null) {
        if (!file_exists($filePath)) {
            throw new Exception("Local source file does not exist: {$filePath}");
        }

        $accessToken = $this->getAccessToken();

        $metadata = ['name' => $fileName];
        if (!empty($parentFolderId)) {
            $metadata['parents'] = [$parentFolderId];
        }

        $boundary = '-------CCA_VAULT_' . md5(microtime(true));
        $delimiter = "\r\n--" . $boundary . "\r\n";
        $closeDelimiter = "\r\n--" . $boundary . "--";

        $fileContent = @file_get_contents($filePath);
        if ($fileContent === false) {
            throw new Exception("Could not read local file: {$filePath}");
        }

        $multipartBody = $delimiter
            . "Content-Type: application/json; charset=UTF-8\r\n\r\n"
            . json_encode($metadata)
            . $delimiter
            . "Content-Type: {$mimeType}\r\n\r\n"
            . $fileContent
            . $closeDelimiter;

        $url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,size,mimeType,webViewLink,webContentLink';

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $multipartBody);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 600); // 10 minutes for heavy PSD/ZIP
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer {$accessToken}",
            "Content-Type: multipart/related; boundary={$boundary}",
            "Content-Length: " . strlen($multipartBody)
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $json = @json_decode($response, true);
        if ($httpCode >= 200 && $httpCode < 300 && !empty($json['id'])) {
            $fileId = $json['id'];

            // Make public for link sharing
            $this->makeFilePublic($fileId, $accessToken);

            return [
                'status' => 'success',
                'file_id' => $fileId,
                'name' => $json['name'] ?? $fileName,
                'size' => $json['size'] ?? strlen($fileContent),
                'view_url' => "https://drive.google.com/file/d/{$fileId}/view",
                'download_url' => "https://drive.google.com/uc?export=download&id={$fileId}"
            ];
        }

        $errMsg = $json['error']['message'] ?? ($curlError ?: "Drive Upload failed with HTTP {$httpCode}: {$response}");
        throw new Exception($errMsg);
    }

    /**
     * Makes a file readable to anyone with link
     */
    public function makeFilePublic($fileId, $accessToken = null) {
        try {
            $accessToken = $accessToken ?: $this->getAccessToken();
            $url = "https://www.googleapis.com/drive/v3/files/{$fileId}/permissions?supportsAllDrives=true";

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['role' => 'reader', 'type' => 'anyone']));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Bearer {$accessToken}",
                "Content-Type: application/json"
            ]);
            curl_exec($ch);
            curl_close($ch);
        } catch (Throwable $e) {}
    }

    /**
     * Finds or creates a folder on Google Drive
     */
    public function findOrCreateFolder($folderName, $parentFolderId = null) {
        $accessToken = $this->getAccessToken();

        // 1. Search for existing folder
        $query = "mimeType = 'application/vnd.google-apps.folder' and name = '{$folderName}' and trashed = false";
        if (!empty($parentFolderId)) {
            $query .= " and '{$parentFolderId}' in parents";
        }

        $searchUrl = "https://www.googleapis.com/drive/v3/files?q=" . urlencode($query) . "&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name)";
        $ch = curl_init($searchUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer {$accessToken}"]);
        $res = curl_exec($ch);
        curl_close($ch);

        $json = @json_decode($res, true);
        if (!empty($json['files'][0]['id'])) {
            return $json['files'][0]['id'];
        }

        // 2. Create if not found
        $createUrl = "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true";
        $metadata = [
            'name' => $folderName,
            'mimeType' => 'application/vnd.google-apps.folder'
        ];
        if (!empty($parentFolderId)) {
            $metadata['parents'] = [$parentFolderId];
        }

        $ch = curl_init($createUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($metadata));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer {$accessToken}",
            "Content-Type: application/json"
        ]);
        $createRes = curl_exec($ch);
        curl_close($ch);

        $createJson = @json_decode($createRes, true);
        return $createJson['id'] ?? null;
    }
}
