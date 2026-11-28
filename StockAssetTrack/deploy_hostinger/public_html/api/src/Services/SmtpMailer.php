<?php

declare(strict_types=1);

namespace App\Services;

use Throwable;

/**
 * Lightweight, zero-dependency pure PHP SMTP client supporting SSL/TLS (port 465 or 587) with HTML & plain-text fallback.
 */
final class SmtpMailer
{
    /**
     * @param array<string, mixed> $config
     */
    public function __construct(private readonly array $config)
    {
    }

    public function send(string $toEmail, string $toName, string $subject, string $htmlBody, string $textBody = ''): bool
    {
        $host = trim((string) ($this->config['smtp']['host'] ?? ''));
        $port = (int) ($this->config['smtp']['port'] ?? 465);
        $user = trim((string) ($this->config['smtp']['user'] ?? ''));
        $pass = trim((string) ($this->config['smtp']['pass'] ?? ''));
        $fromEmail = trim((string) ($this->config['mail']['fromAddress'] ?? ($user ?: 'support@stockassettrack.com')));
        $fromName = trim((string) ($this->config['mail']['fromName'] ?? 'StockAssetTrack'));

        // If SMTP credentials are empty, fallback to standard PHP mail()
        if ($host === '' || $user === '' || $pass === '') {
            $headers = [
                "From: {$fromName} <{$fromEmail}>",
                "Reply-To: {$fromEmail}",
                "X-Mailer: PHP/" . PHP_VERSION,
                "Content-Type: text/plain; charset=UTF-8",
            ];
            return @mail($toEmail, $subject, $textBody ?: strip_tags($htmlBody), implode("\r\n", $headers));
        }

        try {
            $protocol = $port === 465 ? 'ssl://' : '';
            $context = stream_context_create([
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true,
                ],
            ]);

            $socket = @stream_socket_client(
                "{$protocol}{$host}:{$port}",
                $errNo,
                $errStr,
                15,
                STREAM_CLIENT_CONNECT,
                $context
            );

            if (!$socket) {
                error_log("SMTP Socket Connect Failed to {$host}:{$port} - {$errStr} ({$errNo})");
                return false;
            }

            stream_set_timeout($socket, 15);
            $this->readResponse($socket); // 220 Greeting

            $this->sendCommand($socket, 'EHLO ' . gethostname());

            if ($port === 587) {
                $this->sendCommand($socket, 'STARTTLS');
                stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT);
                $this->sendCommand($socket, 'EHLO ' . gethostname());
            }

            $this->sendCommand($socket, 'AUTH LOGIN');
            $this->sendCommand($socket, base64_encode($user));
            $this->sendCommand($socket, base64_encode($pass));

            $this->sendCommand($socket, "MAIL FROM:<{$fromEmail}>");
            $this->sendCommand($socket, "RCPT TO:<{$toEmail}>");
            $this->sendCommand($socket, 'DATA');

            $boundary = '==_SAT_' . md5(uniqid((string) time(), true));
            $safeToName = mb_encode_mimeheader($toName ?: explode('@', $toEmail)[0], 'UTF-8');
            $safeFromName = mb_encode_mimeheader($fromName, 'UTF-8');
            $safeSubject = mb_encode_mimeheader($subject, 'UTF-8');

            $headers = [
                'Date: ' . date('r'),
                "To: {$safeToName} <{$toEmail}>",
                "From: {$safeFromName} <{$fromEmail}>",
                "Subject: {$safeSubject}",
                'MIME-Version: 1.0',
                "Content-Type: multipart/alternative; boundary=\"{$boundary}\"",
                'X-Mailer: StockAssetTrack Pure PHP SMTP',
            ];

            $body = implode("\r\n", $headers) . "\r\n\r\n";
            $body .= "--{$boundary}\r\n";
            $body .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
            $body .= ($textBody ?: strip_tags($htmlBody)) . "\r\n\r\n";
            $body .= "--{$boundary}\r\n";
            $body .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
            $body .= $htmlBody . "\r\n\r\n";
            $body .= "--{$boundary}--\r\n";
            $body .= '.';

            $this->sendCommand($socket, $body);
            $this->sendCommand($socket, 'QUIT');
            fclose($socket);

            return true;
        } catch (Throwable $e) {
            error_log('SMTP Execution Error: ' . $e->getMessage());
            return false;
        }
    }

    private function sendCommand($socket, string $cmd): string
    {
        fwrite($socket, $cmd . "\r\n");
        return $this->readResponse($socket);
    }

    private function readResponse($socket): string
    {
        $response = '';
        while ($line = fgets($socket, 512)) {
            $response .= $line;
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        return $response;
    }
}
