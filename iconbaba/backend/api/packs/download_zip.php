<?php
// backend/api/packs/download_zip.php
// Generates and streams a clean ZIP archive of an entire icon pack

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/rate_limit.php';
require_once __DIR__ . '/../../helpers/auth.php';

enforceRateLimit($pdo, 'pack_download_zip_api', 30, 60);

try {
    $packId = isset($_GET['pack_id']) ? (int)$_GET['pack_id'] : 0;
    $slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';
    $style = isset($_GET['style']) ? strtolower(trim($_GET['style'])) : 'all';

    if ($packId <= 0 && empty($slug)) {
        jsonResponse(false, null, 'Pack ID or slug is required.', 400);
    }

    if ($packId > 0) {
        $packStmt = $pdo->prepare("SELECT * FROM packs WHERE id = :id AND status = 'published' LIMIT 1");
        $packStmt->execute([':id' => $packId]);
    } else {
        $packStmt = $pdo->prepare("SELECT * FROM packs WHERE slug = :slug AND status = 'published' LIMIT 1");
        $packStmt->execute([':slug' => $slug]);
    }

    $pack = $packStmt->fetch(PDO::FETCH_ASSOC);
    if (!$pack) {
        jsonResponse(false, null, 'Pack not found or unavailable.', 404);
    }

    $packId = (int)$pack['id'];

    // Check optional authentication & premium status
    $user = getAuthenticatedUser($pdo);
    if ($pack['is_premium']) {
        if (!$user) {
            jsonResponse(false, null, 'Authentication required to download premium packs.', 401);
        }
        $isPro = false;
        if (!empty($user['id'])) {
            $subStmt = $pdo->prepare("SELECT id FROM subscriptions WHERE user_id = ? AND status = 'active' AND expires_at > NOW() LIMIT 1");
            $subStmt->execute([$user['id']]);
            $isPro = (bool)$subStmt->fetch();
        }
        if (!$isPro) {
            jsonResponse(false, null, 'Active Pro subscription required to download premium packs.', 403);
        }
    }

    // Check ZipArchive availability
    if (!class_exists('ZipArchive')) {
        jsonResponse(false, null, 'ZIP archive extension is not available on the server.', 500);
    }

    // Fetch pack icons and variants
    $iconQuery = "
        SELECT i.id, i.name, i.slug, iv.style, iv.svg_content
        FROM icons i
        INNER JOIN icon_variants iv ON i.id = iv.icon_id
        WHERE i.pack_id = :pack_id AND i.status = 'published'
    ";
    $params = [':pack_id' => $packId];
    if (!empty($style) && $style !== 'all') {
        $iconQuery .= " AND iv.style = :style";
        $params[':style'] = $style;
    }
    $iconQuery .= " ORDER BY i.sort_order ASC, i.id ASC, iv.style ASC";

    $iconStmt = $pdo->prepare($iconQuery);
    $iconStmt->execute($params);
    $items = $iconStmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($items)) {
        jsonResponse(false, null, 'No icon SVG files found for this pack.', 404);
    }

    // Create temp zip
    $zipFilename = tempnam(sys_get_temp_dir(), 'ib_pack_') . '.zip';
    $zip = new ZipArchive();
    if ($zip->open($zipFilename, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        jsonResponse(false, null, 'Unable to create ZIP archive.', 500);
    }

    $baseFolder = $pack['slug'];

    // Group icons into zip folders
    $addedCount = 0;
    foreach ($items as $item) {
        $svg = trim($item['svg_content'] ?? '');
        if (empty($svg)) continue;

        $iSlug = $item['slug'];
        $iStyle = $item['style'];

        if ($style === 'all') {
            $zipPath = "{$baseFolder}/{$iStyle}/{$iSlug}.svg";
        } else {
            $zipPath = "{$baseFolder}/{$iSlug}.svg";
        }

        $zip->addFromString($zipPath, $svg);
        $addedCount++;
    }

    // Add README & License file
    $licenseText = "========================================================\n"
        . " IconBaba - Vector Icon Pack\n"
        . "========================================================\n\n"
        . "Pack Name: " . $pack['name'] . "\n"
        . "Author:    " . ($pack['author_name'] ?: 'IconBaba Studio') . "\n"
        . "Icons:     " . $addedCount . " files\n"
        . "Style:     " . strtoupper($style) . "\n"
        . "Website:   https://iconbaba.com\n\n"
        . "LICENSE TERMS:\n"
        . ($pack['is_premium']
            ? "Commercial License - Full usage in commercial and personal projects. Re-distribution of raw assets prohibited."
            : "Free with Attribution - You are free to use these icons in web, mobile, and print designs. Please attribute to IconBaba.")
        . "\n\nThank you for choosing IconBaba!\n";

    $zip->addFromString("{$baseFolder}/README-LICENSE.txt", $licenseText);
    $zip->close();

    // Record download
    try {
        $pdo->exec("UPDATE packs SET downloads_count = downloads_count + 1 WHERE id = {$packId}");
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $uid = $user ? (int)$user['id'] : null;
        $dlStmt = $pdo->prepare("INSERT INTO pack_downloads (pack_id, user_id, ip_address, style, format) VALUES (?, ?, ?, ?, 'svg')");
        $dlStmt->execute([$packId, $uid, $ip, $style]);
    } catch (Exception $e) {
        // Non-critical tracking failure
    }

    // Stream download
    $downloadName = $pack['slug'] . ($style !== 'all' ? "-{$style}" : '') . "-icons.zip";

    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $downloadName . '"');
    header('Content-Length: ' . filesize($zipFilename));
    header('Cache-Control: no-cache, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');

    readfile($zipFilename);
    @unlink($zipFilename);
    exit;

} catch (Exception $e) {
    jsonResponse(false, null, 'ZIP download failed: ' . $e->getMessage(), 500);
}
