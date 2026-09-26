<?php
header("Content-Type: application/xml; charset=UTF-8");
require_once __DIR__ . '/../config/db.php';

$frontendUrl = "https://dayalstock.com";
$baseUrl = "https://api.dayalstock.com"; // For image URLs
$maxUrlsPerSitemap = 50000;

$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
if ($page < 1) $page = 1;
$offset = ($page - 1) * $maxUrlsPerSitemap;

echo '<?xml version="1.0" encoding="UTF-8"?>';
echo "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">';

$stmt = $mysqli->prepare("SELECT slug, content_type, title, preview_image, preview_1200_url, watermarked_preview_image, updated_at FROM contents WHERE status = 'published' ORDER BY id ASC LIMIT ? OFFSET ?");
if ($stmt) {
    $stmt->bind_param("ii", $maxUrlsPerSitemap, $offset);
    $stmt->execute();
    $result = $stmt->get_result();
    
    while ($row = $result->fetch_assoc()) {
        $slug = $row['slug'];
        $contentType = !empty($row['content_type']) ? $row['content_type'] : 'image';
        
        // Ensure the route matches Router.jsx: /:category/:slug (e.g., /photos/dog)
        $route = '/' . urlencode(strtolower($contentType)) . '/' . urlencode($slug);
        
        echo "\n  <url>";
        echo "\n    <loc>" . htmlspecialchars($frontendUrl . $route) . "</loc>";
        
        if (!empty($row['updated_at'])) {
            $date = new DateTime($row['updated_at']);
            echo "\n    <lastmod>" . $date->format('c') . "</lastmod>";
        }
        
        echo "\n    <changefreq>weekly</changefreq>";
        echo "\n    <priority>0.8</priority>";
        
        // Image Sitemap Extension
        $imageSrc = $row['preview_1200_url'] ?: $row['preview_image'] ?: $row['watermarked_preview_image'];
        if (!empty($imageSrc)) {
            $fullImageUrl = strpos($imageSrc, 'http') === 0 ? $imageSrc : $baseUrl . '/' . $imageSrc;
            echo "\n    <image:image>";
            echo "\n      <image:loc>" . htmlspecialchars($fullImageUrl) . "</image:loc>";
            echo "\n      <image:title>" . htmlspecialchars($row['title']) . "</image:title>";
            echo "\n    </image:image>";
        }
        
        echo "\n  </url>";
    }
    $stmt->close();
}

echo "\n</urlset>";
$mysqli->close();
?>
