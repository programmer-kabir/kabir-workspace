<?php
// Category Helper & Auto-Migration Utility

function ensureCategoryTableExists($db) {
    static $checked = false;
    if ($checked) return;

    try {
        $create_table_sql = "
        CREATE TABLE IF NOT EXISTS `task_categories` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(150) NOT NULL,
            `slug` VARCHAR(150) NOT NULL,
            `parent_id` INT NULL DEFAULT NULL,
            `level` ENUM('category', 'subcategory', 'child') NOT NULL DEFAULT 'category',
            `icon` VARCHAR(50) DEFAULT '📋',
            `color` VARCHAR(100) DEFAULT 'from-blue-500 to-indigo-600',
            `default_checklists` JSON NULL,
            `default_specs` JSON NULL,
            `estimated_minutes` INT DEFAULT 120,
            `department_id` INT NULL DEFAULT NULL,
            `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
            `order_index` INT DEFAULT 0,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_parent_level` (`parent_id`, `level`, `status`),
            INDEX `idx_slug` (`slug`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        $db->exec($create_table_sql);

        // Ensure tasks table columns exist
        $cols = [
            'category_id' => "ALTER TABLE `tasks` ADD COLUMN `category_id` INT NULL",
            'subcategory_id' => "ALTER TABLE `tasks` ADD COLUMN `subcategory_id` INT NULL",
            'child_category_id' => "ALTER TABLE `tasks` ADD COLUMN `child_category_id` INT NULL"
        ];

        foreach ($cols as $col => $sql) {
            try {
                $check = $db->query("SHOW COLUMNS FROM `tasks` LIKE '$col'")->fetch();
                if (!$check) {
                    $db->exec($sql);
                }
            } catch (Exception $ex) {}
        }

        // Ensure credit column on task_categories is NULLABLE (allowing child to inherit from subcategory)
        try {
            $checkCredit = $db->query("SHOW COLUMNS FROM `task_categories` LIKE 'credit'")->fetch();
            if (!$checkCredit) {
                $db->exec("ALTER TABLE `task_categories` ADD COLUMN `credit` INT NULL DEFAULT NULL AFTER `estimated_minutes`");
            } else {
                // Ensure it is nullable
                $db->exec("ALTER TABLE `task_categories` MODIFY COLUMN `credit` INT NULL DEFAULT NULL");
            }

            // Cleanup: child categories should have NULL credit so they inherit from subcategory
            $db->exec("UPDATE `task_categories` SET `credit` = NULL WHERE `level` = 'child' AND `credit` = 5");

            // Ensure subcategories and main categories have appropriate default credits if currently NULL
            $db->exec("UPDATE `task_categories` SET `credit` = 7 WHERE `slug` LIKE '%business-card%' AND (`credit` IS NULL OR `credit` = 0) AND `level` = 'subcategory'");
            $db->exec("UPDATE `task_categories` SET `credit` = 10 WHERE `slug` LIKE '%logo%' AND (`credit` IS NULL OR `credit` = 0) AND `level` = 'subcategory'");
            $db->exec("UPDATE `task_categories` SET `credit` = 8 WHERE (`slug` LIKE '%flyer%' OR `slug` LIKE '%poster%' OR `slug` LIKE '%brochure%') AND (`credit` IS NULL OR `credit` = 0) AND `level` = 'subcategory'");
            $db->exec("UPDATE `task_categories` SET `credit` = 6 WHERE `slug` LIKE '%social-media%' AND (`credit` IS NULL OR `credit` = 0) AND `level` = 'subcategory'");
            $db->exec("UPDATE `task_categories` SET `credit` = 8 WHERE `slug` LIKE '%resume%' AND (`credit` IS NULL OR `credit` = 0) AND `level` = 'subcategory'");
            $db->exec("UPDATE `task_categories` SET `credit` = 5 WHERE `slug` LIKE '%letterhead%' AND (`credit` IS NULL OR `credit` = 0) AND `level` = 'subcategory'");
            $db->exec("UPDATE `task_categories` SET `credit` = 12 WHERE (`slug` LIKE '%frontend%' OR `slug` LIKE '%fullstack%' OR `slug` LIKE '%web%') AND (`credit` IS NULL OR `credit` = 0) AND `level` = 'subcategory'");
            $db->exec("UPDATE `task_categories` SET `credit` = 10 WHERE (`slug` LIKE '%video%' OR `slug` LIKE '%motion%' OR `slug` LIKE '%reels%') AND (`credit` IS NULL OR `credit` = 0) AND `level` = 'subcategory'");
            $db->exec("UPDATE `task_categories` SET `credit` = 5 WHERE `level` = 'category' AND (`credit` IS NULL OR `credit` = 0)");
        } catch (Exception $ex) {}

        // Ensure custom_credit column on tasks table
        try {
            $checkCustom = $db->query("SHOW COLUMNS FROM `tasks` LIKE 'custom_credit'")->fetch();
            if (!$checkCustom) {
                $db->exec("ALTER TABLE `tasks` ADD COLUMN `custom_credit` INT NULL DEFAULT NULL AFTER `child_category_id`");
            }
        } catch (Exception $ex) {}

        // Check if seed is needed
        $count = $db->query("SELECT COUNT(*) FROM `task_categories`")->fetchColumn();
        if ($count == 0) {
            seedInitialCategories($db);
        }

        $checked = true;
    } catch (Exception $e) {
        // Silently continue or log
    }
}

function makeCategorySlug($text) {
    return strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $text), '-'));
}

function seedInitialCategories($db) {
    $seed_data = [
        [
            'name' => 'Graphic Design',
            'icon' => '🎨',
            'color' => 'from-pink-500 to-rose-600',
            'subcategories' => [
                [
                    'name' => 'Business Card',
                    'icon' => '💳',
                    'color' => 'from-purple-500 to-indigo-600',
                    'children' => [
                        [
                            'name' => 'Doctor / Medical',
                            'icon' => '🩺',
                            'estimated_minutes' => 90,
                            'checklists' => [
                                'Check Doctor Name & Academic Degrees/Designation',
                                'Include BMDC Registration Number',
                                'Verify Chamber Address, Visiting Hours & Serial Phone',
                                'Standard Print Size 3.5" x 2" with 0.125" Bleed (300 DPI CMYK)',
                                'Generate and include QR Code for clinic location / contact'
                            ],
                            'specs' => [
                                'dimensions' => '3.5 x 2.0 inches',
                                'bleed' => '0.125 in (3.75 x 2.25 in total)',
                                'color_mode' => 'CMYK 300 DPI',
                                'deliverables' => 'Print-ready PDF, Vector AI/EPS, JPG Preview'
                            ]
                        ],
                        [
                            'name' => 'Corporate / Business',
                            'icon' => '🏢',
                            'estimated_minutes' => 90,
                            'checklists' => [
                                'Verify Company Logo, Name & Employee Designation',
                                'Include Corporate Email, Direct Phone & Office Address',
                                'Standard 3.5" x 2" with Bleed and Clean Safe Margins',
                                'Double-sided modern executive layout (Front: Identity, Back: Clean Logo)'
                            ],
                            'specs' => [
                                'dimensions' => '3.5 x 2.0 inches',
                                'bleed' => '0.125 in',
                                'color_mode' => 'CMYK 300 DPI',
                                'deliverables' => 'Print-ready PDF, Source AI, Mockup JPG'
                            ]
                        ],
                        [
                            'name' => 'Personal / Freelancer',
                            'icon' => '👤',
                            'estimated_minutes' => 75,
                            'checklists' => [
                                'Name, Specialty/Tagline, Social Handles, Portfolio Link',
                                'Modern Minimalist Typography & Aesthetic Background'
                            ]
                        ],
                        [
                            'name' => 'Restaurant / Food',
                            'icon' => '🍴',
                            'estimated_minutes' => 90,
                            'checklists' => [
                                'Restaurant Name, Tagline, Table Reservation Phone',
                                'Online Ordering QR Code & Physical Address'
                            ]
                        ],
                        [
                            'name' => 'Real Estate / Agent',
                            'icon' => '🏠',
                            'estimated_minutes' => 90,
                            'checklists' => [
                                'Agent Photo, Brokerage Name & License No.',
                                'Website, Direct Phone, Luxury Theme Styling'
                            ]
                        ]
                    ]
                ],
                [
                    'name' => 'Flyer & Brochure',
                    'icon' => '📄',
                    'color' => 'from-amber-500 to-orange-600',
                    'children' => [
                        [
                            'name' => 'Corporate Event Flyer',
                            'icon' => '🎤',
                            'estimated_minutes' => 120,
                            'checklists' => [
                                'Event Title, Date, Time & Venue Highlighted',
                                'Keynote Speakers / Agenda Details',
                                'Ticket Pricing / Registration Link & QR Code',
                                'A4 / Letter Size (300 DPI CMYK with Bleed)'
                            ]
                        ],
                        [
                            'name' => 'Product / Promotional Flyer',
                            'icon' => '🛍️',
                            'estimated_minutes' => 120,
                            'checklists' => [
                                'High-Resolution Product Photos & Discount Badges',
                                'Clear Call to Action (Shop Now / Visit Store)'
                            ]
                        ],
                        [
                            'name' => 'Tri-Fold Company Brochure',
                            'icon' => '📑',
                            'estimated_minutes' => 180,
                            'checklists' => [
                                'Inside & Outside 6-Panel Layout Alignment',
                                'About Us, Services, Case Studies & Contact Info'
                            ]
                        ]
                    ]
                ],
                [
                    'name' => 'Logo & Branding',
                    'icon' => '🏷️',
                    'color' => 'from-emerald-500 to-teal-600',
                    'children' => [
                        [
                            'name' => 'Minimalist / Wordmark',
                            'icon' => '✨',
                            'estimated_minutes' => 150,
                            'checklists' => [
                                'Unique Custom Typography & Kerning',
                                'Primary, Dark, Light & Monochrome Variants',
                                'Favicon / App Icon Adaptation (1:1 Square)'
                            ]
                        ],
                        [
                            'name' => 'Mascot / Illustrative',
                            'icon' => '🦊',
                            'estimated_minutes' => 240,
                            'checklists' => [
                                'Detailed Vector Character Illustration',
                                'Scalable at Micro and Billboard Sizes'
                            ]
                        ],
                        [
                            'name' => 'Brand Identity Kit',
                            'icon' => '📦',
                            'estimated_minutes' => 300,
                            'checklists' => [
                                'Logo Guidelines, Color Codes (RGB, CMYK, HEX)',
                                'Primary & Secondary Typography Pairing',
                                'Social Media Kit & Stationery Mockups'
                            ]
                        ]
                    ]
                ],
                [
                    'name' => 'Social Media Design',
                    'icon' => '📱',
                    'color' => 'from-blue-500 to-cyan-600',
                    'children' => [
                        [
                            'name' => 'Facebook / Insta Post (1:1)',
                            'icon' => '🖼️',
                            'estimated_minutes' => 60,
                            'checklists' => [
                                'Canvas 1080x1080px (RGB 72-150 DPI)',
                                'Catchy Headline with < 20% Text Coverage',
                                'Brand Logo & CTA at Bottom'
                            ]
                        ],
                        [
                            'name' => 'Story / Reel Cover (9:16)',
                            'icon' => '📲',
                            'estimated_minutes' => 60,
                            'checklists' => [
                                'Canvas 1080x1920px with Safe Margin Center Area'
                            ]
                        ],
                        [
                            'name' => 'Real Estate / Property Post',
                            'icon' => '🏠',
                            'estimated_minutes' => 90,
                            'checklists' => [
                                'Canvas 1080x1080px or 1080x1350px (RGB 72-150 DPI)',
                                'High-Resolution Interior / Exterior Property Photos',
                                'Property Key Features (Bed, Bath, Sq Ft Icons & Values)',
                                'Prominent Price Tag / Special Offer Badge',
                                'Agent Photo, Brokerage Logo, License No. & Contact Info',
                                'Clear Call to Action (Book a Tour / Call Now)'
                            ]
                        ],
                        [
                            'name' => 'YouTube Thumbnail',
                            'icon' => '▶️',
                            'estimated_minutes' => 75,
                            'checklists' => [
                                '1280x720px High Contrast Dramatic Lighting',
                                'Large Bold Expressive Text (< 5 Words)',
                                'Avoid Bottom Right Timestamp Obscurity'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        [
            'name' => 'Web Development',
            'icon' => '💻',
            'color' => 'from-blue-600 to-indigo-700',
            'subcategories' => [
                [
                    'name' => 'Frontend Development',
                    'icon' => '🌐',
                    'color' => 'from-sky-500 to-blue-600',
                    'children' => [
                        [
                            'name' => 'Landing Page UI',
                            'icon' => '🚀',
                            'estimated_minutes' => 240,
                            'checklists' => [
                                'Pixel-perfect responsive design across Mobile/Tablet/Desktop',
                                'Modern animations & smooth scrolling',
                                'Fast Core Web Vitals optimization'
                            ]
                        ],
                        [
                            'name' => 'Dashboard / Admin UI',
                            'icon' => '📊',
                            'estimated_minutes' => 300,
                            'checklists' => [
                                'Dark/Light mode support',
                                'Interactive charts & data tables'
                            ]
                        ]
                    ]
                ],
                [
                    'name' => 'Fullstack & Backend',
                    'icon' => '⚙️',
                    'color' => 'from-slate-600 to-slate-800',
                    'children' => [
                        [
                            'name' => 'REST API Development',
                            'icon' => '🔌',
                            'estimated_minutes' => 180,
                            'checklists' => [
                                'JWT Authentication & Authorization',
                                'Input validation & SQL Injection Prevention',
                                'Postman collection / API Documentation'
                            ]
                        ],
                        [
                            'name' => 'Database Architecture',
                            'icon' => '🗄️',
                            'estimated_minutes' => 180,
                            'checklists' => [
                                'Indexed queries & Foreign Key integrity',
                                'Automated backup script setup'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        [
            'name' => 'Video & Motion',
            'icon' => '🎬',
            'color' => 'from-violet-600 to-purple-800',
            'subcategories' => [
                [
                    'name' => 'Reels & Shorts Editing',
                    'icon' => '📲',
                    'color' => 'from-rose-500 to-red-600',
                    'children' => [
                        [
                            'name' => 'Talking Head Reel with Captions',
                            'icon' => '🗣️',
                            'estimated_minutes' => 90,
                            'checklists' => [
                                'Engaging Hook in first 3 seconds',
                                'Animated dynamic subtitles / captions',
                                'Sound effects (SFX) on key transitions'
                            ]
                        ],
                        [
                            'name' => 'Product Promo Video',
                            'icon' => '✨',
                            'estimated_minutes' => 120,
                            'checklists' => [
                                'High-energy cuts and background music sync',
                                'Color grading and text motion graphics'
                            ]
                        ]
                    ]
                ]
            ]
        ],
        [
            'name' => 'Digital Marketing',
            'icon' => '📢',
            'color' => 'from-orange-500 to-amber-600',
            'subcategories' => [
                [
                    'name' => 'Social Media Marketing',
                    'icon' => '📣',
                    'color' => 'from-yellow-500 to-orange-500',
                    'children' => [
                        [
                            'name' => 'Facebook & Instagram Ad Campaign',
                            'icon' => '🎯',
                            'estimated_minutes' => 120,
                            'checklists' => [
                                'Target audience persona setup',
                                'Compelling ad copywriting with A/B headlines',
                                'Pixel / Conversion tracking verification'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ];

    $insert_cat_stmt = $db->prepare("
        INSERT INTO `task_categories` (`name`, `slug`, `parent_id`, `level`, `icon`, `color`, `default_checklists`, `default_specs`, `estimated_minutes`, `order_index`)
        VALUES (:name, :slug, :parent_id, :level, :icon, :color, :checklists, :specs, :est_min, :order_idx)
    ");

    $main_idx = 0;
    foreach ($seed_data as $cat) {
        $main_idx++;
        $slug = makeCategorySlug($cat['name']);
        $insert_cat_stmt->execute([
            ':name' => $cat['name'],
            ':slug' => $slug,
            ':parent_id' => null,
            ':level' => 'category',
            ':icon' => $cat['icon'] ?? '📁',
            ':color' => $cat['color'] ?? 'from-blue-500 to-indigo-600',
            ':checklists' => null,
            ':specs' => null,
            ':est_min' => 120,
            ':order_idx' => $main_idx
        ]);
        $main_id = $db->lastInsertId();

        if (!empty($cat['subcategories'])) {
            $sub_idx = 0;
            foreach ($cat['subcategories'] as $sub) {
                $sub_idx++;
                $sub_slug = makeCategorySlug($cat['name'] . '-' . $sub['name']);
                $insert_cat_stmt->execute([
                    ':name' => $sub['name'],
                    ':slug' => $sub_slug,
                    ':parent_id' => $main_id,
                    ':level' => 'subcategory',
                    ':icon' => $sub['icon'] ?? '📄',
                    ':color' => $sub['color'] ?? 'from-slate-500 to-slate-700',
                    ':checklists' => null,
                    ':specs' => null,
                    ':est_min' => 120,
                    ':order_idx' => $sub_idx
                ]);
                $sub_id = $db->lastInsertId();

                if (!empty($sub['children'])) {
                    $child_idx = 0;
                    foreach ($sub['children'] as $child) {
                        $child_idx++;
                        $child_slug = makeCategorySlug($cat['name'] . '-' . $sub['name'] . '-' . $child['name']);
                        $chk_json = !empty($child['checklists']) ? json_encode($child['checklists'], JSON_UNESCAPED_UNICODE) : null;
                        $specs_json = !empty($child['specs']) ? json_encode($child['specs'], JSON_UNESCAPED_UNICODE) : null;
                        $est_min = $child['estimated_minutes'] ?? 90;

                        $insert_cat_stmt->execute([
                            ':name' => $child['name'],
                            ':slug' => $child_slug,
                            ':parent_id' => $sub_id,
                            ':level' => 'child',
                            ':icon' => $child['icon'] ?? '🏷️',
                            ':color' => $child['color'] ?? 'from-slate-400 to-slate-600',
                            ':checklists' => $chk_json,
                            ':specs' => $specs_json,
                            ':est_min' => $est_min,
                            ':order_idx' => $child_idx
                        ]);
                    }
                }
            }
        }
    }
}
