<?php
require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../libs/PHPMailer/src/Exception.php';
require_once __DIR__ . '/../libs/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../libs/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class EmailHelper {
    /**
     * Send an email using PHPMailer
     */
    public static function sendEmail($toEmail, $toName, $subject, $htmlBody, $debug = false) {
        $mail = new PHPMailer(true);

        try {
            $host = env('SMTP_HOST', 'smtp.gmail.com');
            $port = (int) env('SMTP_PORT', 465);
            $username = env('SMTP_USER', '');
            $password = env('SMTP_PASS', '');
            $fromName = env('SMTP_FROM_NAME', 'CCA Notifications');
            $encryption = ($port === 465) ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;

            // Server settings
            if ($debug) {
                $mail->SMTPDebug = 2; // Enable verbose debug output
            }
            $mail->isSMTP();
            $mail->Host       = $host;
            $mail->SMTPAuth   = true;
            $mail->Username   = $username;
            $mail->Password   = $password;
            $mail->SMTPSecure = $encryption;
            $mail->Port       = $port;

            // Optional: for development if SSL fails
            $mail->SMTPOptions = array(
                'ssl' => array(
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                )
            );

            $mail->setFrom($username, $fromName);
            $mail->addAddress($toEmail, $toName);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '</p>'], "\n", $htmlBody));

            return $mail->send();
        } catch (Exception $e) {
            $errorMsg = "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
            error_log($errorMsg);
            if ($debug) {
                return $errorMsg; // Return error string if debugging
            }
            return false;
        }
    }

    /**
     * Generate a beautiful HTML email template
     */
    public static function getHtmlTemplate($title, $contentHtml, $actionUrl = null, $actionText = null) {
        $primaryColor = '#4F46E5'; // Indigo 600
        $secondaryColor = '#f8fafc';
        
        $buttonHtml = '';
        if ($actionUrl && $actionText) {
            $buttonHtml = '
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                <tbody>
                    <tr>
                        <td align="center" bgcolor="'.$primaryColor.'" style="border-radius: 8px;">
                            <a href="'.$actionUrl.'" target="_blank" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 14px 28px; border: 1px solid '.$primaryColor.'; display: inline-block; font-weight: bold; border-radius: 8px;">'.$actionText.'</a>
                        </td>
                    </tr>
                </tbody>
            </table>';
        }

        // We use a clean, professional table layout which is the standard for email clients
        return '
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>'.$title.'</title>
            <style>
                @media screen and (max-width: 600px) {
                    .content-cell { padding: 20px !important; }
                    .header-cell { padding: 30px 20px !important; }
                    h1 { font-size: 20px !important; }
                    h2 { font-size: 18px !important; }
                }
                body { margin: 0; padding: 0; background-color: #f3f4f6; -webkit-font-smoothing: antialiased; }
                a:hover { opacity: 0.9; }
            </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: \'Segoe UI\', Helvetica, Arial, sans-serif;">
            
            <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
                <tr>
                    <td align="center">
                        <!-- Main Email Container -->
                        <table role="presentation" width="100%" max-width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);">
                            
                            <!-- Header with Logo & Brand Color -->
                            <tr>
                                <td class="header-cell" align="center" style="background-color: '.$primaryColor.'; padding: 40px 30px; text-align: center;">
                                    <img src="https://api.creativecomputeracademy.com/uploads/logo/Cca_Logo.webp" alt="CCA Logo" width="80" height="80" style="display: block; margin: 0 auto 15px auto; border-radius: 8px; object-fit: contain; background-color: #ffffff; padding: 5px;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Creative Computer Academy</h1>
                                </td>
                            </tr>
                            
                            <!-- Email Body -->
                            <tr>
                                <td class="content-cell" style="padding: 40px 50px;">
                                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 600; text-align: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 15px;">'.$title.'</h2>
                                    
                                    <div style="color: #4b5563; font-size: 16px; line-height: 1.8; text-align: left;">
                                        '.$contentHtml.'
                                    </div>
                                    
                                    '.$buttonHtml.'
                                    
                                    <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 15px; line-height: 1.6; text-align: left;">
                                        Best Regards,<br>
                                        <strong style="color: #374151;">Admin Team</strong><br>
                                        Creative Computer Academy
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f9fafb; padding: 25px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                                    <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                                        You received this email because you are a registered staff member at Creative Computer Academy. This is an automated notification.
                                    </p>
                                    <p style="margin: 0; color: #9ca3af; font-size: 13px; font-weight: 600;">
                                        &copy; '.date('Y').' Creative Computer Academy. All rights reserved.
                                    </p>
                                </td>
                            </tr>
                            
                        </table>
                        <!-- End Main Email Container -->
                    </td>
                </tr>
            </table>

        </body>
        </html>
        ';
    }
}
?>
