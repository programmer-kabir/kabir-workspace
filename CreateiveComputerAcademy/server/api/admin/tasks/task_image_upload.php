<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Catch ALL PHP errors and return them as JSON (no more silent 500s)
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    echo json_encode([
        "error"   => "PHP Error [$errno]: $errstr",
        "file"    => basename($errfile),
        "line"    => $errline,
    ]);
    exit;
});
set_exception_handler(function ($e) {
    echo json_encode([
        "error" => "Exception: " . $e->getMessage(),
        "line"  => $e->getLine(),
    ]);
    exit;
});

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["error" => "Method not allowed."]);
    exit;
}

if (!isset($_FILES['files']) || empty($_FILES['files']['name'][0])) {
    echo json_encode(["error" => "No valid file uploaded."]);
    exit;
}

$upload_dir = '../../../uploads/task_images/';
if (!is_dir($upload_dir)) {
    if (!mkdir($upload_dir, 0755, true)) {
        echo json_encode(["error" => "Cannot create upload directory. Check server permissions."]);
        exit;
    }
}

// ── Feature Detection ───────────────────────────────────────────────────────
$has_gd      = extension_loaded('gd');
$has_finfo   = function_exists('finfo_open');
$has_webp    = $has_gd && function_exists('imagewebp');

// ── Debug info (remove after testing) ──────────────────────────────────────
// Uncomment below line temporarily to see server capabilities:
// echo json_encode(["debug" => ["gd"=>$has_gd,"finfo"=>$has_finfo,"webp"=>$has_webp]]); exit;

$allowed_mime = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
$uploaded_files = [];

// Normalize: Jodit sometimes sends a single file as plain strings (not arrays).
// Wrap in array so the loop below always works the same way.
$file_names = is_array($_FILES['files']['name'])     ? $_FILES['files']['name']     : [$_FILES['files']['name']];
$file_tmps  = is_array($_FILES['files']['tmp_name']) ? $_FILES['files']['tmp_name'] : [$_FILES['files']['tmp_name']];
$file_errs  = is_array($_FILES['files']['error'])    ? $_FILES['files']['error']    : [$_FILES['files']['error']];

$file_count = count($file_names);

for ($i = 0; $i < $file_count; $i++) {
    $file_name = $file_names[$i];
    $file_tmp  = $file_tmps[$i];
    $file_err  = $file_errs[$i];

    if ($file_err !== UPLOAD_ERR_OK) {
        echo json_encode(["error" => "File upload error code: $file_err for $file_name"]);
        exit;
    }

    // ── MIME type detection ─────────────────────────────────────────────────
    if ($has_finfo) {
        $finfo     = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $file_tmp);
        finfo_close($finfo);
    } else {
        // Fallback: guess from extension if finfo not available
        $ext_map = [
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png'  => 'image/png',
            'gif'  => 'image/gif',
            'webp' => 'image/webp',
            'svg'  => 'image/svg+xml',
        ];
        $ext       = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
        $mime_type = $ext_map[$ext] ?? 'application/octet-stream';
    }

    if (!in_array($mime_type, $allowed_mime)) {
        echo json_encode(["error" => "Invalid file type ($mime_type) for: $file_name"]);
        exit;
    }

    // SVG: cannot rasterize — save as-is
    if ($mime_type === 'image/svg+xml') {
        $new_name  = 'task_' . uniqid() . '.svg';
        $dest_path = $upload_dir . $new_name;
        if (move_uploaded_file($file_tmp, $dest_path)) {
            $uploaded_files[] = 'uploads/task_images/' . $new_name;
            
            // Also copy to originals folder
            $orig_dir = $upload_dir . 'originals/';
            if (!is_dir($orig_dir)) mkdir($orig_dir, 0755, true);
            copy($dest_path, $orig_dir . $new_name);
        }
        continue;
    }

    // ── WebP Conversion ─────────────────────────────────────────────────────
    if ($has_webp) {
        $orig_ext = 'jpg';
        // GD is available — convert to WebP
        switch ($mime_type) {
            case 'image/jpeg':
                $img = imagecreatefromjpeg($file_tmp);
                $orig_ext = 'jpg';
                break;
            case 'image/png':
                $img = imagecreatefrompng($file_tmp);
                $orig_ext = 'png';
                if ($img) {
                    imagepalettetotruecolor($img);
                    imagealphablending($img, true);
                    imagesavealpha($img, true);
                }
                break;
            case 'image/gif':
                $img = imagecreatefromgif($file_tmp);
                $orig_ext = 'gif';
                break;
            case 'image/webp':
                $img = imagecreatefromwebp($file_tmp);
                $orig_ext = 'webp';
                break;
            default:
                $img = false;
        }

        if (!$img) {
            echo json_encode(["error" => "GD could not read image: $file_name"]);
            exit;
        }

        $base_id = 'task_' . uniqid();
        $new_name  = $base_id . '.webp';
        $dest_path = $upload_dir . $new_name;

        if (imagewebp($img, $dest_path, 85)) {
            $uploaded_files[] = 'uploads/task_images/' . $new_name;
            
            // Save original file in originals/ subfolder
            $orig_dir = $upload_dir . 'originals/';
            if (!is_dir($orig_dir)) {
                mkdir($orig_dir, 0755, true);
            }
            move_uploaded_file($file_tmp, $orig_dir . $base_id . '.' . $orig_ext);
        } else {
            echo json_encode(["error" => "imagewebp() failed. Check directory write permissions."]);
            exit;
        }
        imagedestroy($img);

    } else {
        // ── GD/WebP not available — save original file as-is ────────────────
        $ext_map   = ['image/jpeg'=>'jpg','image/png'=>'png','image/gif'=>'gif','image/webp'=>'webp'];
        $ext       = $ext_map[$mime_type] ?? 'jpg';
        $base_id   = 'task_' . uniqid();
        $new_name  = $base_id . '.' . $ext;
        $dest_path = $upload_dir . $new_name;

        if (move_uploaded_file($file_tmp, $dest_path)) {
            $uploaded_files[] = 'uploads/task_images/' . $new_name;
            
            // Also copy to originals folder
            $orig_dir = $upload_dir . 'originals/';
            if (!is_dir($orig_dir)) {
                mkdir($orig_dir, 0755, true);
            }
            copy($dest_path, $orig_dir . $new_name);
        }
    }
}

if (empty($uploaded_files)) {
    echo json_encode(["error" => "Failed to save any uploaded file."]);
    exit;
}

// Jodit expects exactly: { "files": [ "url1", "url2", ... ] }
echo json_encode(["files" => $uploaded_files]);
?>
