<?php
// backend/api_v1/seo/social_crawler_proxy.php
// This script intercepts social crawlers (Facebook, WhatsApp, Twitter) and returns server-rendered OpenGraph metadata.
require_once __DIR__ . '/../config/db.php';

$baseUrl = "https://dayalstock.com";
$imgBaseUrl = "https://api.dayalstock.com";
$requestUri = isset($_GET['uri']) ? $_GET['uri'] : '/';

$title = "DayalStock - Premium Quality Assets";
$description = "Download high-quality photos, vectors, and videos from DayalStock.";
$image = $imgBaseUrl . "/assets/images/default-og.jpg";
$url = $baseUrl . $requestUri;
$type = "website";

// Detect if it's a content page (e.g. /photos/slug-name or /photos/content/slug-name)
if (preg_match('#^/[^/]+(?:/content)?/([^/]+)$#', $requestUri, $matches)) {
    $slug = $mysqli->real_escape_string($matches[1]);
    $stmt = $mysqli->prepare("SELECT title, content_type, preview_image, preview_1200_url, watermarked_preview_image, is_premium FROM contents WHERE slug = ? AND status = 'published' LIMIT 1");
    if ($stmt) {
        $stmt->bind_param("s", $slug);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            $isPremium = $row['is_premium'] ? "Premium" : "Free";
            $contentType = ucfirst($row['content_type'] ?: 'Asset');
            $title = htmlspecialchars("{$row['title']} - {$isPremium} {$contentType} | DayalStock");
            $description = htmlspecialchars("Download {$row['title']} on DayalStock.");
            
            $imgSrc = $row['preview_1200_url'] ?: $row['preview_image'] ?: $row['watermarked_preview_image'];
            if (!empty($imgSrc)) {
                $image = strpos($imgSrc, 'http') === 0 ? $imgSrc : $imgBaseUrl . '/' . $imgSrc;
            }
            $type = "article";
        }
        $stmt->close();
    }
} 
// Detect if it's a CMS page (e.g. /terms-of-use)
elseif (preg_match('#^/([^/]+)$#', $requestUri, $matches)) {
    $slug = $mysqli->real_escape_string($matches[1]);
    $stmt = $mysqli->prepare("SELECT title, meta_description, og_image FROM dynamic_pages WHERE slug = ? AND status = 'published' LIMIT 1");
    if ($stmt) {
        $stmt->bind_param("s", $slug);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            $title = htmlspecialchars("{$row['title']} | DayalStock");
            if (!empty($row['meta_description'])) $description = htmlspecialchars($row['meta_description']);
            if (!empty($row['og_image'])) $image = htmlspecialchars($row['og_image']);
        }
        $stmt->close();
    }
}

$mysqli->close();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?= $title ?></title>
    <meta name="description" content="<?= $description ?>">
    <link rel="canonical" href="<?= $url ?>">
    
    <!-- Open Graph for Facebook/WhatsApp/LinkedIn -->
    <meta property="og:title" content="<?= $title ?>">
    <meta property="og:description" content="<?= $description ?>">
    <meta property="og:image" content="<?= $image ?>">
    <meta property="og:url" content="<?= $url ?>">
    <meta property="og:type" content="<?= $type ?>">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?= $title ?>">
    <meta name="twitter:description" content="<?= $description ?>">
    <meta name="twitter:image" content="<?= $image ?>">
</head>
<body>
    <p>Please wait while we redirect you...</p>
    <script>
        // Redirect normal browsers (if they somehow get here) to the actual SPA route
        window.location.replace("<?= $url ?>");
    </script>
</body>
</html>
