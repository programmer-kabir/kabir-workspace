<?php
require 'backend/api_v1 (2)/config/db.php';

// Get a random user
$res = $mysqli->query("SELECT id FROM users LIMIT 1");
$user = $res->fetch_assoc();
$user_id = $user ? $user['id'] : 1;

$tickets = [
    [
        'id' => 'TKT-100452',
        'dept' => 'Billing',
        'subj' => 'Withdrawal not received yet',
        'pri' => 'Urgent',
        'stat' => 'Open',
        'msg' => 'Hi Admin, I requested a withdrawal 3 days ago via bKash but I have not received the money yet. Please check. Attached is my dashboard screenshot.',
        'att' => 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&q=80'
    ],
    [
        'id' => 'TKT-100453',
        'dept' => 'Technical',
        'subj' => 'Cannot upload vector files',
        'pri' => 'High',
        'stat' => 'Open',
        'msg' => 'Hello! Whenever I try to upload an EPS file, it says Invalid Format. Can you please look into this issue? I have many items to upload.',
        'att' => null
    ],
    [
        'id' => 'TKT-100454',
        'dept' => 'Copyright',
        'subj' => 'Someone copied my illustration',
        'pri' => 'Medium',
        'stat' => 'Closed',
        'msg' => 'I found a user who has re-uploaded my premium vector illustration. Here is the link to their item...',
        'att' => null
    ]
];

foreach ($tickets as $t) {
    // Insert ticket
    $ins = $mysqli->prepare("INSERT IGNORE INTO support_tickets (id, user_id, department, subject, priority, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY))");
    $ins->bind_param('sissss', $t['id'], $user_id, $t['dept'], $t['subj'], $t['pri'], $t['stat']);
    $ins->execute();

    // Insert message
    $msg = $mysqli->prepare("INSERT IGNORE INTO ticket_messages (ticket_id, sender_id, message, attachment_url, is_admin_reply, created_at) VALUES (?, ?, ?, ?, 0, DATE_SUB(NOW(), INTERVAL 2 DAY))");
    $msg->bind_param('siss', $t['id'], $user_id, $t['msg'], $t['att']);
    $msg->execute();
}
echo 'Demo data inserted successfully!';
