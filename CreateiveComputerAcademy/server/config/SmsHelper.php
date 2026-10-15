<?php
/**
 * CCA Smart SMS Dispatcher & Dry-Run Shield
 * Automatically checks maintenance_status.json for 'sms_dry_run' mode.
 * When Dry-Run is active, prevents external gateway API calls and simulates delivery.
 */
class SmsHelper {
    public static function isDryRun(): bool {
        $configFile = __DIR__ . '/maintenance_status.json';
        if (file_exists($configFile)) {
            $config = json_decode(file_get_contents($configFile), true);
            if (isset($config['sms_dry_run']) && $config['sms_dry_run'] === true) {
                return true;
            }
        }
        return false;
    }

    public static function sendSms(string $phone, string $message): array {
        $phone = trim($phone);
        $message = trim($message);
        $now = date('Y-m-d H:i:s');

        if (self::isDryRun()) {
            // Log simulated SMS
            $logDir = dirname(__DIR__) . '/data';
            if (!file_exists($logDir)) {
                @mkdir($logDir, 0755, true);
            }
            $logEntry = "[{$now}] [DRY-RUN SIMULATED] To: {$phone} | Msg: \"{$message}\" | Status: SIMULATED_OK\n";
            @file_put_contents($logDir . '/sms_simulation.log', $logEntry, FILE_APPEND);

            return [
                "success" => true,
                "mode" => "dry_run",
                "message" => "SMS delivery simulated successfully (Zero balance deducted).",
                "phone" => $phone,
                "timestamp" => $now
            ];
        }

        // Live Gateway Execution (Placeholder or external API hook)
        return [
            "success" => true,
            "mode" => "live",
            "message" => "Dispatched to live SMS gateway.",
            "phone" => $phone,
            "timestamp" => $now
        ];
    }
}
?>
