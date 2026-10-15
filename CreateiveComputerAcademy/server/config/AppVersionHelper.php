<?php
/**
 * AppVersionHelper - Desktop Attendance Version Control & Release Governance
 * Creative Computer Academy
 */

require_once __DIR__ . '/database.php';

class AppVersionHelper {
    private static $schemaEnsured = false;

    /**
     * Ensures app_releases and staff_app_versions tables exist
     */
    public static function ensureSchema($db) {
        if (self::$schemaEnsured) return;

        try {
            // 1. app_releases table
            $db->exec("CREATE TABLE IF NOT EXISTS app_releases (
                id INT AUTO_INCREMENT PRIMARY KEY,
                version VARCHAR(20) NOT NULL UNIQUE,
                release_title VARCHAR(255) NOT NULL,
                release_notes TEXT NOT NULL,
                category ENUM('feature', 'bugfix', 'critical') DEFAULT 'feature',
                is_mandatory TINYINT(1) DEFAULT 0,
                min_supported_version VARCHAR(20) DEFAULT '1.0.0',
                download_url VARCHAR(500) NOT NULL,
                file_size BIGINT DEFAULT 0,
                file_hash VARCHAR(100) NULL,
                download_count INT DEFAULT 0,
                published_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_version (version),
                INDEX idx_mandatory (is_mandatory)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            // 2. staff_app_versions table
            $db->exec("CREATE TABLE IF NOT EXISTS staff_app_versions (
                user_id INT PRIMARY KEY,
                current_version VARCHAR(20) NOT NULL,
                device_name VARCHAR(150) NULL,
                platform VARCHAR(50) DEFAULT 'Windows',
                last_check_in_version VARCHAR(20) NULL,
                last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_curr_ver (current_version)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            // 3. Seed initial baseline release v1.0.0 if empty
            $countStmt = $db->query("SELECT COUNT(*) FROM app_releases");
            if ($countStmt && $countStmt->fetchColumn() == 0) {
                $seedStmt = $db->prepare("INSERT INTO app_releases 
                    (version, release_title, release_notes, category, is_mandatory, min_supported_version, download_url, file_size) 
                    VALUES (:version, :title, :notes, :cat, :mand, :min_ver, :url, :size)");
                $seedStmt->execute([
                    ':version'  => '1.0.0',
                    ':title'    => 'Initial Production Desktop Attendance App',
                    ':notes'    => "• Desktop Attendance Check-In & Check-Out\n• System Tray Quick Punch Integration\n• Real-time WebRTC Live Screen Streaming\n• Windows Input Injector & Remote Surveillance",
                    ':cat'      => 'feature',
                    ':mand'     => 0,
                    ':min_ver'  => '1.0.0',
                    ':url'      => 'https://pub-20551b894a524e97915e7c30fe97f682.r2.dev/releases/v1.0.0/CCA-Attendance-Setup.exe',
                    ':size'     => 85983232 // approx 82 MB
                ]);
            }

            self::$schemaEnsured = true;
        } catch (Throwable $e) {
            error_log("AppVersionHelper::ensureSchema error: " . $e->getMessage());
        }
    }

    /**
     * Checks if a client's version has an update available
     *
     * @param string $clientVersion
     * @param PDO $db
     * @return array
     */
    public static function checkUpdate($clientVersion, $db) {
        self::ensureSchema($db);

        $clientVersion = trim((string)$clientVersion);
        if (empty($clientVersion)) {
            $clientVersion = '1.0.0';
        }

        // Fetch latest release
        $stmt = $db->query("SELECT * FROM app_releases ORDER BY id DESC LIMIT 1");
        $latest = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$latest) {
            return [
                'has_update'   => false,
                'is_mandatory' => false,
                'current_version' => $clientVersion
            ];
        }

        $latestVersion = $latest['version'];
        $minSupported = !empty($latest['min_supported_version']) ? $latest['min_supported_version'] : '1.0.0';

        $hasUpdate = version_compare($clientVersion, $latestVersion, '<');

        // Check if mandatory:
        // 1. If latest is flagged is_mandatory = 1 AND client is behind latest
        // 2. OR client is strictly below min_supported_version
        $isMandatory = false;
        if ($hasUpdate) {
            if (!empty($latest['is_mandatory'])) {
                $isMandatory = true;
            } elseif (version_compare($clientVersion, $minSupported, '<')) {
                $isMandatory = true;
            }
        }

        return [
            'has_update'            => $hasUpdate,
            'is_mandatory'          => $isMandatory,
            'client_version'        => $clientVersion,
            'latest_version'        => $latestVersion,
            'release_title'         => $latest['release_title'],
            'release_notes'         => $latest['release_notes'],
            'category'              => $latest['category'],
            'download_url'          => $latest['download_url'],
            'file_size'             => intval($latest['file_size']),
            'min_supported_version' => $minSupported,
            'published_at'          => $latest['created_at']
        ];
    }

    /**
     * Records or updates a staff member's active desktop app version
     */
    public static function logStaffVersion($userId, $version, $deviceName = null, $platform = 'Windows', $isCheckIn = false) {
        if (empty($userId)) return;

        try {
            $database = new Database();
            $db = $database->getConnection();
            self::ensureSchema($db);

            $lastCheckInClause = $isCheckIn ? ", last_check_in_version = :ver" : "";

            $sql = "INSERT INTO staff_app_versions (user_id, current_version, device_name, platform, last_seen_at) 
                    VALUES (:user_id, :version, :device_name, :platform, NOW())
                    ON DUPLICATE KEY UPDATE 
                        current_version = VALUES(current_version),
                        device_name = COALESCE(VALUES(device_name), device_name),
                        platform = VALUES(platform),
                        last_seen_at = NOW()
                        $lastCheckInClause";

            $stmt = $db->prepare($sql);
            $params = [
                ':user_id'     => $userId,
                ':version'     => trim($version),
                ':device_name' => $deviceName,
                ':platform'    => $platform
            ];
            if ($isCheckIn) {
                $params[':ver'] = trim($version);
            }
            $stmt->execute($params);
        } catch (Throwable $e) {
            error_log("AppVersionHelper::logStaffVersion error: " . $e->getMessage());
        }
    }
}
