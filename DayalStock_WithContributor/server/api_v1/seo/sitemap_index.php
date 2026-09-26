<?php
header("Content-Type: application/xml; charset=UTF-8");
require_once __DIR__ . '/../config/db.php';

$baseUrl = "https://api.dayalstock.com/api_v1/seo";
$maxUrlsPerSitemap = 50000;

echo '<?xml version="1.0" encoding="UTF-8"?>';
echo "\n";
echo '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

// 1. Pages Sitemap
echo "\n  <sitemap>";
echo "\n    <loc>{$baseUrl}/sitemap_pages.php</loc>";
// Get max updated_at for pages
$res = $mysqli->query("SELECT MAX(updated_at) as lastmod FROM dynamic_pages WHERE status='published' AND is_indexable=1");
if ($res && $row = $res->fetch_assoc() && !empty($row['lastmod'])) {
    $date = new DateTime($row['lastmod']);
    echo "\n    <lastmod>" . $date->format('c') . "</lastmod>";
} else {
    echo "\n    <lastmod>" . date('c') . "</lastmod>";
}
echo "\n  </sitemap>";

// 2. Contents Sitemaps
$countRes = $mysqli->query("SELECT COUNT(id) as total FROM contents WHERE status='published'");
$totalContents = 0;
if ($countRes && $row = $countRes->fetch_assoc()) {
    $totalContents = (int)$row['total'];
}

$totalPages = ceil($totalContents / $maxUrlsPerSitemap);
if ($totalPages == 0) $totalPages = 1; // Always show at least 1

for ($i = 1; $i <= $totalPages; $i++) {
    echo "\n  <sitemap>";
    echo "\n    <loc>{$baseUrl}/sitemap_contents.php?page={$i}</loc>";
    
    // We could get the max date for this chunk, but current time is acceptable for the index
    $chunkDate = date('c'); 
    
    // Try to get the latest updated_at for this specific chunk
    $offset = ($i - 1) * $maxUrlsPerSitemap;
    $chunkRes = $mysqli->query("SELECT MAX(updated_at) as lastmod FROM (SELECT updated_at FROM contents WHERE status='published' ORDER BY id ASC LIMIT $maxUrlsPerSitemap OFFSET $offset) as chunk");
    if ($chunkRes && $chunkRow = $chunkRes->fetch_assoc() && !empty($chunkRow['lastmod'])) {
        $chunkDate = (new DateTime($chunkRow['lastmod']))->format('c');
    }
    
    echo "\n    <lastmod>" . $chunkDate . "</lastmod>";
    echo "\n  </sitemap>";
}

echo "\n</sitemapindex>";
$mysqli->close();
?>
