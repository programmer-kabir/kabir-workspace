<?php

class CustomJWT {
    private static function getSecret() {
        $secret = getenv('JWT_SECRET');
        if (!$secret) {
            $secret = 'dayalstock_jwt_super_secure_key_2026_x99a!';
        }
        return $secret;
    }

    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4 === 0 ? strlen($data) : strlen($data) + 4 - (strlen($data) % 4), '=', STR_PAD_RIGHT));
    }

    /**
     * Generate signed JWT token
     * @param array $payload
     * @param int $expirySeconds (default 30 days = 2592000s)
     * @return string
     */
    public static function generateToken(array $payload, $expirySeconds = 2592000) {
        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256'
        ];

        $now = time();
        $payload['iat'] = $payload['iat'] ?? $now;
        $payload['exp'] = $payload['exp'] ?? ($now + $expirySeconds);
        $payload['iss'] = 'dayalstock';

        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", self::getSecret(), true);
        $signatureEncoded = self::base64UrlEncode($signature);

        return "$headerEncoded.$payloadEncoded.$signatureEncoded";
    }

    /**
     * Verify signed JWT token and return payload
     * @param string $token
     * @return array
     * @throws Exception
     */
    public static function verifyToken($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new Exception("Invalid token structure");
        }

        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;

        $header = json_decode(self::base64UrlDecode($headerEncoded), true);
        if (!$header || ($header['alg'] ?? '') !== 'HS256') {
            throw new Exception("Unsupported token algorithm");
        }

        $expectedSig = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", self::getSecret(), true);
        $providedSig = self::base64UrlDecode($signatureEncoded);

        if (!hash_equals($expectedSig, $providedSig)) {
            throw new Exception("Invalid token signature");
        }

        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);
        if (!$payload) {
            throw new Exception("Invalid token payload");
        }

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception("Token has expired");
        }

        return $payload;
    }
}
