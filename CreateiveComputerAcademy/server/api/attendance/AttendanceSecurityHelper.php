<?php
// AttendanceSecurityHelper.php - Complete Security, Geofencing, and Device Profiling Helper

class AttendanceSecurityHelper {

    /**
     * Ensure attendance_device_logs and required system_settings exist
     */
    public static function ensureTables($db) {
        if (!$db) return;
        try {
            $queryDeviceLogs = "CREATE TABLE IF NOT EXISTS `attendance_device_logs` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `attendance_id` INT NOT NULL,
                `user_id` INT NOT NULL,
                `punch_type` ENUM('check_in', 'check_out') NOT NULL,
                `timestamp` DATETIME NOT NULL,
                
                -- Network Info
                `ip_address` VARCHAR(45) NOT NULL,
                `network_type` VARCHAR(30) DEFAULT 'unknown',
                `isp_name` VARCHAR(100) DEFAULT NULL,
                
                -- Device Specifications
                `device_type` VARCHAR(20) DEFAULT 'Desktop',
                `device_brand` VARCHAR(50) DEFAULT NULL,
                `device_model` VARCHAR(100) DEFAULT NULL,
                `os_name` VARCHAR(50) DEFAULT NULL,
                `browser_name` VARCHAR(50) DEFAULT NULL,
                `screen_res` VARCHAR(30) DEFAULT NULL,
                `device_fingerprint` VARCHAR(64) NOT NULL,
                
                -- Geolocation & Distance
                `latitude` DECIMAL(10, 8) DEFAULT NULL,
                `longitude` DECIMAL(11, 8) DEFAULT NULL,
                `accuracy_meters` FLOAT DEFAULT NULL,
                `distance_meters` FLOAT DEFAULT NULL,
                `is_within_geofence` TINYINT(1) DEFAULT 1,
                
                -- Security Scoring
                `trust_score` INT DEFAULT 100,
                `fraud_flags` TEXT DEFAULT NULL,
                `verification_status` ENUM('verified', 'flagged', 'rejected') DEFAULT 'verified',
                
                INDEX (`attendance_id`),
                INDEX (`user_id`),
                INDEX (`device_fingerprint`),
                INDEX (`timestamp`),
                INDEX (`verification_status`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
            $db->exec($queryDeviceLogs);

            $querySettings = "CREATE TABLE IF NOT EXISTS `system_settings` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `setting_key` VARCHAR(100) NOT NULL UNIQUE,
                `setting_value` TEXT NOT NULL,
                `description` VARCHAR(255) DEFAULT NULL,
                `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
            $db->exec($querySettings);

            // Default settings
            $defaults = [
                'office_latitude' => ['23.81033100', 'Office GPS Latitude coordinate'],
                'office_longitude' => ['90.41252100', 'Office GPS Longitude coordinate'],
                'office_geofence_radius_meters' => ['50', 'Allowed radius in meters for office attendance'],
                'attendance_security_mode' => ['audit_flag', 'Security mode: audit_flag (allow & flag) or strict_block (block if outside)'],
                'office_allowed_ips' => ['127.0.0.1,::1,182.48.76.182', 'Comma-separated list of allowed office public IPs or subnets']
            ];

            $insertStmt = $db->prepare("
                INSERT INTO system_settings (setting_key, setting_value, description, updated_at)
                VALUES (:key, :val, :desc, NOW())
                ON DUPLICATE KEY UPDATE description = VALUES(description)
            ");

            foreach ($defaults as $key => [$val, $desc]) {
                $insertStmt->execute([':key' => $key, ':val' => $val, ':desc' => $desc]);
            }
        } catch (Exception $e) {
            error_log("AttendanceSecurityHelper table setup warning: " . $e->getMessage());
        }
    }

    /**
     * Resolve actual client IP address taking into account Cloudflare & proxies
     */
    public static function getRealClientIP() {
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            return trim($_SERVER['HTTP_CF_CONNECTING_IP']);
        }
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $list = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($list[0]);
        }
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            return trim($_SERVER['HTTP_CLIENT_IP']);
        }
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }

    /**
     * Server-side User-Agent Parser (Bulletproof fallback for mobile/desktop detection)
     */
    public static function parseServerUserAgent($ua = null) {
        if (!$ua) {
            $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        }

        $deviceType = 'Desktop';
        $deviceBrand = 'Unknown Brand';
        $deviceModel = 'Standard PC';
        $osName = 'Unknown OS';
        $browserName = 'Unknown Browser';

        // 1. Detect Device Type
        if (preg_match('/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i', $ua)) {
            $deviceType = 'Tablet';
        } elseif (preg_match('/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i', $ua)) {
            $deviceType = 'Mobile';
        }

        // 2. Detect OS
        if (preg_match('/Windows NT 10.0/i', $ua)) $osName = 'Windows 10/11';
        elseif (preg_match('/Windows NT 6.3/i', $ua)) $osName = 'Windows 8.1';
        elseif (preg_match('/Windows NT 6.1/i', $ua)) $osName = 'Windows 7';
        elseif (preg_match('/iPhone|iPad|iPod/i', $ua)) {
            if (preg_match('/OS\s([0-9\_]+)/i', $ua, $matches)) {
                $osName = 'iOS ' . str_replace('_', '.', $matches[1]);
            } else {
                $osName = 'iOS';
            }
        }
        elseif (preg_match('/Mac OS X/i', $ua)) $osName = 'macOS';
        elseif (preg_match('/Android\s([0-9\.]+)/i', $ua, $matches)) $osName = 'Android ' . $matches[1];
        elseif (preg_match('/Android/i', $ua)) $osName = 'Android';
        elseif (preg_match('/Linux/i', $ua)) $osName = 'Linux';

        // 3. Detect Brand & Model
        if (preg_match('/iPhone/i', $ua)) {
            $deviceBrand = 'Apple';
            $deviceModel = 'iPhone';
        } elseif (preg_match('/iPad/i', $ua)) {
            $deviceBrand = 'Apple';
            $deviceModel = 'iPad';
        } elseif (preg_match('/Macintosh/i', $ua)) {
            $deviceBrand = 'Apple';
            $deviceModel = 'MacBook / Mac PC';
        } elseif (preg_match('/(SAMSUNG|SM-[A-Z0-9]+|GT-[A-Z0-9]+)/i', $ua, $matches)) {
            $deviceBrand = 'Samsung';
            $deviceModel = 'Samsung Galaxy ' . ($matches[1] ?? '');
        } elseif (preg_match('/(Redmi[^\;\)]+|POCO[^\;\)]+|Mi\s[^\;\)]+|2[0-9]{3}[^\;\)]+|M2[0-9]{3}[^\;\)]+)/i', $ua, $matches)) {
            $deviceBrand = 'Xiaomi';
            $deviceModel = trim($matches[0]);
        } elseif (preg_match('/vivo\s([A-Z0-9_]+)/i', $ua, $matches)) {
            $deviceBrand = 'Vivo';
            $deviceModel = 'Vivo ' . $matches[1];
        } elseif (preg_match('/(CPH[0-9]+|OPPO[^\;\)]+)/i', $ua, $matches)) {
            $deviceBrand = 'OPPO';
            $deviceModel = 'OPPO ' . $matches[0];
        } elseif (preg_match('/(RMX[0-9]+|Realme[^\;\)]+)/i', $ua, $matches)) {
            $deviceBrand = 'Realme';
            $deviceModel = 'Realme ' . $matches[0];
        } elseif (preg_match('/(Infinix|X6[0-9]+)/i', $ua, $matches)) {
            $deviceBrand = 'Infinix';
            $deviceModel = 'Infinix ' . $matches[0];
        } elseif (preg_match('/(Tecno|KG[0-9]+|CK[0-9]+)/i', $ua, $matches)) {
            $deviceBrand = 'Tecno';
            $deviceModel = 'Tecno ' . $matches[0];
        } elseif (preg_match('/(Pixel\s?[0-9a-zA-Z\s]+)/i', $ua, $matches)) {
            $deviceBrand = 'Google';
            $deviceModel = trim($matches[0]);
        } elseif (preg_match('/OnePlus/i', $ua)) {
            $deviceBrand = 'OnePlus';
            $deviceModel = 'OnePlus Phone';
        } elseif ($deviceType === 'Desktop') {
            $deviceBrand = strpos($osName, 'Windows') !== false ? 'Windows PC' : (strpos($osName, 'macOS') !== false ? 'Apple Mac' : 'Linux PC');
            $deviceModel = $osName . ' (Desktop)';
        } elseif ($deviceType === 'Mobile') {
            $deviceBrand = 'Android Device';
            $deviceModel = 'Smartphone';
        }

        // 4. Detect Browser
        if (preg_match('/Edg\/([0-9\.]+)/i', $ua, $matches)) $browserName = 'Edge ' . explode('.', $matches[1])[0];
        elseif (preg_match('/Chrome\/([0-9\.]+)/i', $ua, $matches) && !preg_match('/Edg|OPR/i', $ua)) $browserName = 'Chrome ' . explode('.', $matches[1])[0];
        elseif (preg_match('/Version\/([0-9\.]+)/i', $ua, $matches) && preg_match('/Safari/i', $ua)) $browserName = 'Safari ' . explode('.', $matches[1])[0];
        elseif (preg_match('/Firefox\/([0-9\.]+)/i', $ua, $matches)) $browserName = 'Firefox ' . explode('.', $matches[1])[0];
        elseif (preg_match('/OPR\/([0-9\.]+)/i', $ua, $matches)) $browserName = 'Opera';

        return [
            'device_type' => $deviceType,
            'device_brand' => $deviceBrand,
            'device_model' => $deviceModel,
            'os_name' => $osName,
            'browser_name' => $browserName,
            'screen_res' => 'Mobile Screen',
            'network_type' => $deviceType === 'Mobile' ? 'mobile_network' : 'wifi/broadband',
            'device_fingerprint' => 'dev_' . substr(hash('sha256', $ua . ($_SERVER['REMOTE_ADDR'] ?? '')), 0, 32)
        ];
    }

    /**
     * Calculate exact surface distance in meters using Haversine formula
     */
    public static function calculateHaversineDistance($lat1, $lon1, $lat2, $lon2) {
        if ($lat1 === null || $lon1 === null || $lat2 === null || $lon2 === null) {
            return null;
        }

        $earthRadius = 6371000; // in meters

        $latFrom = deg2rad((float)$lat1);
        $lonFrom = deg2rad((float)$lon1);
        $latTo = deg2rad((float)$lat2);
        $lonTo = deg2rad((float)$lon2);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));

        return round($angle * $earthRadius, 2);
    }

    /**
     * Fetch attendance security settings from system_settings
     */
    public static function getAttendanceSettings($db) {
        self::ensureTables($db);
        
        $settings = [
            'office_latitude' => 23.810331,
            'office_longitude' => 90.412521,
            'office_geofence_radius_meters' => 50,
            'attendance_security_mode' => 'audit_flag',
            'office_allowed_ips' => ['127.0.0.1', '::1', '182.48.76.182']
        ];

        try {
            $stmt = $db->query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('office_latitude', 'office_longitude', 'office_geofence_radius_meters', 'attendance_security_mode', 'office_allowed_ips')");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($rows as $row) {
                $key = $row['setting_key'];
                $val = $row['setting_value'];
                if ($key === 'office_latitude' || $key === 'office_longitude' || $key === 'office_geofence_radius_meters') {
                    $settings[$key] = (float)$val;
                } elseif ($key === 'office_allowed_ips') {
                    $ips = array_filter(array_map('trim', explode(',', $val)));
                    $settings[$key] = array_merge(['127.0.0.1', '::1'], $ips);
                } else {
                    $settings[$key] = $val;
                }
            }
        } catch (Exception $e) {
            // Use defaults if query fails
        }

        return $settings;
    }

    /**
     * Evaluate security, geofence, and device integrity
     */
    public static function evaluateSecurity($db, $userId, $punchType, $clientIp, $deviceInfo = [], $location = []) {
        $settings = self::getAttendanceSettings($db);

        $flags = [];
        $trustScore = 100;
        $isWithinGeofence = 1;
        $distanceMeters = null;

        // 1. Check IP Whitelist
        $isIpMatched = false;
        foreach ($settings['office_allowed_ips'] as $allowed) {
            $allowed = trim($allowed);
            if ($allowed === $clientIp) {
                $isIpMatched = true;
                break;
            }
            // Check subnet prefix e.g. 192.168.1.
            if (substr($allowed, -1) === '*' && strpos($clientIp, rtrim($allowed, '*')) === 0) {
                $isIpMatched = true;
                break;
            }
        }

        if (!$isIpMatched) {
            $flags[] = "EXTERNAL_IP_NETWORK";
            $trustScore -= 20;
        }

        // 2. Geofence Distance Calculation
        $lat = isset($location['latitude']) && is_numeric($location['latitude']) ? (float)$location['latitude'] : null;
        $lng = isset($location['longitude']) && is_numeric($location['longitude']) ? (float)$location['longitude'] : null;
        $accuracy = isset($location['accuracy']) && is_numeric($location['accuracy']) ? (float)$location['accuracy'] : 15.0;

        $allowedRadius = $settings['office_geofence_radius_meters'] ?? 50;

        if ($lat !== null && $lng !== null) {
            $distanceMeters = self::calculateHaversineDistance(
                $lat,
                $lng,
                $settings['office_latitude'],
                $settings['office_longitude']
            );

            // Give indoor tolerance up to min(accuracy, 30m)
            $effectiveRadius = $allowedRadius + min($accuracy, 30.0);

            if ($distanceMeters > $effectiveRadius) {
                $isWithinGeofence = 0;
                $flags[] = "OUT_OF_GEOFENCE";
                $excessDist = $distanceMeters - $effectiveRadius;
                if ($excessDist > 500) {
                    $trustScore -= 60; // Far outside (different area/home)
                } else {
                    $trustScore -= 35; // Nearby outside building
                }
            }
        } else {
            // If GPS is unavailable
            if ($isIpMatched) {
                $flags[] = "IP_VERIFIED_GPS_UNAVAILABLE";
            } else {
                $flags[] = "GPS_AND_IP_UNVERIFIED";
                $trustScore -= 40;
            }
        }

        $trustScore = max(0, min(100, $trustScore));

        // Determine verification status
        $verificationStatus = 'verified';
        if ($trustScore < 50 || !$isWithinGeofence) {
            $verificationStatus = 'flagged';
        }

        // Check if strict blocking is enabled
        $isBlocked = false;
        $blockMessage = '';
        if ($settings['attendance_security_mode'] === 'strict_block') {
            if (!$isWithinGeofence && $distanceMeters !== null) {
                $isBlocked = true;
                $blockMessage = "Check-in blocked. You are " . round($distanceMeters) . "m away from the office building (Allowed: {$allowedRadius}m).";
            } elseif (!$isIpMatched && ($lat === null || $lng === null)) {
                $isBlocked = true;
                $blockMessage = "Check-in blocked. You must be connected to Office Wi-Fi or enable GPS location.";
            }
        }

        return [
            'is_blocked' => $isBlocked,
            'block_message' => $blockMessage,
            'is_within_geofence' => $isWithinGeofence,
            'distance_meters' => $distanceMeters,
            'accuracy_meters' => $accuracy,
            'latitude' => $lat,
            'longitude' => $lng,
            'ip_address' => $clientIp,
            'trust_score' => $trustScore,
            'fraud_flags' => $flags,
            'verification_status' => $verificationStatus,
            'device_info' => $deviceInfo
        ];
    }

    /**
     * Atomically log punch to attendance_device_logs with server UA fallback
     */
    public static function logDevicePunch($db, $attendanceId, $userId, $punchType, $evalResult) {
        if (!$db || !$attendanceId || !$userId) return false;
        
        self::ensureTables($db);

        $dev = $evalResult['device_info'] ?? [];
        $serverParsed = self::parseServerUserAgent();

        // Determine Device Type
        $deviceType = !empty($dev['device_type']) ? $dev['device_type'] : $serverParsed['device_type'];

        // Determine Device Brand
        $deviceBrand = !empty($dev['device_brand']) && !in_array($dev['device_brand'], ['Generic PC', 'Linux PC', 'Unknown Brand', 'Android Phone'])
            ? $dev['device_brand']
            : $serverParsed['device_brand'];

        // Determine Device Model
        $deviceModel = !empty($dev['device_model']) && !in_array($dev['device_model'], ['Desktop Computer', 'Standard PC']) && strpos($dev['device_model'], 'Linux') === false
            ? $dev['device_model']
            : $serverParsed['device_model'];

        // Determine OS Name
        $osName = !empty($dev['os_name']) && $dev['os_name'] !== 'Unknown OS' && !($deviceType === 'Mobile' && $dev['os_name'] === 'Linux')
            ? $dev['os_name']
            : $serverParsed['os_name'];

        $browserName = !empty($dev['browser_name']) && $dev['browser_name'] !== 'Unknown Browser' ? $dev['browser_name'] : $serverParsed['browser_name'];
        $screenRes = !empty($dev['screen_res']) ? $dev['screen_res'] : $serverParsed['screen_res'];
        $networkType = !empty($dev['network_type']) && $dev['network_type'] !== 'unknown' ? $dev['network_type'] : $serverParsed['network_type'];
        $fingerprint = !empty($dev['device_fingerprint']) ? substr(trim($dev['device_fingerprint']), 0, 64) : $serverParsed['device_fingerprint'];

        try {
            $stmt = $db->prepare("
                INSERT INTO attendance_device_logs (
                    attendance_id, user_id, punch_type, timestamp,
                    ip_address, network_type, isp_name,
                    device_type, device_brand, device_model, os_name, browser_name, screen_res, device_fingerprint,
                    latitude, longitude, accuracy_meters, distance_meters, is_within_geofence,
                    trust_score, fraud_flags, verification_status
                ) VALUES (
                    :attendance_id, :user_id, :punch_type, NOW(),
                    :ip_address, :network_type, :isp_name,
                    :device_type, :device_brand, :device_model, :os_name, :browser_name, :screen_res, :device_fingerprint,
                    :latitude, :longitude, :accuracy_meters, :distance_meters, :is_within_geofence,
                    :trust_score, :fraud_flags, :verification_status
                )
            ");

            return $stmt->execute([
                ':attendance_id' => $attendanceId,
                ':user_id' => $userId,
                ':punch_type' => $punchType,
                ':ip_address' => $evalResult['ip_address'],
                ':network_type' => substr($networkType, 0, 30),
                ':isp_name' => substr($dev['isp_name'] ?? '', 0, 100),
                ':device_type' => substr($deviceType, 0, 20),
                ':device_brand' => substr($deviceBrand, 0, 50),
                ':device_model' => substr($deviceModel, 0, 100),
                ':os_name' => substr($osName, 0, 50),
                ':browser_name' => substr($browserName, 0, 50),
                ':screen_res' => substr($screenRes, 0, 30),
                ':device_fingerprint' => $fingerprint,
                ':latitude' => $evalResult['latitude'],
                ':longitude' => $evalResult['longitude'],
                ':accuracy_meters' => $evalResult['accuracy_meters'],
                ':distance_meters' => $evalResult['distance_meters'],
                ':is_within_geofence' => $evalResult['is_within_geofence'],
                ':trust_score' => $evalResult['trust_score'],
                ':fraud_flags' => json_encode($evalResult['fraud_flags'] ?? []),
                ':verification_status' => $evalResult['verification_status']
            ]);
        } catch (Exception $e) {
            error_log("Error logging device punch: " . $e->getMessage());
            return false;
        }
    }
}
?>
