<?php
class CommunityDbHelper {
    public static function ensureSchema($db) {
        if (!$db) return;

        try {
            // 1. Table: community_posts
            $db->exec("CREATE TABLE IF NOT EXISTS `community_posts` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `user_id` INT NOT NULL,
                `content` TEXT NOT NULL,
                `category` VARCHAR(50) NOT NULL DEFAULT 'General',
                `image_url` VARCHAR(500) NULL,
                `is_pinned` TINYINT(1) NOT NULL DEFAULT 0,
                `likes_count` INT NOT NULL DEFAULT 0,
                `comments_count` INT NOT NULL DEFAULT 0,
                `status` ENUM('active', 'archived', 'deleted') NOT NULL DEFAULT 'active',
                `created_at` DATETIME NOT NULL,
                `updated_at` DATETIME NOT NULL,
                INDEX (`user_id`),
                INDEX (`category`),
                INDEX (`is_pinned`),
                INDEX (`status`),
                INDEX (`created_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            // 2. Table: community_likes
            $db->exec("CREATE TABLE IF NOT EXISTS `community_likes` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `post_id` INT NOT NULL,
                `user_id` INT NOT NULL,
                `reaction_type` VARCHAR(20) NOT NULL DEFAULT 'like',
                `created_at` DATETIME NOT NULL,
                UNIQUE KEY `unique_post_user_like` (`post_id`, `user_id`),
                INDEX (`post_id`),
                INDEX (`user_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            // 3. Table: community_comments
            $db->exec("CREATE TABLE IF NOT EXISTS `community_comments` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `post_id` INT NOT NULL,
                `user_id` INT NOT NULL,
                `parent_id` INT NULL DEFAULT NULL,
                `comment` TEXT NOT NULL,
                `created_at` DATETIME NOT NULL,
                `updated_at` DATETIME NOT NULL,
                INDEX (`post_id`),
                INDEX (`user_id`),
                INDEX (`parent_id`),
                INDEX (`created_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            // Check if community_posts is empty; if so, seed initial starter posts into database
            $cntStmt = $db->query("SELECT COUNT(*) FROM `community_posts`");
            if ($cntStmt && (int)$cntStmt->fetchColumn() === 0) {
                self::seedInitialPosts($db);
            }

        } catch (Throwable $e) {
            error_log("CommunityDbHelper::ensureSchema error: " . $e->getMessage());
        }
    }

    private static function seedInitialPosts($db) {
        try {
            $adminId = 1;
            $kabirId = 2;
            $siamId = 3;
            $jahidId = 4;
            $kalamId = 5;

            $posts = [
                [
                    'user_id' => $adminId,
                    'content' => "📢 **সম্মানিত CCA টিম**, আগামী মাসের ফাইনাল এক্সাম এবং স্টুডেন্ট রিভিউ সেশন নিয়ে কিছু গুরুত্বপূর্ণ দিকনির্দেশনা:\n\n১. সকল ট্রেইনারকে তাদের রেগুলার স্টুডেন্ট লগ ও রিভিউ রিপোর্ট ৩০ তারিখের মধ্যে কমপ্লিট করতে হবে।\n২. @kabir এবং @siam ভাইদের সাথে নতুন ব্যাচের শিডিউল ফাইনাল করা হয়েছে।\n৩. কোনো ছুটি বা ব্রেক শিডিউলে পরিবর্তন থাকলে অ্যাডমিন প্যানেলে আগে থেকে ইনফর্ম করুন।\n\nশুভকামনা সবাইকে! 🚀",
                    'category' => 'Announcement',
                    'is_pinned' => 1,
                    'created_at' => date('Y-m-d H:i:s', strtotime('-2 hours')),
                    'comments' => [
                        ['user_id' => $kabirId, 'comment' => "নোট নিলাম স্যার! আমাদের ব্যাচের সব স্টুডেন্ট লগ অলরেডি কমপ্লিট করা আছে। 👍"],
                        ['user_id' => $jahidId, 'comment' => "In sha Allah timely submit kora hobe! 👏"]
                    ]
                ],
                [
                    'user_id' => $kabirId,
                    'content' => "🎉 আলহামদুলিল্লাহ! গ্রাফিক্স ডিজাইন ব্যাচ #৪২ এর সব স্টুডেন্ট পেন টুল মাস্টার এক্সাম ১০০% একুরেসিতে কমপ্লিট করেছে! 🎨🖌️\n\nস্টুডেন্টদের ডেডিকেশন দেখে সত্যি ভালো লাগছে। বিশেষ করে জটিল ভেক্টর মাস্কিং এবং বেজিয়ার কার্ভের কাজগুলো সবাই খুব নিখুঁতভাবে করতে পারছে। @jahidul এবং @siam ভাইয়ের সাপোর্ট প্রশংসনীয় ছিল! 🔥💯",
                    'category' => 'Achievement',
                    'is_pinned' => 0,
                    'created_at' => date('Y-m-d H:i:s', strtotime('-1 day')),
                    'comments' => [
                        ['user_id' => $siamId, 'comment' => "অভিনন্দন কবির ভাই এবং ব্যাচের সবাইকে! চমৎকার রেজাল্ট! 🏆🎉"],
                        ['user_id' => $kalamId, 'comment' => "Great work team! Keep it up! 🔥"]
                    ]
                ],
                [
                    'user_id' => $jahidId,
                    'content' => "💡 **Quick Workflow Tip for Designers:**\n\nফটোশপে সোশ্যাল মিডিয়া ব্যানার বা পোস্টার ডিজাইনের সময় সবসময় Smart Objects এবং Non-destructive Masking ব্যবহার করুন। এতে ক্লায়েন্ট রিভিশন দিলে খুব সহজেই কয়েক সেকেন্ডে সাইজ ও কালার পরিবর্তন করা যায়!\n\nকে কে এই মেথড রেগুলার ফলো করেন? 💬👇",
                    'category' => 'Discussion',
                    'is_pinned' => 0,
                    'created_at' => date('Y-m-d H:i:s', strtotime('-2 days')),
                    'comments' => [
                        ['user_id' => $kabirId, 'comment' => "খুবই হেল্পফুল টিপ ভাইয়া, স্মার্ট অবজেক্ট ইউজ করলে ফাইলের কোয়ালিটিও নষ্ট হয় না! ✨"]
                    ]
                ],
                [
                    'user_id' => $siamId,
                    'content' => "❓ **একটি প্রশ্ন ছিল সবার কাছে:**\nইলাস্ট্রেটরে জটিল ভেক্টর লোগো এক্সপোর্ট করার সময় SVG বনাম EPS কোন ফরম্যাটটা বেশি প্রিফার করেন প্রিন্ট এবং ওয়েবের কম্বিনেশন প্রজেক্টের জন্য? আপনাদের অভিজ্ঞতা শেয়ার করবেন প্লিজ। 🧐",
                    'category' => 'Question',
                    'is_pinned' => 0,
                    'created_at' => date('Y-m-d H:i:s', strtotime('-3 days')),
                    'comments' => [
                        ['user_id' => $kabirId, 'comment' => "প্রিন্টের ক্ষেত্রে EPS বা ভেক্টর PDF সবচেয়ে সেফ সিএমওয়াইকে কালারের জন্য। আর ওয়েবের জন্য অবশ্যই অপ্টিমাইজড SVG! 💡"]
                    ]
                ],
                [
                    'user_id' => $kalamId,
                    'content' => "🥭 ম্যাঙ্গো ব্রেক ট্রি সত্যিই দারুণ ফিচার! অতিরিক্ত কাজের প্রতিটি ঘণ্টার জন্য আম পাকছে এবং ফুল-ডে পেইড লিভ পাওয়া যাচ্ছে। এই মাসের ফার্স্ট ম্যাঙ্গো অলরেডি অর্জন করেছি! পরিশ্রম কখনো বৃথা যায় না। 💪🔥 @kabir @cca_admin",
                    'category' => 'General',
                    'is_pinned' => 0,
                    'created_at' => date('Y-m-d H:i:s', strtotime('-4 days')),
                    'comments' => [
                        ['user_id' => $adminId, 'comment' => "অভিনন্দন কালাম! আপনার পরিশ্রম প্রশংসার দাবিদার। 🥭👏"]
                    ]
                ]
            ];

            $insPost = $db->prepare("INSERT INTO community_posts (user_id, content, category, is_pinned, likes_count, comments_count, status, created_at, updated_at) VALUES (:uid, :cnt, :cat, :pin, :l_cnt, :c_cnt, 'active', :c_at, :u_at)");
            $insComm = $db->prepare("INSERT INTO community_comments (post_id, user_id, comment, created_at, updated_at) VALUES (:pid, :uid, :comm, :c_at, :u_at)");
            $insLike = $db->prepare("INSERT IGNORE INTO community_likes (post_id, user_id, reaction_type, created_at) VALUES (:pid, :uid, 'like', :c_at)");

            foreach ($posts as $p) {
                $commentsCount = count($p['comments']);
                $likesCount = 3;

                $insPost->execute([
                    ':uid' => $p['user_id'],
                    ':cnt' => $p['content'],
                    ':cat' => $p['category'],
                    ':pin' => $p['is_pinned'],
                    ':l_cnt' => $likesCount,
                    ':c_cnt' => $commentsCount,
                    ':c_at' => $p['created_at'],
                    ':u_at' => $p['created_at']
                ]);
                $pid = (int)$db->lastInsertId();

                // Likes
                for ($u = 1; $u <= $likesCount; $u++) {
                    $insLike->execute([
                        ':pid' => $pid,
                        ':uid' => $u,
                        ':c_at' => $p['created_at']
                    ]);
                }

                // Comments
                foreach ($p['comments'] as $c) {
                    $cTime = date('Y-m-d H:i:s', strtotime($p['created_at'] . ' +15 minutes'));
                    $insComm->execute([
                        ':pid' => $pid,
                        ':uid' => $c['user_id'],
                        ':comm' => $c['comment'],
                        ':c_at' => $cTime,
                        ':u_at' => $cTime
                    ]);
                }
            }
        } catch (Throwable $e) {
            error_log("CommunityDbHelper::seedInitialPosts error: " . $e->getMessage());
        }
    }
}
