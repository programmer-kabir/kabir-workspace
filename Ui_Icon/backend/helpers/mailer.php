<?php
// backend/helpers/mailer.php
// Simple email sending helper for IconBaba
// Uses PHP's mail() function - works on most shared hosting (cPanel/Hostinger/etc)

/**
 * Send an email using PHP mail() with proper headers.
 * On cPanel hosting, mail() works out of the box.
 */
function sendMail(string $toEmail, string $toName, string $subject, string $htmlBody, string $textBody = ''): bool {
    $fromName  = 'IconBaba';
    $fromEmail = 'noreply@iconbaba.com';

    if (empty($textBody)) {
        $textBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $htmlBody));
    }

    $boundary = md5(uniqid(rand(), true));

    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
    $headers .= "From: {$fromName} <{$fromEmail}>\r\n";
    $headers .= "Reply-To: {$fromEmail}\r\n";
    $headers .= "X-Mailer: IconBaba-PHP\r\n";

    $message  = "--{$boundary}\r\n";
    $message .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $message .= chunk_split(base64_encode($textBody)) . "\r\n";

    $message .= "--{$boundary}\r\n";
    $message .= "Content-Type: text/html; charset=UTF-8\r\n";
    $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $message .= chunk_split(base64_encode($htmlBody)) . "\r\n";

    $message .= "--{$boundary}--";

    $to = "{$toName} <{$toEmail}>";

    try {
        $result = mail($to, $subject, $message, $headers);
        if (!$result) {
            error_log("mailer.php: mail() returned false for {$toEmail}");
        }
        return $result;
    } catch (Exception $e) {
        error_log("mailer.php: Exception sending to {$toEmail}: " . $e->getMessage());
        return false;
    }
}

/**
 * Build and send an OTP verification email.
 */
function sendOtpEmail(string $toEmail, string $toName, string $otp, string $purpose = 'registration'): bool {
    $purposeLabel = $purpose === 'forgot_password' ? 'reset your password' : 'verify your email';

    $subject = "Your IconBaba Verification Code: {$otp}";

    $html = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#12131e;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">IconBaba</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Your verification code</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;color:#94a3b8;font-size:14px;">Hi <strong style="color:#e2e8f0;">{$toName}</strong>,</p>
            <p style="margin:0 0 28px;color:#94a3b8;font-size:14px;line-height:1.6;">
              Use the 6-digit code below to {$purposeLabel}. This code expires in <strong style="color:#e2e8f0;">10 minutes</strong>.
            </p>
            <!-- OTP Box -->
            <div style="background:#0f1117;border:2px solid #7c3aed;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
              <span style="font-size:42px;font-weight:900;letter-spacing:16px;color:#a78bfa;font-family:'Courier New',monospace;">{$otp}</span>
            </div>
            <p style="margin:0 0 8px;color:#64748b;font-size:12px;line-height:1.6;">
              If you didn't request this, please ignore this email. Never share this code with anyone.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid rgba(255,255,255,0.06);padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#475569;font-size:11px;">© 2025 IconBaba. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML;

    $text = "Your IconBaba Verification Code\n\n"
          . "Hi {$toName},\n\n"
          . "Use this code to {$purposeLabel}:\n\n"
          . "  {$otp}\n\n"
          . "This code expires in 10 minutes.\n\n"
          . "If you didn't request this, please ignore this email.\n\n"
          . "— The IconBaba Team";

    return sendMail($toEmail, $toName, $subject, $html, $text);
}

/**
 * Build and send a password reset email.
 */
function sendPasswordResetEmail(string $toEmail, string $toName, string $otp): bool {
    return sendOtpEmail($toEmail, $toName, $otp, 'forgot_password');
}
