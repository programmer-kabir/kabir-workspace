<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/r2_config.php';
require_once __DIR__ . '/../middleware/auth.php'; // SECURE: Verify Firebase Token
require_once __DIR__ . '/../helper/email_helper.php';

header("Content-Type: application/json; charset=UTF-8");

function sendResponse($success, $message, $extra = []) {
    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    echo json_encode(
        array_merge([
            "success" => $success,
            "message" => $message
        ], $extra),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

function createSlug($text) {
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    $text = trim($text, '-');

    if ($text === '') {
        $text = 'content';
    }

    return $text . '-' . time() . '-' . rand(1000, 9999);
}

function createTagSlug($text) {
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);

    return trim($text, '-');
}

function getOrientation($width, $height) {
    if (!$width || !$height) {
        return null;
    }

    if ($width == $height) {
        return 'square';
    }

    if ($width > $height) {
        return ($width / $height >= 2) ? 'panoramic' : 'horizontal';
    }

    return 'vertical';
}

function extractMetadataFromFile($filePath) {
    $meta = [
        'title' => '',
        'description' => '',
        'tags' => []
    ];

    if (!file_exists($filePath) || !is_readable($filePath)) {
        return $meta;
    }

    $fileSize = @filesize($filePath);
    if (!$fileSize) return $meta;

    // Read up to 20MB of file content (covers large 5MB+ EPS/PSD/AI files)
    $maxBytes = 20 * 1024 * 1024;
    $content = @file_get_contents($filePath, false, null, 0, $maxBytes);
    if (!$content) return $meta;

    // 1. Search for XMP Title across ALL <x:xmpmeta> or <rdf:RDF> blocks in the file
    if (preg_match_all('/<dc:title[\s\S]*?>([\s\S]*?)<\/dc:title>/i', $content, $dcTitleMatches)) {
        foreach ($dcTitleMatches[1] as $block) {
            if (preg_match('/<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/i', $block, $liMatch)) {
                $val = trim(strip_tags(html_entity_decode($liMatch[1])));
                if (!empty($val)) { $meta['title'] = $val; break; }
            } else {
                $val = trim(strip_tags(html_entity_decode($block)));
                if (!empty($val) && !str_contains($val, '<rdf:')) { $meta['title'] = $val; break; }
            }
        }
    }

    // dc:title="..." attribute inside <rdf:Description ...>
    if (empty($meta['title'])) {
        if (preg_match('/dc:title=["\']([^"\']+)["\']/i', $content, $m)) {
            $meta['title'] = trim(html_entity_decode($m[1]));
        }
    }

    // <photoshop:Headline> or photoshop:Headline="..."
    if (empty($meta['title'])) {
        if (preg_match('/<photoshop:Headline[\s\S]*?>([\s\S]*?)<\/photoshop:Headline>/i', $content, $m)) {
            if (preg_match('/<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/i', $m[1], $li)) $meta['title'] = trim(strip_tags(html_entity_decode($li[1])));
            else $meta['title'] = trim(strip_tags(html_entity_decode($m[1])));
        } elseif (preg_match('/photoshop:Headline=["\']([^"\']+)["\']/i', $content, $m)) {
            $meta['title'] = trim(html_entity_decode($m[1]));
        }
    }

    // <pdf:Title> or <xmp:Title>
    if (empty($meta['title'])) {
        if (preg_match('/<(?:pdf|xmp):Title[\s\S]*?>([\s\S]*?)<\/(?:pdf|xmp):Title>/i', $content, $m)) {
            $meta['title'] = trim(strip_tags(html_entity_decode($m[1])));
        }
    }

    // PostScript %%DocumentTitle: comment (if explicit document title is specified in EPS header)
    if (empty($meta['title'])) {
        if (preg_match('/^%%\s*DocumentTitle\s*:\s*(.+)$/m', $content, $m)) {
            $val = trim($m[1]);
            $genericTitles = ['adobe illustrator artwork', 'untitled', 'untitled-1', 'untitled-2', 'illustration', 'vector', 'artboard', 'document', 'canvas'];
            if (!empty($val) && !in_array(strtolower($val), $genericTitles, true)) {
                $meta['title'] = $val;
            }
        }
    }

    // 2. Extract XMP Description
    if (preg_match_all('/<dc:description[\s\S]*?>([\s\S]*?)<\/dc:description>/i', $content, $dcDescMatches)) {
        foreach ($dcDescMatches[1] as $block) {
            if (preg_match('/<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/i', $block, $liMatch)) {
                $val = trim(strip_tags(html_entity_decode($liMatch[1])));
                if (!empty($val)) { $meta['description'] = $val; break; }
            } else {
                $val = trim(strip_tags(html_entity_decode($block)));
                if (!empty($val) && !str_contains($val, '<rdf:')) { $meta['description'] = $val; break; }
            }
        }
    }

    // 3. Extract XMP Tags / Keywords
    if (preg_match_all('/<dc:subject[\s\S]*?>([\s\S]*?)<\/dc:subject>/i', $content, $dcSubjMatches)) {
        foreach ($dcSubjMatches[1] as $block) {
            if (preg_match_all('/<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/i', $block, $tagsMatch)) {
                foreach ($tagsMatch[1] as $tag) {
                    $t = trim(strip_tags(html_entity_decode($tag)));
                    if ($t !== '') $meta['tags'][] = $t;
                }
            }
        }
    }
    
    if (empty($meta['tags'])) {
        if (preg_match_all('/<(?:pdf|photoshop|xmp):Keywords[\s\S]*?>([\s\S]*?)<\/(?:pdf|photoshop|xmp):Keywords>/i', $content, $kwMatches)) {
            foreach ($kwMatches[1] as $block) {
                $kwStr = trim(strip_tags(html_entity_decode($block)));
                if ($kwStr !== '') {
                    $splitTags = preg_split('/[;,]+/', $kwStr);
                    foreach ($splitTags as $st) {
                        $st = trim($st);
                        if ($st !== '') $meta['tags'][] = $st;
                    }
                }
            }
        }
    }

    // 4. Fallback: IPTC metadata check (JPEG / PNG / TIFF)
    if (empty($meta['tags']) || empty($meta['title'])) {
        $size = @getimagesize($filePath, $info);
        if (isset($info['APP13'])) {
            $iptc = @iptcparse($info['APP13']);
            if (is_array($iptc)) {
                if (empty($meta['title'])) {
                    if (!empty($iptc['2#105'][0])) $meta['title'] = trim($iptc['2#105'][0]);
                    else if (!empty($iptc['2#005'][0])) $meta['title'] = trim($iptc['2#005'][0]);
                }
                if (empty($meta['description'])) {
                    if (!empty($iptc['2#120'][0])) $meta['description'] = trim($iptc['2#120'][0]);
                }
                if (empty($meta['tags']) && !empty($iptc['2#025'])) {
                    $meta['tags'] = array_map('trim', $iptc['2#025']);
                }
            }
        }
    }

    $meta['tags'] = array_values(array_unique(array_filter($meta['tags'])));
    return $meta;
}

function deleteUploadedFiles($filePaths) {
    foreach ($filePaths as $filePath) {
        if (!empty($filePath) && file_exists($filePath)) {
            unlink($filePath);
        }
    }
}

function generateAssetId($mysqli) {
    $digits = 12; // Start with 12-digit IDs

    while (true) {
        $min = (int) pow(10, $digits - 1); // 100000000000
        $max = (int) pow(10, $digits) - 1; // 999999999999
        $capacity = $max - $min + 1; // 900000000000 for 12 digits

        // Count how many IDs of this digit length already exist
        $countStmt = $mysqli->prepare(
            "SELECT COUNT(*) FROM contents WHERE CHAR_LENGTH(asset_id) = ?"
        );
        if ($countStmt) {
            $countStmt->bind_param("i", $digits);
            $countStmt->execute();
            $countStmt->bind_result($used);
            $countStmt->fetch();
            $countStmt->close();

            // If this digit space is completely full, move to next digit count
            if ($used >= $capacity) {
                $digits++;
                continue;
            }
        }

        // Generate a random ID of current digit length
        $assetId = (string) random_int($min, $max);

        $stmt = $mysqli->prepare("SELECT id FROM contents WHERE asset_id = ?");
        if (!$stmt) return $assetId; // fallback if DB issue
        $stmt->bind_param("s", $assetId);
        $stmt->execute();
        $res = $stmt->get_result();
        $stmt->close();

        if ($res->num_rows === 0) {
            return $assetId; // Unique ID found!
        }
        // Collision: try again within same digit space
    }
}

function generateCheckerboardJpg($sourcePath, $destinationPath) {
    $info = @getimagesize($sourcePath);
    if (!$info || $info['mime'] !== 'image/png') return false;

    $sourceImg = @imagecreatefrompng($sourcePath);
    if (!$sourceImg) return false;
    imagealphablending($sourceImg, false);
    imagesavealpha($sourceImg, true);

    $width = imagesx($sourceImg);
    $height = imagesy($sourceImg);

    $destImg = imagecreatetruecolor($width, $height);
    
    // Draw checkerboard
    $white = imagecolorallocate($destImg, 255, 255, 255);
    $gray = imagecolorallocate($destImg, 240, 240, 240);
    $squareSize = 20;

    for ($y = 0; $y < $height; $y += $squareSize) {
        for ($x = 0; $x < $width; $x += $squareSize) {
            $isGray = (($x / $squareSize) % 2) ^ (($y / $squareSize) % 2);
            $color = $isGray ? $gray : $white;
            imagefilledrectangle($destImg, $x, $y, $x + $squareSize - 1, $y + $squareSize - 1, $color);
        }
    }

    // Ensure transparency of source image is respected when copying
    imagealphablending($destImg, true);
    imagecopy($destImg, $sourceImg, 0, 0, 0, 0, $width, $height);

    // Save as high-quality JPG
    $result = imagejpeg($destImg, $destinationPath, 95);

    imagedestroy($sourceImg);
    imagedestroy($destImg);

    return $result;
}

function createWatermarkedWebp($sourcePath, $destinationPath, $assetId = '') {
    $info = getimagesize($sourcePath);
    if (!$info) return false;

    $mime = $info['mime'];
    
    switch ($mime) {
        case 'image/jpeg':
            $image = @imagecreatefromjpeg($sourcePath);
            break;
        case 'image/png':
            $image = @imagecreatefrompng($sourcePath);
            break;
        case 'image/webp':
            $image = @imagecreatefromwebp($sourcePath);
            break;
        default:
            return false;
    }
    
    if (!$image) return false;
    
    $width = imagesx($image);
    $height = imagesy($image);
    
    $fontPath = __DIR__ . '/../config/fonts/OpenSans.ttf';

    // ── Center tiled watermark (bigger & more visible) ──
    // White text, semi-transparent (0=opaque, 127=transparent)
    $textColor = imagecolorallocatealpha($image, 255, 255, 255, 80); 
    
    $fontSize = max(30, min($width, $height) * 0.07); // bigger: 0.07 instead of 0.05
    $angle = 45;
    $text = "DayalStock";
    
    if (file_exists($fontPath)) {
        $bbox = imagettfbbox($fontSize, 0, $fontPath, $text);
        $textWidth = abs($bbox[4] - $bbox[0]);
        
        // Tighter grid (1.2x instead of 1.5x) = more watermarks
        $stepX = $textWidth * 1.2;
        $stepY = $textWidth * 1.2;
        
        $row = 0;
        for ($y = -$height; $y <= $height * 2; $y += $stepY) {
            $rowOffsetX = ($row % 2 == 0) ? 0 : ($stepX / 2);
            for ($x = -$width; $x <= $width * 2; $x += $stepX) {
                imagettftext($image, $fontSize, $angle, (int)($x + $rowOffsetX), (int)$y, $textColor, $fontPath, $text);
            }
            $row++;
        }
    }

    // ── Bottom-left label: "Dayal Stock | [assetId]" ──
    if (file_exists($fontPath)) {
        $labelText = 'Dayal Stock' . ($assetId ? ' | ' . $assetId : '');
        $labelFontSize = max(12, min($width, $height) * 0.025);
        
        $labelBbox = imagettfbbox($labelFontSize, 0, $fontPath, $labelText);
        $labelWidth  = abs($labelBbox[4] - $labelBbox[0]) + 20;
        $labelHeight = abs($labelBbox[5] - $labelBbox[1]) + 12;

        $padX = 14;
        $padY = 12;
        $boxX1 = $padX;
        $boxY1 = $height - $labelHeight - $padY;
        $boxX2 = $padX + $labelWidth;
        $boxY2 = $height - $padY;

        // White semi-transparent background strip
        $bgColor = imagecolorallocatealpha($image, 255, 255, 255, 30);
        imagefilledrectangle($image, $boxX1, $boxY1, $boxX2, $boxY2, $bgColor);

        // Black text on top
        $blackText = imagecolorallocate($image, 0, 0, 0);
        $textX = $boxX1 + 10;
        $textY = $boxY2 - 7;
        imagettftext($image, $labelFontSize, 0, $textX, $textY, $blackText, $fontPath, $labelText);
    }
    
    // Save as WebP
    $result = imagewebp($image, $destinationPath, 80); 
    imagedestroy($image);
    
    return $result;
}

function resizeToWebp($sourcePath, $destWebpPath, $targetMaxDim) {
    $info = @getimagesize($sourcePath);
    if (!$info) return false;
    
    $width = $info[0];
    $height = $info[1];
    
    // If original is smaller and already WebP, just copy it (only if webp)
    if ($width <= $targetMaxDim && $height <= $targetMaxDim && $info['mime'] === 'image/webp') {
        return copy($sourcePath, $destWebpPath);
    }
    
    $ratio = $width / $height;
    if ($width > $height) {
        $newWidth = $targetMaxDim;
        $newHeight = (int)($targetMaxDim / $ratio);
    } else {
        $newHeight = $targetMaxDim;
        $newWidth = (int)($targetMaxDim * $ratio);
    }
    
    switch ($info['mime']) {
        case 'image/jpeg': $sourceImg = @imagecreatefromjpeg($sourcePath); break;
        case 'image/png': $sourceImg = @imagecreatefrompng($sourcePath); break;
        case 'image/webp': $sourceImg = @imagecreatefromwebp($sourcePath); break;
        default: return false;
    }
    if (!$sourceImg) return false;
    
    $destImg = imagecreatetruecolor($newWidth, $newHeight);
    
    imagealphablending($destImg, false);
    imagesavealpha($destImg, true);
    $transparent = imagecolorallocatealpha($destImg, 255, 255, 255, 127);
    imagefilledrectangle($destImg, 0, 0, $newWidth, $newHeight, $transparent);
    
    imagecopyresampled($destImg, $sourceImg, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
    
    $result = imagewebp($destImg, $destWebpPath, 80);
    
    imagedestroy($sourceImg);
    imagedestroy($destImg);
    
    return $result;
}

function autoGeneratePreviewFromMainFile($mainFullPath, $mainExtension, $destPreviewJpgPath) {
    // 1. Try extracting embedded XMP base64 thumbnail (<xmpGImg:image>) or embedded JPEG from EPS/AI/PSD
    if (file_exists($mainFullPath)) {
        $fileSize = @filesize($mainFullPath);
        if ($fileSize > 0) {
            $readSize = min($fileSize, 20971520); // Read up to 20MB for XMP thumbnail
            $handle = @fopen($mainFullPath, 'rb');
            if ($handle) {
                $content = @fread($handle, $readSize);
                @fclose($handle);

                // Check for XMP thumbnail: <xmpGImg:image>base64</xmpGImg:image>
                if (preg_match('/<xmpGImg:image>([\s\S]*?)<\/xmpGImg:image>/i', $content, $match)) {
                    $cleanBase64 = preg_replace('/\s+/', '', $match[1]);
                    $decoded = @base64_decode($cleanBase64);
                    if ($decoded && strlen($decoded) > 500) {
                        if (@file_put_contents($destPreviewJpgPath, $decoded)) {
                            $info = @getimagesize($destPreviewJpgPath);
                            if ($info) {
                                return true;
                            }
                        }
                    }
                }

                // Check for raw JPEG stream (\xFF\xD8\xFF ... \xFF\xD9) inside EPS
                $startPos = strpos($content, "\xFF\xD8\xFF");
                if ($startPos !== false) {
                    $endPos = strrpos($content, "\xFF\xD9");
                    if ($endPos !== false && $endPos > $startPos) {
                        $jpegBytes = substr($content, $startPos, ($endPos - $startPos + 2));
                        if (strlen($jpegBytes) > 500) {
                            if (@file_put_contents($destPreviewJpgPath, $jpegBytes)) {
                                $info = @getimagesize($destPreviewJpgPath);
                                if ($info) {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 2. Try Imagick if installed
    if (extension_loaded('imagick')) {
        try {
            $imagick = new Imagick();
            if (strtolower($mainExtension) === 'svg') {
                $imagick->setResolution(600, 600);
                $imagick->setBackgroundColor(new ImagickPixel('transparent'));
            }
            $imagick->readImage($mainFullPath . '[0]');
            if (strtolower($mainExtension) === 'svg') {
                $imagick->resizeImage(2000, 2000, Imagick::FILTER_LANCZOS, 1, true);
            }
            $imagick->setImageFormat('jpeg');
            $imagick->setImageCompressionQuality(90);
            $imagick->setImageBackgroundColor('white');
            if (method_exists($imagick, 'mergeImageLayers')) {
                $imagick = $imagick->mergeImageLayers(Imagick::LAYERMETHOD_FLATTEN);
            }
            $imagick->writeImage($destPreviewJpgPath);
            $imagick->clear();
            $imagick->destroy();
            if (file_exists($destPreviewJpgPath) && filesize($destPreviewJpgPath) > 0) {
                return true;
            }
        } catch (Throwable $e) {
            // Imagick failed or not configured, fallback below
        }
    }
    
    // 3. Fallback: Create clean asset banner image (1200x800)
    $width = 1200;
    $height = 800;
    $img = imagecreatetruecolor($width, $height);
    $bg = imagecolorallocate($img, 30, 32, 47);
    imagefilledrectangle($img, 0, 0, $width, $height, $bg);
    
    $badgeBg = imagecolorallocate($img, 108, 79, 224);
    $white = imagecolorallocate($img, 255, 255, 255);
    $text = strtoupper($mainExtension) . " ASSET";
    
    imagefilledrectangle($img, 400, 340, 800, 460, $badgeBg);
    
    $fontPath = __DIR__ . '/../config/fonts/OpenSans.ttf';
    if (file_exists($fontPath)) {
        imagettftext($img, 26, 0, 470, 412, $white, $fontPath, $text);
    } else {
        imagestring($img, 5, 520, 390, $text, $white);
    }
    
    $res = imagejpeg($img, $destPreviewJpgPath, 90);
    imagedestroy($img);
    return $res;
}

$uploadedFiles = [];

try {
    if (!isset($mysqli) || !$mysqli) {
        throw new Exception('Database connection পাওয়া যায়নি। config/db.php-তে $mysqli থাকতে হবে।');
    }

    // SECURE: Get Author ID securely from authenticated email
    $userEmail = $GLOBALS['user']['email'];
    if (!$userEmail) throw new Exception("Unauthorized. Please log in.");
    
    $authStmt = $mysqli->prepare("SELECT authors.id AS author_id, users.id AS user_id, users.name AS user_name FROM authors INNER JOIN users ON authors.user_id = users.id WHERE users.email = ? LIMIT 1");
    $authStmt->bind_param("s", $userEmail);
    $authStmt->execute();
    $authRes = $authStmt->get_result();
    
    if ($authRes->num_rows === 0) {
        throw new Exception('You are not authorized to upload content. Author account required.');
    }
    
    $authRow = $authRes->fetch_assoc();
    $authorId = (int) $authRow['author_id'];
    $authorUserId = (int) $authRow['user_id'];
    $authorDisplayName = $authRow['user_name'] ?? 'Contributor';
    $authStmt->close();

    // --- Upload Limit Checking (Saturday to Friday cycle) ---
    $limitStmt = $mysqli->prepare("SELECT id, permission_type, weekly_upload_limit, uploads_this_week, last_upload_date FROM author_upload_limits WHERE author_id = ? LIMIT 1");
    $limitStmt->bind_param("i", $authorId);
    $limitStmt->execute();
    $limitRes = $limitStmt->get_result();
    
    if ($limitRes->num_rows > 0) {
        $limitRow = $limitRes->fetch_assoc();
        $limitId = $limitRow['id'];
        $permissionType = $limitRow['permission_type'];
        $weeklyLimit = (int) $limitRow['weekly_upload_limit'];
        $uploadsThisWeek = (int) $limitRow['uploads_this_week'];
        $lastUploadDate = $limitRow['last_upload_date'];
        
        $now = new DateTime();
        $dayOfWeek = (int) $now->format('w'); // 0 (Sun) to 6 (Sat)
        
        $startOfWeek = clone $now;
        if ($dayOfWeek == 6) {
            $startOfWeek->setTime(0, 0, 0);
        } else {
            $startOfWeek->modify('last saturday')->setTime(0, 0, 0);
        }
        
        if ($lastUploadDate) {
            $lastUploadTime = new DateTime($lastUploadDate);
            if ($lastUploadTime < $startOfWeek) {
                // New week! Reset uploads_this_week
                $uploadsThisWeek = 0;
            }
        }
        
        if ($permissionType === 'limited' && $uploadsThisWeek >= $weeklyLimit) {
            throw new Exception("Upload Limit Reached: You have exhausted your weekly upload limit! It will renew next Saturday.");
        }
    }
    $limitStmt->close();
    // --------------------------------------------------------

    $isDraft = filter_var($_POST['is_draft'] ?? false, FILTER_VALIDATE_BOOLEAN);

    if (
        !$isDraft && (
            empty($_POST['title']) ||
            empty($_POST['category_id']) ||
            empty($_POST['content_type'])
        )
    ) {
        throw new Exception('Title, category and content type required.');
    }

    // --- MAP main_files[0] to main_file ---
    $hasMainFilesUpload = isset($_FILES['main_files']) && is_array($_FILES['main_files']['tmp_name']);
    if ($hasMainFilesUpload && count($_FILES['main_files']['tmp_name']) > 0) {
        $_FILES['main_file'] = [
            'name' => $_FILES['main_files']['name'][0],
            'type' => $_FILES['main_files']['type'][0],
            'tmp_name' => $_FILES['main_files']['tmp_name'][0],
            'error' => $_FILES['main_files']['error'][0],
            'size' => $_FILES['main_files']['size'][0],
        ];
    }

    $hasPreviewFileUpload = isset($_FILES['preview_file']) && $_FILES['preview_file']['error'] === UPLOAD_ERR_OK;
    $hasMainFileUpload = isset($_FILES['main_file']) && $_FILES['main_file']['error'] === UPLOAD_ERR_OK;

    if (!$hasPreviewFileUpload && !$hasMainFileUpload) {
        throw new Exception('At least a main file or preview file is required.');
    }

    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $categoryId = !empty($_POST['category_id']) ? (int) $_POST['category_id'] : null;

    $subcategoryId = !empty($_POST['subcategory_id'])
        ? (int) $_POST['subcategory_id']
        : null;

    $contentType = trim($_POST['content_type'] ?? 'image');
    $licenseType = trim($_POST['license_type'] ?? 'free');
    $exclusivePrice = !empty($_POST['exclusive_price']) ? (float) $_POST['exclusive_price'] : 0.00;
    $aiGenerated = ($_POST['ai_generated'] ?? 'no') === 'yes' ? 1 : 0;
    $tagsText = trim($_POST['tags'] ?? '');

    $allowedContentTypes = ['vector', 'photo', 'png', 'video', 'image'];

    if (!$isDraft && !in_array($contentType, $allowedContentTypes, true)) {
        throw new Exception('Invalid content type.');
    }

    $allowedLicenseTypes = ['free', 'premium', 'editorial'];

    if (!in_array($licenseType, $allowedLicenseTypes, true)) {
        $licenseType = 'free';
    }

    $contentsBaseDir = __DIR__ . '/../../uploads/contents/';

    if (!is_dir($contentsBaseDir)) {
        if (!mkdir($contentsBaseDir, 0775, true)) {
            throw new Exception('uploads/contents folder তৈরি করা যায়নি।');
        }
    }

    if (!is_writable($contentsBaseDir)) {
        throw new Exception('uploads/contents folder writable না। Folder permission 775 করে দাও।');
    }

    // Temp folder for upload (will be renamed to contentId after DB insert)
    $tempFolderName = 'temp_' . time() . '_' . rand(1000, 9999);
    $uploadDirectory = $contentsBaseDir . $tempFolderName . '/';
    if (!mkdir($uploadDirectory, 0775, true)) {
        throw new Exception('Temp upload folder তৈরি করা যায়নি।');
    }

    /* ===========================
       Preview & Main Image Upload Handling
    =========================== */
    $slug = createSlug($title);
    $hasSecondMainFile = false;
    $pngMainFileDatabasePaths = [];
    $isAutoPreviewGenerated = false;

    // Check preview extension or main extension
    $previewFileObj = $hasPreviewFileUpload ? $_FILES['preview_file'] : $_FILES['main_file'];
    $previewExtension = strtolower(pathinfo($previewFileObj['name'], PATHINFO_EXTENSION));
    $allowedPreviewExtensions = ['jpg', 'jpeg', 'png', 'webp'];

    if (!in_array($previewExtension, $allowedPreviewExtensions, true)) {
        // Preview file is actually a vector/PSD/AI main file! Auto-generate preview JPG.
        $mainFile = $previewFileObj;
        $mainExtension = $previewExtension;
        $mainFileName = 'main.' . $mainExtension;
        $mainFullPath = $uploadDirectory . $mainFileName;
        $mainDatabasePath = null; // will be set after contentId is known

        if (!move_uploaded_file($mainFile['tmp_name'], $mainFullPath)) {
            throw new Exception('Main vector/PSD file save করা যায়নি।');
        }
        $uploadedFiles[] = $mainFullPath;

        // Auto-generate JPG preview
        $previewFileName = 'preview.jpg';
        $previewExtension = 'jpg';
        $previewFullPath = $uploadDirectory . $previewFileName;
        $previewDatabasePath = null; // will be set after contentId is known

        if (!autoGeneratePreviewFromMainFile($mainFullPath, $mainExtension, $previewFullPath)) {
            throw new Exception('Preview JPG auto-generation failed.');
        }
        $uploadedFiles[] = $previewFullPath;

        $hasSecondMainFile = true;
        $pngMainFileDatabasePaths = [
            ['path' => $mainDatabasePath, 'name' => $mainFileName, 'ext' => $mainExtension, 'full_path' => $mainFullPath]
        ];
        $isAutoPreviewGenerated = true;
    }

    $hasMainFileUpload = isset($_FILES['main_file']) && $_FILES['main_file']['error'] !== UPLOAD_ERR_NO_FILE;

    if ($isAutoPreviewGenerated) {
        // Preview JPG is already generated & saved above!
    } else if ($previewExtension === 'png' && !$hasMainFileUpload) {
        // --- 1. Original PNG as Main File ---
        $mainFileName = 'main.png';
        $mainFullPath = $uploadDirectory . $mainFileName;
        $mainDatabasePath = null; // will be set after contentId is known

        if (!move_uploaded_file($previewFileObj['tmp_name'], $mainFullPath)) {
            throw new Exception('Original PNG folder-এ save করা যায়নি।');
        }
        $uploadedFiles[] = $mainFullPath;

        // --- 2. Checkerboard JPG as Second Main File & Base for Previews ---
        $checkerboardFileName = 'main.jpg';
        $checkerboardFullPath = $uploadDirectory . $checkerboardFileName;
        $checkerboardDatabasePath = null; // will be set after contentId is known

        if (generateCheckerboardJpg($mainFullPath, $checkerboardFullPath)) {
            $uploadedFiles[] = $checkerboardFullPath;
            
            // Set the preview file to the checkerboard JPG
            $previewFileName = 'preview.jpg';
            $previewExtension = 'jpg';
            $previewFullPath = $uploadDirectory . $previewFileName;
            $previewDatabasePath = null; // will be set after contentId is known
            
            copy($checkerboardFullPath, $previewFullPath);
            $uploadedFiles[] = $previewFullPath;
            
            $hasSecondMainFile = true;
            $pngMainFileDatabasePaths = [
                ['name' => $mainFileName, 'ext' => 'png', 'full_path' => $mainFullPath],
                ['name' => $checkerboardFileName, 'ext' => 'jpg', 'full_path' => $checkerboardFullPath]
            ];
        } else {
            throw new Exception('Checkerboard JPG তৈরি করা যায়নি।');
        }
    } else {
        $previewFileName = 'preview.' . $previewExtension;
        $previewFullPath = $uploadDirectory . $previewFileName;
        $previewDatabasePath = null; // will be set after contentId is known

        if (!move_uploaded_file($previewFileObj['tmp_name'], $previewFullPath)) {
            throw new Exception('Preview image folder-এ save করা যায়নি।');
        }
        $uploadedFiles[] = $previewFullPath;
    }

    // Create Watermarked WEBP version
    $watermarkFileName = 'preview-watermarked.webp';
    $watermarkFullPath = $uploadDirectory . $watermarkFileName;
    $watermarkDatabasePath = null; // will be set after contentId is known

    // Generate asset_id early so it can be embedded in the watermark label
    // We generate it here using the DB to ensure uniqueness.
    $assetId = generateAssetId($mysqli);

    // Initialize the resized paths
    $thumbnailDatabasePath = null;
    $preview600DatabasePath = null;
    $preview1200DatabasePath = null;
    $authorPreviewDatabasePath = null;

    // Generate Clean 600px Preview for Admin/Author
    $authorPreviewFileName = 'author-600.webp';
    $authorPreviewFullPath = $uploadDirectory . $authorPreviewFileName;
    if (resizeToWebp($previewFullPath, $authorPreviewFullPath, 600)) {
        $uploadedFiles[] = $authorPreviewFullPath;
        $authorPreviewDatabasePath = null; // will be set after contentId is known
    }

    if (createWatermarkedWebp($previewFullPath, $watermarkFullPath, $assetId)) {
        $uploadedFiles[] = $watermarkFullPath;
        
        // Generate Resized Watermarked Previews
        // 1200px
        $preview1200FileName = 'preview-1200.webp';
        $preview1200FullPath = $uploadDirectory . $preview1200FileName;
        if (resizeToWebp($watermarkFullPath, $preview1200FullPath, 1200)) {
            $uploadedFiles[] = $preview1200FullPath;
            $preview1200DatabasePath = null; // will be set after contentId is known
        }

        // 600px
        $preview600FileName = 'preview-600.webp';
        $preview600FullPath = $uploadDirectory . $preview600FileName;
        if (resizeToWebp($watermarkFullPath, $preview600FullPath, 600)) {
            $uploadedFiles[] = $preview600FullPath;
            $preview600DatabasePath = null; // will be set after contentId is known
        }

        // 300px
        if ($contentType !== 'video') {
            $thumbnailFileName = 'preview-300.webp';
            $thumbnailFullPath = $uploadDirectory . $thumbnailFileName;
            if (resizeToWebp($watermarkFullPath, $thumbnailFullPath, 300)) {
                $uploadedFiles[] = $thumbnailFullPath;
                $thumbnailDatabasePath = null; // will be set after contentId is known
            }
        }

    } else {
        $watermarkDatabasePath = null; // Fallback if creation fails
    }

    if ($contentType === 'video') {
        // The user requested not to use full preview_image, watermarked image and 300px thumbnail for videos
        $previewDatabasePath = null;
        $watermarkDatabasePath = null;
        $thumbnailDatabasePath = null;
        
        if (file_exists($watermarkFullPath)) unlink($watermarkFullPath);
        if (isset($thumbnailFullPath) && file_exists($thumbnailFullPath)) unlink($thumbnailFullPath);
    }

    $imageInfo = @getimagesize($previewFullPath);

    $width = $imageInfo ? (int) $imageInfo[0] : null;
    $height = $imageInfo ? (int) $imageInfo[1] : null;
    $orientation = getOrientation($width, $height);
    
    // Extract metadata (Title, Description, Tags) from file XMP/IPTC
    // Priority: EPS/PSD/AI main_file > already-saved mainFullPath > preview image
    $targetFileForMeta = $previewFullPath; // default
    if ($hasMainFileUpload && isset($_FILES['main_file']) && $_FILES['main_file']['error'] === UPLOAD_ERR_OK) {
        // Main EPS/PSD/AI is not yet moved (still in tmp), use tmp path for metadata extraction
        $targetFileForMeta = $_FILES['main_file']['tmp_name'];
    } elseif (!empty($mainFullPath) && file_exists($mainFullPath)) {
        $targetFileForMeta = $mainFullPath;
    }
    $extractedMeta = extractMetadataFromFile($targetFileForMeta);

    if ($isDraft) {
        if (!empty($extractedMeta['title'])) {
            $title = $extractedMeta['title'];
        } else if (empty($title)) {
            $sampleFile = $hasPreviewFileUpload ? $_FILES['preview_file'] : $_FILES['main_file'];
            $title = pathinfo($sampleFile['name'], PATHINFO_FILENAME);
        }

        if (!empty($extractedMeta['description'])) {
            $description = $extractedMeta['description'];
        } else if (empty($description) && !empty($title)) {
            $typeLabel = $contentType === "video" ? "stock video footage" : ($contentType === "photo" ? "high resolution stock photograph" : ($contentType === "png" ? "transparent PNG element" : "vector graphic illustration"));
            $description = "High quality " . $typeLabel . " of " . $title . ". Isolated design element suitable for banners, posters, social media graphics, web design, print templates, and creative projects. High resolution file included.";
        }
    }

    $extractedMeta['title'] = $title;

    // Reconnect to DB if it has gone away due to long Imagick processing
    if (!@$mysqli->ping()) {
        @$mysqli->close();
        $DB_HOST = getenv('DB_HOST') ?: 'localhost';
        $DB_USER = getenv('DB_USER') ?: '';
        $DB_PASS = getenv('DB_PASS') ?: '';
        $DB_NAME = getenv('DB_NAME') ?: '';
        $mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
        $mysqli->set_charset("utf8mb4");
        $mysqli->query("SET time_zone = '+06:00'");
    }

    $mysqli->begin_transaction();

    /* ===========================
       Ensure columns exist (DDL — runs outside transaction, errors silently ignored)
    =========================== */
    try {
        $mysqli->query("ALTER TABLE contents ADD COLUMN watermarked_preview_video varchar(500) DEFAULT NULL AFTER watermarked_preview_image");
    } catch(Exception $e) { /* ignore if exists */ }
    // asset_id column is already varchar(20) with unique index — no ALTER needed

    // assetId was already safely generated before watermark creation
    // $assetId = generateAssetId($mysqli); // Removed to avoid mismatch

    /* ===========================
       Contents Table Insert
    =========================== */
    $isPremium = $licenseType === 'premium' ? 1 : 0;
    $status = $isDraft ? 'draft' : 'pending';
    
    // Default value
    $watermarkedVideoDatabasePath = null;

    // $assetId was already generated above (before watermark creation)
    // so we reuse it here — no need to generate again

    $contentQuery = "
        INSERT INTO contents (
            author_id,
            asset_id,
            main_category_id,
            subcategory_id,
            title,
            slug,
            description,
            preview_image,
            watermarked_preview_image,
            watermarked_preview_video,
            thumbnail_url,
            preview_600_url,
            preview_1200_url,
            author_preview_url,
            content_type,
            is_premium,
            license_type,
            ai_generated,
            width,
            height,
            orientation,
            status,
            exclusive_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ";

    $contentStatement = $mysqli->prepare($contentQuery);

    if (!$contentStatement) {
        throw new Exception('Contents query error: ' . $mysqli->error);
    }

    /*
      i = integer
      s = string
    */
    $contentStatement->bind_param(
        'isiisssssssssssissiissd',
        $authorId,
        $assetId,
        $categoryId,
        $subcategoryId,
        $title,
        $slug,
        $description,
        $previewDatabasePath,
        $watermarkDatabasePath,
        $watermarkedVideoDatabasePath,
        $thumbnailDatabasePath,
        $preview600DatabasePath,
        $preview1200DatabasePath,
        $authorPreviewDatabasePath,
        $contentType,
        $isPremium,
        $licenseType,
        $aiGenerated,
        $width,
        $height,
        $orientation,
        $status,
        $exclusivePrice
    );
    if (!$contentStatement->execute()) {
        throw new Exception(
            'Contents table-এ save হয় নাই: ' . $contentStatement->error
        );
    }

    $contentId = $mysqli->insert_id;
    $contentStatement->close();

    /* ===========================
       Rename temp folder to contentId folder
       images/contents/temp_xxx/ → images/contents/{contentId}/
    =========================== */
    $finalFolderName = (string)$contentId;
    $finalUploadDirectory = $contentsBaseDir . $finalFolderName . '/';
    if (!rename($uploadDirectory, $finalUploadDirectory)) {
        throw new Exception('Content folder rename করা যায়নি (temp → ' . $contentId . ')।');
    }
    // Update $uploadDirectory so any further file ops use the right path
    $uploadDirectory = $finalUploadDirectory;
    // Update $uploadedFiles paths to reflect the new directory
    $uploadedFiles = array_map(function($p) use ($contentsBaseDir, $tempFolderName, $finalFolderName) {
        return str_replace($contentsBaseDir . $tempFolderName . '/', $contentsBaseDir . $finalFolderName . '/', $p);
    }, $uploadedFiles);

    // Now compute all database paths (uploads/contents/{contentId}/filename)
    $dbBase = 'uploads/contents/' . $contentId . '/';
    $previewDatabasePath      = $dbBase . $previewFileName;
    $previewFullPath          = $finalUploadDirectory . $previewFileName; // UPDATE PREVIEW FULL PATH
    $watermarkDatabasePath    = file_exists($finalUploadDirectory . $watermarkFileName)   ? $dbBase . $watermarkFileName   : null;
    $authorPreviewDatabasePath= file_exists($finalUploadDirectory . $authorPreviewFileName) ? $dbBase . $authorPreviewFileName : null;
    $thumbnailDatabasePath    = file_exists($finalUploadDirectory . 'preview-300.webp')   ? $dbBase . 'preview-300.webp'   : null;
    $preview600DatabasePath   = file_exists($finalUploadDirectory . 'preview-600.webp')   ? $dbBase . 'preview-600.webp'   : null;
    $preview1200DatabasePath  = file_exists($finalUploadDirectory . 'preview-1200.webp')  ? $dbBase . 'preview-1200.webp'  : null;

    // Update the contents row with the correct file paths
    $updatePaths = $mysqli->prepare(
        "UPDATE contents SET preview_image=?, watermarked_preview_image=?, thumbnail_url=?, preview_600_url=?, preview_1200_url=?, author_preview_url=? WHERE id=?"
    );
    if (!$updatePaths) throw new Exception('Path update query error: ' . $mysqli->error);
    $updatePaths->bind_param('ssssssi',
        $previewDatabasePath, $watermarkDatabasePath,
        $thumbnailDatabasePath, $preview600DatabasePath, $preview1200DatabasePath,
        $authorPreviewDatabasePath, $contentId
    );
    if (!$updatePaths->execute()) throw new Exception('Path update failed: ' . $updatePaths->error);
    $updatePaths->close();

    // Update pngMainFileDatabasePaths with final paths
    if (!empty($pngMainFileDatabasePaths)) {
        foreach ($pngMainFileDatabasePaths as &$pmf) {
            $pmf['path'] = $dbBase . $pmf['name'];
            $pmf['full_path'] = $finalUploadDirectory . $pmf['name'];
        }
        unset($pmf);
    }

    // CLOUDFLARE R2 UPLOAD moved to end of file

    /* ===========================
       Content Files Table
       Preview file = is_main_file 1
    =========================== */
    $fileQuery = "
        INSERT INTO content_files (
            content_id,
            file_url,
            file_name,
            file_type,
            file_size,
            width,
            height,
            is_main_file
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ";

    $fileStatement = $mysqli->prepare($fileQuery);

    if (!$fileStatement) {
        throw new Exception('Content files query error: ' . $mysqli->error);
    }

    if ($contentType !== 'video') {
        $isStandalonePng = ($previewExtension === 'png' && !$hasMainFileUpload && !$isAutoPreviewGenerated);
        if (!$isStandalonePng) {
            $previewFileSize = filesize($previewFullPath);
            $previewIsMainFile = 1;

            $fileStatement->bind_param(
                'isssiiii',
                $contentId,
                $previewDatabasePath,
                $previewFileName,
                $previewExtension,
                $previewFileSize,
                $width,
                $height,
                $previewIsMainFile
            );

            if (!$fileStatement->execute()) {
                throw new Exception(
                    'Preview file DB-তে save হয় নাই: ' . $fileStatement->error
                );
            }
        }
    }

    /* ===========================
       Insert PNG Main Files (if any)
    =========================== */
    if ($hasSecondMainFile && !empty($pngMainFileDatabasePaths)) {
        foreach ($pngMainFileDatabasePaths as $pmf) {
            $fileSize = filesize($pmf['full_path']);
            $isMainFile = ($pmf['ext'] === 'jpg') ? 0 : 1;
            
            $fileStatement->bind_param(
                'isssiiii',
                $contentId,
                $pmf['path'],
                $pmf['name'],
                $pmf['ext'],
                $fileSize,
                $width,
                $height,
                $isMainFile
            );

            if (!$fileStatement->execute()) {
                throw new Exception('PNG Main file DB-তে save হয় নাই: ' . $fileStatement->error);
            }
        }
    }

    /* ===========================
       Optional Main File
       EPS / SVG / AI / PSD / ZIP
    =========================== */
    if (
        !$isAutoPreviewGenerated &&
        isset($_FILES['main_file']) &&
        $_FILES['main_file']['error'] !== UPLOAD_ERR_NO_FILE
    ) {
        $mainFile = $_FILES['main_file'];

        $uploadErrors = [
    UPLOAD_ERR_INI_SIZE => 'File size php.ini upload_max_filesize limit-এর বেশি।',
    UPLOAD_ERR_FORM_SIZE => 'File size form limit-এর বেশি।',
    UPLOAD_ERR_PARTIAL => 'File আংশিক upload হয়েছে।',
    UPLOAD_ERR_NO_FILE => 'Main file পাওয়া যায়নি।',
    UPLOAD_ERR_NO_TMP_DIR => 'Temporary upload folder পাওয়া যায়নি।',
    UPLOAD_ERR_CANT_WRITE => 'Server file write করতে পারেনি।',
    UPLOAD_ERR_EXTENSION => 'PHP extension file upload বন্ধ করেছে।',
];

if ($mainFile['error'] !== UPLOAD_ERR_OK) {
    throw new Exception(
        $uploadErrors[$mainFile['error']]
        ?? 'Main file upload failed. Error: ' . $mainFile['error']
    );
}

        $mainExtension = strtolower(
            pathinfo($mainFile['name'], PATHINFO_EXTENSION)
        );

        $allowedMainExtensions = ['eps', 'svg', 'ai', 'psd', 'zip', 'mp4', 'mov', 'webm'];

        if (!in_array($mainExtension, $allowedMainExtensions, true)) {
            throw new Exception(
                'Main file must be EPS, SVG, AI, PSD, ZIP or Video (MP4/MOV/WEBM).'
            );
        }

        $mainFileName = 'main.' . $mainExtension;
        $mainFullPath = $uploadDirectory . $mainFileName;

        // Database path uses contentId folder
        $mainDatabasePath = $dbBase . $mainFileName;

        if (!move_uploaded_file($mainFile['tmp_name'], $mainFullPath)) {
            throw new Exception('Main file folder-এ save করা যায়নি।');
        }

        // Basic SVG Sanitization to prevent XSS
        if ($mainExtension === 'svg') {
            $svgContent = file_get_contents($mainFullPath);
            if ($svgContent !== false) {
                $temp = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $svgContent);
                if ($temp !== null) $svgContent = $temp;
                
                $temp = preg_replace('/\bon[a-z]+\s*=\s*"[^"]*"/is', '', $svgContent);
                if ($temp !== null) $svgContent = $temp;
                
                $temp = preg_replace('/\bon[a-z]+\s*=\s*\'[^\']*\'/is', '', $svgContent);
                if ($temp !== null) $svgContent = $temp;
                
                $temp = preg_replace('/href="javascript:[^"]*"/is', '', $svgContent);
                if ($temp !== null) $svgContent = $temp;
                
                $temp = preg_replace('/href=\'javascript:[^\']*\'/is', '', $svgContent);
                if ($temp !== null) $svgContent = $temp;
                
                file_put_contents($mainFullPath, $svgContent);
            }
        }

        // Generate Watermarked Video Preview if it's a video
        if (in_array($mainExtension, ['mp4', 'mov', 'webm'], true)) {
            $watermarkedExt = $mainExtension;
            $watermarkedVideoName = 'preview-watermarked.' . $watermarkedExt;
            $watermarkedVideoFullPath = $uploadDirectory . $watermarkedVideoName;
            $watermarkedVideoDatabasePath = $dbBase . $watermarkedVideoName;

            // Priority 1: Explicit preview_video field (sent when user gives a separate preview video)
            $previewVideoFile = null;
            $hasPreviewVideoField = isset($_FILES['preview_video']) && $_FILES['preview_video']['error'] === UPLOAD_ERR_OK;

            if ($hasPreviewVideoField) {
                $previewExt = strtolower(pathinfo($_FILES['preview_video']['name'], PATHINFO_EXTENSION));
                if (in_array($previewExt, ['mp4', 'mov', 'webm'], true)) {
                    $previewVideoFile = $_FILES['preview_video'];
                    $watermarkedExt = $previewExt;
                    $watermarkedVideoName = 'preview-watermarked.' . $watermarkedExt;
                    $watermarkedVideoFullPath = $uploadDirectory . $watermarkedVideoName;
                    $watermarkedVideoDatabasePath = $dbBase . $watermarkedVideoName;
                }
            }

            // Priority 2: preview_file field (if it's a video)
            if (!$previewVideoFile && $hasPreviewFileUpload) {
                $previewExt = strtolower(pathinfo($_FILES['preview_file']['name'], PATHINFO_EXTENSION));
                if (in_array($previewExt, ['mp4', 'mov', 'webm'], true)) {
                    $previewVideoFile = $_FILES['preview_file'];
                    $watermarkedExt = $previewExt;
                    $watermarkedVideoName = 'preview-watermarked.' . $watermarkedExt;
                    $watermarkedVideoFullPath = $uploadDirectory . $watermarkedVideoName;
                    $watermarkedVideoDatabasePath = $dbBase . $watermarkedVideoName;
                }
            }

            if ($previewVideoFile) {
                // User supplied a custom lower-quality preview video → use it as watermarked preview
                if (!move_uploaded_file($previewVideoFile['tmp_name'], $watermarkedVideoFullPath)) {
                    throw new Exception('Preview video save করা যায়নি (move_uploaded_file failed)। Error: ' . $_FILES['preview_video']['error']);
                }
                $uploadedFiles[] = $watermarkedVideoFullPath;
            } else {
                // No preview video → fallback: copy the main video as the preview
                if (!copy($mainFullPath, $watermarkedVideoFullPath)) {
                     throw new Exception('Main video copy করে preview বানানো যায়নি।');
                }
            }

            $updateStmt = $mysqli->prepare("UPDATE contents SET watermarked_preview_video = ? WHERE id = ?");
            if ($updateStmt) {
                $updateStmt->bind_param("si", $watermarkedVideoDatabasePath, $contentId);
                if (!$updateStmt->execute()) {
                    throw new Exception("Video DB update failed: " . $updateStmt->error);
                }
                $updateStmt->close();
            } else {
                throw new Exception("Video DB update prepare failed: " . $mysqli->error);
            }
        }

        $uploadedFiles[] = $mainFullPath;

        $mainFileSize = filesize($mainFullPath);
        $mainIsMainFile = 1;

        $fileStatement->bind_param(
            'isssiiii',
            $contentId,
            $mainDatabasePath,
            $mainFileName,
            $mainExtension,
            $mainFileSize,
            $width,
            $height,
            $mainIsMainFile
        );

        if (!$fileStatement->execute()) {
            throw new Exception(
                'Main file DB-তে save হয় নাই: ' . $fileStatement->error
            );
        }
    }

    $fileStatement->close();

    /* ===========================
       Insert Secondary Main Files (from main_files[] array)
    =========================== */
    if ($hasMainFilesUpload) {
        $count = count($_FILES['main_files']['tmp_name']);
        
        if ($count > 1) {
            // Re-open statement for secondary files
            $secFileStmt = $mysqli->prepare($fileQuery);
            if ($secFileStmt) {
                // Start from index 1 since index 0 was aliased to main_file
                for ($i = 1; $i < $count; $i++) {
                    if ($_FILES['main_files']['error'][$i] !== UPLOAD_ERR_OK) continue;
                    
                    $secExt = strtolower(pathinfo($_FILES['main_files']['name'][$i], PATHINFO_EXTENSION));
                    $allowedSecondaryExtensions = ['eps', 'svg', 'ai', 'psd', 'zip', 'png', 'jpg', 'jpeg'];
                    if (!in_array($secExt, $allowedSecondaryExtensions, true)) continue;
                    
                    // We use original file name for secondary main files
                    // But if it conflicts with main.ext, we modify it
                    $secOriginalName = basename($_FILES['main_files']['name'][$i]);
                    $secFileName = 'extra_' . $i . '_' . preg_replace('/[^a-zA-Z0-9_\.-]/', '', $secOriginalName);
                    
                    $secFullPath = $finalUploadDirectory . $secFileName;
                    $secDatabasePath = $dbBase . $secFileName;
                    
                    if (move_uploaded_file($_FILES['main_files']['tmp_name'][$i], $secFullPath)) {
                        $uploadedFiles[] = $secFullPath;
                        $secFileSize = filesize($secFullPath);
                        
                        $secFileStmt->bind_param(
                            'isssiiii',
                            $contentId,
                            $secDatabasePath,
                            $secFileName,
                            $secExt,
                            $secFileSize,
                            $width,
                            $height,
                            $mainIsMainFile // usually 1 for secondary main files, since they belong to the main asset bundle
                        );
                        $secFileStmt->execute();
                    }
                }
                $secFileStmt->close();
            }
        }
    }

    /* ===========================
       Tags + Content Tags
    =========================== */
    $tagArray = explode(',', $tagsText);
    $uniqueTags = [];

    foreach ($tagArray as $tag) {
        $tag = strtolower(trim($tag));

        if ($tag !== '' && strlen($tag) >= 2) {
            $uniqueTags[$tag] = $tag;
        }
    }

    $findTagStatement = $mysqli->prepare(
        'SELECT id FROM tags WHERE LOWER(name) = LOWER(?) LIMIT 1'
    );

    $newTagStatement = $mysqli->prepare(
        "INSERT INTO tags (name, slug, status) VALUES (?, ?, 'active')"
    );

    $contentTagStatement = $mysqli->prepare(
        'INSERT IGNORE INTO content_tags (content_id, tag_id) VALUES (?, ?)'
    );

    if (
        !$findTagStatement ||
        !$newTagStatement ||
        !$contentTagStatement
    ) {
        throw new Exception('Tags query error: ' . $mysqli->error);
    }

    foreach ($uniqueTags as $tagName) {
        $findTagStatement->bind_param('s', $tagName);
        $findTagStatement->execute();

        $tagResult = $findTagStatement->get_result();
        $existingTag = $tagResult->fetch_assoc();

        if ($existingTag) {
            $tagId = (int) $existingTag['id'];
        } else {
            $tagDisplayName = ucwords($tagName);
            $tagSlug = createTagSlug($tagName);

            $newTagStatement->bind_param(
                'ss',
                $tagDisplayName,
                $tagSlug
            );

            if (!$newTagStatement->execute()) {
                throw new Exception(
                    'New tag save হয় নাই: ' . $newTagStatement->error
                );
            }

            $tagId = $mysqli->insert_id;
        }

        $contentTagStatement->bind_param(
            'ii',
            $contentId,
            $tagId
        );

        if (!$contentTagStatement->execute()) {
            throw new Exception(
                'Content tag relation save হয় নাই: ' .
                $contentTagStatement->error
            );
        }
    }

    $findTagStatement->close();
    $newTagStatement->close();
    $contentTagStatement->close();

    // --- CLOUDFLARE R2 UPLOAD ---
    // Iterate over all successfully processed files and upload them to R2
    foreach ($uploadedFiles as $localFilePath) {
        if (file_exists($localFilePath)) {
            $fileName = basename($localFilePath);
            $r2Key = 'uploads/contents/' . $contentId . '/' . $fileName;
            
            $mime = mime_content_type($localFilePath);
            if (!$mime) $mime = 'application/octet-stream';
            if (pathinfo($localFilePath, PATHINFO_EXTENSION) === 'svg') $mime = 'image/svg+xml';
            
            $uploadSuccess = R2Helper::uploadFile($localFilePath, $r2Key, $mime);
            
            if ($uploadSuccess) {
                unlink($localFilePath);
            }
        }
    }
    @rmdir($finalUploadDirectory);
    // -----------------------------

    $mysqli->commit();

    // --- Increment Upload Limit Counter ---
    if (isset($limitId)) {
        $newUploadCount = $uploadsThisWeek + 1;
        $updateLimitStmt = $mysqli->prepare("UPDATE author_upload_limits SET uploads_this_week = ?, last_upload_date = NOW() WHERE id = ?");
        $updateLimitStmt->bind_param("ii", $newUploadCount, $limitId);
        $updateLimitStmt->execute();
        $updateLimitStmt->close();
    }
    // --------------------------------------

    sendResponse(true, 'Content uploaded successfully.', [
        'content_id' => $contentId,
        'preview_image' => $previewDatabasePath,
        'author_preview_url' => $authorPreviewDatabasePath,
        'thumbnail_url' => $thumbnailDatabasePath,
        'extracted_title' => $extractedMeta['title'] ?? '',
        'extracted_description' => $extractedMeta['description'] ?? '',
        'extracted_tags' => !empty($extractedMeta['tags']) ? implode(', ', $extractedMeta['tags']) : ''
    ]);

} catch (Throwable $error) {
    try {
        if (isset($mysqli) && $mysqli) {
            $mysqli->rollback();
        }
    } catch (Throwable $rollbackError) {
        // আসল error response-ই ফেরত যাবে
    }

    deleteUploadedFiles($uploadedFiles);

    http_response_code(400);

    // TEMPORARY LOGGING TO SEE THE ERROR
    file_put_contents(__DIR__ . '/error_log.txt', date('Y-m-d H:i:s') . ' - ' . $error->getMessage() . PHP_EOL, FILE_APPEND);

    sendResponse(false, $error->getMessage());
}