# 🏛️ Creative Computer Academy — Community Feed Blueprint
**Internal Social Wall & Discussion Platform for Admin & Staff (Microscopic Architecture Review)**

---

## 📌 ১. ওভারভিউ ও উদ্দেশ্য (Overview & Objective)

ক্রিয়েটিভ কম্পিউটার একাডেমির প্ল্যাটফর্মে অ্যাডমিন ও স্টাফদের কাজের সমন্বয়, নোটিশ প্রচার, অর্জন উদযাপন এবং টিম বন্ডিং মজবুত করার জন্য একটি ইন-হাউজ **"Community Feed"** (সোশ্যাল ওয়াল) প্ল্যাটফর্ম তৈরি করা হবে। 

যেহেতু আমাদের সিস্টেমে প্রতিটি ইউজারের:
- **Full Name** (`users.name`)
- **Username** (`users.username` e.g., `@kabir_cca`)
- **Profile Picture / Avatar** (`users.profile_picture`)
- **Role** (`user_roles.role` e.g., `admin`, `staff`, `reviewer`)
- **Department** (`departments.name` e.g., `IT & Academics`, `Graphics & Media`)
- **Designation** (`employees.designation`)

ইতোমধ্যে ডেটাবেজে সংরক্ষিত রয়েছে এবং `AuthContext` এর মাধ্যমে অ্যাক্সেসযোগ্য, তাই এই কমিউনিটি পোস্ট ফিচারটি দেখতে সম্পূর্ণ প্রফেশনাল এবং সোশ্যাল নেটওয়ার্কের (যেমন: LinkedIn / Workplace / Discord) মতো প্রাণবন্ত লাগবে।

---

## 🏗️ ২. আর্কিটেকচার ডিজাইন (System Architecture)

```mermaid
graph TD
    subgraph Frontend Layer
        SF["Staff Frontend (/community)<br/>CommunityFeed.jsx"]
        AF["Admin Frontend (/community)<br/>CommunityWall.jsx"]
    end

    subgraph Backend API Layer (server/api/community/)
        CDB["CommunityDbHelper.php"]
        GF["get_feed.php"]
        CP["create_post.php"]
        TL["toggle_like.php"]
        AC["add_comment.php"]
        PP["pin_post.php"]
        DP["delete_post.php"]
        UP["upload_post_image.php"]
    end

    subgraph Realtime & Notification Services
        PSH["PusherHelper.php<br/>(community-channel)"]
        NOTIF["NotificationHelper.php<br/>(notifications table)"]
    end

    subgraph Database Layer
        CPT["community_posts"]
        CLT["community_likes"]
        CCT["community_comments"]
        UT["users, user_roles, employees, departments"]
    end

    SF --> GF & CP & TL & AC & UP
    AF --> GF & CP & TL & AC & PP & DP & UP
    
    CP & TL & AC --> PSH
    CP & TL & AC --> NOTIF
    
    GF & CP & TL & AC & PP & DP --> CPT & CLT & CCT & UT
```

---

## 🗄️ ৩. মাইক্রোস্কোপিক ডেটাবেজ স্কিমা (Database Schema & Integrity)

আমাদের প্রজেক্টের স্বয়ংক্রিয় টেবিল জেনারেশন প্যাটার্ন (`CommunityDbHelper::ensureSchema($db)`) অনুযায়ী টেবিলগুলো স্বয়ংক্রিয়ভাবে তৈরি হবে। কোনো ম্যানুয়াল SQL ইমপোর্টের প্রয়োজন নেই।

### ১) `community_posts` (মূল পোস্ট টেবিল)
```sql
CREATE TABLE IF NOT EXISTS `community_posts` (
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
  INDEX (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### ২) `community_likes` (লাইক ও রিঅ্যাকশন ট্র্যাকিং)
```sql
CREATE TABLE IF NOT EXISTS `community_likes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `post_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `reaction_type` VARCHAR(20) NOT NULL DEFAULT 'like',
  `created_at` DATETIME NOT NULL,
  UNIQUE KEY `unique_post_user_like` (`post_id`, `user_id`),
  INDEX (`post_id`),
  INDEX (`user_id`),
  FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### ৩) `community_comments` (কমেন্টস ও থ্রেডেড রিপ্লাই)
```sql
CREATE TABLE IF NOT EXISTS `community_comments` (
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
  INDEX (`created_at`),
  FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

> [!IMPORTANT]
> **কেন `ON DELETE CASCADE` ব্যবহার করা হয়েছে?**  
> যদি কোনো পোস্ট ডিলিট করা হয়, ডেটাবেজ ইঞ্জিন স্বয়ংক্রিয়ভাবে তার সমস্ত লাইক এবং কমেন্ট মুছে ফেলবে। এতে কোনো অরফ্যানড (orphaned) ডেটা জমবে না। এবং `utf8mb4` ব্যবহারের কারণে বাংলা ফন্ট এবং সব ধরনের ইমোজি (🎉, 🥭, ❤️, 🔥, 👏) কোনো ধরনের সমস্যা ছাড়া স্মুথলি স্টোর হবে।

---

## 🔌 ৪. ব্যাকএন্ড এপিআই কন্ট্রাক্ট (API Specifications & Payloads)

ফোল্ডার পাথ: `server/api/community/`

### ১) `get_feed.php`
- **Method**: `GET` বা `POST`
- **Parameters**:
  - `user_id`: ভিউয়ার ইউজারের আইডি (যাতে জানা যায় বর্তমান ইউজার পোস্টে লাইক করেছে কি না)
  - `category`: `'all' | 'announcement' | 'discussion' | 'achievement' | 'help'`
  - `filter`: `'all' | 'pinned' | 'my_posts'`
  - `page`: ডিফল্ট `1`
  - `limit`: ডিফল্ট `15`
- **SQL Join লজিক**:
  ```sql
  SELECT p.*,
         u.name AS author_name,
         u.username AS author_username,
         u.profile_picture AS author_avatar,
         MIN(ur.role) AS author_role,
         MAX(e.designation) AS author_designation,
         MAX(d.name) AS author_department,
         (SELECT reaction_type FROM community_likes WHERE post_id = p.id AND user_id = :viewer_id LIMIT 1) AS my_reaction,
         (SELECT COUNT(*) FROM community_likes WHERE post_id = p.id) AS real_likes_count,
         (SELECT COUNT(*) FROM community_comments WHERE post_id = p.id) AS real_comments_count
  FROM community_posts p
  INNER JOIN users u ON p.user_id = u.id
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  LEFT JOIN employees e ON u.id = e.user_id
  LEFT JOIN departments d ON e.department_id = d.id
  WHERE p.status = 'active'
  GROUP BY p.id
  ORDER BY p.is_pinned DESC, p.created_at DESC
  LIMIT :offset, :limit
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": 1,
        "content": "নতুন গ্রাফিক্স ব্যাচের ক্লাস টেস্টের ফলাফল পাবলিশ করা হয়েছে!",
        "category": "Announcement",
        "image_url": "uploads/community/post_1791713000.webp",
        "is_pinned": 1,
        "likes_count": 8,
        "comments_count": 3,
        "my_reaction": "like",
        "created_at": "2026-10-11 14:20:00",
        "author": {
          "id": 14,
          "name": "Tanvir Kabir",
          "username": "kabir_cca",
          "role": "admin",
          "avatar": "uploads/profile/14.jpg",
          "designation": "Managing Director",
          "department": "IT & Academics"
        },
        "latest_comments": [ ... ]
      }
    ],
    "has_more": false
  }
  ```

### ২) `create_post.php`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "user_id": 14,
    "content": "আজকে আমাদের ফটোশপ অ্যাডভান্সড ক্লাসের প্রজেক্ট প্রেজেন্টেশন সম্পন্ন হলো! @shakil অসাধারণ কাজ করেছে।",
    "category": "Achievement",
    "image_url": "uploads/community/post_1791713000.jpg"
  }
  ```
- **Execution Workflow**:
  1. ভ্যালিডেশন: `user_id` ও `content` (অথবা `image_url`) ফাঁকা হওয়া যাবে না।
  2. ইনসার্ট: `community_posts` টেবিলে ডেটা সেভ করা।
  3. **@mentions পার্সিং**: রেজেক্স `/@([a-zA-Z0-9_]+)/` দিয়ে টেক্সট স্ক্যান করে ইউজার খোঁজা। ইউজার পাওয়া গেলে `NotificationHelper::sendToUser` দিয়ে নোটিফিকেশন পাঠানো।
  4. **Pusher ব্রডকাস্ট**: `PusherHelper::trigger('community-channel', 'new-post', $newPostData)` কল করে লাইভ পুশ করা।
  5. রেসপন্স: নতুন তৈরি হওয়া পোস্টের কমপ্লিট অবজেক্ট রিটার্ন করা।

### ৩) `toggle_like.php`
- **Method**: `POST`
- **Payload**: `{ "post_id": 1, "user_id": 14, "reaction_type": "like" }`
- **Execution Workflow**:
  1. `community_likes` টেবিলে অলরেডি লাইক আছে কি না চেক করা।
  2. থাকলে ডিলিট করা (`liked: false`), না থাকলে ইনসার্ট করা (`liked: true`)।
  3. `community_posts` এর `likes_count` ফিল্ড আপডেট করা।
  4. যদি নতুন লাইক হয় এবং লাইকার যদি পোস্টের লেখক না হন, তবে পোস্টের লেখককে নোটিফিকেশন পাঠানো:
     `NotificationHelper::sendToUser($db, $author_id, $user_id, 'New Like', "{$liker_name} liked your post", 'like', 'community', '/community')`।
  5. Pusher ব্রডকাস্ট: `PusherHelper::trigger('community-channel', 'post-liked', ['post_id' => $post_id, 'likes_count' => $new_count])`।

### ৪) `add_comment.php`
- **Method**: `POST`
- **Payload**: `{ "post_id": 1, "user_id": 14, "comment": "অসাধারণ কাজ!", "parent_id": null }`
- **Execution Workflow**:
  1. `community_comments` টেবিলে ইনসার্ট করা।
  2. `community_posts` এর `comments_count` ফিল্ড ১ বৃদ্ধি করা।
  3. পোস্টের লেখককে নোটিফিকেশন পাঠানো (যদি লেখক নিজে কমেন্ট না করে থাকেন)।
  4. কমেন্টে `@username` মেনশন থাকলে তাদেরও নোটিফিকেশন পাঠানো।
  5. Pusher ব্রডকাস্ট: `PusherHelper::trigger('community-channel', 'new-comment', ['post_id' => $post_id, 'comment' => $commentRow])`।

### ৫) `pin_post.php` (Admin Exclusive)
- **Method**: `POST`
- **Payload**: `{ "post_id": 1, "admin_id": 14, "is_pinned": 1 }`
- **Permission Check**: `user_roles` টেবিলে `admin_id` এর রোল `admin` কি না তা ভেরিফাই করা। শুধুমাত্র অ্যাডমিনরা পিন/আনপিন করতে পারবে।

### ৬) `delete_post.php` / `delete_comment.php`
- **Method**: `POST`
- **Payload**: `{ "post_id": 1, "user_id": 14 }`
- **Permission Check**: পোস্টের লেখক নিজে ডিলিট করতে পারবে অথবা যদি `user_roles` এ `admin` থাকে তবে অ্যাডমিন মডারেশন ডিলিট করতে পারবে।

### ৭) `upload_post_image.php`
- **Method**: `POST` (`multipart/form-data`)
- **Directory**: `server/uploads/community/`
- **Allowed Extensions**: `jpg`, `jpeg`, `png`, `webp`, `gif`
- **Max Size**: `5 MB`
- **Naming Pattern**: `post_` + `timestamp` + `_` + `random_hex` + `.` + `ext`

---

## 🎨 ৫. ফ্রন্টএন্ড কম্পোনেন্ট আর্কিটেকচার (UI & Aesthetics)

উভয় অ্যাপেই (`staff-frontend` এবং `admin-frontend`) লাইট এবং ডার্ক মোডের জন্য প্রিমিয়াম ডিজাইন টোকেন ব্যবহার করা হবে:

### ১) কম্পোনেন্ট হায়ারার্কি
```
src/pages/CommunityFeed.jsx (Staff) / CommunityWall.jsx (Admin)
├── FeedHeader (Title, Category Chips, Feed Filter Tabs)
├── PostComposer
│   ├── User Avatar & Interactive Placeholder
│   ├── Expanding Textarea (with Auto-grow & Emoji suggestions)
│   ├── Image Dropzone / Preview with remove button
│   ├── Category Selector Dropdown
│   └── Submit Button (with loading spinner)
└── FeedStream
    ├── PinnedPostBanner (if any pinned post exists)
    └── PostCard (Repeated list)
        ├── CardHeader (Avatar, Name, @username, Role Badge, Dept, Timeago, 3-dots Menu)
        ├── CardBody (Content with clickable @mentions and links, Image Attachment with Lightbox)
        ├── CardFooter (Like Button with animated count, Comment Toggle, Share/Copy Link)
        └── CommentSection (Collapsible)
            ├── CommentItem (Avatar, Name, Time, Content, Reply button)
            └── CommentInput (Avatar + Input + Submit)
```

### ২) ক্যাটাগরি ও ব্যাজ প্যালেট (Curated Palette)
| ক্যাটাগরি | কালার স্টাইল (Light Mode) | কালার স্টাইল (Dark Mode) | আইকন |
|---|---|---|---|
| **Announcement** | `bg-blue-50 text-blue-600 border-blue-200` | `dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800` | 📢 |
| **Discussion** | `bg-purple-50 text-purple-600 border-purple-200` | `dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800` | 💡 |
| **Achievement** | `bg-emerald-50 text-emerald-600 border-emerald-200` | `dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800` | 🎉 |
| **Question / Help** | `bg-amber-50 text-amber-600 border-amber-200` | `dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800` | ❓ |
| **General** | `bg-slate-100 text-slate-700 border-slate-200` | `dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700` | 💬 |

---

## 🔒 ৬. সিকিউরিটি ও ইন্টিগ্রিটি ম্যাট্রিক্স (Security & Integrity)

1. **SQL Injection**: প্রতিটি এপিআইতে সম্পূর্ণ PDO Prepared Statements এবং প্যারামিটার বাইন্ডিং (`:user_id`, `:post_id`, ইত্যাদি) বাধ্যতামূলক।
2. **XSS Protection**: রিয়্যাক্টে ডিফল্টভাবে `{post.content}` ব্রাউজারে সুরক্ষিতভাবে রেন্ডার হয়। `@mention` এবং লিংক পার্সিংয়ের ক্ষেত্রে `dangerouslySetInnerHTML` পরিহার করে সেফ রিঅ্যাক্ট কম্পোনেন্ট রেন্ডারিং ব্যবহার করা হবে।
3. **Self-Notification Prevention**: নিজের পোস্টে নিজে লাইক বা কমেন্ট করলে কোনো নোটিফিকেশন পাঠানো হবে না:  
   `if ((int)$post['user_id'] !== (int)$current_user_id) { NotificationHelper::sendToUser(...); }`
4. **Role Authorization**: পিন পোস্ট বা ডিলিট অ্যাকশনে ব্যাকএন্ডে সেশন টোকেন বা ডাটাবেজ রোল ভ্যালিডেশন বাধ্যতামূলক।
5. **File Upload Security**: এক্সিকিউটেবল ফাইল (.php, .js, .sh) সম্পূর্ণ ব্লক। শুধুমাত্র ইমেজ মাইম-টাইপ ও এক্সটেনশন অ্যালাউড।

---

## 📅 ৭. এক্সিকিউশন রোডম্যাপ (Execution Steps For Implementation)

| ফেজ | কাজ | ফাইল লোকেশন |
|---|---|---|
| **Phase 1: Backend** | ডাটাবেজ স্কিমা ও হেল্পার তৈরি | `server/api/community/CommunityDbHelper.php` |
| **Phase 1: Backend** | ফিড এপিআই ও পোস্ট তৈরি | `server/api/community/get_feed.php`, `create_post.php` |
| **Phase 1: Backend** | লাইক, কমেন্ট ও ইমেজ আপলোড | `toggle_like.php`, `add_comment.php`, `upload_post_image.php` |
| **Phase 1: Backend** | পিন ও ডিলিট হ্যান্ডলার | `pin_post.php`, `delete_post.php` |
| **Phase 2: Staff App** | কমিউনিটি ফিড পেজ ও কম্পোনেন্টস | `staff-frontend/src/pages/CommunityFeed.jsx` |
| **Phase 2: Staff App** | সাইডবার ও রাউটিং ইন্টিগ্রেশন | `staff-frontend/src/App.jsx`, `Sidebar.jsx` |
| **Phase 3: Admin App** | অ্যাডমিন কমিউনিটি ওয়াল পেজ | `admin-frontend/src/pages/CommunityWall.jsx` |
| **Phase 3: Admin App** | অ্যাডমিন সাইডবার ও রাউটিং | `admin-frontend/src/App.jsx`, `AdminSidebar.jsx` |
| **Phase 4: Realtime** | পুশার সকেট কানেকশন ও লাইভ ফিড | Pusher `community-channel` ইভেন্ট লিসেনার |
| **Phase 5: Polish** | লাইট/ডার্ক মোড টেস্টিং ও ফিনিশিং | উভয় ফ্রন্টএন্ডে স্মুথ ইন্টারেকশন ও রেসপনসিভনেস পরীক্ষা |

---

> [!NOTE]
> এই প্ল্যানটি ক্রিয়েটিভ কম্পিউটার একাডেমির বিদ্যমান সমস্ত আর্কিটেকচারাল প্যাটার্ন (Database PDO, JWT/Session tokens, PusherHelper, NotificationHelper, Tailwind CSS, Dark Mode) এর সাথে শতভাগ সামঞ্জস্য রেখে নিখুঁতভাবে তৈরি করা হয়েছে।
