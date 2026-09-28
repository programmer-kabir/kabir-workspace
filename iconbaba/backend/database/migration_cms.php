<?php
// backend/database/migration_cms.php
// CMS Database Migration & Seeding for IconBaba

require_once __DIR__ . '/../config/database.php';

echo "=== Starting IconBaba CMS Database Migration ===\n\n";

// 1. Create content_pages table
$pdo->exec("
CREATE TABLE IF NOT EXISTS content_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content MEDIUMTEXT NOT NULL,
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    status ENUM('draft', 'published') NOT NULL DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    updated_by INT NULL,
    INDEX idx_slug (slug),
    INDEX idx_status (status),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");
echo "✓ Table 'content_pages' ready.\n";

// 2. Create content_page_revisions table
$pdo->exec("
CREATE TABLE IF NOT EXISTS content_page_revisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content MEDIUMTEXT NOT NULL,
    meta_title VARCHAR(255) NULL,
    meta_description TEXT NULL,
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_page_id (page_id),
    FOREIGN KEY (page_id) REFERENCES content_pages(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");
echo "✓ Table 'content_page_revisions' ready.\n";

// 3. Create pricing_plans table
$pdo->exec("
CREATE TABLE IF NOT EXISTS pricing_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    billing_period VARCHAR(50) NOT NULL DEFAULT 'forever',
    features JSON NOT NULL,
    cta_text VARCHAR(100) NOT NULL DEFAULT 'Get Started',
    cta_url VARCHAR(255) NOT NULL DEFAULT '/',
    is_popular TINYINT(1) DEFAULT 0,
    display_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active_order (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");
echo "✓ Table 'pricing_plans' ready.\n";

// 4. Create faq_items table
$pdo->exec("
CREATE TABLE IF NOT EXISTS faq_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    display_order INT NOT NULL DEFAULT 0,
    status ENUM('draft', 'published') NOT NULL DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status_cat (status, category, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");
echo "✓ Table 'faq_items' ready.\n";

// 5. Create contact_messages table
$pdo->exec("
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('unread', 'read', 'replied') DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");
echo "✓ Table 'contact_messages' ready.\n";

// 6. Ensure admin user exists
$adminCheck = $pdo->prepare("SELECT id FROM users WHERE email = :email OR username = :username LIMIT 1");
$adminCheck->execute([':email' => 'admin@iconbaba.com', ':username' => 'admin']);
$adminUser = $adminCheck->fetch();

$adminId = null;
if ($adminUser) {
    $adminId = (int)$adminUser['id'];
} else {
    // Check if user ID 1 or any user exists
    $firstUser = $pdo->query("SELECT id FROM users ORDER BY id ASC LIMIT 1")->fetch();
    if ($firstUser) {
        $adminId = (int)$firstUser['id'];
    } else {
        $passwordHash = password_hash('admin123', PASSWORD_BCRYPT);
        $insAdmin = $pdo->prepare("
            INSERT INTO users (username, email, password_hash, full_name)
            VALUES ('admin', 'admin@iconbaba.com', :hash, 'IconBaba Administrator')
        ");
        $insAdmin->execute([':hash' => $passwordHash]);
        $adminId = (int)$pdo->lastInsertId();
    }
}

if ($adminId) {
    try {
        $pdo->prepare("INSERT IGNORE INTO user_roles (user_id, role_slug) VALUES (:uid, 'admin')")->execute([':uid' => $adminId]);
        $pdo->prepare("INSERT IGNORE INTO user_roles (user_id, role_slug) VALUES (:uid, 'user')")->execute([':uid' => $adminId]);
    } catch (Exception $e) {}
    echo "✓ Admin user confirmed (ID: {$adminId}).\n";
}

// 7. Seed Content Pages (Original IconBaba content, NO verbatim copying of Iconic)
$pages = [
    [
        'slug' => 'pricing',
        'title' => 'Simple, Transparent Pricing',
        'meta_title' => 'IconBaba Pricing — Free & Pro Plans for Modern Creators',
        'meta_description' => 'Explore IconBaba pricing plans. Access 5,000+ beautifully crafted open-source and premium vector icons for commercial and personal projects.',
        'content' => "## Craft with Freedom, Scale with Pro\n\nIconBaba gives designers and developers unlimited access to a growing library of 5,000+ precision-engineered vector icons. Every icon is pixel-perfect, fully customizable in real time, and ready for modern web and mobile apps.\n\n### Why Upgrade to Pro?\n- **Full Library Access**: Unlock all current and future icon categories and variants.\n- **Commercial Peace of Mind**: Unlimited commercial projects, SaaS platforms, client deliverables, and templates.\n- **High-Res Multi-Format Exports**: Instant SVG, JSX React components, high-density PNG (up to 512px), and WebP.\n- **Custom Collections**: Create and organize limitless icon collections for all your design systems.\n- **Priority Support & Icon Requests**: Direct access to our design team for custom icon requests and fast updates.\n\nChoose the plan that fits your workflow best below."
    ],
    [
        'slug' => 'faq',
        'title' => 'Frequently Asked Questions',
        'meta_title' => 'IconBaba FAQ — Licensing, Formats, Customization & Support',
        'meta_description' => 'Find quick answers to common questions about IconBaba icon downloads, licensing terms, React integration, and commercial usage.',
        'content' => "## Everything You Need to Know\n\nHave questions about using IconBaba in your applications, websites, or client work? Browse our frequently asked questions below or get in touch with our team if you need personalized assistance."
    ],
    [
        'slug' => 'contact',
        'title' => 'Contact IconBaba Support',
        'meta_title' => 'Contact IconBaba — Inquiries, Support & Custom Icon Requests',
        'meta_description' => 'Get in touch with the IconBaba team for technical support, licensing questions, commercial partnerships, or custom icon requests.',
        'content' => "## We’re Here to Help\n\nWhether you have a technical question, feedback on our icons, an enterprise licensing inquiry, or want to request custom icon designs for your brand, our team is excited to hear from you.\n\n### Direct Inquiries\n- **General Support**: support@iconbaba.com\n- **Business & Enterprise**: hello@iconbaba.com\n- **Design & Icon Requests**: design@iconbaba.com\n- **Response Time**: We typically respond to all inquiries within 24 business hours."
    ],
    [
        'slug' => 'licenses',
        'title' => 'IconBaba Licensing Overview',
        'meta_title' => 'IconBaba Licenses — Free & Pro Usage Guidelines',
        'meta_description' => 'Learn how you can use IconBaba icons in commercial, personal, open-source, and client projects under our transparent Free and Pro licenses.',
        'content' => "## Simple, Creator-Friendly Licensing\n\nAt IconBaba, we believe high-quality visual assets should empower creators without confusing legal hurdles. Our icons are divided into two straightforward license tiers:\n\n### 1. IconBaba Free License\n- **Cost**: 100% Free\n- **Allowed**: Personal and commercial websites, web apps, mobile apps, and open-source software.\n- **Attribution**: Required when feasible (e.g. \"Icons by IconBaba\" in app credits or footer).\n- **Restrictions**: Cannot redistribute, resell, or sub-license the raw icon files as standalone icon packs.\n- [View Full Free License Details](/licenses/free)\n\n### 2. IconBaba Pro License\n- **Cost**: Included with any Pro subscription or lifetime pass.\n- **Allowed**: Unlimited commercial websites, commercial software, SaaS products, client work, templates, and marketing materials.\n- **Attribution**: **Zero attribution required**.\n- **Restrictions**: Cannot resell or re-distribute icons as a competing icon set or design asset bundle.\n- [View Full Pro License Details](/licenses/pro)\n\n### Summary Comparison\n| Feature | Free License | Pro License |\n| :--- | :--- | :--- |\n| Personal Projects | Included | Included |\n| Commercial Projects | Included | Included |\n| Attribution Required | Yes | **No** |\n| Unlimited Client Work | Limited | **Unlimited** |\n| Full Vector Exports (SVG, JSX) | Included | Included |\n| High-Res PNG (512px) | Standard | **Ultra-HD** |\n| Custom Icon Requests | No | **Yes** |"
    ],
    [
        'slug' => 'free-license',
        'title' => 'IconBaba Free License Agreement',
        'meta_title' => 'IconBaba Free License — Commercial & Personal Usage Terms',
        'meta_description' => 'Complete terms of the IconBaba Free License. Learn how to use our free icon assets with simple attribution in web, mobile, and digital products.',
        'content' => "## 1. Grant of License\nUnder the IconBaba Free License, IconBaba grants you a non-exclusive, worldwide, royalty-free license to use, download, copy, modify, and integrate our free icon assets into digital and physical media.\n\n## 2. What You Can Do (Permitted Uses)\n- Use icons in personal, educational, and commercial websites.\n- Embed icons in mobile applications (iOS, Android, React Native, Flutter).\n- Use icons in digital presentations, pitch decks, and marketing campaigns.\n- Customize colors, stroke widths, sizes, and styling to match your product design system.\n\n## 3. Attribution Requirement\nWhen using icons under the Free License, you must provide clear attribution back to IconBaba where reasonable. For example:\n- In website footers: `Icons provided by IconBaba (iconbaba.com)`\n- In app settings or credit screens: `Icon assets by IconBaba`\n- In code repositories: include a link in your README or package manifest.\n\nIf you prefer not to include attribution, you can easily upgrade to an [IconBaba Pro License](/licenses/pro).\n\n## 4. What You Cannot Do (Restrictions)\n- You may not sell, redistribute, sub-license, or share IconBaba icons as a standalone icon library, pack, or vector collection.\n- You may not incorporate IconBaba icons into automated logo generation tools or trademark them as unique standalone brand marks.\n- You may not host IconBaba icon files on competing CDN services or asset marketplaces.\n\n## 5. Termination & Disclaimer\nThis license remains effective until terminated. Failure to comply with the attribution requirement or restrictions automatically revokes this license. Assets are provided \"as is\" without warranty of any kind."
    ],
    [
        'slug' => 'pro-license',
        'title' => 'IconBaba Pro Commercial License',
        'meta_title' => 'IconBaba Pro License — Royalty-Free Commercial Usage with No Attribution',
        'meta_description' => 'IconBaba Pro License terms for creators, agencies, and enterprises. Enjoy unlimited commercial usage, zero attribution requirements, and full client rights.',
        'content' => "## 1. Commercial License Overview\nThe IconBaba Pro License grants you a perpetual, worldwide, non-exclusive, royalty-free license to utilize IconBaba Pro and Free icons in commercial products, client projects, and distributed software with **absolutely no attribution required**.\n\n## 2. Permitted Commercial Uses\n- **Commercial Software & SaaS**: Integrate icons directly into software-as-a-service applications, web apps, enterprise dashboards, and mobile apps.\n- **Client Deliverables**: Build websites, web applications, and marketing materials for paying clients without limitation.\n- **Commercial Templates & Themes**: Embed icons within website themes, UI kits, and application templates provided the icons cannot be extracted as standalone assets.\n- **Broadcast & Digital Media**: Use in video productions, social media campaigns, print advertisements, and digital billboards.\n- **No Attribution**: You are not required to link back to IconBaba or credit us anywhere in your product or marketing.\n\n## 3. Scope of Rights\n- Single User Pro License: Applies to one individual designer or developer.\n- Team / Enterprise License: Applies to all members of your organization under your active subscription.\n\n## 4. Prohibited Uses\n- You may not re-license, sublicense, resell, or distribute IconBaba icons as a standalone icon set, SVG bundle, Figma component library, or competing design asset collection.\n- You may not extract or permit third parties to extract raw SVG/icon files from your distributed product for independent reuse.\n\n## 5. Guarantee & Support\nIconBaba guarantees that all icons provided under the Pro License are original creations or legitimately licensed vector graphics that do not infringe on third-party copyrights."
    ],
    [
        'slug' => 'terms',
        'title' => 'Terms of Service',
        'meta_title' => 'IconBaba Terms of Service — Complete Legal Agreement & Usage Rules',
        'meta_description' => 'Official IconBaba Terms of Service. Learn your rights and obligations regarding vector icon downloads, commercial licensing, billing, and platform usage.',
        'content' => "## 1. Description of Service\nIconBaba is a digital asset and designer productivity platform providing:\n- High-quality scalable vector graphics (SVG) and raster icons (PNG).\n- In-browser customization (stroke widths, color swatches, canvas sizing).\n- Direct React JSX and React Native component copy and integration tools.\n- Personal asset collections, bookmarking, and download history tracking.\n- AI-assisted icon taxonomy, tagging, and search discovery engines.\n\n## 2. User Accounts & Security\n- **Eligibility**: You must be at least 13 years old (or the legal age of digital consent in your jurisdiction) to use the Service.\n- **Account Accuracy**: You must provide accurate and complete registration information.\n- **Security Responsibility**: You are solely responsible for maintaining the confidentiality of your credentials, OTP codes, and authentication tokens. Any action performed under your account is your legal responsibility.\n- **Account Termination**: We reserve the right to suspend or terminate accounts that engage in abusive scraping, credential sharing, security tampering, or violation of these terms without prior notice.\n\n## 3. Subscriptions, Payments & Billing\n- **Free Tier**: Free users receive access to standard assets subject to daily export quota limits and mandatory attribution requirements under our [Free License](/licenses/free).\n- **Pro Subscriptions & Lifetime Passes**: Paid users receive unlimited downloads, zero attribution requirements, and full commercial client rights pursuant to our [Pro License](/licenses/pro).\n- **Merchant of Record**: All financial transactions, recurring billing, and invoice generation are securely processed through our authorized merchant partner, **Lemon Squeezy**. IconBaba does not store raw credit card details on its servers.\n- **Refund Policy**: Eligible Pro purchases are covered by our **14-day 100% money-back guarantee** as detailed in our [Refund Policy](/refund-policy).\n\n## 4. Intellectual Property Rights & Licensing\n- **Platform Ownership**: All software, web applications, database compilations, UI designs, brand assets, logos, and vector illustrations hosted on IconBaba are protected by international copyright, trademark, and intellectual property laws.\n- **License Grants**: Downloading icon assets does not transfer underlying intellectual property ownership to you. Instead, you are granted a non-exclusive usage license governed by the [Free License](/licenses/free) or [Pro License](/licenses/pro).\n- **Trademark & Logo Restrictions**: You may **NOT** register or trademark any IconBaba icon as a standalone logo, trademark, or service mark, as the same assets remain available to other creators.\n- **Resale & Distribution Prohibition**: You may **NOT** repackage, sublicense, resell, or distribute IconBaba icons as a standalone icon pack, SVG bundle, UI kit component, or competing asset repository.\n\n## 5. Acceptable Use & Anti-Scraping Policy\nTo protect service stability and intellectual property, you explicitly agree NOT to:\n- Deploy automated crawlers, scrapers, bots, or extraction scripts to bulk-download the IconBaba catalog without explicit written consent.\n- Circumvent or attempt to bypass download limits, token security, rate limiters, or authentication mechanisms.\n- Launch denial-of-service (DoS/DDoS) attacks or deliberately overload server infrastructure.\n- Reverse-engineer, decompile, or extract proprietary database schemas or source code from our APIs.\n\n## 6. AI Features & Metadata Disclaimer\nIconBaba utilizes artificial intelligence and machine learning models (including Google Gemini) for automated icon tagging, taxonomy, and visual consistency checks. While we strive for high accuracy, AI-generated metadata, tags, and suggested categories are provided for convenience and discovery purposes without warranty of absolute accuracy.\n\n## 7. Copyright & DMCA Takedown Notice\nIconBaba respects the intellectual property rights of others. If you believe that any vector asset or content hosted on our platform infringes upon your copyright, please submit a formal DMCA notification to **support@iconbaba.com** containing:\n1. Identification of the copyrighted work claimed to be infringed.\n2. The specific URL(s) or asset ID(s) on IconBaba.\n3. Your contact information and a physical or electronic signature.\n\n## 8. Warranty Disclaimer\nThe Service and all downloadable icon assets are provided on an **\"AS IS\"** and **\"AS AVAILABLE\"** basis without warranties of any kind, whether express, statutory, or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or entirely immune from downtime.\n\n## 9. Limitation of Liability\nTo the maximum extent permitted by applicable law, IconBaba, its founders, directors, employees, and licensors shall not be liable for any indirect, incidental, special, punitive, or consequential damages, including loss of profits, data loss, or business interruption, arising from your use of or inability to use the Service or downloaded assets.\n\n## 10. Indemnification\nYou agree to defend, indemnify, and hold harmless IconBaba and its affiliates from and against any claims, liabilities, damages, losses, and expenses (including legal fees) arising out of or in any way connected with your breach of these Terms or misuse of downloaded assets.\n\n## 11. Force Majeure & Severability\n- **Force Majeure**: IconBaba shall not be held responsible for failures or delays caused by circumstances beyond reasonable control, including cloud provider outages, network failures, acts of God, or regulatory actions.\n- **Severability**: If any provision of these Terms is found to be unlawful, void, or unenforceable, that provision shall be deemed severable and shall not affect the validity and enforceability of the remaining provisions.\n\n## 12. Governing Law & Dispute Resolution\nThese Terms shall be governed by and construed in accordance with applicable laws. Any dispute or claim arising out of these Terms shall first be addressed through good-faith direct consultation between the parties before seeking formal arbitration.\n\n## 13. Modifications to Terms\nWe reserve the right to revise or update these Terms of Service at any time. When modifications occur, the \"Last updated\" date will be revised. Your continued use of IconBaba after such revisions signifies your binding acceptance of the updated Terms.\n\n## 14. Contact Information\nFor legal inquiries, licensing questions, or support requests regarding these Terms, please contact us at:\n- **Email**: `support@iconbaba.com`\n- **Contact Form**: [iconbaba.com/contact](/contact)"
    ],
    [
        'slug' => 'privacy-policy',
        'title' => 'Privacy Policy',
        'meta_title' => 'IconBaba Privacy Policy — Data Protection & Privacy Rights',
        'meta_description' => 'Learn how IconBaba collects, uses, and safeguards your personal information when you use our icon explorer, download tools, and user accounts.',
        'content' => "## 1. Information We Collect\nWe collect minimal information necessary to deliver and improve the IconBaba experience:\n\n### Information You Provide Directly\n- **Account Information**: When you register, we collect your username, email address, and encrypted password hash.\n- **Profile Data**: Full name or display name if you choose to provide it.\n- **Support Messages**: Inquiries, name, and contact details submitted through our contact form.\n\n### Information Collected Automatically\n- **Usage & Analytics**: Anonymized icon search queries, category views, and download counts to improve library quality.\n- **Technical Data**: IP address, browser type, and device information for security, rate limiting, and session verification.\n\n## 2. How We Use Your Information\nWe use your data strictly to:\n- Authenticate your account and manage your favorites and collections.\n- Deliver requested icon downloads in your preferred format.\n- Protect our platform against unauthorized abuse and security threats.\n- Respond to your customer support inquiries.\n\n## 3. Data Storage & Security\nYour personal data and passwords are encrypted using industry-standard hashing algorithms (Bcrypt). We do not sell, rent, or trade your personal information to third parties or advertising networks.\n\n## 4. Cookies & Local Storage\nIconBaba uses browser LocalStorage and secure session tokens strictly for authentication and remembering your customization preferences (such as stroke width, icon size, and color).\n\n## 5. Your Rights\nYou have the right to access, update, or request the deletion of your account and personal data at any time by contacting support@iconbaba.com.\n\n## 6. Updates to This Policy\nWe may update this Privacy Policy periodically. Significant changes will be reflected in the updated timestamp on this page."
    ],
    [
        'slug' => 'refund-policy',
        'title' => 'Refund Policy',
        'meta_title' => 'IconBaba Refund Policy — 14-Day Money-Back Guarantee',
        'meta_description' => 'IconBaba offers a transparent 14-day refund policy for Pro subscriptions and lifetime licenses. Read our full terms and refund process.',
        'content' => "## 1. 14-Day Money-Back Guarantee\nWe want you to be completely satisfied with IconBaba Pro. If for any reason our icon library, formats, or customization features do not meet your project needs, you are eligible for a **100% full refund within 14 days** of your initial purchase.\n\n## 2. Eligibility Criteria\nTo qualify for a refund:\n- Your refund request must be submitted within 14 calendar days from the date of purchase.\n- You must provide your purchase email or transaction reference ID.\n- Refunds apply to initial subscription periods and one-time lifetime purchases.\n\n## 3. Non-Refundable Situations\n- Requests submitted after the 14-day guarantee window has expired.\n- Accounts that have engaged in mass automated scraping or clear abuse of our terms of service prior to requesting a refund.\n\n## 4. How to Request a Refund\nSimply send an email to **support@iconbaba.com** or submit a message through our [Contact Page](/contact) with:\n1. Your account email address.\n2. Transaction reference or receipt number.\n3. A brief note explaining why the product did not meet your needs (this helps us improve).\n\n## 5. Processing Time\nOnce approved, your refund will be processed back to your original payment method within 3 to 7 business days depending on your card issuer or bank."
    ]
];

$stmtPage = $pdo->prepare("
    INSERT INTO content_pages (slug, title, content, meta_title, meta_description, status, created_by, updated_by)
    VALUES (:slug, :title, :content, :meta_title, :meta_description, 'published', :created_by, :updated_by)
    ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        content = VALUES(content),
        meta_title = VALUES(meta_title),
        meta_description = VALUES(meta_description),
        status = 'published',
        updated_by = VALUES(updated_by)
");

foreach ($pages as $p) {
    $stmtPage->execute([
        ':slug' => $p['slug'],
        ':title' => $p['title'],
        ':content' => $p['content'],
        ':meta_title' => $p['meta_title'],
        ':meta_description' => $p['meta_description'],
        ':created_by' => $adminId,
        ':updated_by' => $adminId
    ]);
    echo "✓ Seeded/Updated content page: '{$p['slug']}'\n";
}

// 8. Seed Pricing Plans
$plans = [
    [
        'name' => 'Free Forever',
        'price' => 0.00,
        'billing_period' => 'free forever',
        'features' => json_encode([
            '5,000+ Scalable Vector Icons',
            'Outlined & Filled Styles',
            'Full Customization (Stroke, Size, Color)',
            'Instant SVG & JSX React Export',
            'Personal & Commercial Use (with attribution)',
            'Standard PNG Export (up to 64px)'
        ]),
        'cta_text' => 'Start Free',
        'cta_url' => '/',
        'is_popular' => 0,
        'display_order' => 1
    ],
    [
        'name' => 'Pro Pass',
        'price' => 19.00,
        'billing_period' => 'per year',
        'features' => json_encode([
            'Everything in Free',
            'Zero Attribution Required',
            'Unlimited Commercial Client Projects',
            'High-Res PNG Export (up to 512px)',
            'Figma File & Plugin Access',
            'Unlimited Custom Collections',
            'Priority Icon Requests',
            'Continuous Weekly Icon Updates'
        ]),
        'cta_text' => 'Get Pro Pass',
        'cta_url' => '/pricing',
        'is_popular' => 1,
        'display_order' => 2
    ],
    [
        'name' => 'Lifetime Access',
        'price' => 49.00,
        'billing_period' => 'one-time payment',
        'features' => json_encode([
            'Everything in Pro Pass',
            'Pay Once, Own Forever',
            'All Future Icon Sets & Styles Included',
            'Commercial Team License (up to 5 seats)',
            'VIP Direct Support via Discord/Email',
            'Commercial SaaS & Template Embedding Rights',
            'Early Beta Access to New Icon Releases'
        ]),
        'cta_text' => 'Get Lifetime Access',
        'cta_url' => '/pricing',
        'is_popular' => 0,
        'display_order' => 3
    ]
];

$pdo->exec("TRUNCATE TABLE pricing_plans");
$stmtPlan = $pdo->prepare("
    INSERT INTO pricing_plans (name, price, billing_period, features, cta_text, cta_url, is_popular, display_order, is_active)
    VALUES (:name, :price, :billing_period, :features, :cta_text, :cta_url, :is_popular, :display_order, 1)
");

foreach ($plans as $pl) {
    $stmtPlan->execute($pl);
    echo "✓ Seeded pricing plan: '{$pl['name']}' ({$pl['price']} USD)\n";
}

// 9. Seed FAQ Items
$faqs = [
    [
        'question' => 'What is IconBaba?',
        'answer' => 'IconBaba is a modern, high-performance icon library and customizer featuring over 5,000 beautifully crafted vector icons in both Outlined and Filled styles, optimized for web apps, mobile products, and design systems.',
        'category' => 'General',
        'display_order' => 1
    ],
    [
        'question' => 'Can I use IconBaba icons in commercial projects?',
        'answer' => 'Yes! Both our Free and Pro licenses permit commercial use in websites, SaaS platforms, apps, and client work. Under the Free License, simple attribution is required; Pro users enjoy full commercial rights with zero attribution required.',
        'category' => 'Licensing',
        'display_order' => 2
    ],
    [
        'question' => 'How do I attribute IconBaba for free icon usage?',
        'answer' => 'You can add a simple credit in your website footer, about screen, app credits, or code repository README (for example: "Icons by IconBaba — iconbaba.com").',
        'category' => 'Licensing',
        'display_order' => 3
    ],
    [
        'question' => 'What formats can I download icons in?',
        'answer' => 'IconBaba supports instant downloads in clean, scalable SVG, ready-to-use React JSX components, and high-density raster PNGs ranging from 16px up to 512px.',
        'category' => 'Technical',
        'display_order' => 4
    ],
    [
        'question' => 'How does real-time icon customization work?',
        'answer' => 'You can change the icon size, stroke width (1px to 4px), line cap (round, butt, square), line join (round, bevel, miter), and color in real time on both the main grid and inside the icon detail modal before copying or downloading.',
        'category' => 'Technical',
        'display_order' => 5
    ],
    [
        'question' => 'What is the refund policy for Pro purchases?',
        'answer' => 'We offer a 100% money-back guarantee within 14 days of purchase if IconBaba does not meet your project needs. Simply contact us at support@iconbaba.com.',
        'category' => 'Billing',
        'display_order' => 6
    ],
    [
        'question' => 'Can I request a custom icon for my product?',
        'answer' => 'Yes! Pro subscribers can submit icon requests directly to our design team. We prioritize popular community and subscriber requests in our weekly library updates.',
        'category' => 'General',
        'display_order' => 7
    ],
    [
        'question' => 'Can I use IconBaba with Figma?',
        'answer' => 'Yes, our SVG code pastes directly into Figma as fully editable vector paths with separate strokes and fills. A dedicated Figma plugin is also in active development.',
        'category' => 'Technical',
        'display_order' => 8
    ]
];

$pdo->exec("TRUNCATE TABLE faq_items");
$stmtFaq = $pdo->prepare("
    INSERT INTO faq_items (question, answer, category, display_order, status)
    VALUES (:question, :answer, :category, :display_order, 'published')
");

foreach ($faqs as $f) {
    $stmtFaq->execute($f);
    echo "✓ Seeded FAQ item: '{$f['question']}' ({$f['category']})\n";
}

echo "\n=== CMS Migration & Seeding Completed Successfully! ===\n";
