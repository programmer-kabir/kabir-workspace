<?php
// backend/api/seo/sitemap.php
// Dynamic Google & Bing XML Sitemap Generator for IconBaba
// Supports unlimited icons with high SEO priority, categories, and static routes.

require_once __DIR__ . '/../../config/database.php';

// Set headers for XML and fast caching
header('Content-Type: application/xml; charset=UTF-8');
header('X-Robots-Tag: noindex, follow');
header('Cache-Control: public, max-age=3600'); // Cache for 1 hour

// Determine base URL dynamically
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$host = $_SERVER['HTTP_HOST'] ?? 'iconbaba.com';
$baseUrl = rtrim($protocol . $host, '/');

// Check if a specific sub-sitemap page was requested (e.g. ?page=1)
$page = isset($_GET['page']) ? (int)$_GET['page'] : 0;
$perPage = 40000; // Google limit is 50,000; 40,000 is safe buffer

// Count total active icons
try {
    $countStmt = $pdo->query("SELECT COUNT(*) FROM icons WHERE is_active = 1 OR is_active IS NULL");
    $totalIcons = (int)$countStmt->fetchColumn();
} catch (Exception $e) {
    $totalIcons = 0;
}

// If no page is specified and icons > perPage, render Sitemap Index
if ($page === 0 && $totalIcons > $perPage) {
    $totalPages = (int)ceil($totalIcons / $perPage);
    $now = date('Y-m-d\TH:i:sP');

    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    
    // Core pages & categories sitemap
    echo "  <sitemap>\n";
    echo "    <loc>{$baseUrl}/api/seo/sitemap.php?page=core</loc>\n";
    echo "    <lastmod>{$now}</lastmod>\n";
    echo "  </sitemap>\n";

    // Icon partitions
    for ($p = 1; $p <= $totalPages; $p++) {
        echo "  <sitemap>\n";
        echo "    <loc>{$baseUrl}/api/seo/sitemap.php?page={$p}</loc>\n";
        echo "    <lastmod>{$now}</lastmod>\n";
        echo "  </sitemap>\n";
    }

    echo '</sitemapindex>';
    exit;
}

// Output standard URL set
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' . "\n";
echo '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' . "\n";

$today = date('Y-m-d');

// If page is 0 or 'core', output static pages + categories
if ($page === 0 || $page === 'core') {
    $staticPages = [
        ['path' => '/', 'changefreq' => 'daily', 'priority' => '1.0'],
        ['path' => '/pricing', 'changefreq' => 'weekly', 'priority' => '0.8'],
        ['path' => '/faq', 'changefreq' => 'monthly', 'priority' => '0.7'],
        ['path' => '/contact', 'changefreq' => 'monthly', 'priority' => '0.6'],
        ['path' => '/licenses', 'changefreq' => 'monthly', 'priority' => '0.7'],
        ['path' => '/licenses/free', 'changefreq' => 'monthly', 'priority' => '0.6'],
        ['path' => '/licenses/pro', 'changefreq' => 'monthly', 'priority' => '0.6'],
        ['path' => '/terms', 'changefreq' => 'monthly', 'priority' => '0.5'],
        ['path' => '/privacy-policy', 'changefreq' => 'monthly', 'priority' => '0.5'],
        ['path' => '/refund-policy', 'changefreq' => 'monthly', 'priority' => '0.5'],
    ];

    foreach ($staticPages as $sp) {
        $loc = htmlspecialchars($baseUrl . $sp['path'], ENT_XML1);
        echo "  <url>\n";
        echo "    <loc>{$loc}</loc>\n";
        echo "    <lastmod>{$today}</lastmod>\n";
        echo "    <changefreq>{$sp['changefreq']}</changefreq>\n";
        echo "    <priority>{$sp['priority']}</priority>\n";
        echo "  </url>\n";
    }

    // Categories
    try {
        $catStmt = $pdo->query("SELECT slug, name, updated_at FROM categories WHERE is_active = 1 OR is_active IS NULL");
        $categories = $catStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($categories as $cat) {
            $catSlug = $cat['slug'] ?: strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $cat['name']));
            $loc = htmlspecialchars($baseUrl . '/category/' . $catSlug, ENT_XML1);
            $lastmod = !empty($cat['updated_at']) ? date('Y-m-d', strtotime($cat['updated_at'])) : $today;
            echo "  <url>\n";
            echo "    <loc>{$loc}</loc>\n";
            echo "    <lastmod>{$lastmod}</lastmod>\n";
            echo "    <changefreq>weekly</changefreq>\n";
            echo "    <priority>0.9</priority>\n";
            echo "  </url>\n";
        }
    } catch (Exception $e) {}
}

// Output Icons
if ($page !== 'core') {
    $pageNum = max(1, (int)$page);
    $offset = ($pageNum - 1) * $perPage;

    try {
        $iconStmt = $pdo->prepare("
            SELECT id, name, slug, updated_at, created_at, tags 
            FROM icons 
            WHERE is_active = 1 OR is_active IS NULL 
            ORDER BY id ASC 
            LIMIT ? OFFSET ?
        ");
        $iconStmt->bindValue(1, $perPage, PDO::PARAM_INT);
        $iconStmt->bindValue(2, $offset, PDO::PARAM_INT);
        $iconStmt->execute();
        $icons = $iconStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($icons as $ic) {
            $iconSlug = $ic['slug'] ?: strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $ic['name']));
            $loc = htmlspecialchars($baseUrl . '/icon/' . $iconSlug, ENT_XML1);
            $lastmodDate = !empty($ic['updated_at']) ? $ic['updated_at'] : (!empty($ic['created_at']) ? $ic['created_at'] : $today);
            $lastmod = date('Y-m-d', strtotime($lastmodDate));
            $title = htmlspecialchars($ic['name'] . ' Free SVG Icon', ENT_XML1);

            echo "  <url>\n";
            echo "    <loc>{$loc}</loc>\n";
            echo "    <lastmod>{$lastmod}</lastmod>\n";
            echo "    <changefreq>weekly</changefreq>\n";
            echo "    <priority>0.85</priority>\n";
            echo "  </url>\n";
        }
    } catch (Exception $e) {}
}

echo '</urlset>';
