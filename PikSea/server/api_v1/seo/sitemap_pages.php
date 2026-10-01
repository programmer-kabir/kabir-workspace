<?php
header("Content-Type: application/xml; charset=UTF-8");
require_once __DIR__ . '/../config/db.php';

$frontendUrl = "https://dayalstock.com";

echo '<?xml version="1.0" encoding="UTF-8"?>';
echo "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

// Static Base Routes (Hardcoded but dynamic in nature)
$staticRoutes = [
    '/' => '1.0',
    '/search' => '0.8',
    '/join-pro' => '0.8',
    '/faqs' => '0.7',
    '/contact-us' => '0.7'
];

foreach ($staticRoutes as $route => $priority) {
    echo "\n  <url>";
    echo "\n    <loc>" . htmlspecialchars($frontendUrl . $route) . "</loc>";
    echo "\n    <changefreq>daily</changefreq>";
    echo "\n    <priority>{$priority}</priority>";
    echo "\n  </url>";
}

// Dynamic CMS Pages (Terms, Privacy, Licensing, About, DMCA, etc.)
$stmt = $mysqli->prepare("SELECT slug, updated_at FROM dynamic_pages WHERE status = 'published' AND is_indexable = 1 ORDER BY id ASC");
if ($stmt) {
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $slug = $row['slug'];
        // Map slug to route. We just use /$slug per Router.jsx, e.g., /terms-of-use
        echo "\n  <url>";
        echo "\n    <loc>" . htmlspecialchars($frontendUrl . '/' . $slug) . "</loc>";
        if (!empty($row['updated_at'])) {
            $date = new DateTime($row['updated_at']);
            echo "\n    <lastmod>" . $date->format('c') . "</lastmod>";
        }
        echo "\n    <changefreq>monthly</changefreq>";
        echo "\n    <priority>0.5</priority>";
        echo "\n  </url>";
    }
    $stmt->close();
}

echo "\n</urlset>";
$mysqli->close();
?>
