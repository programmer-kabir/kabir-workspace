<?php
/**
 * ============================================================
 *  DayalStock — Common Email Helper
 * ============================================================
 *  Usage:
 *    require_once __DIR__ . '/../helper/email_helper.php';
 *    sendEmail($mysqli, 'user@email.com', 'John Doe', 'content_submitted', [
 *        'file_count' => 5,
 *        'content_title' => 'Beautiful Sunset'
 *    ]);
 * ============================================================
 */

/**
 * Send a branded HTML email and log it in the database.
 *
 * @param mysqli      $mysqli       Database connection
 * @param string      $toEmail      Recipient email address
 * @param string      $toName       Recipient display name
 * @param string      $emailType    One of the predefined email types (see EMAIL_TEMPLATES)
 * @param array       $params       Dynamic data to inject into the template
 * @param int|null    $recipientUserId  User ID for logging (optional)
 * @param int|null    $senderUserId     Sender user ID for logging (optional)
 * @param string|null $senderName       Sender name for logging (optional)
 * @return bool       True if mail was sent successfully
 */
function sendEmail(
    $mysqli,
    string $toEmail,
    string $toName,
    string $emailType,
    array $params = [],
    ?int $recipientUserId = null,
    ?int $senderUserId = null,
    ?string $senderName = null
): bool {
    if (empty($toEmail)) return false;

    // Load SMTP config
    $mailConfig = @include __DIR__ . '/../config/smtp_config.php';
    $fromEmail = $mailConfig['from_email'] ?? 'contact@dayalstock.com';
    $fromName  = $mailConfig['from_name']  ?? 'DayalStock';

    // Build email content from template
    $template = getEmailTemplate($emailType, $toName, $params);
    if (!$template) return false;

    $subject      = $template['subject'];
    $messageTitle = $template['title'];
    $messageBody  = $template['body'];

    // Build full HTML
    $htmlContent = buildEmailHtml($toName, $messageTitle, $messageBody, $fromEmail, $template);

    // Send email
    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8\r\n";
    $headers .= "From: $fromName <$fromEmail>\r\n";
    $headers .= "Reply-To: $fromEmail\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    $mailSent = @mail($toEmail, $subject, $htmlContent, $headers);
    $status   = $mailSent ? 'sent' : 'failed';

    // Log to email_logs table
    if ($mysqli) {
        $logSenderName = $senderName ?? 'System';
        $logSenderId   = $senderUserId ?? 0;

        $stmtLog = $mysqli->prepare("
            INSERT INTO email_logs 
                (recipient_user_id, recipient_name, recipient_email, email_type, subject, message_title, message_body, status, sent_by_id, sent_by_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        if ($stmtLog) {
            $bodyForLog = strip_tags($messageBody);
            $stmtLog->bind_param(
                "isssssssis",
                $recipientUserId,
                $toName,
                $toEmail,
                $emailType,
                $subject,
                $messageTitle,
                $bodyForLog,
                $status,
                $logSenderId,
                $logSenderName
            );
            $stmtLog->execute();
            $stmtLog->close();
        }
    }

    return $mailSent;
}


/**
 * Get email template data by type.
 * Returns ['subject', 'title', 'body', 'icon', 'accent_color', 'cta_text', 'cta_url', 'footer_note']
 */
function getEmailTemplate(string $type, string $recipientName, array $params = []): ?array {
    $dashboardUrl = 'https://contributor.dayalstock.com/dashboard';
    $fileCount    = $params['file_count'] ?? 1;
    $contentTitle = $params['content_title'] ?? '';
    $reason       = $params['reason'] ?? '';
    $amount       = $params['amount'] ?? '';
    $method       = $params['method'] ?? '';

    $templates = [

        // ═══════════════════════════════════════════
        //  CONTENT SUBMISSION (PENDING REVIEW)
        // ═══════════════════════════════════════════
        'content_submitted' => [
            'subject'      => $fileCount > 1 
                ? "Your {$fileCount} files have been submitted — DayalStock" 
                : "Your file has been submitted — DayalStock",
            'title'        => '📤 Submission Received!',
            'body'         => $fileCount > 1
                ? "<p>Great news! Your <strong>{$fileCount} files</strong> have been successfully submitted for review.</p>
                   <p>Our quality review team will carefully examine each file to ensure it meets our content standards. This process typically takes <strong>1-3 business days</strong>.</p>"
                : "<p>Great news! Your file" . ($contentTitle ? " <strong>\"" . htmlspecialchars($contentTitle) . "\"</strong>" : "") . " has been successfully submitted for review.</p>
                   <p>Our quality review team will carefully examine your submission to ensure it meets our content standards. This process typically takes <strong>1-3 business days</strong>.</p>",
            'icon'         => '📤',
            'accent_color' => '#6C4FE0',
            'cta_text'     => 'View Submission Status',
            'cta_url'      => $dashboardUrl . '/files/review',
            'info_box'     => [
                'title' => 'What happens next?',
                'items' => [
                    '🔍 Our team reviews your file quality and metadata',
                    '✅ Approved files go live and start earning',
                    '💬 If changes are needed, you\'ll be notified with feedback',
                ]
            ],
            'footer_note'  => 'Keep uploading! The more quality content you submit, the faster you grow as a contributor.',
        ],

        // ═══════════════════════════════════════════
        //  CONTRIBUTOR APPLICATION RECEIVED
        // ═══════════════════════════════════════════
        'contributor_application_received' => [
            'subject'      => "Application Received — DayalStock Contributor",
            'title'        => '🎉 Application Received!',
            'body'         => "<p>Hi " . htmlspecialchars($recipientName) . ",</p>
                               <p>Thank you for applying to become a contributor at DayalStock! We have received your application successfully.</p>
                               <p>Our team will review your portfolio and details. We will get back to you with an update soon.</p>",
            'icon'         => '🎉',
            'accent_color' => '#10B981',
            'cta_text'     => 'Visit DayalStock',
            'cta_url'      => 'https://contributor.dayalstock.com',
            'footer_note'  => 'We are excited to see your creativity!',
        ],

        // ═══════════════════════════════════════════
        //  CONTRIBUTOR APPLICATION APPROVED
        // ═══════════════════════════════════════════
        'contributor_application_approved' => [
            'subject'      => "Application Approved! 🎉 — DayalStock",
            'title'        => '🎉 Welcome to DayalStock!',
            'body'         => "<p>Hi " . htmlspecialchars($recipientName) . ",</p>
                               <p>Congratulations! Your contributor application has been approved. You have been granted the Author role.</p>
                               <p>You can now log in and start uploading your creative content to our platform.</p>",
            'icon'         => '🎉',
            'accent_color' => '#10B981',
            'cta_text'     => 'Login to Contributor Hub',
            'cta_url'      => 'https://contributor.dayalstock.com/login',
            'footer_note'  => 'We can\'t wait to see your first upload!',
        ],

        // ═══════════════════════════════════════════
        //  CONTRIBUTOR APPLICATION REJECTED
        // ═══════════════════════════════════════════
        'contributor_application_rejected' => [
            'subject'      => "Application Status Update — DayalStock",
            'title'        => 'Application Update',
            'body'         => "<p>Hi " . htmlspecialchars($recipientName) . ",</p>
                               <p>Thank you for your interest in becoming a contributor at DayalStock. We have reviewed your application.</p>
                               <p>Unfortunately, we are unable to approve your application at this time. We appreciate your effort and wish you the best.</p>",
            'icon'         => 'ℹ️',
            'accent_color' => '#EF4444',
            'footer_note'  => 'Keep improving your portfolio and you may apply again in the future.',
        ],

        // ═══════════════════════════════════════════
        //  CONTENT APPROVED
        // ═══════════════════════════════════════════
        'content_approved' => [
            'subject'      => "Your content has been approved! 🎉 — DayalStock",
            'title'        => '🎉 Content Approved!',
            'body'         => "<p>Hi " . htmlspecialchars($recipientName) . ",</p>
                               <p>Great news! Your content <strong>\"" . htmlspecialchars($contentTitle) . "\"</strong> has been approved by our review team.</p>
                               <p>It is now live on DayalStock and available for users.</p>",
            'icon'         => '✅',
            'accent_color' => '#10B981',
            'cta_text'     => 'View Your Dashboard',
            'cta_url'      => 'https://contributor.dayalstock.com/dashboard/files/published',
            'footer_note'  => 'Keep up the great work and continue uploading high-quality content!',
        ],

        // ═══════════════════════════════════════════
        //  CONTENT REJECTED
        // ═══════════════════════════════════════════
        'content_rejected' => [
            'subject'      => "Update on your content submission — DayalStock",
            'title'        => 'Content Review Update',
            'body'         => "<p>Hi " . htmlspecialchars($recipientName) . ",</p>
                               <p>Thank you for submitting your content <strong>\"" . htmlspecialchars($contentTitle) . "\"</strong>.</p>
                               <p>After careful review, unfortunately, we are unable to approve this content.</p>" . 
                               ($reason ? "<p><strong>Reason:</strong> " . htmlspecialchars($reason) . "</p>" : ""),
            'icon'         => 'ℹ️',
            'accent_color' => '#EF4444',
            'footer_note'  => 'Please review our submission guidelines before your next upload.',
        ],

        // ═══════════════════════════════════════════
        //  IDENTITY APPROVED
        // ═══════════════════════════════════════════
        'identity_approved' => [
            'subject'      => "Identity Verification Successful! 🎉 — DayalStock",
            'title'        => '🎉 Verification Approved!',
            'body'         => "<p>Hi " . htmlspecialchars($recipientName) . ",</p>
                               <p>Great news! Your identity document (NID/Passport) has been verified and approved.</p>
                               <p>Your account is now fully verified. Thank you for completing this step.</p>",
            'icon'         => '✅',
            'accent_color' => '#10B981',
            'cta_text'     => 'Go to Dashboard',
            'cta_url'      => 'https://contributor.dayalstock.com/dashboard',
            'footer_note'  => 'Your verified status adds credibility to your profile!',
        ],

        // ═══════════════════════════════════════════
        //  IDENTITY REJECTED
        // ═══════════════════════════════════════════
        'identity_rejected' => [
            'subject'      => "Identity Verification Failed — DayalStock",
            'title'        => 'Verification Update',
            'body'         => "<p>Hi " . htmlspecialchars($recipientName) . ",</p>
                               <p>We reviewed your submitted identity document (NID/Passport), but unfortunately, it was rejected.</p>" . 
                               ($reason ? "<p><strong>Reason:</strong> " . htmlspecialchars($reason) . "</p>" : "") . "
                               <p>Please upload a clear, valid document to complete your verification.</p>",
            'icon'         => '⚠️',
            'accent_color' => '#EF4444',
            'cta_text'     => 'Re-submit Document',
            'cta_url'      => 'https://contributor.dayalstock.com/dashboard/settings',
            'footer_note'  => 'Ensure all details on the document are readable and match your profile.',
        ],

        // ═══════════════════════════════════════════
        //  PAYOUT APPROVED
        // ═══════════════════════════════════════════
        'payout_approved' => [
            'subject'      => "Withdrawal Request Processed! 💸 — DayalStock",
            'title'        => '💸 Payment Sent!',
            'body'         => "<p>Hi " . htmlspecialchars($recipientName) . ",</p>
                               <p>Great news! Your withdrawal request for <strong>" . htmlspecialchars($amount) . "</strong> has been processed successfully.</p>
                               <p>The funds should be available in your selected payment method (" . htmlspecialchars($method) . ") shortly.</p>",
            'icon'         => '✅',
            'accent_color' => '#10B981',
            'cta_text'     => 'View Earnings',
            'cta_url'      => 'https://contributor.dayalstock.com/dashboard/finance/earnings',
            'footer_note'  => 'Thank you for your continuous contributions!',
        ],

        // ═══════════════════════════════════════════
        //  PAYOUT REJECTED
        // ═══════════════════════════════════════════
        'payout_rejected' => [
            'subject'      => "Update on your Withdrawal Request — DayalStock",
            'title'        => 'Withdrawal Update',
            'body'         => "<p>Hi " . htmlspecialchars($recipientName) . ",</p>
                               <p>We reviewed your recent withdrawal request for <strong>" . htmlspecialchars($amount) . "</strong>, but unfortunately, it was rejected.</p>" . 
                               ($reason ? "<p><strong>Reason:</strong> " . htmlspecialchars($reason) . "</p>" : "") . "
                               <p>The funds have been returned to your wallet. Please check your payout settings or contact support for help.</p>",
            'icon'         => '⚠️',
            'accent_color' => '#EF4444',
            'cta_text'     => 'Go to Support',
            'cta_url'      => 'https://contributor.dayalstock.com/dashboard/support/tickets',
            'footer_note'  => 'Ensure your payment details are correct and up-to-date.',
        ],

    ];

    return $templates[$type] ?? null;
}


/**
 * Build the full branded HTML email from template data.
 */
function buildEmailHtml(string $recipientName, string $title, string $body, string $fromEmail, array $template): string {
    $accentColor = $template['accent_color'] ?? '#6C4FE0';
    $icon        = $template['icon'] ?? '';
    $ctaText     = $template['cta_text'] ?? '';
    $ctaUrl      = $template['cta_url'] ?? '';
    $infoBox     = $template['info_box'] ?? null;
    $footerNote  = $template['footer_note'] ?? '';
    $year        = date('Y');

    // Build info box HTML
    $infoBoxHtml = '';
    if ($infoBox) {
        $itemsHtml = '';
        foreach ($infoBox['items'] as $item) {
            $itemsHtml .= '<tr><td style="padding: 8px 0; font-size: 14px; color: #4b5563; line-height: 1.5;">' . $item . '</td></tr>';
        }
        $infoBoxHtml = '
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; background-color: #f8f7ff; border-radius: 12px; border: 1px solid #e8e5f7;">
            <tr>
                <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #1f2937;">' . htmlspecialchars($infoBox['title']) . '</p>
                    <table width="100%" cellpadding="0" cellspacing="0">' . $itemsHtml . '</table>
                </td>
            </tr>
        </table>';
    }

    // Build CTA button HTML
    $ctaHtml = '';
    if ($ctaText && $ctaUrl) {
        $ctaHtml = '
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0 8px 0;">
            <tr>
                <td align="center">
                    <a href="' . htmlspecialchars($ctaUrl) . '" target="_blank" style="
                        display: inline-block;
                        padding: 14px 36px;
                        background: linear-gradient(135deg, ' . $accentColor . ' 0%, #5438b8 100%);
                        color: #ffffff;
                        font-size: 15px;
                        font-weight: 700;
                        text-decoration: none;
                        border-radius: 10px;
                        letter-spacing: 0.3px;
                        box-shadow: 0 4px 14px rgba(108, 79, 224, 0.35);
                    ">' . htmlspecialchars($ctaText) . '</a>
                </td>
            </tr>
        </table>';
    }

    // Build footer note HTML
    $footerNoteHtml = '';
    if ($footerNote) {
        $footerNoteHtml = '
        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0 0 0; background-color: #fef9f0; border-radius: 10px; border-left: 4px solid #f59e0b;">
            <tr>
                <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">💡 <strong>Tip:</strong> ' . htmlspecialchars($footerNote) . '</p>
                </td>
            </tr>
        </table>';
    }

    return '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>' . htmlspecialchars($title) . '</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    
    <!-- Wrapper -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 32px 16px;">
        <tr>
            <td align="center">
                
                <!-- Main Container -->
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06);">
                    
                    <!-- Header Bar -->
                    <tr>
                        <td style="background: linear-gradient(135deg, ' . $accentColor . ' 0%, #5438b8 100%); padding: 28px 32px; text-align: center;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <!-- Logo -->
                                        <p style="margin: 0; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                                            Dayal<span style="opacity: 0.85;">Stock</span>
                                        </p>
                                        <p style="margin: 6px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 2px;">
                                            Contributor Hub
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content Area -->
                    <tr>
                        <td style="padding: 36px 32px 28px 32px;">
                            
                            <!-- Title -->
                            <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #111827; line-height: 1.3;">
                                ' . htmlspecialchars($title) . '
                            </h1>
                            
                            <!-- Greeting -->
                            <p style="margin: 0 0 20px 0; font-size: 15px; color: #6b7280;">
                                Hi <strong style="color: #374151;">' . htmlspecialchars($recipientName) . '</strong>,
                            </p>
                            
                            <!-- Divider -->
                            <hr style="border: none; height: 1px; background-color: #f3f4f6; margin: 0 0 20px 0;">
                            
                            <!-- Body Content -->
                            <div style="font-size: 15px; line-height: 1.7; color: #374151;">
                                ' . $body . '
                            </div>
                            
                            ' . $infoBoxHtml . '
                            
                            ' . $ctaHtml . '
                            
                            ' . $footerNoteHtml . '
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #f3f4f6;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 8px 0; font-size: 13px; color: #9ca3af;">
                                            &copy; ' . $year . ' DayalStock. All rights reserved.
                                        </p>
                                        <p style="margin: 0; font-size: 12px; color: #d1d5db;">
                                            If you have questions, contact us at 
                                            <a href="mailto:' . htmlspecialchars($fromEmail) . '" style="color: ' . $accentColor . '; text-decoration: none;">' . htmlspecialchars($fromEmail) . '</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
                <!-- End Main Container -->
                
            </td>
        </tr>
    </table>
    <!-- End Wrapper -->
    
</body>
</html>';
}
