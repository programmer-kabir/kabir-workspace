<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'EmailHelper.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$testEmail = isset($_GET['email']) ? $_GET['email'] : 'contact@creativecomputeracademy.com';

$title = "Email System Test";
$contentHtml = "<p>If you are reading this, the CCA Email Notification System is working perfectly!</p><p>SMTP configuration is successful.</p>";

$htmlBody = EmailHelper::getHtmlTemplate($title, $contentHtml);

// Pass $debug = true to get string error back or true on success
$result = EmailHelper::sendEmail($testEmail, "Admin Tester", $title, $htmlBody, true);

if ($result === true) {
    echo json_encode([
        "status" => "success",
        "message" => "Test email successfully sent to $testEmail"
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to send email.",
        "debug_info" => $result
    ]);
}
?>
