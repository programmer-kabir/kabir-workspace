<?php
require_once '../../config/cors.php';

if (!isset($_GET['file']) && !isset($_GET['url'])) {
    http_response_code(400);
    echo json_encode(["error" => "File path or URL is required."]);
    exit;
}

$raw_file = trim($_GET['file'] ?? $_GET['url']);
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
            $relative_path = substr($parsed_url, $uploads_pos + 1);
        }
    }
} else {
    $relative_path = ltrim($clean_input, '/');
}

if ($relative_path) {
    $base_upload_dir = realpath(__DIR__ . '/../../');
    $local_file_path = $base_upload_dir ? $base_upload_dir . '/' . $relative_path : null;

    $path_info = pathinfo($relative_path);
    $dir_name = $path_info['dirname'] ?? '';
    $file_stem = $path_info['filename'] ?? '';
    $file_ext = strtolower($path_info['extension'] ?? '');

    $served_file = null;
    $served_ext = $file_ext;

    // Search in originals directory
    if (!empty($dir_name) && !empty($file_stem)) {
        $originals_dir = $base_upload_dir . '/' . $dir_name . '/originals/';
        if (is_dir($originals_dir)) {
            $pattern = $originals_dir . $file_stem . '.*';
            $matches = glob($pattern);
            if ($matches && count($matches) > 0) {
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

    // Fallback: local file directly
    if (!$served_file && $local_file_path && file_exists($local_file_path) && is_file($local_file_path)) {
        $served_file = $local_file_path;
        $served_ext = $file_ext;
    }

    if ($served_file && file_exists($served_file)) {
        if (ob_get_level()) ob_end_clean();

        $mime = mime_content_type($served_file) ?: 'application/octet-stream';
        $final_filename = $custom_filename;

        if (!empty($final_filename)) {
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

http_response_code(404);
echo json_encode(["error" => "File not found."]);
exit;
?>
