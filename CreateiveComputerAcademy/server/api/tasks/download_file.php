<?php
require_once '../../config/cors.php';

if (!isset($_GET['url']) && !isset($_GET['file'])) {
    http_response_code(400);
    echo json_encode(["error" => "File URL or path is required."]);
    exit;
}

$raw_file = trim($_GET['url'] ?? $_GET['file']);
$custom_filename = trim($_GET['filename'] ?? '');

if (empty($raw_file)) {
    http_response_code(400);
    echo json_encode(["error" => "Empty file parameter."]);
    exit;
}

// 1. Check if the URL points to a local upload path on this server
$relative_path = null;
$clean_input = str_replace(['..', '\\'], ['', '/'], $raw_file);

if (preg_match('/^https?:\/\//i', $raw_file)) {
    $parsed_url = parse_url($raw_file, PHP_URL_PATH);
    if ($parsed_url) {
        $uploads_pos = strpos($parsed_url, '/uploads/');
        if ($uploads_pos !== false) {
            $relative_path = substr($parsed_url, $uploads_pos + 1); // e.g. "uploads/task_images/task_xxxx.webp"
        }
    }
} else {
    $relative_path = ltrim($clean_input, '/');
}

// 2. If a local upload path was identified, check for original uncompressed file
if ($relative_path) {
    $base_upload_dir = realpath(__DIR__ . '/../../');
    $local_file_path = $base_upload_dir ? $base_upload_dir . '/' . $relative_path : null;

    $path_info = pathinfo($relative_path);
    $dir_name = $path_info['dirname'] ?? ''; // e.g. "uploads/task_images" or "uploads/comments"
    $file_stem = $path_info['filename'] ?? ''; // e.g. "task_67be..."
    $file_ext = strtolower($path_info['extension'] ?? '');

    $served_file = null;
    $served_ext = $file_ext;

    // Check in originals subfolder if it exists (e.g. uploads/task_images/originals/task_xxxx.*)
    if (!empty($dir_name) && !empty($file_stem)) {
        $originals_dir = $base_upload_dir . '/' . $dir_name . '/originals/';
        if (is_dir($originals_dir)) {
            $pattern = $originals_dir . $file_stem . '.*';
            $matches = glob($pattern);
            if ($matches && count($matches) > 0) {
                // Found original file (e.g. .jpg, .png, .psd)
                foreach ($matches as $match) {
                    if (is_file($match) && file_exists($match)) {
                        $served_file = $match;
                        $served_ext = strtolower(pathinfo($match, PATHINFO_EXTENSION));
                        break;
                    }
                }
            }
        }
    }

    // If no original file found in originals/, fall back to the direct local file
    if (!$served_file && $local_file_path && file_exists($local_file_path) && is_file($local_file_path)) {
        $served_file = $local_file_path;
        $served_ext = $file_ext;
    }

    // If we have a local file to serve (either original or preview)
    if ($served_file && file_exists($served_file)) {
        if (ob_get_level()) ob_end_clean();

        $mime = mime_content_type($served_file) ?: 'application/octet-stream';
        $final_filename = $custom_filename;

        if (!empty($final_filename)) {
            // Replace .webp extension in custom_filename if original is .jpg/.png
            $custom_ext = strtolower(pathinfo($final_filename, PATHINFO_EXTENSION));
            if ($custom_ext === 'webp' && $served_ext !== 'webp') {
                $final_filename = pathinfo($final_filename, PATHINFO_FILENAME) . '.' . $served_ext;
            } elseif (empty($custom_ext)) {
                $final_filename .= '.' . $served_ext;
            }
        } else {
            $final_filename = basename($served_file);
        }

        header('Content-Description: File Transfer');
        header('Content-Type: ' . $mime);
        header('Content-Disposition: attachment; filename="' . str_replace('"', '', $final_filename) . '"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        header('Pragma: public');
        header('Content-Length: ' . filesize($served_file));
        readfile($served_file);
        exit;
    }
}

// 3. Remote URL (e.g. Cloudflare R2 bucket or external CDN)
$final_filename = $custom_filename;
if (empty($final_filename)) {
    $url_path = parse_url($raw_file, PHP_URL_PATH);
    $final_filename = $url_path ? basename($url_path) : 'download_file';
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $raw_file);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
curl_setopt($ch, CURLOPT_TIMEOUT, 90);
$content = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300 && $content !== false) {
    if (ob_get_level()) ob_end_clean();

    header('Content-Description: File Transfer');
    header('Content-Type: ' . ($contentType ?: 'application/octet-stream'));
    header('Content-Disposition: attachment; filename="' . str_replace('"', '', $final_filename) . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
    header('Pragma: public');
    header('Content-Length: ' . strlen($content));
    echo $content;
    exit;
}

// Fallback redirect
header("Location: " . $raw_file);
exit;
?>
