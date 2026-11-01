<?php

if (!defined('SL_SMTP_HOST')) {
    define('SL_SMTP_HOST', 'ssl://smtp.gmail.com');
    define('SL_SMTP_PORT', 465);
    define('SL_SMTP_USER', 'supplylinkbdltd@gmail.com');
    define('SL_SMTP_PASS', 'osgpenunfhcprbpp');
    define('SL_ADMIN_EMAIL', 'supplylinkb@gmail.com');
    define('SL_SENDER_NAME', 'SupplyLink Limited');
}

/**
 * SupplyLink Email Logger: Saves full HTML and delivery status into email_logs table
 */
function sl_log_email($to, $subject, $htmlBody, $status, $errorMessage = null, $meta = []) {
    global $mysqli;
    if (!isset($mysqli) || !($mysqli instanceof mysqli)) {
        if (file_exists(__DIR__ . '/../db.php')) {
            require_once __DIR__ . '/../db.php';
        }
    }
    if (!isset($mysqli) || !($mysqli instanceof mysqli)) return;

    try {
        $sender = SL_SENDER_NAME;
        $category = $meta['category'] ?? '';
        $eventType = $meta['event_type'] ?? '';
        $relatedId = isset($meta['related_id']) ? intval($meta['related_id']) : null;

        // Auto detect category and eventType if not explicitly passed
        if (empty($category)) {
            if (stripos($subject, 'Asset') !== false || stripos($subject, 'Share') !== false || stripos($subject, 'Rental') !== false || stripos($subject, 'অ্যাসেট') !== false) {
                $category = 'others_profit';
            } elseif (stripos($subject, 'Withdraw') !== false || stripos($subject, 'উইথড্র') !== false) {
                $category = 'withdraw';
            } elseif (stripos($subject, 'Investment') !== false || stripos($subject, 'বিনিয়োগ') !== false) {
                $category = 'investor';
            } elseif (stripos($subject, 'Installment') !== false || stripos($subject, 'কিস্তি') !== false) {
                $category = 'installment';
            } elseif (stripos($subject, 'User') !== false || stripos($subject, 'ইউজার') !== false) {
                $category = 'user';
            } else {
                $category = 'general';
            }
        }
        if (empty($eventType)) {
            $eventType = 'email_alert';
        }

        $stmt = $mysqli->prepare("
            INSERT INTO email_logs (recipient, sender, subject, category, event_type, related_id, html_body, status, error_message, sent_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        if ($stmt) {
            $stmt->bind_param("sssssisss", $to, $sender, $subject, $category, $eventType, $relatedId, $htmlBody, $status, $errorMessage);
            $stmt->execute();
            $stmt->close();
        }
    } catch (\Throwable $e) {
        error_log("Failed to log email to email_logs: " . $e->getMessage());
    }
}

/**
 * Raw Socket SMTP sender (zero external dependencies)
 */
function sl_smtp_send($to, $subject, $htmlBody, $fromName = SL_SENDER_NAME, $inlineAttachments = [], $meta = []) {
    $host = SL_SMTP_HOST;
    $port = SL_SMTP_PORT;
    $user = SL_SMTP_USER;
    $pass = SL_SMTP_PASS;

    $socket = @stream_socket_client($host . ":" . $port, $errno, $errstr, 12, STREAM_CLIENT_CONNECT);
    if (!$socket) {
        error_log("SupplyLink Mailer Socket Error: $errstr ($errno)");
        sl_log_email($to, $subject, $htmlBody, 'failed', "Socket connection failed: $errstr ($errno)", $meta);
        return ["success" => false, "error" => "Socket connection failed: $errstr"];
    }

    $read = function($expectedCode) use ($socket) {
        $response = "";
        while ($line = fgets($socket, 512)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') break;
        }
        $code = substr($response, 0, 3);
        return [
            "ok" => ($code === (string)$expectedCode),
            "code" => $code,
            "response" => $response
        ];
    };

    $write = function($cmd) use ($socket) {
        fputs($socket, $cmd . "\r\n");
    };

    // Greeting 220
    $r = $read(220);
    if (!$r['ok']) { 
        fclose($socket); 
        sl_log_email($to, $subject, $htmlBody, 'failed', "Greeting: " . $r['response'], $meta);
        return ["success" => false, "error" => "Greeting: " . $r['response']]; 
    }

    // EHLO
    $write("EHLO " . (gethostname() ?: "localhost"));
    $r = $read(250);
    if (!$r['ok']) { 
        fclose($socket); 
        sl_log_email($to, $subject, $htmlBody, 'failed', "EHLO: " . $r['response'], $meta);
        return ["success" => false, "error" => "EHLO: " . $r['response']]; 
    }

    // AUTH LOGIN
    $write("AUTH LOGIN");
    $r = $read(334);
    if (!$r['ok']) { 
        fclose($socket); 
        sl_log_email($to, $subject, $htmlBody, 'failed', "AUTH: " . $r['response'], $meta);
        return ["success" => false, "error" => "AUTH: " . $r['response']]; 
    }

    $write(base64_encode($user));
    $r = $read(334);
    if (!$r['ok']) { 
        fclose($socket); 
        sl_log_email($to, $subject, $htmlBody, 'failed', "User: " . $r['response'], $meta);
        return ["success" => false, "error" => "User: " . $r['response']]; 
    }

    $write(base64_encode($pass));
    $r = $read(235);
    if (!$r['ok']) { 
        fclose($socket); 
        sl_log_email($to, $subject, $htmlBody, 'failed', "Password auth failed: " . $r['response'], $meta);
        return ["success" => false, "error" => "Password auth failed: " . $r['response']]; 
    }

    // MAIL FROM
    $write("MAIL FROM:<$user>");
    $r = $read(250);
    if (!$r['ok']) { 
        fclose($socket); 
        sl_log_email($to, $subject, $htmlBody, 'failed', "MAIL FROM: " . $r['response'], $meta);
        return ["success" => false, "error" => "MAIL FROM: " . $r['response']]; 
    }

    // RCPT TO
    $write("RCPT TO:<$to>");
    $r = $read(250);
    if (!$r['ok']) { 
        fclose($socket); 
        sl_log_email($to, $subject, $htmlBody, 'failed', "RCPT TO: " . $r['response'], $meta);
        return ["success" => false, "error" => "RCPT TO: " . $r['response']]; 
    }

    // DATA
    $write("DATA");
    $r = $read(354);
    if (!$r['ok']) { 
        fclose($socket); 
        sl_log_email($to, $subject, $htmlBody, 'failed', "DATA: " . $r['response'], $meta);
        return ["success" => false, "error" => "DATA: " . $r['response']]; 
    }

    $encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";
    $encodedFromName = "=?UTF-8?B?" . base64_encode($fromName) . "?=";

    // Filter valid inline attachments
    $validAttachments = [];
    if (!empty($inlineAttachments)) {
        foreach ($inlineAttachments as $att) {
            $fPath = $att['path'] ?? '';
            if (!empty($fPath) && file_exists($fPath)) {
                $rawBytes = @file_get_contents($fPath);
                if ($rawBytes !== false) {
                    $validAttachments[] = [
                        'cid'      => $att['cid'] ?? 'image_' . uniqid(),
                        'filename' => $att['name'] ?? basename($fPath),
                        'mime'     => $att['mime'] ?? 'image/jpeg',
                        'data'     => chunk_split(base64_encode($rawBytes))
                    ];
                }
            }
        }
    }

    if (!empty($validAttachments)) {
        $boundary = "==_Part_" . md5(uniqid((string)microtime(true), true));
        $headers = [
            "From: $encodedFromName <$user>",
            "To: <$to>",
            "Reply-To: $encodedFromName <$user>",
            "Subject: $encodedSubject",
            "MIME-Version: 1.0",
            "Content-Type: multipart/related; boundary=\"$boundary\"",
            "X-Mailer: SupplyLink FinTech Engine",
            "Date: " . date("r")
        ];

        $bodyParts = [];
        // 1. HTML part
        $bodyParts[] = "--" . $boundary;
        $bodyParts[] = "Content-Type: text/html; charset=UTF-8";
        $bodyParts[] = "Content-Transfer-Encoding: base64\r\n";
        $bodyParts[] = chunk_split(base64_encode($htmlBody));

        // 2. Inline attachments
        foreach ($validAttachments as $att) {
            $bodyParts[] = "--" . $boundary;
            $bodyParts[] = "Content-Type: " . $att['mime'] . "; name=\"" . $att['filename'] . "\"";
            $bodyParts[] = "Content-Transfer-Encoding: base64";
            $bodyParts[] = "Content-ID: <" . $att['cid'] . ">";
            $bodyParts[] = "Content-Disposition: inline; filename=\"" . $att['filename'] . "\"\r\n";
            $bodyParts[] = $att['data'];
        }

        $bodyParts[] = "--" . $boundary . "--";
        $emailContent = implode("\r\n", $headers) . "\r\n\r\n" . implode("\r\n", $bodyParts) . "\r\n.";
    } else {
        $headers = [
            "From: $encodedFromName <$user>",
            "To: <$to>",
            "Reply-To: $encodedFromName <$user>",
            "Subject: $encodedSubject",
            "MIME-Version: 1.0",
            "Content-Type: text/html; charset=UTF-8",
            "Content-Transfer-Encoding: base64",
            "X-Mailer: SupplyLink FinTech Engine",
            "Date: " . date("r")
        ];

        $emailContent = implode("\r\n", $headers) . "\r\n\r\n" . chunk_split(base64_encode($htmlBody)) . "\r\n.";
    }

    $write($emailContent);

    $r = $read(250);
    if (!$r['ok']) { 
        fclose($socket); 
        sl_log_email($to, $subject, $htmlBody, 'failed', "Send: " . $r['response'], $meta);
        return ["success" => false, "error" => "Send: " . $r['response']]; 
    }

    $write("QUIT");
    fclose($socket);

    // 🌟 Log success to email_logs
    sl_log_email($to, $subject, $htmlBody, 'sent', null, $meta);

    return ["success" => true];
}


function sendSupplyLinkNotification($recipientEmail, $subject, $htmlBody, $meta = []) {
    global $mysqli;

    $results = [];

    // 1. Send to user/investor if email is present
    if (!empty($recipientEmail) && filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
        $resUser = sl_smtp_send($recipientEmail, $subject, $htmlBody);
        $results['user_email'] = $resUser;
    }

    // 2. Send master copy to Admin email
    $adminSubject = "[Admin Alert] " . $subject;
    $resAdmin = sl_smtp_send(SL_ADMIN_EMAIL, $adminSubject, $htmlBody);
    $results['admin_email'] = $resAdmin;

    // 3. Insert into in-app notifications table for Admin Panel
    if (isset($mysqli) && $mysqli instanceof mysqli) {
        try {
            $notifType = $meta['type'] ?? 'transaction';
            $notifTitle = $meta['title'] ?? $subject;
            $notifMsg   = $meta['message'] ?? strip_tags($subject);
            $notifLink  = $meta['link'] ?? '/';
            $userId     = !empty($meta['user_id']) ? (int)$meta['user_id'] : null;

            $stmt = $mysqli->prepare("
                INSERT INTO notifications (user_id, target_roles, type, title, message, link, is_read, created_at)
                VALUES (?, 'admin,developer', ?, ?, ?, ?, 0, NOW())
            ");
            if ($stmt) {
                $stmt->bind_param("issss", $userId, $notifType, $notifTitle, $notifMsg, $notifLink);
                $stmt->execute();
                $stmt->close();
            }
        } catch (Throwable $dbErr) {
            error_log("In-app notification insert error: " . $dbErr->getMessage());
        }
    }

    return $results;
}

/**
 * Renders a premium SupplyLink HTML Email Voucher
 */
function renderSupplyLinkEmailTemplate($data) {
    $title       = htmlspecialchars($data['title'] ?? 'Digital Transaction Voucher');
    $partyName   = htmlspecialchars($data['party_name'] ?? 'গ্রাহক / ইনভেস্টর');
    $category    = htmlspecialchars($data['category'] ?? 'কিস্তি আদায়');
    $amount      = number_format(floatval($data['amount'] ?? 0), 2);
    $date        = htmlspecialchars($data['date'] ?? date('Y-m-d'));
    $time        = date('h:i A');
    $slipNo      = htmlspecialchars($data['slip_no'] ?? 'N/A');
    $cardId      = htmlspecialchars($data['card_id'] ?? 'N/A');
    $collector   = htmlspecialchars($data['collector'] ?? 'স্টাফ');
    $notes       = htmlspecialchars($data['notes'] ?? 'অর্থ সফলভাবে আদায় ও সিস্টেমে অন্তর্ভুক্ত হয়েছে।');

    return <<<HTML
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070c18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070c18; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 560px; background: linear-gradient(145deg, #0d162b, #070e1c); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.8);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e1b4b 100%); padding: 30px 25px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 12px; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #e0f2fe; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
                SupplyLink Enterprise System
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                {$title}
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #bae6fd;">
                অফিসিয়াল ডিজিটাল লেনদেন ভাউচার
              </p>
            </td>
          </tr>

          <!-- Amount Highlight Card -->
          <tr>
            <td style="padding: 25px 30px 10px 30px; text-align: center;">
              <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 18px; padding: 20px;">
                <span style="font-size: 11px; font-weight: 700; color: #6ee7b7; text-transform: uppercase; letter-spacing: 1.5px; display: block;">
                  সংগৃহীত / পরিশোধিত পরিমাণ
                </span>
                <div style="font-size: 34px; font-weight: 900; color: #34d399; margin: 8px 0; font-family: monospace;">
                  ৳ {$amount}
                </div>
                <span style="font-size: 11px; color: #94a3b8; font-family: monospace;">
                  ক্যাশ ইন হ্যান্ড • ডিজিটাল ট্রানজেকশন সফল ✅
                </span>
              </div>
            </td>
          </tr>

          <!-- Breakdown Ledger Details -->
          <tr>
            <td style="padding: 20px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 18px;">
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">নাম / প্রতিষ্ঠান</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #ffffff; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">{$partyName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">লেনদেনের ধরন</td>
                  <td style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #38bdf8; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">{$category}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">কার্ড / স্লিপ নম্বর</td>
                  <td style="padding: 8px 0; font-size: 12px; font-weight: 700; color: #fbbf24; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">কার্ড #{$cardId} | স্লিপ #{$slipNo}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">তারিখ ও সময়</td>
                  <td style="padding: 8px 0; font-size: 12px; font-family: monospace; color: #cbd5e1; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">{$date} • {$time}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8;">আদায়কারী কর্মী / আইডি</td>
                  <td style="padding: 8px 0; font-size: 12px; color: #cbd5e1; text-align: right;">{$collector}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notes Callout -->
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <div style="background: rgba(30, 41, 59, 0.4); border-left: 3px solid #0284c7; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                <strong style="color: #38bdf8;">মন্তব্য:</strong> {$notes}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(0,0,0,0.4); border-top: 1px solid rgba(255,255,255,0.06); padding: 20px 30px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.6;">
                এই ডিজিটাল রসিদটি <strong>SupplyLink</strong> সেন্ট্রাল সার্ভার দ্বারা স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত।<br>
                যোগাযোগ: <a href="mailto:supplylinkbdltd@gmail.com" style="color: #38bdf8; text-decoration: none;">supplylinkbdltd@gmail.com</a> | ওয়েবসাইট: <a href="https://supplylinkbd.com" style="color: #38bdf8; text-decoration: none;">supplylinkbd.com</a>
              </p>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #475569; font-family: monospace;">
                © 2026 SupplyLink Limited. All Rights Reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

/**
 * Renders a premium HTML email for new user creation with profile picture
 */
function renderNewUserEmailTemplate($data) {
    $userId      = htmlspecialchars($data['user_id'] ?? 'N/A');
    $name        = htmlspecialchars($data['name'] ?? 'N/A');
    $role        = htmlspecialchars($data['role'] ?? 'User');
    $mobile      = htmlspecialchars($data['mobile'] ?? 'N/A');
    $email       = htmlspecialchars($data['email'] ?? 'N/A');
    $idType      = htmlspecialchars($data['id_type'] ?? 'NID');
    $idNumber    = htmlspecialchars($data['id_number'] ?? 'N/A');
    $address     = htmlspecialchars($data['address'] ?? 'N/A');
    $startDate   = htmlspecialchars($data['start_date'] ?? date('Y-m-d'));
    $createdTime = date('d M Y, h:i A');
    $photoUrl    = $data['photo_url'] ?? '';
    $photoBase64 = $data['photo_base64'] ?? '';

    // Role display in Bengali
    $roleNames = [
        'admin'      => 'অ্যাডমিন (Admin)',
        'manager'    => 'ম্যানেজার (Manager)',
        'staff'      => 'অফিস স্টাফ (Staff)',
        'developer'  => 'ডেভেলপার (Developer)',
        'investor'   => 'বিনিয়োগকারী (Investor)',
        'customer'   => 'গ্রাহক (Customer)',
        'supplier'   => 'সাপ্লায়ার (Supplier)',
        'granter'    => 'জামিনদার (Granter)',
    ];
    $roleDisplay = $roleNames[strtolower($role)] ?? strtoupper($role);

    $hasPhoto = !empty($data['has_photo']);
    $avatarHtml = '';
    if ($hasPhoto) {
        $avatarHtml = '
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="cid:user_photo" alt="Profile Photo" width="110" height="110" style="width: 110px; height: 110px; object-fit: cover; border-radius: 55px; border: 4px solid #6366f1; box-shadow: 0 10px 30px rgba(99,102,241,0.45); display: inline-block;" />
          <div style="margin-top: 8px; font-size: 11px; color: #a5b4fc; font-family: monospace;">প্রোফাইল ছবি (Profile Photo)</div>
        </div>';
    } else {
        $firstChar = mb_substr($name, 0, 1, 'UTF-8');
        $avatarHtml = '
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="width: 80px; height: 80px; border-radius: 40px; background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; font-size: 34px; font-weight: 700; line-height: 80px; margin: 0 auto; box-shadow: 0 10px 25px rgba(99,102,241,0.35); text-align: center;">' . $firstChar . '</div>
        </div>';
    }

    return <<<HTML
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New User Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070c18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070c18; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background: linear-gradient(145deg, #0e172e, #070e1c); border: 1px solid rgba(99,102,241,0.25); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.85);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #1e1b4b 100%); padding: 32px 25px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #ede9fe; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px;">
                SupplyLink User Registration
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                🎉 নতুন ইউজার তৈরি হয়েছে
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #ddd6fe;">
                সিস্টেমে একজন নতুন মেম্বারের প্রোফাইল সফলভাবে অন্তর্ভুক্ত করা হয়েছে
              </p>
            </td>
          </tr>

          <!-- Profile Photo Card -->
          <tr>
            <td style="padding: 28px 30px 10px 30px;">
              {$avatarHtml}
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">{$name}</h2>
                <div style="display: inline-block; background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.35); color: #a5b4fc; font-size: 12px; font-weight: 600; padding: 4px 14px; border-radius: 20px; margin-top: 6px;">
                  {$roleDisplay}
                </div>
              </div>
            </td>
          </tr>

          <!-- User Details Table -->
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 18px 20px;">
                <tr>
                  <td style="padding: 10px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">ইউজার আইডি (User ID)</td>
                  <td style="padding: 10px 0; font-size: 13px; font-weight: 700; color: #818cf8; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">#{$userId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">মোবাইল নম্বর (Phone)</td>
                  <td style="padding: 10px 0; font-size: 13px; font-weight: 700; color: #34d399; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$mobile}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">ইমেইল (Email)</td>
                  <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #38bdf8; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$email}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">আইডি তথ্য (ID Card)</td>
                  <td style="padding: 10px 0; font-size: 12px; font-weight: 600; color: #38bdf8; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$idType}: {$idNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">শুরুর তারিখ (Start Date)</td>
                  <td style="padding: 10px 0; font-size: 12px; font-family: monospace; color: #cbd5e1; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$startDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">তৈরির সময় (Created At)</td>
                  <td style="padding: 10px 0; font-size: 12px; font-family: monospace; color: #cbd5e1; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$createdTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0 4px 0; font-size: 12px; color: #94a3b8; vertical-align: top;">ঠিকানা (Address)</td>
                  <td style="padding: 10px 0 4px 0; font-size: 12px; color: #e2e8f0; text-align: right; line-height: 1.5;">{$address}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <div style="background: rgba(99,102,241,0.08); border-left: 3px solid #6366f1; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #cbd5e1; line-height: 1.5;">
                <strong style="color: #a5b4fc;">সতর্কতা:</strong> এটি একটি সিস্টেম নোটিফিকেশন। নতুন ইউজারকে প্রয়োজনীয় পারমিশন অথবা রোল অ্যাসাইনমেন্ট যাচাই করার অনুরোধ করা হচ্ছে।
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(0,0,0,0.45); border-top: 1px solid rgba(255,255,255,0.06); padding: 20px 30px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.6;">
                এই নোটিফিকেশনটি <strong>SupplyLink</strong> সেন্ট্রাল সার্ভার দ্বারা স্বয়ংক্রিয়ভাবে প্রেরিত।<br>
                অ্যাডমিন সাপোর্ট: <a href="mailto:supplylinkbdltd@gmail.com" style="color: #818cf8; text-decoration: none;">supplylinkbdltd@gmail.com</a>
              </p>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #475569; font-family: monospace;">
                © 2026 SupplyLink Limited. All Rights Reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

/**
 * Renders a specialized, welcoming HTML email for the user when their account is activated
 */
function renderUserAccountActivatedEmailTemplate($data) {
    $userId      = htmlspecialchars($data['user_id'] ?? 'N/A');
    $name        = htmlspecialchars($data['name'] ?? 'সম্মানিত গ্রাহক / মেম্বার');
    $role        = htmlspecialchars($data['role'] ?? 'User');
    $mobile      = htmlspecialchars($data['mobile'] ?? 'N/A');
    $email       = htmlspecialchars($data['email'] ?? 'N/A');
    $startDate   = htmlspecialchars($data['start_date'] ?? date('Y-m-d'));
    $photoUrl    = $data['photo_url'] ?? '';
    $photoBase64 = $data['photo_base64'] ?? '';

    $roleNames = [
        'admin'      => 'অ্যাডমিন (Admin)',
        'manager'    => 'ম্যানেজার (Manager)',
        'staff'      => 'অফিস স্টাফ (Staff)',
        'developer'  => 'ডেভেলপার (Developer)',
        'investor'   => 'বিনিয়োগকারী (Investor)',
        'customer'   => 'গ্রাহক (Customer)',
        'supplier'   => 'সাপ্লায়ার (Supplier)',
        'granter'    => 'জামিনদার (Granter)',
    ];
    $roleDisplay = $roleNames[strtolower($role)] ?? strtoupper($role);

    $hasPhoto = !empty($data['has_photo']);
    $avatarHtml = '';
    if ($hasPhoto) {
        $avatarHtml = '
        <div style="text-align: center; margin-bottom: 18px;">
          <img src="cid:user_photo" alt="Profile Photo" width="100" height="100" style="width: 100px; height: 100px; object-fit: cover; border-radius: 50px; border: 3px solid #10b981; box-shadow: 0 10px 25px rgba(16,185,129,0.35); display: inline-block;" />
        </div>';
    } else {
        $firstChar = mb_substr($name, 0, 1, 'UTF-8');
        $avatarHtml = '
        <div style="text-align: center; margin-bottom: 18px;">
          <div style="width: 76px; height: 76px; border-radius: 38px; background: linear-gradient(135deg, #10b981, #0284c7); color: #fff; font-size: 32px; font-weight: 700; line-height: 76px; margin: 0 auto; box-shadow: 0 10px 25px rgba(16,185,129,0.35); text-align: center;">' . $firstChar . '</div>
        </div>';
    }

    return <<<HTML
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Account is Active</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070c18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070c18; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background: linear-gradient(145deg, #0a1428, #070e1c); border: 1px solid rgba(16,185,129,0.25); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.85);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #0d9488 50%, #1e1b4b 100%); padding: 32px 25px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #d1fae5; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px;">
                SupplyLink Enterprise
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                🎉 আপনার অ্যাকাউন্ট সক্রিয় করা হয়েছে
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #a7f3d0;">
                Your Account Has Been Successfully Activated
              </p>
            </td>
          </tr>

          <!-- Welcome Message & Avatar -->
          <tr>
            <td style="padding: 28px 30px 15px 30px;">
              {$avatarHtml}
              <div style="text-align: center;">
                <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">প্রিয় {$name},</h2>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                  <strong>SupplyLink</strong> প্ল্যাটফর্মে আপনাকে আন্তরিক স্বাগতম! আপনার অ্যাকাউন্টটি সফলভাবে তৈরি ও সক্রিয় করা হয়েছে। এখন থেকে আপনি আমাদের সকল ডিজিটাল সেবা গ্রহণ করতে পারবেন।
                </p>
                <div style="display: inline-block; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.35); color: #6ee7b7; font-size: 12px; font-weight: 700; padding: 5px 16px; border-radius: 20px; margin-top: 12px;">
                  অ্যাকাউন্ট স্ট্যাটাস: ACTIVE (সক্রিয়) ✅
                </div>
              </div>
            </td>
          </tr>

          <!-- User Credentials & Account Information -->
          <tr>
            <td style="padding: 10px 30px 20px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(0,0,0,0.38); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 18px 20px;">
                <tr>
                  <td style="padding: 10px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">অ্যাকাউন্ট আইডি (Account ID)</td>
                  <td style="padding: 10px 0; font-size: 13px; font-weight: 700; color: #34d399; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">#{$userId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">অ্যাকাউন্টের ধরন (Type)</td>
                  <td style="padding: 10px 0; font-size: 12px; font-weight: 700; color: #6ee7b7; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$roleDisplay}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">রেজিস্টার্ড মোবাইল (Phone)</td>
                  <td style="padding: 10px 0; font-size: 13px; font-weight: 700; color: #ffffff; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$mobile}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">রেজিস্টার্ড ইমেইল (Email)</td>
                  <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #38bdf8; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$email}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0 4px 0; font-size: 12px; color: #94a3b8;">সক্রিয় হওয়ার তারিখ (Date)</td>
                  <td style="padding: 10px 0 4px 0; font-size: 12px; font-family: monospace; color: #cbd5e1; text-align: right;">{$startDate}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Login Instructions / Notice -->
          <tr>
            <td style="padding: 0 30px 25px 30px;">
              <div style="background: rgba(16,185,129,0.08); border-left: 3px solid #10b981; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
                <strong style="color: #6ee7b7;">লগইন তথ্য:</strong> আপনি আপনার রেজিস্টার্ড মোবাইল নম্বর (<span style="font-family: monospace; color: #fff;">{$mobile}</span>) ব্যবহার করে আপনার অ্যাকাউন্টে অ্যাক্সেস করতে পারবেন। কোনো জিজ্ঞাসা থাকলে আমাদের হেল্পলাইনে যোগাযোগ করুন।
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(0,0,0,0.45); border-top: 1px solid rgba(255,255,255,0.06); padding: 20px 30px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.6;">
                এই বার্তাটি <strong>SupplyLink</strong> সেন্ট্রাল সার্ভার থেকে স্বয়ংক্রিয়ভাবে প্রেরিত।<br>
                যোগাযোগ: <a href="mailto:supplylinkbdltd@gmail.com" style="color: #10b981; text-decoration: none;">supplylinkbdltd@gmail.com</a> | ওয়েবসাইট: <a href="https://supplylinkbd.com" style="color: #10b981; text-decoration: none;">supplylinkbd.com</a>
              </p>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #475569; font-family: monospace;">
                © 2026 SupplyLink Limited. All Rights Reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

/**
 * Dispatches New User Registration Notification to Admin email and User (if email provided)
 */
function sendNewUserRegistrationNotification($userData) {
    global $mysqli;

    $name = $userData['name'] ?? 'User';
    $role = $userData['role'] ?? 'user';
    $subjectAdmin = "নতুন ইউজার তৈরি হয়েছে - {$name} (" . strtoupper($role) . ")";

    // Resolve photo file for inline CID attachment
    $attachments = [];
    $hasPhoto = false;
    $photoPath = $userData['full_photo_path'] ?? '';
    if (empty($photoPath) || !file_exists($photoPath)) {
        if (!empty($userData['photo_db'])) {
            $candidates = [
                rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/') . '/' . ltrim($userData['photo_db'], '/'),
                dirname(__DIR__, 2) . '/' . ltrim($userData['photo_db'], '/'),
                'C:/xampp/htdocs/' . ltrim($userData['photo_db'], '/'),
                'C:/xampp/htdocs/uploads/' . basename($userData['photo_db']),
            ];
            foreach ($candidates as $cand) {
                if (file_exists($cand)) {
                    $photoPath = $cand;
                    break;
                }
            }
        }
    }

    if (!empty($photoPath) && file_exists($photoPath)) {
        $ext = strtolower(pathinfo($photoPath, PATHINFO_EXTENSION));
        $mime = ($ext === 'png') ? 'image/png' : (($ext === 'webp') ? 'image/webp' : 'image/jpeg');

        $attachments[] = [
            'cid'  => 'user_photo',
            'path' => $photoPath,
            'mime' => $mime,
            'name' => basename($photoPath)
        ];
        $hasPhoto = true;
    }
    $userData['has_photo'] = $hasPhoto;

    $htmlBodyAdmin = renderNewUserEmailTemplate($userData);

    // 1. Send detailed audit alert to Admin with attachments
    $mailRes = sl_smtp_send(SL_ADMIN_EMAIL, "[Admin Alert] " . $subjectAdmin, $htmlBodyAdmin, SL_SENDER_NAME, $attachments);

    // 2. If user provided an email, send the user-friendly "Account Activated" message with attachments!
    if (!empty($userData['email']) && filter_var($userData['email'], FILTER_VALIDATE_EMAIL)) {
        $htmlBodyUser = renderUserAccountActivatedEmailTemplate($userData);
        $subjectUser  = "আপনার অ্যাকাউন্ট সক্রিয় করা হয়েছে - {$name} | SupplyLink";
        sl_smtp_send($userData['email'], $subjectUser, $htmlBodyUser, SL_SENDER_NAME, $attachments);
    }

    // 3. Insert in-app notification for Admin & Managers
    if (isset($mysqli) && $mysqli instanceof mysqli) {
        try {
            $stmt = $mysqli->prepare("
                INSERT INTO notifications (user_id, target_roles, type, title, message, link, is_read, created_at)
                VALUES (?, 'admin,manager,developer', 'user_created', ?, ?, '/all_users', 0, NOW())
            ");
            if ($stmt) {
                $uid = (int)($userData['user_id'] ?? 0);
                $title = "নতুন ইউজার: " . $name;
                $msg   = "রোল: " . strtoupper($role) . " | মোবাইল: " . ($userData['mobile'] ?? '');
                $link  = '/all_users';
                $stmt->bind_param("isss", $uid, $title, $msg, $link);
                $stmt->execute();
                $stmt->close();
            }
        } catch (Throwable $e) {
            error_log("Failed to insert user notification: " . $e->getMessage());
        }
    }

    return $mailRes;
}

/**
 * Renders an audit email for Admin detailing who modified a user and which fields were changed
 */
function renderUserEditAdminAlertTemplate($auditData) {
    $editorName   = htmlspecialchars($auditData['editor_name'] ?? 'অ্যাডমিন / স্টাফ');
    $editorRole   = htmlspecialchars(strtoupper($auditData['editor_role'] ?? 'ADMIN'));
    $editorId     = htmlspecialchars($auditData['editor_id'] ?? 'N/A');
    $targetName   = htmlspecialchars($auditData['target_name'] ?? 'N/A');
    $targetId     = htmlspecialchars($auditData['target_id'] ?? 'N/A');
    $targetMobile = htmlspecialchars($auditData['target_mobile'] ?? 'N/A');
    $targetEmail  = htmlspecialchars($auditData['target_email'] ?? 'N/A');
    $editTime     = date('d M Y, h:i A');
    $ip           = htmlspecialchars($_SERVER['REMOTE_ADDR'] ?? 'Unknown');
    $changes      = $auditData['changes'] ?? [];

    $diffRows = '';
    if (!empty($changes)) {
        foreach ($changes as $c) {
            $fName = htmlspecialchars($c['label'] ?? $c['field']);
            $oldV  = htmlspecialchars($c['old'] ?? '—');
            $newV  = htmlspecialchars($c['new'] ?? '—');
            if ($oldV === '') $oldV = '<span style="color:#64748b; font-style:italic;">(খালি ছিল)</span>';
            if ($newV === '') $newV = '<span style="color:#ef4444; font-style:italic;">(মুছে ফেলা হয়েছে)</span>';

            $diffRows .= '
            <tr>
              <td style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #cbd5e1; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02);">' . $fName . '</td>
              <td style="padding: 10px 12px; font-size: 12px; font-family: monospace; color: #f87171; border-bottom: 1px solid rgba(255,255,255,0.06); text-decoration: line-through; background: rgba(239,68,68,0.04);">' . $oldV . '</td>
              <td style="padding: 10px 12px; font-size: 12px; font-family: monospace; font-weight: 700; color: #34d399; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(16,185,129,0.06);">→ ' . $newV . '</td>
            </tr>';
        }
    } else {
        $diffRows = '
        <tr>
          <td colspan="3" style="padding: 14px; text-align: center; color: #94a3b8; font-size: 12px;">কোনো তথ্যের পরিবর্তন সনাক্ত হয়নি (Re-saved)।</td>
        </tr>';
    }

    return <<<HTML
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Profile Modified Audit</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070c18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070c18; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 620px; background: linear-gradient(145deg, #0e172e, #070e1c); border: 1px solid rgba(245,158,11,0.25); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.85);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #d97706 0%, #b45309 50%, #1e1b4b 100%); padding: 30px 25px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #fef3c7; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px;">
                Audit Control & Security Alert
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                📝 ইউজার প্রোফাইল এডিট করা হয়েছে
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #fde68a;">
                User Account Data Modified By System Staff/Admin
              </p>
            </td>
          </tr>

          <!-- Summary Meta Box -->
          <tr>
            <td style="padding: 24px 28px 10px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 14px 18px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #94a3b8;">কে এডিট করেছে (Edited By):</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #fbbf24; text-align: right;">{$editorName} ({$editorRole} #{$editorId})</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #94a3b8;">লক্ষ্য ইউজার (Target User):</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #38bdf8; text-align: right;">{$targetName} (ID: #{$targetId})</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #94a3b8;">ইউজারের মোবাইল / ইমেইল:</td>
                  <td style="padding: 6px 0; font-size: 12px; font-family: monospace; color: #cbd5e1; text-align: right;">{$targetMobile} • {$targetEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 12px; color: #94a3b8;">সময় ও আইপি (Timestamp):</td>
                  <td style="padding: 6px 0; font-size: 11px; font-family: monospace; color: #94a3b8; text-align: right;">{$editTime} • {$ip}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Field-by-Field Diff Table -->
          <tr>
            <td style="padding: 15px 28px 25px 28px;">
              <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.8px;">
                🔍 কি কি ফিল্ড পরিবর্তন করা হয়েছে (Modified Fields Diff):
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; border-collapse: collapse;">
                <thead>
                  <tr style="background: rgba(255,255,255,0.06); text-align: left;">
                    <th style="padding: 10px 12px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">ফিল্ড (Field)</th>
                    <th style="padding: 10px 12px; font-size: 11px; font-weight: 700; color: #f87171; text-transform: uppercase;">পূর্বের মান (Old)</th>
                    <th style="padding: 10px 12px; font-size: 11px; font-weight: 700; color: #34d399; text-transform: uppercase;">নতুন মান (New)</th>
                  </tr>
                </thead>
                <tbody>
                  {$diffRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(0,0,0,0.45); border-top: 1px solid rgba(255,255,255,0.06); padding: 18px 28px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.6;">
                এই অডিট রিপোর্টটি <strong>SupplyLink Security & Compliance Engine</strong> দ্বারা স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়েছে।
              </p>
              <p style="margin: 6px 0 0 0; font-size: 10px; color: #475569; font-family: monospace;">
                © 2026 SupplyLink Limited • Real-time Audit Trail
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

/**
 * Renders an informative update email for the User when their profile or email is edited
 */
function renderUserProfileUpdatedUserEmailTemplate($userData, $changedFields = []) {
    $name      = htmlspecialchars($userData['name'] ?? 'গ্রাহক / মেম্বার');
    $userId    = htmlspecialchars($userData['id'] ?? 'N/A');
    $mobile    = htmlspecialchars($userData['mobile'] ?? 'N/A');
    $email     = htmlspecialchars($userData['email'] ?? 'N/A');
    $idNumber  = htmlspecialchars($userData['id_number'] ?? 'N/A');
    $address   = htmlspecialchars($userData['address'] ?? 'N/A');
    $editTime  = date('d M Y, h:i A');

    $emailAddedNotice = '';
    foreach ($changedFields as $c) {
        if (($c['field'] ?? '') === 'email' && empty($c['old']) && !empty($c['new'])) {
            $emailAddedNotice = '
            <div style="background: rgba(16,185,129,0.12); border-left: 3px solid #10b981; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #6ee7b7; margin-bottom: 16px; line-height: 1.5;">
              ✅ <strong>আপনার অ্যাকাউন্টে নতুন ইমেইল যুক্ত হয়েছে:</strong> এখন থেকে সকল ডিজিটাল রসিদ ও অ্যাকাউন্টের জরুরি আপডেট এই ইমেইলে প্রেরিত হবে।
            </div>';
            break;
        }
    }

    return <<<HTML
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Profile Updated Notice</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070c18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070c18; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background: linear-gradient(145deg, #0a1428, #070e1c); border: 1px solid rgba(56,189,248,0.25); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.85);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e1b4b 100%); padding: 30px 25px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #e0f2fe; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px;">
                SupplyLink Notification
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                🔄 আপনার তথ্য আপডেট করা হয়েছে
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #bae6fd;">
                Your Account Profile Has Been Updated Successfully
              </p>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 26px 30px 15px 30px;">
              <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 800; color: #ffffff;">প্রিয় {$name},</h2>
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #94a3b8; line-height: 1.6;">
                সাপ্লাইলিঙ্ক অ্যাডমিন প্যানেল থেকে আপনার অ্যাকাউন্টের তথ্যাবলি সফলভাবে হালনাগাদ করা হয়েছে। আপনার বর্তমান সক্রিয় তথ্যাবলি নিচে উল্লেখ করা হলো:
              </p>
              {$emailAddedNotice}
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(0,0,0,0.38); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 16px 20px;">
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">অ্যাকাউন্ট আইডি (ID)</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #38bdf8; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">#{$userId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">নাম (Name)</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #ffffff; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">মোবাইল নম্বর (Phone)</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #34d399; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$mobile}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">ইমেইল (Email)</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: 600; color: #38bdf8; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">আইডি নম্বর (ID)</td>
                  <td style="padding: 8px 0; font-size: 12px; font-family: monospace; color: #cbd5e1; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$idNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0 2px 0; font-size: 12px; color: #94a3b8;">হালনাগাদের সময় (Updated At)</td>
                  <td style="padding: 8px 0 2px 0; font-size: 11px; font-family: monospace; color: #94a3b8; text-align: right;">{$editTime}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding: 0 30px 22px 30px;">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.5;">
                🔒 যদি এই পরিবর্তন আপনার জ্ঞাতসারে না হয়ে থাকে, তবে অনুগ্রহ করে অবিলম্বে SupplyLink সাপোর্টে যোগাযোগ করুন।
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(0,0,0,0.45); border-top: 1px solid rgba(255,255,255,0.06); padding: 18px 28px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.6;">
                যোগাযোগ: <a href="mailto:supplylinkbdltd@gmail.com" style="color: #38bdf8; text-decoration: none;">supplylinkbdltd@gmail.com</a> | ওয়েবসাইট: <a href="https://supplylinkbd.com" style="color: #38bdf8; text-decoration: none;">supplylinkbd.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

/**
 * Dispatches User Edit Audit Notification to Admin and to User (if user has email)
 */
function sendUserEditNotification($userData, $oldData, $changedFields, $actorData = []) {
    global $mysqli;

    $userName   = $userData['name'] ?? 'User';
    $userId     = $userData['id'] ?? 0;
    $editorName = $actorData['name'] ?? 'Admin / Staff';
    $editorRole = $actorData['role'] ?? 'admin';
    $editorId   = $actorData['id'] ?? 0;

    $auditPayload = [
        'editor_name'   => $editorName,
        'editor_role'   => $editorRole,
        'editor_id'     => $editorId,
        'target_name'   => $userName,
        'target_id'     => $userId,
        'target_mobile' => $userData['mobile'] ?? '',
        'target_email'  => $userData['email'] ?? '',
        'changes'       => $changedFields
    ];

    // 1. Send Audit alert to Admin
    $adminSubject = "[Audit Alert] ইউজার প্রোফাইল এডিট করা হয়েছে - {$userName} (ID: #{$userId})";
    $adminHtml    = renderUserEditAdminAlertTemplate($auditPayload);
    $adminMailRes = sl_smtp_send(SL_ADMIN_EMAIL, $adminSubject, $adminHtml);

    // 2. Send notification to the user IF user has a valid email (either existing or newly added)
    $targetEmail = !empty($userData['email']) ? trim($userData['email']) : (!empty($oldData['email']) ? trim($oldData['email']) : null);
    if (!empty($targetEmail) && filter_var($targetEmail, FILTER_VALIDATE_EMAIL)) {
        $userSubject = "আপনার প্রোফাইল তথ্য আপডেট করা হয়েছে - {$userName} | SupplyLink";
        $userHtml    = renderUserProfileUpdatedUserEmailTemplate($userData, $changedFields);
        sl_smtp_send($targetEmail, $userSubject, $userHtml);
    }

    // 3. Insert in-app notification for Admin & Managers
    if (isset($mysqli) && $mysqli instanceof mysqli) {
        try {
            $changedNames = [];
            foreach ($changedFields as $cf) {
                $changedNames[] = $cf['label'] ?? $cf['field'];
            }
            $changedSummary = !empty($changedNames) ? implode(', ', $changedNames) : 'সাধারণ তথ্য';

            $stmt = $mysqli->prepare("
                INSERT INTO notifications (user_id, target_roles, type, title, message, link, is_read, created_at)
                VALUES (?, 'admin,developer', 'user_updated', ?, ?, '/all_users', 0, NOW())
            ");
            if ($stmt) {
                $title = "ইউজার এডিট: {$userName} (#{$userId})";
                $msg   = "{$editorName} ({$editorRole}) কর্তৃক পরিবর্তিত ফিল্ড: {$changedSummary}";
                $link  = '/all_users';
                $stmt->bind_param("isss", $userId, $title, $msg, $link);
                $stmt->execute();
                $stmt->close();
            }
        } catch (Throwable $e) {
            error_log("Failed to insert user edit notification: " . $e->getMessage());
        }
    }

    return $adminMailRes;
}

/**
 * HTML Email Template for User when an Investment Card is created in their name
 */
function renderInvestmentCardCreatedUserTemplate($cardData, $userData, $referenceStaffData = null) {
    $name          = htmlspecialchars($userData['name'] ?? 'গ্রাহক', ENT_QUOTES, 'UTF-8');
    $userId        = (int)($userData['id'] ?? 0);
    $cardId        = (int)($cardData['id'] ?? 0);
    $cardName      = htmlspecialchars($cardData['card_name'] ?? 'ইনভেস্টমেন্ট কার্ড', ENT_QUOTES, 'UTF-8');
    $startDate     = htmlspecialchars($cardData['start_date'] ?? date('Y-m-d'), ENT_QUOTES, 'UTF-8');
    $maturityDate  = htmlspecialchars($cardData['maturity_date'] ?? '', ENT_QUOTES, 'UTF-8');
    $paymentTypeRaw= strtolower($cardData['payment_type'] ?? 'flexible');

    $paymentLabels = [
        'flexible' => 'Flexible (ফ্লেক্সিবল / যখন ইচ্ছা)',
        'onetime'  => 'এককালীন (Onetime)',
        'daily'    => 'দৈনিক (Daily)',
        'weekly'   => 'সাপ্তাহিক (Weekly)',
        'monthly'  => 'মাসিক (Monthly)',
    ];
    $paymentLabel = $paymentLabels[$paymentTypeRaw] ?? ucfirst($paymentTypeRaw);

    $staffRow = '';
    if (!empty($referenceStaffData) && !empty($referenceStaffData['name'])) {
        $staffName = htmlspecialchars($referenceStaffData['name'], ENT_QUOTES, 'UTF-8');
        $staffRow = <<<HTML
        <tr>
          <td style="padding: 10px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">রেফারেন্স কর্মী (Official Staff)</td>
          <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #a5b4fc; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$staffName}</td>
        </tr>
HTML;
    }

    return <<<HTML
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>নতুন ইনভেস্টমেন্ট কার্ড সক্রিয় করা হয়েছে</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070c18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070c18; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background: linear-gradient(145deg, #0a1428, #070e1c); border: 1px solid rgba(56,189,248,0.3); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.85);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0891b2 0%, #2563eb 50%, #4f46e5 100%); padding: 32px 25px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #e0f2fe; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px;">
                SupplyLink Investment Card
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                💳 নতুন ইনভেস্টমেন্ট কার্ড তৈরি ও সক্রিয় করা হয়েছে
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #bae6fd;">
                Congratulations! A new investment card has been activated in your account.
              </p>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 28px 30px 15px 30px;">
              <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 800; color: #ffffff;">প্রিয় {$name},</h2>
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #94a3b8; line-height: 1.6;">
                অভিনন্দন! SupplyLink-এ আপনার অ্যাকাউন্টের অধীনে একটি নতুন <strong>ইনভেস্টমেন্ট কার্ড</strong> সফলভাবে খোলা ও সক্রিয় করা হয়েছে। আপনার নতুন কার্ডের তথ্যাবলি নিচে উল্লেখ করা হলো:
              </p>

              <!-- Digital Card Visual Representation -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border: 1px solid rgba(56,189,248,0.25); border-radius: 18px; padding: 20px; margin-bottom: 20px;">
                <tr>
                  <td style="padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.08);">
                    <div style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px;">কার্ড নাম ও আইডি</div>
                    <div style="font-size: 18px; font-weight: 800; color: #ffffff; margin-top: 4px;">{$cardName}</div>
                    <div style="font-size: 12px; color: #94a3b8; font-family: monospace; margin-top: 2px;">কার্ড আইডি: #{$cardId} • ক্লায়েন্ট আইডি: #{$userId}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 15px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #94a3b8;">পেমেন্ট ধরণ</td>
                        <td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #38bdf8; text-align: right;">{$paymentLabel}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #94a3b8;">শুরুর তারিখ (Start Date)</td>
                        <td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #ffffff; font-family: monospace; text-align: right;">{$startDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #94a3b8;">মেয়াদ উত্তীর্ণ (Maturity Date)</td>
                        <td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #34d399; font-family: monospace; text-align: right;">{$maturityDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 12px; color: #94a3b8;">কার্ড স্ট্যাটাস</td>
                        <td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #10b981; text-align: right;">● Running (সক্রিয়)</td>
                      </tr>
                      {$staffRow}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background: rgba(16,185,129,0.1); border-left: 3px solid #10b981; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #6ee7b7; margin-bottom: 20px; line-height: 1.5;">
                💡 <strong>লেনদেন ও মুনাফা ট্র্যাকিং:</strong> আপনি আপনার ইনভেস্টর পোর্টালে লগইন করে যেকোনো সময় এই কার্ডের বিনিয়োগ জমা, কিস্তি আদায় এবং প্রতি মাসের অর্জিত মুনাফা সরাসরি পর্যবেক্ষণ করতে পারবেন।
              </div>

              <!-- Portal Login CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
                <tr>
                  <td align="center">
                    <a href="https://app.supplylinkbd.com" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(2,132,199,0.35);">
                      ইনভেস্টর পোর্টালে প্রবেশ করুন →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px 25px 30px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; background: rgba(0,0,0,0.25);">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">
                এটি সাপ্লাইলিঙ্ক ডিজিটাল সিস্টেম থেকে স্বয়ংক্রিয়ভাবে প্রেরিত ইমেইল।
              </p>
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                যোগাযোগ: <a href="mailto:supplylinkbdltd@gmail.com" style="color: #38bdf8; text-decoration: none;">supplylinkbdltd@gmail.com</a> | ওয়েবসাইট: <a href="https://supplylinkbd.com" style="color: #38bdf8; text-decoration: none;">supplylinkbd.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

/**
 * HTML Email Template for Admin Alert when an Investment Card is created
 */
function renderInvestmentCardCreatedAdminAlertTemplate($cardData, $userData, $actorData = [], $referenceStaffData = null) {
    $investorName  = htmlspecialchars($userData['name'] ?? 'N/A', ENT_QUOTES, 'UTF-8');
    $investorId    = (int)($userData['id'] ?? 0);
    $investorPhone = htmlspecialchars($userData['mobile'] ?? 'N/A', ENT_QUOTES, 'UTF-8');
    $investorEmail = htmlspecialchars($userData['email'] ?? 'ইমেইল নেই', ENT_QUOTES, 'UTF-8');

    $cardId        = (int)($cardData['id'] ?? 0);
    $cardName      = htmlspecialchars($cardData['card_name'] ?? 'ইনভেস্টমেন্ট কার্ড', ENT_QUOTES, 'UTF-8');
    $startDate     = htmlspecialchars($cardData['start_date'] ?? date('Y-m-d'), ENT_QUOTES, 'UTF-8');
    $maturityDate  = htmlspecialchars($cardData['maturity_date'] ?? '', ENT_QUOTES, 'UTF-8');
    $paymentType   = htmlspecialchars($cardData['payment_type'] ?? 'flexible', ENT_QUOTES, 'UTF-8');

    $creatorName   = htmlspecialchars($actorData['name'] ?? 'Admin / Staff', ENT_QUOTES, 'UTF-8');
    $creatorRole   = htmlspecialchars($actorData['role'] ?? 'admin', ENT_QUOTES, 'UTF-8');
    $creatorId     = (int)($actorData['id'] ?? 0);

    $staffName     = !empty($referenceStaffData['name']) ? htmlspecialchars($referenceStaffData['name'], ENT_QUOTES, 'UTF-8') : 'প্রযোজ্য নয়';
    $timestamp     = date('Y-m-d h:i:s A');

    return <<<HTML
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Audit: New Investment Card Created</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070c18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070c18; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background: linear-gradient(145deg, #0a1428, #070e1c); border: 1px solid rgba(168,85,247,0.3); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.85);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #4338ca 50%, #1e1b4b 100%); padding: 28px 25px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; padding: 5px 12px; font-size: 11px; font-weight: 700; color: #f3e8ff; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 10px;">
                Admin Audit Notification
              </div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">
                💳 নতুন ইনভেস্টমেন্ট কার্ড তৈরি করা হয়েছে
              </h1>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #e9d5ff;">
                A new investment card account has been created in SupplyLink System
              </p>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 25px 28px 15px 28px;">
              <!-- Meta Summary Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 16px; margin-bottom: 18px;">
                <tr>
                  <td style="font-size: 12px; color: #94a3b8; padding-bottom: 8px;">তৈরি করেছেন (Created By):</td>
                  <td style="font-size: 13px; font-weight: 700; color: #c084fc; text-align: right; padding-bottom: 8px;">{$creatorName} ({$creatorRole} #{$creatorId})</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #94a3b8; padding-bottom: 8px;">সময় (Timestamp):</td>
                  <td style="font-size: 12px; color: #cbd5e1; font-family: monospace; text-align: right; padding-bottom: 8px;">{$timestamp}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #94a3b8;">রেফারেন্স কর্মী (Reference Staff):</td>
                  <td style="font-size: 12px; font-weight: 600; color: #38bdf8; text-align: right;">{$staffName}</td>
                </tr>
              </table>

              <!-- Card Details Box -->
              <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.8px;">
                📋 কার্ড বিবরণী (Investment Card Details)
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(0,0,0,0.38); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 18px; margin-bottom: 18px;">
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">কার্ড আইডি (Card ID)</td>
                  <td style="padding: 7px 0; font-size: 13px; font-weight: 700; color: #38bdf8; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">#{$cardId}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">কার্ডের নাম (Card Name)</td>
                  <td style="padding: 7px 0; font-size: 13px; font-weight: 700; color: #ffffff; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$cardName}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">পেমেন্ট ধরণ (Frequency)</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #f59e0b; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06); text-transform: capitalize;">{$paymentType}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">শুরুর তারিখ (Start Date)</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #ffffff; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$startDate}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8;">মেয়াদ সমাপ্তি (Maturity Date)</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 700; color: #34d399; font-family: monospace; text-align: right;">{$maturityDate}</td>
                </tr>
              </table>

              <!-- Investor Info Box -->
              <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 0.8px;">
                👤 গ্রাহক বিবরণী (Investor Information)
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(0,0,0,0.38); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 18px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">গ্রাহকের নাম (Investor Name)</td>
                  <td style="padding: 7px 0; font-size: 13px; font-weight: 700; color: #ffffff; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$investorName} (ID: #{$investorId})</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">মোবাইল নম্বর (Phone)</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #34d399; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$investorPhone}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8;">ইমেইল এড্রেস (Email)</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #38bdf8; text-align: right;">{$investorEmail}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px 25px 30px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; background: rgba(0,0,0,0.25);">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                SupplyLink Financial System • Automated Real-time Audit Trail
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

/**
 * Dispatches New Investment Card Created Notification to Admin and to Investor (if investor has email)
 */
function sendInvestmentCardCreatedNotification($cardData, $userData, $actorData = [], $referenceStaffData = null) {
    global $mysqli;

    $investorName = $userData['name'] ?? 'Investor';
    $investorId   = $userData['id'] ?? 0;
    $cardId       = $cardData['id'] ?? 0;
    $cardName     = $cardData['card_name'] ?? 'Card';

    // 1. Send alert email to Admin
    $adminSubject = "[Card Alert] নতুন ইনভেস্টমেন্ট কার্ড তৈরি - {$cardName} (গ্রাহক: {$investorName} #{$investorId})";
    $adminHtml    = renderInvestmentCardCreatedAdminAlertTemplate($cardData, $userData, $actorData, $referenceStaffData);
    $adminMailRes = sl_smtp_send(SL_ADMIN_EMAIL, $adminSubject, $adminHtml);

    // 2. Send notice to User if user has a valid email
    $targetEmail = !empty($userData['email']) ? trim($userData['email']) : null;
    if (!empty($targetEmail) && filter_var($targetEmail, FILTER_VALIDATE_EMAIL)) {
        $userSubject = "আপনার নামে নতুন ইনভেস্টমেন্ট কার্ড সক্রিয় করা হয়েছে - {$cardName} | SupplyLink";
        $userHtml    = renderInvestmentCardCreatedUserTemplate($cardData, $userData, $referenceStaffData);
        sl_smtp_send($targetEmail, $userSubject, $userHtml);
    }

    // 3. Insert in-app notification for Admin & Managers
    if (isset($mysqli) && $mysqli instanceof mysqli) {
        try {
            $creatorName = $actorData['name'] ?? 'Admin';
            $stmt = $mysqli->prepare("
                INSERT INTO notifications (user_id, target_roles, type, title, message, link, is_read, created_at)
                VALUES (?, 'admin,developer,manager', 'investment_card_created', ?, ?, '/investor/investment_cards', 0, NOW())
            ");
            if ($stmt) {
                $title = "নতুন কার্ড তৈরি: {$cardName} (#{$cardId})";
                $msg   = "{$creatorName} কর্তৃক গ্রাহক {$investorName} (#{$investorId}) এর জন্য কার্ড তৈরি করা হয়েছে।";
                $link  = '/investor/investment_cards';
                $stmt->bind_param("isss", $investorId, $title, $msg, $link);
                $stmt->execute();
                $stmt->close();
            }
        } catch (Throwable $e) {
            error_log("Failed to insert card creation notification: " . $e->getMessage());
        }
    }

    return $adminMailRes;
}

/**
 * HTML Email Template for Customer Daily Installment Payment Receipt
 */
function renderDailyInstallmentReceiptUserTemplate($installmentData, $customerData, $cardData = null, $collectorData = null) {
    $name          = htmlspecialchars($customerData['name'] ?? 'গ্রাহক', ENT_QUOTES, 'UTF-8');
    $userId        = (int)($customerData['id'] ?? 0);
    $receiptId     = (int)($installmentData['id'] ?? 0);
    $amountRaw     = (float)($installmentData['amount'] ?? 0);
    $amountFmt     = number_format($amountRaw, 2);
    $payDate       = htmlspecialchars($installmentData['date'] ?? date('Y-m-d'), ENT_QUOTES, 'UTF-8');
    $payTime       = htmlspecialchars($installmentData['time'] ?? date('h:i:s A'), ENT_QUOTES, 'UTF-8');
    $refId         = htmlspecialchars($installmentData['ref_id'] ?? "daily_installment_{$receiptId}", ENT_QUOTES, 'UTF-8');

    $cardNumber    = htmlspecialchars($cardData['card_number'] ?? ($installmentData['card_id'] ?? 'N/A'), ENT_QUOTES, 'UTF-8');
    $productName   = !empty($cardData['product_name']) ? htmlspecialchars($cardData['product_name'], ENT_QUOTES, 'UTF-8') : 'দৈনিক কিস্তি অ্যাকাউন্ট';
    $collectorName = !empty($collectorData['name']) ? htmlspecialchars($collectorData['name'], ENT_QUOTES, 'UTF-8') : 'অফিসিয়াল প্রতিনিধি';

    return <<<HTML
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>দৈনিক কিস্তি জমা রসিদ</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070c18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070c18; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background: linear-gradient(145deg, #0a1428, #070e1c); border: 1px solid rgba(16,185,129,0.3); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.85);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #0d9488 50%, #1e1b4b 100%); padding: 32px 25px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #d1fae5; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px;">
                SupplyLink Payment Receipt
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                🧾 দৈনিক কিস্তি জমা সফল হয়েছে
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #a7f3d0;">
                Your Daily Installment Payment Has Been Successfully Received
              </p>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 28px 30px 15px 30px;">
              <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 800; color: #ffffff;">প্রিয় {$name},</h2>
              <p style="margin: 0 0 18px 0; font-size: 13px; color: #94a3b8; line-height: 1.6;">
                ধন্যবাদ! SupplyLink-এ আপনার কিস্তি অ্যাকাউন্টের অধীনে দৈনিক কিস্তির টাকা সফলভাবে জমা হয়েছে। আপনার ডিজিটাল পেমেন্ট রসিদের তথ্যাবলি নিচে উল্লেখ করা হলো:
              </p>

              <!-- Payment Amount Hero Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,78,59,0.25) 100%); border: 1px solid rgba(16,185,129,0.35); border-radius: 18px; padding: 22px; text-align: center; margin-bottom: 22px;">
                <tr>
                  <td>
                    <div style="font-size: 12px; font-weight: 700; color: #6ee7b7; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 4px;">
                      জমা কৃত টাকা (Amount Received)
                    </div>
                    <div style="font-size: 32px; font-weight: 900; color: #10b981; font-family: monospace; letter-spacing: 0.5px;">
                      ৳ {$amountFmt}
                    </div>
                    <div style="font-size: 11px; color: #a7f3d0; margin-top: 6px;">
                      স্ট্যাটাস: ● সফলভাবে ক্যাশ ইন সম্পন্ন
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Digital Receipt Details Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(0,0,0,0.38); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px 20px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 9px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">রসিদ নম্বর (Receipt No)</td>
                  <td style="padding: 9px 0; font-size: 13px; font-weight: 700; color: #38bdf8; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">#{$receiptId}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">গ্রাহক অ্যাকাউন্ট আইডি</td>
                  <td style="padding: 9px 0; font-size: 13px; font-weight: 700; color: #ffffff; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">#{$userId}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">কার্ড নম্বর / বিবরণ</td>
                  <td style="padding: 9px 0; font-size: 13px; font-weight: 700; color: #f59e0b; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">কার্ড #{$cardNumber} ({$productName})</td>
                </tr>
                <tr>
                  <td style="padding: 9px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">তারিখ ও সময় (Date & Time)</td>
                  <td style="padding: 9px 0; font-size: 12px; font-weight: 600; color: #cbd5e1; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$payDate} • {$payTime}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">সংগ্রাহক কর্মী (Collected By)</td>
                  <td style="padding: 9px 0; font-size: 13px; font-weight: 600; color: #a5b4fc; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$collectorName}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 0; font-size: 12px; color: #94a3b8;">ট্র্যাকিং রেফারেন্স (Ref ID)</td>
                  <td style="padding: 9px 0; font-size: 11px; font-family: monospace; color: #64748b; text-align: right;">{$refId}</td>
                </tr>
              </table>

              <!-- Notice Box -->
              <div style="background: rgba(16,185,129,0.1); border-left: 3px solid #10b981; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #6ee7b7; margin-bottom: 20px; line-height: 1.5;">
                💡 <strong>কিস্তির স্টেটমেন্ট ট্র্যাকিং:</strong> আপনি আপনার গ্রাহক পোর্টালে লগইন করে যেকোনো সময় সকল কিস্তি জমা ও বকেয়া ব্যালেন্স বিস্তারিত দেখতে পারবেন।
              </div>

              <!-- Portal Login CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
                <tr>
                  <td align="center">
                    <a href="https://app.supplylinkbd.com" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(5,150,105,0.35);">
                      গ্রাহক পোর্টালে প্রবেশ করুন →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px 25px 30px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; background: rgba(0,0,0,0.25);">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">
                এটি সাপ্লাইলিঙ্ক ডিজিটাল সিস্টেম থেকে স্বয়ংক্রিয়ভাবে প্রেরিত ইমেইল রসিদ।
              </p>
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                যোগাযোগ: <a href="mailto:supplylinkbdltd@gmail.com" style="color: #38bdf8; text-decoration: none;">supplylinkbdltd@gmail.com</a> | ওয়েবসাইট: <a href="https://supplylinkbd.com" style="color: #38bdf8; text-decoration: none;">supplylinkbd.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

/**
 * HTML Email Template for Admin Alert when a Daily Installment is collected
 */
function renderDailyInstallmentAlertAdminTemplate($installmentData, $customerData, $cardData = null, $collectorData = null) {
    $customerName  = htmlspecialchars($customerData['name'] ?? 'N/A', ENT_QUOTES, 'UTF-8');
    $customerId    = (int)($customerData['id'] ?? 0);
    $customerPhone = htmlspecialchars($customerData['mobile'] ?? 'N/A', ENT_QUOTES, 'UTF-8');
    $customerEmail = htmlspecialchars($customerData['email'] ?? 'ইমেইল নেই', ENT_QUOTES, 'UTF-8');

    $receiptId     = (int)($installmentData['id'] ?? 0);
    $amountRaw     = (float)($installmentData['amount'] ?? 0);
    $amountFmt     = number_format($amountRaw, 2);
    $payDate       = htmlspecialchars($installmentData['date'] ?? date('Y-m-d'), ENT_QUOTES, 'UTF-8');
    $payTime       = htmlspecialchars($installmentData['time'] ?? date('h:i:s A'), ENT_QUOTES, 'UTF-8');
    $refId         = htmlspecialchars($installmentData['ref_id'] ?? "daily_installment_{$receiptId}", ENT_QUOTES, 'UTF-8');

    $cardNumber    = htmlspecialchars($cardData['card_number'] ?? ($installmentData['card_id'] ?? 'N/A'), ENT_QUOTES, 'UTF-8');
    $productName   = !empty($cardData['product_name']) ? htmlspecialchars($cardData['product_name'], ENT_QUOTES, 'UTF-8') : 'দৈনিক কিস্তি অ্যাকাউন্ট';

    $collectorName = !empty($collectorData['name']) ? htmlspecialchars($collectorData['name'], ENT_QUOTES, 'UTF-8') : 'সংগ্রাহক কর্মী';
    $collectorId   = (int)($collectorData['id'] ?? ($installmentData['receiver'] ?? 0));
    $timestamp     = date('Y-m-d h:i:s A');

    return <<<HTML
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Collection Alert: Daily Installment</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070c18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070c18; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background: linear-gradient(145deg, #0a1428, #070e1c); border: 1px solid rgba(14,165,233,0.3); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.85);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e1b4b 100%); padding: 28px 25px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; padding: 5px 12px; font-size: 11px; font-weight: 700; color: #e0f2fe; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 10px;">
                Collection Audit Alert
              </div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">
                💰 দৈনিক কিস্তি আদায় সম্পন্ন হয়েছে
              </h1>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #bae6fd;">
                Daily Installment Deposit Logged & Cash Ledger Synced
              </p>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 25px 28px 15px 28px;">
              <!-- Hero Amount Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(14,165,233,0.1); border: 1px solid rgba(14,165,233,0.3); border-radius: 16px; padding: 18px; text-align: center; margin-bottom: 18px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px;">আদায়কৃত কিস্তির পরিমাণ</div>
                    <div style="font-size: 30px; font-weight: 900; color: #38bdf8; font-family: monospace; margin-top: 4px;">৳ {$amountFmt}</div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">ক্যাশ রেফারেন্স: {$refId}</div>
                  </td>
                </tr>
              </table>

              <!-- Collector Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px; margin-bottom: 18px;">
                <tr>
                  <td style="font-size: 12px; color: #94a3b8; padding-bottom: 6px;">আদায়কারী কর্মী (Collector):</td>
                  <td style="font-size: 13px; font-weight: 700; color: #a5b4fc; text-align: right; padding-bottom: 6px;">{$collectorName} (ID: #{$collectorId})</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #94a3b8; padding-bottom: 6px;">আদায়ের তারিখ ও সময়:</td>
                  <td style="font-size: 12px; color: #cbd5e1; font-family: monospace; text-align: right; padding-bottom: 6px;">{$payDate} • {$payTime}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #94a3b8;">সিস্টেম লগ টাইম:</td>
                  <td style="font-size: 12px; color: #94a3b8; font-family: monospace; text-align: right;">{$timestamp}</td>
                </tr>
              </table>

              <!-- Customer Info Box -->
              <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 0.8px;">
                👤 গ্রাহক ও কার্ড বিবরণী (Customer & Card Details)
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(0,0,0,0.38); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px 18px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">গ্রাহকের নাম (Customer Name)</td>
                  <td style="padding: 7px 0; font-size: 13px; font-weight: 700; color: #ffffff; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$customerName} (ID: #{$customerId})</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">মোবাইল নম্বর (Phone)</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #34d399; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$customerPhone}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.06);">ইমেইল এড্রেস (Email)</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #38bdf8; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06);">{$customerEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8;">কিস্তি কার্ড (Installment Card)</td>
                  <td style="padding: 7px 0; font-size: 13px; font-weight: 700; color: #f59e0b; text-align: right;">কার্ড #{$cardNumber} ({$productName})</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px 25px 30px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; background: rgba(0,0,0,0.25);">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                SupplyLink Financial System • Automated Real-time Cash Ledger Audit
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

/**
 * Dispatches Daily Installment Payment Notification to Admin and to Customer (if customer has email)
 */
function sendDailyInstallmentNotification($installmentData, $customerData, $cardData = null, $collectorData = null) {
    $customerName = $customerData['name'] ?? 'Customer';
    $customerId   = $customerData['id'] ?? 0;
    $amountFmt    = number_format((float)($installmentData['amount'] ?? 0), 2);
    $cardId       = $cardData['card_number'] ?? ($installmentData['card_id'] ?? '');

    // 1. Send alert email to Admin
    $adminSubject = "[Collection Alert] দৈনিক কিস্তি আদায় - ৳{$amountFmt} (গ্রাহক: {$customerName} #{$customerId})";
    $adminHtml    = renderDailyInstallmentAlertAdminTemplate($installmentData, $customerData, $cardData, $collectorData);
    $adminMailRes = sl_smtp_send(SL_ADMIN_EMAIL, $adminSubject, $adminHtml);

    // 2. Send receipt to Customer if customer has a valid email
    $targetEmail = !empty($customerData['email']) ? trim($customerData['email']) : null;
    if (!empty($targetEmail) && filter_var($targetEmail, FILTER_VALIDATE_EMAIL)) {
        $userSubject = "আপনার দৈনিক কিস্তি জমা রসিদ - ৳{$amountFmt} | SupplyLink";
        $userHtml    = renderDailyInstallmentReceiptUserTemplate($installmentData, $customerData, $cardData, $collectorData);
        sl_smtp_send($targetEmail, $userSubject, $userHtml);
    }

    return $adminMailRes;
}

/**
 * HTML Email Template for Investment Withdraw Application (Admin Alert)
 */
function renderWithdrawRequestAdminAlertTemplate($withdrawData, $investorData, $cardData, $requestedByData = null) {
    $investorName = htmlspecialchars($investorData['name'] ?? 'ইনভেস্টর', ENT_QUOTES, 'UTF-8');
    $investorId   = (int)($investorData['id'] ?? 0);
    $investorMobile = htmlspecialchars($investorData['mobile'] ?? ($withdrawData['mobile'] ?? 'N/A'), ENT_QUOTES, 'UTF-8');
    $investorEmail = htmlspecialchars($investorData['email'] ?? 'ইমেইল নেই', ENT_QUOTES, 'UTF-8');

    $requestId     = (int)($withdrawData['id'] ?? 0);
    $cardId        = (int)($withdrawData['card_id'] ?? 0);
    $cardName      = htmlspecialchars($cardData['card_name'] ?? 'ইনভেস্টমেন্ট কার্ড', ENT_QUOTES, 'UTF-8');
    $paymentType   = htmlspecialchars($cardData['payment_type'] ?? 'standard', ENT_QUOTES, 'UTF-8');

    $amountRaw     = (float)($withdrawData['amount'] ?? ($cardData['investment_amount'] ?? 0));
    $amountFmt     = number_format($amountRaw, 2);

    $totalProfitRaw = (float)($withdrawData['total_profit'] ?? 0);
    $totalProfitFmt = number_format($totalProfitRaw, 2);

    $payableRaw    = (float)($withdrawData['payable_amount'] ?? 0);
    $payableFmt    = number_format($payableRaw, 2);

    $withdrawDate  = htmlspecialchars($withdrawData['withdraw_date'] ?? date('Y-m-d'), ENT_QUOTES, 'UTF-8');
    $maturityDate  = htmlspecialchars($withdrawData['maturity_date'] ?? ($cardData['maturity_date'] ?? 'N/A'), ENT_QUOTES, 'UTF-8');
    $reason        = nl2br(htmlspecialchars($withdrawData['reason'] ?? 'কোনো কারণ উল্লেখ নেই', ENT_QUOTES, 'UTF-8'));

    $requestedByName = htmlspecialchars($requestedByData['name'] ?? 'স্টাফ', ENT_QUOTES, 'UTF-8');
    $requestedById   = (int)($requestedByData['id'] ?? 0);

    $currentDateTime = date('d M Y, h:i A');

    return <<<HTML
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>নতুন ইনভেস্টমেন্ট উইথড্র আবেদন</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070c18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070c18; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background: linear-gradient(145deg, #0d162b, #070e1c); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.85);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e1b4b 100%); padding: 30px 25px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 12px; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #e0f2fe; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
                SupplyLink Capital Management • Admin Alert
              </div>
              <h1 style="margin: 0; font-size: 23px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                নতুন ইনভেস্টমেন্ট উইথড্র আবেদন
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #bae6fd;">
                আবেদন নম্বর: #{$requestId} • স্ট্যাটাস: পেন্ডিং রিভিউ
              </p>
            </td>
          </tr>

          <!-- Summary Amount Cards -->
          <tr>
            <td style="padding: 25px 30px 10px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="padding-right: 8px;">
                    <div style="background: rgba(14, 165, 233, 0.08); border: 1px solid rgba(14, 165, 233, 0.25); border-radius: 16px; padding: 16px; text-align: center;">
                      <span style="font-size: 10px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px; display: block;">
                        মূল বিনিয়োগ
                      </span>
                      <div style="font-size: 22px; font-weight: 800; color: #ffffff; margin-top: 4px; font-family: monospace;">
                        ৳ {$amountFmt}
                      </div>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 8px;">
                    <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 16px; text-align: center;">
                      <span style="font-size: 10px; font-weight: 700; color: #34d399; text-transform: uppercase; letter-spacing: 1px; display: block;">
                        প্রদেয় প্রফিট
                      </span>
                      <div style="font-size: 22px; font-weight: 800; color: #34d399; margin-top: 4px; font-family: monospace;">
                        ৳ {$payableFmt}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Detailed Ledger Information -->
          <tr>
            <td style="padding: 15px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 18px;">
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">ইনভেস্টরের নাম</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #ffffff; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">{$investorName} (ID: #{$investorId})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">মোবাইল নম্বর</td>
                  <td style="padding: 8px 0; font-size: 12px; font-family: monospace; color: #e2e8f0; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">{$investorMobile}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">ইমেইল ঠিকানা</td>
                  <td style="padding: 8px 0; font-size: 12px; font-family: monospace; color: #38bdf8; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">{$investorEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">ইনভেস্টমেন্ট কার্ড</td>
                  <td style="padding: 8px 0; font-size: 12px; font-weight: 700; color: #fbbf24; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">{$cardName} (#{$cardId})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">কার্ড পেমেন্ট টাইপ</td>
                  <td style="padding: 8px 0; font-size: 12px; text-transform: capitalize; color: #cbd5e1; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">{$paymentType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">আবেদনকৃত উইথড্র তারিখ</td>
                  <td style="padding: 8px 0; font-size: 12px; font-family: monospace; color: #e2e8f0; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">{$withdrawDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">কার্ড ম্যাচিউরিটি তারিখ</td>
                  <td style="padding: 8px 0; font-size: 12px; font-family: monospace; color: #cbd5e1; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">{$maturityDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">অর্জিত মোট লাভ</td>
                  <td style="padding: 8px 0; font-size: 12px; font-family: monospace; color: #38bdf8; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">৳ {$totalProfitFmt}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">আবেদন দাখিলকারী</td>
                  <td style="padding: 8px 0; font-size: 12px; color: #cbd5e1; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">{$requestedByName} (ID: #{$requestedById})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8;">আবেদনের সময়</td>
                  <td style="padding: 8px 0; font-size: 12px; font-family: monospace; color: #cbd5e1; text-align: right;">{$currentDateTime}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Reason Callout -->
          <tr>
            <td style="padding: 5px 30px 20px 30px;">
              <div style="background: rgba(245, 158, 11, 0.08); border-left: 4px solid #f59e0b; border-radius: 0 12px 12px 0; padding: 14px 18px;">
                <span style="font-size: 11px; font-weight: 700; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">
                  উইথড্র করার কারণ (Reason):
                </span>
                <p style="margin: 0; font-size: 12px; color: #fde68a; line-height: 1.6;">
                  {$reason}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer Action Note -->
          <tr>
            <td style="padding: 20px 30px 25px 30px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; background: rgba(0,0,0,0.25);">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #94a3b8;">
                আবেদনটি অনুমোদন বা বাতিল করতে SupplyLink এডমিন প্যানেল এ লগইন করুন।
              </p>
              <div style="font-size: 11px; color: #64748b;">
                SupplyLink Financial System • Automated Real-Time Withdrawal Alert
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

/**
 * HTML Email Template for Investment Withdraw Application (Investor Copy)
 */
function renderWithdrawRequestInvestorTemplate($withdrawData, $investorData, $cardData) {
    $investorName = htmlspecialchars($investorData['name'] ?? 'সম্মানিত ইনভেস্টর', ENT_QUOTES, 'UTF-8');
    $requestId     = (int)($withdrawData['id'] ?? 0);
    $cardId        = (int)($withdrawData['card_id'] ?? 0);
    $cardName      = htmlspecialchars($cardData['card_name'] ?? 'ইনভেস্টমেন্ট কার্ড', ENT_QUOTES, 'UTF-8');

    $amountRaw     = (float)($withdrawData['amount'] ?? ($cardData['investment_amount'] ?? 0));
    $amountFmt     = number_format($amountRaw, 2);

    $payableRaw    = (float)($withdrawData['payable_amount'] ?? 0);
    $payableFmt    = number_format($payableRaw, 2);

    $withdrawDate  = htmlspecialchars($withdrawData['withdraw_date'] ?? date('Y-m-d'), ENT_QUOTES, 'UTF-8');
    $currentDateTime = date('d M Y, h:i A');

    return <<<HTML
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>আপনার ইনভেস্টমেন্ট উইথড্র আবেদন গৃহীত হয়েছে</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070c18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070c18; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background: linear-gradient(145deg, #0d162b, #070e1c); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.85);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e1b4b 100%); padding: 30px 25px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 12px; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #e0f2fe; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
                SupplyLink Investor Portal
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                উইথড্র আবেদন সফলভাবে গৃহীত হয়েছে
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #bae6fd;">
                ট্র্যাকিং নম্বর: #{$requestId} • আবেদনের তারিখ: {$withdrawDate}
              </p>
            </td>
          </tr>

          <!-- Message Greeting -->
          <tr>
            <td style="padding: 25px 30px 10px 30px;">
              <p style="margin: 0; font-size: 14px; color: #e2e8f0; line-height: 1.6;">
                প্রিয় <strong>{$investorName}</strong>,
              </p>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #94a3b8; line-height: 1.6;">
                আপনার <strong>{$cardName} (#{$cardId})</strong> কার্ডটির মূল বিনিয়োগ / প্রফিট উত্তোলনের আবেদনটি আমাদের সিস্টেমে সফলভাবে জমা হয়েছে।
              </p>
            </td>
          </tr>

          <!-- Amount Breakdown Card -->
          <tr>
            <td style="padding: 10px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 18px;">
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">আবেদন নম্বর</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #fbbf24; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">#{$requestId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">কার্ডের নাম</td>
                  <td style="padding: 8px 0; font-size: 12px; font-weight: 600; color: #ffffff; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">{$cardName} (#{$cardId})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">বিনিয়োগকৃত মূলধন</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #38bdf8; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">৳ {$amountFmt}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">প্রদেয় প্রফিট</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: 700; color: #34d399; font-family: monospace; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">৳ {$payableFmt}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 12px; color: #94a3b8;">আবেদনের স্ট্যাটাস</td>
                  <td style="padding: 8px 0; font-size: 12px; font-weight: 700; color: #fbbf24; text-align: right;">বিচারাধীন (Under Review)</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Next Steps Callout -->
          <tr>
            <td style="padding: 10px 30px 20px 30px;">
              <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; border-radius: 0 12px 12px 0; padding: 14px 18px;">
                <p style="margin: 0; font-size: 12px; color: #a7f3d0; line-height: 1.6;">
                  আমাদের ফাইন্যান্স বিভাগ আপনার আবেদনটি নিয়মাবলী অনুযায়ী পর্যবেক্ষণ করছে। অনুমোদন সম্পন্ন হলে আপনার অ্যাকাউন্টে অর্থ স্থানান্তর করা হবে এবং কনফার্মেশন জানানো হবে।
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px 25px 30px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; background: rgba(0,0,0,0.25);">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                SupplyLink Limited • হটলাইন বা সাপোর্টের জন্য আমাদের হেল্পলাইনে যোগাযোগ করুন
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

/**
 * Dispatches Withdraw Request Notification to Admin (always) and to Investor (if investor has email)
 */
function sendWithdrawRequestNotification($withdrawData, $investorData, $cardData, $requestedByData = null) {
    global $mysqli;

    $investorName = $investorData['name'] ?? 'Investor';
    $investorId   = $investorData['id'] ?? 0;
    $cardName     = $cardData['card_name'] ?? 'Card';
    $cardId       = $cardData['id'] ?? ($withdrawData['card_id'] ?? 0);
    $amountFmt    = number_format((float)($withdrawData['amount'] ?? 0), 2);

    $results = [];

    // 1. Send alert email to Admin (ALWAYS)
    $adminSubject = "[Withdraw Alert] নতুন ইনভেস্টমেন্ট উইথড্র আবেদন - {$investorName} (কার্ড: {$cardName} #{$cardId})";
    $adminHtml    = renderWithdrawRequestAdminAlertTemplate($withdrawData, $investorData, $cardData, $requestedByData);
    $adminMailRes = sl_smtp_send(SL_ADMIN_EMAIL, $adminSubject, $adminHtml);
    $results['admin_email'] = $adminMailRes;

    // 2. Send notice to Investor if investor has a valid email
    $targetEmail = !empty($investorData['email']) ? trim($investorData['email']) : null;
    if (!empty($targetEmail) && filter_var($targetEmail, FILTER_VALIDATE_EMAIL)) {
        $userSubject = "আপনার ইনভেস্টমেন্ট উইথড্র আবেদনটি গৃহীত হয়েছে - কার্ড: {$cardName} | SupplyLink";
        $userHtml    = renderWithdrawRequestInvestorTemplate($withdrawData, $investorData, $cardData);
        $userMailRes = sl_smtp_send($targetEmail, $userSubject, $userHtml);
        $results['user_email'] = $userMailRes;
    }

    // 3. Insert in-app notification for Admin & Managers
    if (isset($mysqli) && $mysqli instanceof mysqli) {
        try {
            $stmt = $mysqli->prepare("
                INSERT INTO notifications (user_id, target_roles, type, title, message, link, is_read, created_at)
                VALUES (?, 'admin,developer,manager', 'investment_withdraw_request', ?, ?, ?, 0, NOW())
            ");
            if ($stmt) {
                $title = "উইথড্র আবেদন: {$investorName} (#{$investorId})";
                $msg   = "কার্ড {$cardName} (#{$cardId}) এর জন্য ৳{$amountFmt} উইথড্র আবেদন দাখিল হয়েছে।";
                $link  = '/applications/invest_withdraw_request';
                $stmt->bind_param("isss", $investorId, $title, $msg, $link);
                $stmt->execute();
                $stmt->close();
            }
        } catch (Throwable $e) {
            error_log("Failed to insert withdraw request notification: " . $e->getMessage());
        }
    }

    return $results;
}

/**
 * Renders Email Template for Admin upon Withdraw Decision (Paid or Rejected)
 */
function renderWithdrawDecisionAdminAlertTemplate($action, $withdrawData, $investorData, $cardData, $reviewerData = null, $notes = '') {
    $isPaid       = ($action === 'paid');
    $statusText   = $isPaid ? 'পরিশোধিত (Paid)' : 'বাতিলকৃত (Rejected)';
    $statusColor  = $isPaid ? '#10b981' : '#f43f5e';
    $statusBg     = $isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';
    $bannerGrad   = $isPaid ? 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #064e3b 100%)' : 'linear-gradient(135deg, #e11d48 0%, #be123c 50%, #4c0519 100%)';
    $headerTitle  = $isPaid ? 'Withdraw Request Paid' : 'Withdraw Request Rejected';
    $subTitle     = $isPaid ? 'ইনভেস্টমেন্ট উত্তোলন সফলভাবে পরিশোধিত ও কার্ড সমাপ্ত' : 'ইনভেস্টমেন্ট উত্তোলন আবেদনটি বাতিল করা হয়েছে';

    $investorName = htmlspecialchars($investorData['name'] ?? 'Investor #' . ($withdrawData['investor_id'] ?? 0));
    $investorId   = (int)($investorData['id'] ?? ($withdrawData['investor_id'] ?? 0));
    $investorPhone= htmlspecialchars($investorData['mobile'] ?? ($withdrawData['mobile'] ?? 'N/A'));
    $cardName     = htmlspecialchars($cardData['card_name'] ?? 'Card #' . ($withdrawData['card_id'] ?? 0));
    $cardId       = (int)($cardData['id'] ?? ($withdrawData['card_id'] ?? 0));
    $amountFmt    = number_format((float)($withdrawData['amount'] ?? 0), 2);
    $payableFmt   = number_format((float)($withdrawData['payable_amount'] ?? 0), 2);
    $profitFmt    = number_format((float)($withdrawData['total_profit'] ?? 0), 2);
    $reqId        = (int)($withdrawData['id'] ?? 0);
    $reviewerName = htmlspecialchars($reviewerData['name'] ?? 'Staff #' . ($withdrawData['reviewed_by'] ?? 0));
    $currentTime  = date('Y-m-d h:i A');

    $extraSection = '';
    if (!$isPaid && !empty($notes)) {
        $extraSection = '
        <tr>
          <td style="padding: 10px 30px 15px 30px;">
            <div style="background: rgba(244, 63, 94, 0.1); border-left: 4px solid #f43f5e; border-radius: 0 12px 12px 0; padding: 14px 18px;">
              <div style="font-size: 11px; font-weight: 700; color: #fecdd3; text-transform: uppercase; margin-bottom: 4px;">বাতিল করার কারণ (Reject Reason)</div>
              <div style="font-size: 13px; color: #ffffff; font-weight: 500; line-height: 1.5;">' . nl2br(htmlspecialchars($notes)) . '</div>
            </div>
          </td>
        </tr>';
    } elseif ($isPaid && !empty($notes)) {
        $extraSection = '
        <tr>
          <td style="padding: 10px 30px 15px 30px;">
            <div style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; border-radius: 0 12px 12px 0; padding: 14px 18px;">
              <div style="font-size: 11px; font-weight: 700; color: #a7f3d0; text-transform: uppercase; margin-bottom: 4px;">পেমেন্ট মেথড (Payment Method)</div>
              <div style="font-size: 13px; color: #ffffff; font-weight: 600;">' . htmlspecialchars($notes) . '</div>
            </div>
          </td>
        </tr>';
    }

    return <<<HTML
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>{$headerTitle} - SupplyLink</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070c18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070c18; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background: linear-gradient(145deg, #0d162b, #070e1c); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.85);">
          
          <!-- Banner -->
          <tr>
            <td style="background: {$bannerGrad}; padding: 30px 25px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 12px; padding: 5px 14px; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">
                SupplyLink Admin Notification
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">{$headerTitle}</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #f1f5f9;">{$subTitle}</p>
            </td>
          </tr>

          <!-- Amount Hero -->
          <tr>
            <td style="padding: 25px 30px 15px 30px; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">উত্তোলনের মোট অংক</div>
              <div style="font-size: 32px; font-weight: 800; color: #ffffff; margin: 4px 0 8px 0; font-family: monospace;">
                ৳ {$amountFmt}
              </div>
              <span style="display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; color: {$statusColor}; background: {$statusBg}; border: 1px solid {$statusColor};">
                {$statusText}
              </span>
            </td>
          </tr>

          {$extraSection}

          <!-- Details Table -->
          <tr>
            <td style="padding: 10px 30px 25px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 18px;">
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8;">আবেদন নং</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 700; color: #38bdf8; text-align: right; font-family: monospace;">#{$reqId}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8;">ইনভেস্টর</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #ffffff; text-align: right;">{$investorName} (ID: {$investorId})</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8;">মোবাইল নম্বর</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #38bdf8; text-align: right;">{$investorPhone}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8;">ইনভেস্টমেন্ট কার্ড</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #ffffff; text-align: right;">{$cardName} (#{$cardId})</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8;">প্রদেয় মোট অর্থ</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 700; color: #22d3ee; text-align: right; font-family: monospace;">৳ {$payableFmt}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8;">মোট প্রফিট</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 700; color: #34d399; text-align: right; font-family: monospace;">৳ {$profitFmt}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8;">সম্পাদনকারী (Reviewed By)</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #e2e8f0; text-align: right;">{$reviewerName}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8;">সময়</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #94a3b8; text-align: right;">{$currentTime}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; background: rgba(0,0,0,0.25);">
              <p style="margin: 0; font-size: 11px; color: #64748b;">SupplyLink Enterprise Automated Decision Alert</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

/**
 * Renders Email Template for Investor upon Withdraw Decision (Paid or Rejected)
 */
function renderWithdrawDecisionInvestorTemplate($action, $withdrawData, $investorData, $cardData, $notes = '') {
    $isPaid       = ($action === 'paid');
    $statusText   = $isPaid ? 'পরিশোধিত ও সমাপ্ত (Paid & Closed)' : 'বাতিলকৃত (Rejected)';
    $statusColor  = $isPaid ? '#10b981' : '#f43f5e';
    $statusBg     = $isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';
    $bannerGrad   = $isPaid ? 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #064e3b 100%)' : 'linear-gradient(135deg, #e11d48 0%, #be123c 50%, #4c0519 100%)';
    $headerTitle  = $isPaid ? 'আপনার উইথড্র সম্পন্ন হয়েছে' : 'উইথড্র আবেদনটি বাতিল করা হয়েছে';
    $subTitle     = $isPaid ? 'আপনার অনুরোধকৃত ইনভেস্টমেন্ট উইথড্র অর্থ সফলভাবে পরিশোধ করা হয়েছে' : 'আপনার ইনভেস্টমেন্ট উইথড্র আবেদনটি পর্যবেক্ষণ শেষে বাতিল করা হয়েছে';

    $investorName = htmlspecialchars($investorData['name'] ?? 'সম্মানিত ইনভেস্টর');
    $cardName     = htmlspecialchars($cardData['card_name'] ?? 'Card #' . ($withdrawData['card_id'] ?? 0));
    $cardId       = (int)($cardData['id'] ?? ($withdrawData['card_id'] ?? 0));
    $amountFmt    = number_format((float)($withdrawData['amount'] ?? 0), 2);
    $reqId        = (int)($withdrawData['id'] ?? 0);
    $currentTime  = date('Y-m-d h:i A');

    $extraCallout = '';
    if (!$isPaid && !empty($notes)) {
        $extraCallout = '
        <tr>
          <td style="padding: 10px 30px 15px 30px;">
            <div style="background: rgba(244, 63, 94, 0.08); border-left: 4px solid #f43f5e; border-radius: 0 12px 12px 0; padding: 14px 18px;">
              <div style="font-size: 11px; font-weight: 700; color: #fecdd3; text-transform: uppercase; margin-bottom: 4px;">বাতিল করার কারণ</div>
              <div style="font-size: 13px; color: #ffffff; font-weight: 500; line-height: 1.5;">' . nl2br(htmlspecialchars($notes)) . '</div>
            </div>
          </td>
        </tr>';
    } elseif ($isPaid) {
        $pmText = !empty($notes) ? htmlspecialchars($notes) : 'ব্যাংক / নগদ / ক্যাশ';
        $extraCallout = '
        <tr>
          <td style="padding: 10px 30px 15px 30px;">
            <div style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; border-radius: 0 12px 12px 0; padding: 14px 18px;">
              <div style="font-size: 11px; font-weight: 700; color: #a7f3d0; text-transform: uppercase; margin-bottom: 4px;">পেমেন্ট কনফার্মেশন</div>
              <div style="font-size: 13px; color: #ffffff; line-height: 1.6;">
                উত্তোলন অর্থ <strong>(' . $pmText . ')</strong> মাধ্যমে আপনার নিকট হস্তান্তর করা হয়েছে এবং সংশ্লিষ্ট কার্ডটির মেয়াদ সফলভাবে সমাপ্ত ঘোষণা করা হয়েছে।
              </div>
            </div>
          </td>
        </tr>';
    }

    return <<<HTML
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>{$headerTitle} - SupplyLink</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070c18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070c18; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background: linear-gradient(145deg, #0d162b, #070e1c); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.85);">
          
          <!-- Banner -->
          <tr>
            <td style="background: {$bannerGrad}; padding: 30px 25px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 12px; padding: 5px 14px; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">
                SupplyLink Investment Notice
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">{$headerTitle}</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #f1f5f9;">{$subTitle}</p>
            </td>
          </tr>

          <!-- Amount Box -->
          <tr>
            <td style="padding: 25px 30px 15px 30px; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">উত্তোলনের পরিমাণ</div>
              <div style="font-size: 32px; font-weight: 800; color: #ffffff; margin: 4px 0 8px 0; font-family: monospace;">
                ৳ {$amountFmt}
              </div>
              <span style="display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; color: {$statusColor}; background: {$statusBg}; border: 1px solid {$statusColor};">
                {$statusText}
              </span>
            </td>
          </tr>

          {$extraCallout}

          <!-- Details Table -->
          <tr>
            <td style="padding: 10px 30px 25px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 18px;">
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8;">ইনভেস্টর নাম</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #ffffff; text-align: right;">{$investorName}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8;">আবেদন নং</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 700; color: #38bdf8; text-align: right; font-family: monospace;">#{$reqId}</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8;">ইনভেস্টমেন্ট কার্ড</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #ffffff; text-align: right;">{$cardName} (#{$cardId})</td>
                </tr>
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8;">প্রসেসিং তারিখ ও সময়</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #94a3b8; text-align: right;">{$currentTime}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; background: rgba(0,0,0,0.25);">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                SupplyLink Limited • যেকোনো প্রয়োজনে আমাদের হেল্পলাইনে যোগাযোগ করুন
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

/**
 * Dispatches Decision Notification (Paid or Rejected) to Admin & Investor (if investor has email)
 */
function sendWithdrawDecisionNotification($action, $withdrawData, $investorData, $cardData, $reviewerData = null, $extraNotes = '') {
    global $mysqli;

    $isPaid       = ($action === 'paid');
    $investorName = $investorData['name'] ?? 'Investor';
    $investorId   = $investorData['id'] ?? ($withdrawData['investor_id'] ?? 0);
    $cardName     = $cardData['card_name'] ?? 'Card';
    $cardId       = $cardData['id'] ?? ($withdrawData['card_id'] ?? 0);
    $amountFmt    = number_format((float)($withdrawData['amount'] ?? 0), 2);
    $reqId        = (int)($withdrawData['id'] ?? 0);

    $results = [];

    // 1. Send alert email to Admin (ALWAYS)
    $actionTitle  = $isPaid ? 'পরিশোধিত (Paid)' : 'বাতিল (Rejected)';
    $adminSubject = "[Withdraw {$actionTitle}] ইনভেস্টমেন্ট উইথড্র #{$reqId} - {$investorName} (কার্ড: {$cardName} #{$cardId})";
    $adminHtml    = renderWithdrawDecisionAdminAlertTemplate($action, $withdrawData, $investorData, $cardData, $reviewerData, $extraNotes);
    $results['admin_email'] = sl_smtp_send(SL_ADMIN_EMAIL, $adminSubject, $adminHtml);

    // 2. Send email to Investor if investor has email in database
    $targetEmail = !empty($investorData['email']) ? trim($investorData['email']) : null;
    if (!empty($targetEmail) && filter_var($targetEmail, FILTER_VALIDATE_EMAIL)) {
        $userSubject = $isPaid 
            ? "আপনার ইনভেস্টমেন্ট উইথড্র সফলভাবে পরিশোধিত হয়েছে (#{$reqId}) - কার্ড: {$cardName} | SupplyLink"
            : "আপনার ইনভেস্টমেন্ট উইথড্র আবেদনটি বাতিল করা হয়েছে (#{$reqId}) - কার্ড: {$cardName} | SupplyLink";
        $userHtml    = renderWithdrawDecisionInvestorTemplate($action, $withdrawData, $investorData, $cardData, $extraNotes);
        $results['user_email'] = sl_smtp_send($targetEmail, $userSubject, $userHtml);
    }

    // 3. Insert in-app notification
    if (isset($mysqli) && $mysqli instanceof mysqli) {
        try {
            $stmt = $mysqli->prepare("
                INSERT INTO notifications (user_id, target_roles, type, title, message, link, is_read, created_at)
                VALUES (?, 'admin,developer,manager', 'investment_withdraw_decision', ?, ?, '/applications/all_invest_withdraw', 0, NOW())
            ");
            if ($stmt) {
                $title = $isPaid 
                    ? "উইথড্র পরিশোধিত: {$investorName} (#{$reqId})" 
                    : "উইথড্র বাতিল: {$investorName} (#{$reqId})";
                $msg   = $isPaid
                    ? "কার্ড {$cardName} (#{$cardId}) এর ৳{$amountFmt} উইথড্র পরিশোধ সম্পন্ন ও কার্ড সমাপ্ত।"
                    : "কার্ড {$cardName} (#{$cardId}) এর উইথড্র আবেদন বাতিল করা হয়েছে। কারণ: {$extraNotes}";
                $link  = '/applications/all_invest_withdraw';
                $stmt->bind_param("isss", $investorId, $title, $msg, $link);
                $stmt->execute();
                $stmt->close();
            }
        } catch (Throwable $e) {
            error_log("Failed to insert decision notification: " . $e->getMessage());
        }
    }

    return $results;
}

/**
 * Renders Email Template for Admin upon Asset & Share Events
 */
function renderAssetEventAdminAlertTemplate($eventType, $data) {
    $assetName   = htmlspecialchars($data['asset_name'] ?? 'Asset');
    $currentTime = date('Y-m-d h:i A');

    // Default values
    $headerTitle = "Asset Transaction Alert";
    $subTitle    = "Others Source Assets & Investment";
    $bannerGrad  = "linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e1b4b 100%)";
    $badgeText   = "TRANSACTION";
    $badgeColor  = "#38bdf8";
    $badgeBg     = "rgba(56, 189, 248, 0.15)";
    $heroLabel   = "টাকার পরিমাণ";
    $heroAmount  = number_format((float)($data['amount'] ?? 0), 2);
    $rows        = [];
    $extraAlert  = "";

    switch ($eventType) {
        case 'asset_purchase':
            $headerTitle = "নতুন প্রোডাক্ট/অ্যাসেট ক্রয়";
            $subTitle    = "কোম্পানির তহবিল হতে নতুন অ্যাসেট ক্রয় সম্পন্ন (Cash Out)";
            $bannerGrad  = "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #78350f 100%)";
            $badgeText   = "CASH OUT (অ্যাসেট ক্রয়)";
            $badgeColor  = "#fbbf24";
            $badgeBg     = "rgba(251, 191, 36, 0.15)";
            $heroLabel   = "ক্রয়মূল্য (Purchase Price)";
            $heroAmount  = number_format((float)($data['purchase_price'] ?? 0), 2);
            $rows = [
                ['অ্যাসেটের নাম', $assetName],
                ['ক্যাটাগরি', htmlspecialchars($data['category_label'] ?? $data['category'] ?? 'অন্যান্য')],
                ['ক্রয়ের তারিখ', htmlspecialchars($data['purchase_date'] ?? date('Y-m-d'))],
                ['ভেন্ডর / বিক্রেতার তথ্য', htmlspecialchars($data['vendor_info'] ?: 'উল্লেখ নেই')],
                ['লাইসেন্স / রেজি নং', htmlspecialchars($data['reg_no'] ?: 'প্রযোজ্য নয়')],
                ['ক্যাশ আউট স্ট্যাটাস', !empty($data['cash_id']) ? 'স্বয়ংক্রিয় Cash Out রেকর্ড হয়েছে' : 'ক্যাশ আউট ব্যতীত সংরক্ষিত'],
                ['মন্তব্য', htmlspecialchars($data['remarks'] ?: 'নেই')],
            ];
            break;

        case 'share_investment':
            $headerTitle = "কোম্পানি শেয়ারে বিনিয়োগ";
            $subTitle    = "নতুন ব্যবসায় ইকুইটি/শেয়ার পার্টনারশিপ মূলধন প্রদান (Cash Out)";
            $bannerGrad  = "linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e1b4b 100%)";
            $badgeText   = "EQUITY INVESTMENT (শেয়ার ক্রয়)";
            $badgeColor  = "#38bdf8";
            $badgeBg     = "rgba(56, 189, 248, 0.15)";
            $heroLabel   = "বিনিয়োগকৃত মূলধন (Capital Invested)";
            $heroAmount  = number_format((float)($data['purchase_price'] ?? 0), 2);
            $rows = [
                ['কোম্পানির নাম', $assetName],
                ['ব্যবসার ধরণ', htmlspecialchars($data['business_type'] ?: 'কোম্পানি শেয়ার')],
                ['শেয়ারের মালিকানা', ($data['share_percentage'] !== null ? $data['share_percentage'] . '%' : 'অংশীদার')],
                ['শেয়ার সংখ্যা', ($data['share_units'] ? number_format($data['share_units']) . ' টি' : 'প্রযোজ্য নয়')],
                ['ডিরেক্টর / যোগাযোগ', htmlspecialchars($data['contact_person'] ?: 'উল্লেখ নেই')],
                ['বিনিয়োগের তারিখ', htmlspecialchars($data['purchase_date'] ?? date('Y-m-d'))],
                ['লভ্যাংশ দেওয়ার ফ্রিকোয়েন্সি', htmlspecialchars($data['dividend_frequency'] ?: 'On Demand')],
                ['ক্যাশ আউট স্ট্যাটাস', !empty($data['cash_id']) ? 'স্বয়ংক্রিয় Cash Out রেকর্ড হয়েছে' : 'ক্যাশ আউট ব্যতীত সংরক্ষিত'],
            ];
            break;

        case 'rental_agreement':
            $headerTitle = "ভাড়া / লিজ চুক্তি সম্পাদন";
            $subTitle    = "অ্যাসেট ভাড়ার জন্য গ্রহীতার সাথে নতুন চুক্তি স্বাক্ষরিত হয়েছে";
            $bannerGrad  = "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #312e81 100%)";
            $badgeText   = "CONTRACT (চুক্তি সম্পাদন)";
            $badgeColor  = "#a5b4fc";
            $badgeBg     = "rgba(165, 180, 252, 0.15)";
            $heroLabel   = "মাসিক নির্ধারিত ভাড়া";
            $heroAmount  = number_format((float)($data['monthly_rent'] ?? 0), 2);
            $rows = [
                ['অ্যাসেটের নাম', $assetName],
                ['ভাড়াটিয়া / গ্রহীতা', htmlspecialchars($data['lessee_name'] ?? 'Payer')],
                ['মোবাইল নম্বর', htmlspecialchars($data['lessee_mobile'] ?: 'উল্লেখ নেই')],
                ['এনআইডি নম্বর', htmlspecialchars($data['lessee_nid'] ?: 'উল্লেখ নেই')],
                ['ঠিকানা', htmlspecialchars($data['lessee_address'] ?: 'উল্লেখ নেই')],
                ['চুক্তির ধরন', ($data['agreement_type'] === 'hire_purchase' ? 'হায়ার পারচেজ' : 'ভাড়া/লিজ')],
                ['প্রতি মাসের ডিউ ডেট', 'প্রতি মাসের ' . intval($data['due_day'] ?? 5) . ' তারিখ'],
                ['জামানত (Security Deposit)', '৳ ' . number_format((float)($data['security_deposit'] ?? 0), 2)],
                ['চুক্তি শুরুর তারিখ', htmlspecialchars($data['start_date'] ?? date('Y-m-d'))],
            ];
            break;

        case 'rental_collection':
            $headerTitle = "মাসিক ভাড়া আদায় সম্পন্ন";
            $subTitle    = "ভাড়াটিয়ার নিকট হতে মাসিক ভাড়া আদায় ও কোম্পানিতে Cash In সম্পন্ন";
            $bannerGrad  = "linear-gradient(135deg, #059669 0%, #0d9488 50%, #064e3b 100%)";
            $badgeText   = "CASH IN (ভাড়া আদায়)";
            $badgeColor  = "#34d399";
            $badgeBg     = "rgba(52, 211, 153, 0.15)";
            $heroLabel   = "আদায়কৃত ভাড়া";
            $heroAmount  = number_format((float)($data['amount'] ?? 0), 2);
            $rows = [
                ['অ্যাসেটের নাম', $assetName],
                ['ভাড়াটিয়া', htmlspecialchars($data['lessee_name'] ?? 'Payer')],
                ['বিলিং মাস', htmlspecialchars($data['billing_month'] ?? date('Y-m'))],
                ['পেমেন্ট মেথড', htmlspecialchars($data['payment_method'] ?? 'Cash')],
                ['আদায়ের তারিখ', htmlspecialchars($data['collection_date'] ?? date('Y-m-d'))],
                ['ক্যাশ ইন কনফার্মেশন', !empty($data['cash_id']) ? 'স্বয়ংক্রিয় Cash In সম্পন্ন' : 'সরাসরি সংরক্ষিত'],
                ['মন্তব্য / নোট', htmlspecialchars($data['remarks'] ?: 'কোনো মন্তব্য নেই')],
            ];
            break;

        case 'share_dividend':
            $headerTitle = "কোম্পানি শেয়ার লভ্যাংশ আদায়";
            $subTitle    = "পার্টনারশিপ ব্যবসা হতে মাসিক প্রফিট/ডিভিডেন্ড আদায় ও Cash In সম্পন্ন";
            $bannerGrad  = "linear-gradient(135deg, #0d9488 0%, #0891b2 50%, #134e4a 100%)";
            $badgeText   = "CASH IN (লভ্যাংশ গ্রহণ)";
            $badgeColor  = "#2dd4bf";
            $badgeBg     = "rgba(45, 212, 191, 0.15)";
            $heroLabel   = "প্রাপ্ত লভ্যাংশ (Dividend Amount)";
            $heroAmount  = number_format((float)($data['amount'] ?? 0), 2);
            $rows = [
                ['কোম্পানির নাম', $assetName],
                ['শেয়ারের মালিকানা', ($data['share_percentage'] ? $data['share_percentage'] . '%' : 'পার্টনার')],
                ['বিলিং মাস', htmlspecialchars($data['billing_month'] ?? date('Y-m'))],
                ['পেমেন্ট মেথড', htmlspecialchars($data['payment_method'] ?? 'Bank Transfer')],
                ['আদায়ের তারিখ', htmlspecialchars($data['collection_date'] ?? date('Y-m-d'))],
                ['ক্যাশ ইন কনফার্মেশন', !empty($data['cash_id']) ? 'স্বয়ংক্রিয় Cash In সম্পন্ন' : 'সরাসরি সংরক্ষিত'],
                ['মন্তব্য', htmlspecialchars($data['remarks'] ?: 'কোনো মন্তব্য নেই')],
            ];
            break;

        case 'asset_sale':
            $headerTitle = "অ্যাসেট বিক্রয় সম্পন্ন";
            $subTitle    = "কোম্পানির অ্যাসেট বিক্রয় ও অর্জিত নিট মুনাফা প্রফিট পুলে যুক্ত হয়েছে";
            $bannerGrad  = "linear-gradient(135deg, #9333ea 0%, #7e22ce 50%, #3b0764 100%)";
            $badgeText   = "CASH IN & PROFIT (অ্যাসেট বিক্রয়)";
            $badgeColor  = "#c084fc";
            $badgeBg     = "rgba(192, 132, 252, 0.15)";
            $heroLabel   = "মোট বিক্রয়মূল্য (Selling Price)";
            $heroAmount  = number_format((float)($data['selling_price'] ?? 0), 2);
            $profitVal   = floatval($data['sale_profit'] ?? 0);
            $rows = [
                ['অ্যাসেটের নাম', $assetName],
                ['পূর্বের ক্রয়মূল্য', '৳ ' . number_format((float)($data['purchase_price'] ?? 0), 2)],
                ['বিক্রয়মূল্য (Cash In)', '৳ ' . number_format((float)($data['selling_price'] ?? 0), 2)],
                ['ক্যাপিটাল গেইন প্রফিট (লাভ)', '৳ ' . number_format($profitVal, 2)],
                ['ক্রেতার নাম', htmlspecialchars($data['buyer_name'] ?: 'উল্লেখ নেই')],
                ['ক্রেতার মোবাইল', htmlspecialchars($data['buyer_mobile'] ?: 'উল্লেখ নেই')],
                ['বিক্রয়ের তারিখ', htmlspecialchars($data['sale_date'] ?? date('Y-m-d'))],
                ['পেমেন্ট মেথড', htmlspecialchars($data['payment_method'] ?? 'Cash')],
            ];
            if ($profitVal > 0) {
                $extraAlert = '
                <tr>
                  <td style="padding: 10px 30px 15px 30px;">
                    <div style="background: rgba(16, 185, 129, 0.12); border-left: 4px solid #10b981; border-radius: 0 12px 12px 0; padding: 14px 18px;">
                      <div style="font-size: 11px; font-weight: 700; color: #a7f3d0; text-transform: uppercase; margin-bottom: 3px;">মুনাফা বণ্টন আপডেট</div>
                      <div style="font-size: 13px; color: #ffffff; line-height: 1.5;">
                        অর্জিত নিট মুনাফা <strong>৳ ' . number_format($profitVal, 2) . '</strong> টাকা ' . htmlspecialchars($data['billing_month'] ?? date('Y-m')) . ' মাসের প্রফিট পুলে যুক্ত হয়েছে।
                      </div>
                    </div>
                  </td>
                </tr>';
            }
            break;

        case 'share_exit':
            $headerTitle = "কোম্পানি শেয়ার বিক্রয় / একজিট";
            $subTitle    = "কোম্পানির শেয়ার হোল্ডিং বিক্রি/বাইব্যাক সম্পন্ন ও লভ্যাংশ বণ্টন পুলে যুক্ত";
            $bannerGrad  = "linear-gradient(135deg, #0284c7 0%, #7e22ce 50%, #1e1b4b 100%)";
            $badgeText   = "CASH IN & PROFIT (শেয়ার একজিট)";
            $badgeColor  = "#38bdf8";
            $badgeBg     = "rgba(56, 189, 248, 0.15)";
            $heroLabel   = "মোট বিক্রয়মূল্য (Exit Value)";
            $heroAmount  = number_format((float)($data['selling_price'] ?? 0), 2);
            $profitVal   = floatval($data['sale_profit'] ?? 0);
            $rows = [
                ['কোম্পানির নাম', $assetName],
                ['মূল বিনিয়োগকৃত তহবিল', '৳ ' . number_format((float)($data['purchase_price'] ?? 0), 2)],
                ['শেয়ার বিক্রয়মূল্য (Cash In)', '৳ ' . number_format((float)($data['selling_price'] ?? 0), 2)],
                ['শেয়ার ক্যাপিটাল গেইন', '৳ ' . number_format($profitVal, 2)],
                ['ক্রেতা / বাইব্যাক প্রতিষ্ঠান', htmlspecialchars($data['buyer_name'] ?: 'কোম্পানি বাইব্যাক')],
                ['একজিট তারিখ', htmlspecialchars($data['sale_date'] ?? date('Y-m-d'))],
            ];
            if ($profitVal > 0) {
                $extraAlert = '
                <tr>
                  <td style="padding: 10px 30px 15px 30px;">
                    <div style="background: rgba(16, 185, 129, 0.12); border-left: 4px solid #10b981; border-radius: 0 12px 12px 0; padding: 14px 18px;">
                      <div style="font-size: 11px; font-weight: 700; color: #a7f3d0; text-transform: uppercase; margin-bottom: 3px;">শেয়ার লাভ বণ্টন আপডেট</div>
                      <div style="font-size: 13px; color: #ffffff; line-height: 1.5;">
                        শেয়ার বিক্রির নিট লাভ <strong>৳ ' . number_format($profitVal, 2) . '</strong> টাকা ' . htmlspecialchars($data['billing_month'] ?? date('Y-m')) . ' মাসের প্রফিট ডিস্ট্রিবিউশন পুলে যুক্ত হয়েছে।
                      </div>
                    </div>
                  </td>
                </tr>';
            }
            break;

        case 'agreement_terminated':
            $headerTitle = "চুক্তি বাতিল ও সম্পদ ফেরত";
            $subTitle    = "ভাড়া চুক্তি বাতিল করা হয়েছে এবং সম্পদটি অফিসে ফেরত নেওয়া হয়েছে (In Stock)";
            $bannerGrad  = "linear-gradient(135deg, #ea580c 0%, #c2410c 50%, #7c2d12 100%)";
            $badgeText   = "TERMINATED (চুক্তি বাতিল)";
            $badgeColor  = "#fb923c";
            $badgeBg     = "rgba(251, 146, 60, 0.15)";
            $heroLabel   = "অ্যাসেট স্ট্যাটাস";
            $heroAmount  = "In Stock (উপলব্ধ)";
            $rows = [
                ['অ্যাসেটের নাম', $assetName],
                ['পূর্বের গ্রহীতা', htmlspecialchars($data['lessee_name'] ?? 'Payer')],
                ['বাতিলের তারিখ', htmlspecialchars($data['end_date'] ?? date('Y-m-d'))],
                ['বাতিলের কারণ', htmlspecialchars($data['reason'] ?: 'ভাড়া বকেয়া বা চুক্তি সমাপ্তি')],
                ['বর্তমান অবস্থা', 'সম্পদটি পুনরায় সক্রিয় ও ভাড়া/বিক্রয়ের জন্য প্রস্তুত'],
            ];
            break;
    }

    $rowsHtml = "";
    foreach ($rows as $r) {
        $rowsHtml .= '
        <tr>
          <td style="padding: 7px 0; font-size: 12px; color: #94a3b8;">' . $r[0] . '</td>
          <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #ffffff; text-align: right;">' . $r[1] . '</td>
        </tr>';
    }

    return <<<HTML
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>{$headerTitle} - SupplyLink</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070c18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070c18; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background: linear-gradient(145deg, #0d162b, #070e1c); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.85);">
          
          <!-- Banner -->
          <tr>
            <td style="background: {$bannerGrad}; padding: 30px 25px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 12px; padding: 5px 14px; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">
                SupplyLink Asset & Revenue System
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">{$headerTitle}</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #f1f5f9;">{$subTitle}</p>
            </td>
          </tr>

          <!-- Hero Value Box -->
          <tr>
            <td style="padding: 25px 30px 15px 30px; text-align: center;">
              <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">{$heroLabel}</div>
              <div style="font-size: 32px; font-weight: 800; color: #ffffff; margin: 4px 0 8px 0; font-family: monospace;">
                {$heroAmount}
              </div>
              <span style="display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; color: {$badgeColor}; background: {$badgeBg}; border: 1px solid {$badgeColor};">
                {$badgeText}
              </span>
            </td>
          </tr>

          {$extraAlert}

          <!-- Details Table -->
          <tr>
            <td style="padding: 10px 30px 25px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 18px;">
                {$rowsHtml}
                <tr>
                  <td style="padding: 7px 0; font-size: 12px; color: #94a3b8;">সিস্টেম টাইমস্ট্যাম্প</td>
                  <td style="padding: 7px 0; font-size: 12px; font-weight: 600; color: #64748b; text-align: right; font-family: monospace;">{$currentTime}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; background: rgba(0,0,0,0.25);">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                SupplyLink Enterprise System • Automated Assets & Revenue Engine
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

/**
 * Dispatches Asset & Share Event Notification to Admin Email and in-app notifications
 */
function sendAssetEventNotification($eventType, $data) {
    global $mysqli;

    $assetName = $data['asset_name'] ?? 'Asset';
    $results = [];

    // 1. Determine Subject
    $subject = "[Asset Alert] {$assetName}";
    switch ($eventType) {
        case 'asset_purchase':
            $subject = "[Asset Purchase] নতুন অ্যাসেট ক্রয় - {$assetName} (৳ " . number_format((float)($data['purchase_price'] ?? 0), 2) . ")";
            break;
        case 'share_investment':
            $pct = $data['share_percentage'] ? $data['share_percentage'] . '%' : 'Equity';
            $subject = "[Share Investment] নতুন কোম্পানি শেয়ারে বিনিয়োগ - {$assetName} ({$pct})";
            break;
        case 'rental_agreement':
            $lessee = $data['lessee_name'] ?? 'Payer';
            $subject = "[Rental Agreement] নতুন চুক্তি সম্পাদন - {$assetName} (ভাড়াটিয়া: {$lessee})";
            break;
        case 'rental_collection':
            $month = $data['billing_month'] ?? date('Y-m');
            $subject = "[Rental Collected] মাসিক ভাড়া আদায় - {$assetName} [{$month}] (৳ " . number_format((float)($data['amount'] ?? 0), 2) . ")";
            break;
        case 'share_dividend':
            $month = $data['billing_month'] ?? date('Y-m');
            $subject = "[Share Dividend] কোম্পানি শেয়ার লভ্যাংশ আদায় - {$assetName} [{$month}] (৳ " . number_format((float)($data['amount'] ?? 0), 2) . ")";
            break;
        case 'asset_sale':
            $subject = "[Asset Sold] অ্যাসেট বিক্রয় সম্পন্ন - {$assetName} (বিক্রয়মূল্য: ৳ " . number_format((float)($data['selling_price'] ?? 0), 2) . ")";
            break;
        case 'share_exit':
            $subject = "[Share Exit] কোম্পানি শেয়ার একজিট/বিক্রয় - {$assetName} (৳ " . number_format((float)($data['selling_price'] ?? 0), 2) . ")";
            break;
        case 'agreement_terminated':
            $subject = "[Agreement Terminated] চুক্তি বাতিল ও সম্পদ ফেরত - {$assetName}";
            break;
    }

    // 2. Send email to Admin
    $htmlBody = renderAssetEventAdminAlertTemplate($eventType, $data);
    $meta = [
        'category'   => 'others_profit',
        'event_type' => $eventType,
        'related_id' => intval($data['asset_id'] ?? ($data['id'] ?? 0))
    ];
    $results['admin_email'] = sl_smtp_send(SL_ADMIN_EMAIL, $subject, $htmlBody, SL_SENDER_NAME, [], $meta);

    // 3. Insert into in-app notifications
    if (isset($mysqli) && $mysqli instanceof mysqli) {
        try {
            $stmt = $mysqli->prepare("
                INSERT INTO notifications (user_id, target_roles, type, title, message, link, is_read, created_at)
                VALUES (NULL, 'admin,developer,manager', 'asset_event', ?, ?, '/other-sources/assets', 0, NOW())
            ");
            if ($stmt) {
                $notifTitle = $subject;
                $notifMsg   = "অ্যাসেট: {$assetName} এ '{$eventType}' ইভেন্ট সম্পন্ন হয়েছে।";
                $stmt->bind_param("ss", $notifTitle, $notifMsg);
                $stmt->execute();
                $stmt->close();
            }
        } catch (Throwable $e) {
            error_log("Failed to insert asset event notification: " . $e->getMessage());
        }
    }

    return $results;
}

/**
 * =========================================================================
 * 🏦 BANK RECONCILIATION: DAILY CASH-TO-BANK DEPOSIT NOTIFICATIONS
 * =========================================================================
 */

/**
 * Renders Premium Email Template for Admin on Daily Bank Deposit Submission
 */
function renderBankDepositSubmittedAdminAlertTemplate($depositData, $staffData = []) {
    $cDate        = htmlspecialchars($depositData['collection_date'] ?? date('Y-m-d'), ENT_QUOTES, 'UTF-8');
    $totalIn      = floatval($depositData['total_in'] ?? 0);
    $deductedExp  = floatval($depositData['deducted_expense_amount'] ?? 0);
    $adjMode      = htmlspecialchars($depositData['adjustment_mode'] ?? 'net', ENT_QUOTES, 'UTF-8');
    $expected     = floatval($depositData['expected_amount'] ?? 0);
    $deposited    = floatval($depositData['deposited_amount'] ?? 0);
    $shortage     = floatval($depositData['shortage'] ?? max(0, $expected - $deposited));
    $bankName     = htmlspecialchars($depositData['bank_name'] ?? 'N/A', ENT_QUOTES, 'UTF-8');
    $accountNo    = htmlspecialchars($depositData['account_no'] ?? '', ENT_QUOTES, 'UTF-8');
    $depositDate  = htmlspecialchars($depositData['deposit_date'] ?? date('Y-m-d'), ENT_QUOTES, 'UTF-8');
    $reason       = trim($depositData['discrepancy_reason'] ?? '');
    $slipPath     = $depositData['slip_image'] ?? '';

    $staffName    = htmlspecialchars($staffData['name'] ?? 'ফিল্ড কর্মী / ম্যানেজার', ENT_QUOTES, 'UTF-8');
    $staffPhone   = htmlspecialchars($staffData['phone'] ?? '', ENT_QUOTES, 'UTF-8');

    $isShortage   = ($shortage > 0);
    $shortageFmt  = number_format($shortage, 2);
    $expectedFmt  = number_format($expected, 2);
    $depositedFmt = number_format($deposited, 2);
    $totalInFmt   = number_format($totalIn, 2);
    $deductedFmt  = number_format($deductedExp, 2);

    $headerBg     = $isShortage ? 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #450a0a 100%)' : 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #022c22 100%)';
    $title        = $isShortage ? 'ক্যাশ ব্যাংক জমায় ঘাটতি সতর্কতা' : 'দৈনিক ক্যাশ ব্যাংক জমা সম্পন্ন';
    $badgeText    = $isShortage ? '⚠️ ঘাটতি / মিসম্যাচ সনাক্ত হয়েছে' : '✅ সম্পূর্ণ টাকা মিলেছে (কোনো ঘাটতি নেই)';
    $badgeColor   = $isShortage ? '#fca5a5' : '#6ee7b7';
    $badgeBorder  = $isShortage ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)';
    $badgeBg      = $isShortage ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';

    $amountColor  = $isShortage ? '#f87171' : '#34d399';
    $amountBg     = $isShortage ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)';
    $amountBorder = $isShortage ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)';

    $auditUrl     = "https://supplylinkbd.com/cash/bank-reconciliation";

    // Slip preview block
    $slipHtml = '';
    if (!empty($slipPath)) {
        $slipUrl = 'https://api.supplylinkbd.com/' . ltrim($slipPath, '/');
        $imgSrc = !empty($depositData['has_slip_attachment']) ? 'cid:deposit_slip' : $slipUrl;
        $isPdf = (strtolower(pathinfo($slipPath, PATHINFO_EXTENSION)) === 'pdf');

        if ($isPdf) {
            $slipHtml = <<<HTML
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px 20px; text-align: center;">
                <div style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px;">
                  📄 ব্যাংক জমার স্লিপ (PDF Document)
                </div>
                <p style="margin: 0 0 12px 0; font-size: 12px; color: #94a3b8;">স্লিপটি PDF ফরম্যাটে আপলোড করা হয়েছে। নিচে ক্লিক করে দেখুন:</p>
                <a href="{$slipUrl}" target="_blank" style="display: inline-block; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; font-size: 12px; font-weight: 700; padding: 8px 22px; border-radius: 20px; text-decoration: none;">
                  📑 PDF ব্যাংক জমার স্লিপ ওপেন করুন →
                </a>
              </div>
            </td>
          </tr>
HTML;
        } else {
            $slipHtml = <<<HTML
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <div style="background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px 20px; text-align: center;">
                <div style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 12px;">
                  📷 ব্যাংক জমার ভাউচার / স্লিপ (Attached Deposit Slip)
                </div>
                <div style="margin-bottom: 14px;">
                  <img src="{$imgSrc}" alt="Bank Deposit Slip" style="max-width: 100%; max-height: 280px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 8px 25px rgba(0,0,0,0.6); display: inline-block;" />
                </div>
                <div>
                  <a href="{$slipUrl}" target="_blank" style="display: inline-block; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; font-size: 12px; font-weight: 700; padding: 7px 20px; border-radius: 20px; text-decoration: none;">
                    🔍 স্লিপ সম্পূর্ণ বড় আকারে দেখুন (Open Full Slip)
                  </a>
                </div>
              </div>
            </td>
          </tr>
HTML;
        }
    }

    $html = <<<HTML
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070c18; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070c18; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background: linear-gradient(145deg, #0d162b, #070e1c); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.85);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: {$headerBg}; padding: 30px 25px; text-align: center;">
              <div style="display: inline-block; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 6px 14px; font-size: 11px; font-weight: 700; color: #e0f2fe; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
                SupplyLink Daily Bank Reconciliation & Audit
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">
                {$title}
              </h1>
              <div style="margin-top: 10px;">
                <span style="display: inline-block; background: {$badgeBg}; border: 1px solid {$badgeBorder}; border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 700; color: {$badgeColor};">
                  {$badgeText}
                </span>
              </div>
            </td>
          </tr>

          <!-- Summary Financial Cards: Cash In vs Cash Out vs Expected -->
          <tr>
            <td style="padding: 22px 30px 10px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="33.3%" style="padding-right: 5px;">
                    <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 14px; padding: 12px 6px; text-align: center;">
                      <span style="font-size: 10px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; display: block;">
                        মোট ক্যাশ আদায়
                      </span>
                      <div style="font-size: 15px; font-weight: 800; color: #ffffff; margin-top: 4px; font-family: monospace;">
                        ৳ {$totalInFmt}
                      </div>
                    </div>
                  </td>
                  <td width="33.3%" style="padding: 0 3px;">
                    <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 14px; padding: 12px 6px; text-align: center;">
                      <span style="font-size: 10px; font-weight: 700; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.5px; display: block;">
                        কর্তনকৃত খরচ
                      </span>
                      <div style="font-size: 15px; font-weight: 800; color: #fbbf24; margin-top: 4px; font-family: monospace;">
                        -৳ {$deductedFmt}
                      </div>
                    </div>
                  </td>
                  <td width="33.3%" style="padding-left: 5px;">
                    <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 14px; padding: 12px 6px; text-align: center;">
                      <span style="font-size: 10px; font-weight: 700; color: #34d399; text-transform: uppercase; letter-spacing: 0.5px; display: block;">
                        টার্গেট ব্যাংক জমা
                      </span>
                      <div style="font-size: 15px; font-weight: 800; color: #34d399; margin-top: 4px; font-family: monospace;">
                        ৳ {$expectedFmt}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Amount Highlight Card: Deposited -->
          <tr>
            <td style="padding: 10px 30px 10px 30px; text-align: center;">
              <div style="background: {$amountBg}; border: 1px solid {$amountBorder}; border-radius: 18px; padding: 20px;">
                <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; display: block;">
                  ব্যাংকে জমাকৃত টাকার পরিমাণ (Deposited)
                </span>
                <div style="font-size: 34px; font-weight: 900; color: {$amountColor}; margin: 8px 0; font-family: monospace;">
                  ৳ {$depositedFmt}
                </div>
                <span style="font-size: 11px; color: #cbd5e1; font-family: monospace;">
                  কালেকশন তারিখ: {$cDate} • ব্যাংক জমার স্লিপ দাখিলকৃত
                </span>
              </div>
            </td>
          </tr>

          <!-- Breakdown Ledger Details -->
          <tr>
            <td style="padding: 15px 30px 20px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 18px;">
                <tr>
                  <td style="padding: 9px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">কালেকশন তারিখ</td>
                  <td style="padding: 9px 0; font-size: 13px; font-weight: 700; color: #ffffff; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05); font-family: monospace;">{$cDate}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">টার্গেট ব্যাংক জমা (Expected)</td>
                  <td style="padding: 9px 0; font-size: 13px; font-weight: 700; color: #38bdf8; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05); font-family: monospace;">৳ {$expectedFmt}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">ব্যাংকে জমাকৃত টাকা (Deposited)</td>
                  <td style="padding: 9px 0; font-size: 13px; font-weight: 700; color: #34d399; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05); font-family: monospace;">৳ {$depositedFmt}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 0; font-size: 12px; font-weight: 700; color: {$amountColor}; border-bottom: 1px solid rgba(255,255,255,0.05);">ঘাটতি / গ্যাপ (Shortage / Gap)</td>
                  <td style="padding: 9px 0; font-size: 14px; font-weight: 800; color: {$amountColor}; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05); font-family: monospace;">
HTML;
    if ($isShortage) {
        $html .= "-৳ {$shortageFmt}";
    } else {
        $html .= "৳ ০.০০ (সম্পূর্ণ মিলেছে ✅)";
    }
    $html .= <<<HTML
                  </td>
                </tr>
                <tr>
                  <td style="padding: 9px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">ব্যাংক ও একাউন্ট</td>
                  <td style="padding: 9px 0; font-size: 12px; font-weight: 600; color: #ffffff; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    {$bankName} {$accountNo}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 9px 0; font-size: 12px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.05);">জমার তারিখ (Deposit Date)</td>
                  <td style="padding: 9px 0; font-size: 12px; font-family: monospace; color: #cbd5e1; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">{$depositDate}</td>
                </tr>
                <tr>
                  <td style="padding: 9px 0; font-size: 12px; color: #94a3b8;">জমাকারী কর্মী</td>
                  <td style="padding: 9px 0; font-size: 12px; font-weight: 600; color: #e2e8f0; text-align: right;">{$staffName} {$staffPhone}</td>
                </tr>
              </table>
            </td>
          </tr>
HTML;

    // Discrepancy Reason box (If shortage)
    if ($isShortage && !empty($reason)) {
        $cleanReason = nl2br(htmlspecialchars($reason, ENT_QUOTES, 'UTF-8'));
        $html .= <<<HTML
          <tr>
            <td style="padding: 0 30px 15px 30px;">
              <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; border-radius: 0 12px 12px 0; padding: 14px 18px;">
                <div style="font-size: 11px; font-weight: 700; color: #fca5a5; text-transform: uppercase; margin-bottom: 4px;">
                  ⚠️ ক্যাশ কম জমার কারণ / কর্মীর কৈফিয়ত:
                </div>
                <div style="font-size: 13px; color: #ffffff; font-style: italic; line-height: 1.5;">
                  "{$cleanReason}"
                </div>
              </div>
            </td>
          </tr>
HTML;
    }

    // Slip Attachment Block
    $html .= $slipHtml;

    $html .= <<<HTML
          <!-- CTA Action Button -->
          <tr>
            <td style="padding: 10px 30px 25px 30px; text-align: center;">
              <a href="{$auditUrl}" style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: #ffffff; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 13px; display: inline-block; box-shadow: 0 4px 15px rgba(5,150,105,0.45); letter-spacing: 0.5px;">
                এডমিন প্যানেলে অডিট ও ভেরিফাই করুন →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(0,0,0,0.5); padding: 18px 25px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06);">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.5;">
                SupplyLink Limited • Automated Daily Banking Reconciliation System<br>
                এই ইমেইলটি সিস্টেম থেকে স্বয়ংক্রিয়ভাবে অডিট ও মনিটরিংয়ের জন্য পাঠানো হয়েছে।
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;

    return $html;
}

/**
 * Sends Daily Bank Deposit Notification to Admin and records in-app notification
 */
function sendBankDepositSubmittedNotification($depositData, $staffData = []) {
    global $mysqli;

    $cDate       = $depositData['collection_date'] ?? date('Y-m-d');
    $deposited   = floatval($depositData['deposited_amount'] ?? 0);
    $shortage    = floatval($depositData['shortage'] ?? 0);
    $reason      = trim($depositData['discrepancy_reason'] ?? '');
    $depId       = intval($depositData['id'] ?? 0);
    $submitterId = intval($depositData['submitted_by'] ?? 290);
    $slipPath    = $depositData['slip_image'] ?? '';

    $isShortage  = ($shortage > 0);
    $shortageFmt = number_format($shortage, 2);
    $depositedFmt= number_format($deposited, 2);

    if ($isShortage) {
        $subject = "🚨 [ক্যাশ ঘাটতি অ্যালার্ট] তারিখ: {$cDate} | ঘাটতি: ৳ {$shortageFmt} কম জমা পড়েছে";
    } else {
        $subject = "✅ [ব্যাংক ডিপোজিট নোটিশ] তারিখ: {$cDate} | ৳ {$depositedFmt} ব্যাংকে জমা হয়েছে (সম্পূর্ণ মিলেছে)";
    }

    // Resolve inline slip attachment if exists
    $attachments = [];
    $hasSlipAttachment = false;
    if (!empty($slipPath)) {
        $candidates = [
            rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/') . '/' . ltrim($slipPath, '/'),
            dirname(__DIR__, 2) . '/' . ltrim($slipPath, '/'),
            'C:/xampp/htdocs/' . ltrim($slipPath, '/'),
            __DIR__ . '/../../' . ltrim($slipPath, '/')
        ];
        $fullSlipPath = '';
        foreach ($candidates as $cand) {
            if (file_exists($cand) && !is_dir($cand)) {
                $fullSlipPath = $cand;
                break;
            }
        }
        if (!empty($fullSlipPath) && file_exists($fullSlipPath)) {
            $ext = strtolower(pathinfo($fullSlipPath, PATHINFO_EXTENSION));
            if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp'])) {
                $mime = ($ext === 'png') ? 'image/png' : (($ext === 'webp') ? 'image/webp' : 'image/jpeg');
                $attachments[] = [
                    'cid'  => 'deposit_slip',
                    'path' => $fullSlipPath,
                    'mime' => $mime,
                    'name' => basename($fullSlipPath)
                ];
                $hasSlipAttachment = true;
            }
        }
    }
    $depositData['has_slip_attachment'] = $hasSlipAttachment;

    $results = [];

    // 1. Render HTML email
    $htmlBody = renderBankDepositSubmittedAdminAlertTemplate($depositData, $staffData);

    // 2. Send email to Admin via SMTP
    $meta = [
        'category'   => 'bank_reconciliation',
        'event_type' => $isShortage ? 'bank_shortage_alert' : 'bank_deposit_submitted',
        'related_id' => $depId
    ];

    $adminEmail = defined('SL_ADMIN_EMAIL') ? SL_ADMIN_EMAIL : 'supplylinkb@gmail.com';
    $mailRes    = sl_smtp_send($adminEmail, $subject, $htmlBody, SL_SENDER_NAME, $attachments, $meta);
    $results['admin_email'] = $mailRes;

    // Fallback to PHP native mail() if socket is restricted on shared hosting
    if (empty($mailRes['success'])) {
        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: SupplyLink Limited <" . SL_SMTP_USER . ">\r\n";
        $headers .= "Reply-To: " . SL_SMTP_USER . "\r\n";
        @mail($adminEmail, $subject, $htmlBody, $headers);
    }

    // 3. Insert in-app notification for Admin & Developers
    if (isset($mysqli) && $mysqli instanceof mysqli) {
        try {
            $notifMsg = $isShortage 
                ? "তারিখ: {$cDate} এ ৳ {$shortageFmt} ক্যাশ ঘাটতি হয়েছে। কৈফিয়ত: {$reason}"
                : "তারিখ: {$cDate} এর ৳ {$depositedFmt} ব্যাংকে জমা হয়েছে।";

            $stmtN = $mysqli->prepare("
                INSERT INTO notifications (user_id, target_roles, type, title, message, link, is_read, created_at)
                VALUES (?, 'admin,developer', 'bank_deposit', ?, ?, '/cash/bank-reconciliation', 0, NOW())
            ");
            if ($stmtN) {
                $stmtN->bind_param("iss", $submitterId, $subject, $notifMsg);
                $stmtN->execute();
                $stmtN->close();
            }
        } catch (\Throwable $e) {
            error_log("Failed to insert bank deposit notification: " . $e->getMessage());
        }
    }

    return $results;
}