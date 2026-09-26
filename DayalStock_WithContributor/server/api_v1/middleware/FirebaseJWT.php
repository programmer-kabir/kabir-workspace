<?php

class FirebaseJWT {
    private static $projectId = 'dayalstockk';
    private static $keysUrl = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
    private static $keysCacheFile = null;

    private static function getCacheFilePath() {
        if (self::$keysCacheFile === null) {
            self::$keysCacheFile = sys_get_temp_dir() . '/firebase_keys_' . self::$projectId . '.json';
        }
        return self::$keysCacheFile;
    }

    public static function getPublicKeys() {
        // Simple file cache for keys (expires after 1 hour)
        $cacheFile = self::getCacheFilePath();
        if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < 3600) {
            return json_decode(file_get_contents($cacheFile), true);
        }

        $keysJson = @file_get_contents(self::$keysUrl);
        if ($keysJson) {
            @file_put_contents($cacheFile, $keysJson);
            return json_decode($keysJson, true);
        }
        
        return null;
    }

    public static function decodeBase64Url($input) {
        $remainder = strlen($input) % 4;
        if ($remainder) {
            $padlen = 4 - $remainder;
            $input .= str_repeat('=', $padlen);
        }
        return base64_decode(strtr($input, '-_', '+/'));
    }

    public static function verifyIdToken($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new Exception('Invalid token format');
        }

        list($headb64, $bodyb64, $cryptob64) = $parts;
        
        $header = json_decode(self::decodeBase64Url($headb64), true);
        $payload = json_decode(self::decodeBase64Url($bodyb64), true);
        $signature = self::decodeBase64Url($cryptob64);

        if (!$header || !$payload || !$signature) {
            throw new Exception('Invalid token parts');
        }

        if (!isset($header['kid']) || !isset($header['alg']) || $header['alg'] !== 'RS256') {
            throw new Exception('Invalid token header');
        }

        // Check standard claims
        if (!isset($payload['exp']) || $payload['exp'] < time()) {
            throw new Exception('Token is expired');
        }

        if (!isset($payload['aud']) || $payload['aud'] !== self::$projectId) {
            throw new Exception('Token audience does not match project ID');
        }

        if (!isset($payload['iss']) || $payload['iss'] !== 'https://securetoken.google.com/' . self::$projectId) {
            throw new Exception('Token issuer is invalid');
        }

        if (!isset($payload['sub'])) {
            throw new Exception('Token subject is missing');
        }

        // Verify signature
        $keys = self::getPublicKeys();
        if (!$keys || !isset($keys[$header['kid']])) {
            throw new Exception('Public key not found for token verification');
        }

        $publicKey = $keys[$header['kid']];
        $data = $headb64 . '.' . $bodyb64;

        $isValid = openssl_verify($data, $signature, $publicKey, OPENSSL_ALGO_SHA256);

        if ($isValid !== 1) {
            throw new Exception('Token signature verification failed');
        }

        return $payload;
    }
}
