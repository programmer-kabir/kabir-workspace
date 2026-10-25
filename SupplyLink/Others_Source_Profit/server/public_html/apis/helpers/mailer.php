<?php
/**
 * SupplyLink Automated Transactional Email Engine
 * Uses secure direct TLS/SSL SMTP to smtp.gmail.com
 */

if (!defined('SL_SMTP_HOST')) {
    define('SL_SMTP_HOST', 'ssl://smtp.gmail.com');
    define('SL_SMTP_PORT', 465);
    define('SL_SMTP_USER', 'supplylinkbdltd@gmail.com');
    define('SL_SMTP_PASS', 'osgpenunfhcprbpp');
    define('SL_ADMIN_EMAIL', 'supplylinkb@gmail.com');
    define('SL_SENDER_NAME', 'SupplyLink Limited');
}

/**
 * Raw Socket SMTP sender (zero external dependencies)
 */
function sl_smtp_send($to, $subject, $htmlBody, $fromName = SL_SENDER_NAME, $inlineAttachments = []) {
    $host = SL_SMTP_HOST;
    $port = SL_SMTP_PORT;
    $user = SL_SMTP_USER;
    $pass = SL_SMTP_PASS;

    $socket = @stream_socket_client($host . ":" . $port, $errno, $errstr, 12, STREAM_CLIENT_CONNECT);
    if (!$socket) {
        error_log("SupplyLink Mailer Socket Error: $errstr ($errno)");
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
    if (!$r['ok']) { fclose($socket); return ["success" => false, "error" => "Greeting: " . $r['response']]; }

    // EHLO
    $write("EHLO " . (gethostname() ?: "localhost"));
    $r = $read(250);
    if (!$r['ok']) { fclose($socket); return ["success" => false, "error" => "EHLO: " . $r['response']]; }

    // AUTH LOGIN
    $write("AUTH LOGIN");
    $r = $read(334);
    if (!$r['ok']) { fclose($socket); return ["success" => false, "error" => "AUTH: " . $r['response']]; }

    $write(base64_encode($user));
    $r = $read(334);
    if (!$r['ok']) { fclose($socket); return ["success" => false, "error" => "User: " . $r['response']]; }

    $write(base64_encode($pass));
    $r = $read(235);
    if (!$r['ok']) { fclose($socket); return ["success" => false, "error" => "Password auth failed: " . $r['response']]; }

    // MAIL FROM
    $write("MAIL FROM:<$user>");
    $r = $read(250);
    if (!$r['ok']) { fclose($socket); return ["success" => false, "error" => "MAIL FROM: " . $r['response']]; }

    // RCPT TO
    $write("RCPT TO:<$to>");
    $r = $read(250);
    if (!$r['ok']) { fclose($socket); return ["success" => false, "error" => "RCPT TO: " . $r['response']]; }

    // DATA
    $write("DATA");
    $r = $read(354);
    if (!$r['ok']) { fclose($socket); return ["success" => false, "error" => "DATA: " . $r['response']]; }

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
    if (!$r['ok']) { fclose($socket); return ["success" => false, "error" => "Send: " . $r['response']]; }

    $write("QUIT");
    fclose($socket);

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


