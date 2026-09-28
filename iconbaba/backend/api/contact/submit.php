<?php
// backend/api/contact/submit.php
// Submit contact form message with server-side validation

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, 'Method not allowed.', 405);
}

$input = getJsonInput();

$name = isset($input['name']) ? trim($input['name']) : '';
$email = isset($input['email']) ? trim(strtolower($input['email'])) : '';
$subject = isset($input['subject']) ? trim($input['subject']) : '';
$message = isset($input['message']) ? trim($input['message']) : '';

// Validation
if (empty($name) || mb_strlen($name) < 2 || mb_strlen($name) > 100) {
    jsonResponse(false, null, 'Please provide a valid name (2-100 characters).', 400);
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 100) {
    jsonResponse(false, null, 'Please provide a valid email address.', 400);
}

if (empty($subject) || mb_strlen($subject) < 3 || mb_strlen($subject) > 200) {
    jsonResponse(false, null, 'Please provide a subject (3-200 characters).', 400);
}

if (empty($message) || mb_strlen($message) < 10 || mb_strlen($message) > 5000) {
    jsonResponse(false, null, 'Please provide a message between 10 and 5,000 characters.', 400);
}

// Store submission
$stmt = $pdo->prepare("
    INSERT INTO contact_messages (name, email, subject, message, status)
    VALUES (:name, :email, :subject, :message, 'unread')
");
$stmt->execute([
    ':name' => $name,
    ':email' => $email,
    ':subject' => $subject,
    ':message' => $message
]);

$id = $pdo->lastInsertId();

// Notify admins about new contact message
require_once __DIR__ . '/../../helpers/notifications.php';
createNotification(
    $pdo,
    'New Contact Inquiry',
    "New message from {$name}: \"{$subject}\"",
    'admin_contact_message',
    null,
    'admin',
    null,
    ['contact_id' => (int)$id, 'sender_name' => $name, 'email' => $email],
    'shield'
);

jsonResponse(true, ['id' => (int)$id], 'Thank you! Your message has been sent successfully. Our team will get back to you shortly.', 201);
