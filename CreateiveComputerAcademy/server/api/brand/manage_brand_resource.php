<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../config/R2Client.php';

header("Content-Type: application/json; charset=UTF-8");

date_default_timezone_set('Asia/Dhaka');

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit();
}

// Auto-migrate schema if created_by / approval_status columns are missing
try {
    $colCheck = $db->query("SHOW COLUMNS FROM `cca_brand_resources` LIKE 'approval_status'")->fetch();
    if (!$colCheck) {
        $db->exec("ALTER TABLE `cca_brand_resources` 
            ADD COLUMN `created_by` VARCHAR(100) NULL DEFAULT 'Admin' AFTER `is_active`,
            ADD COLUMN `created_by_role` VARCHAR(50) NULL DEFAULT 'admin' AFTER `created_by`,
            ADD COLUMN `approval_status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved' AFTER `created_by_role`");
    }
} catch (Exception $e) {
    // Ignore if already altered
}

$input = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$action = $input['action'] ?? $_GET['action'] ?? '';

// Check file upload action
if ($action === 'upload_asset' || (!empty($_FILES) && $action === 'create_with_file')) {
    if (empty($_FILES['file'])) {
        echo json_encode(["status" => "error", "message" => "No file uploaded."]);
        exit();
    }

    $file = $_FILES['file'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(["status" => "error", "message" => "File upload error code: " . $file['error']]);
        exit();
    }

    $originalName = $file['name'];
    $ext = pathinfo($originalName, PATHINFO_EXTENSION);
    $safeName = 'cca_brand_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;

    // Try Cloudflare R2 first
    try {
        $r2 = new R2Client();
        $r2Key = 'brand-assets/' . $safeName;
        $mime = $file['type'] ?: 'application/octet-stream';
        $r2Result = $r2->uploadFile($file['tmp_name'], $r2Key, $mime);

        if (!empty($r2Result['success']) && !empty($r2Result['url'])) {
            $fileUrl = $r2Result['url'];
        } else {
            // Local fallback
            $uploadDir = __DIR__ . '/../../uploads/brand/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $targetPath = $uploadDir . $safeName;
            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                $fileUrl = '/uploads/brand/' . $safeName;
            } else {
                throw new Exception("Local fallback upload failed.");
            }
        }
    } catch (Exception $e) {
        // Fallback to local
        $uploadDir = __DIR__ . '/../../uploads/brand/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $targetPath = $uploadDir . $safeName;
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $fileUrl = '/uploads/brand/' . $safeName;
        } else {
            echo json_encode(["status" => "error", "message" => "Upload failed: " . $e->getMessage()]);
            exit();
        }
    }

    if ($action === 'upload_asset') {
        echo json_encode([
            "status" => "success",
            "url" => $fileUrl,
            "filename" => $originalName,
            "format" => strtoupper($ext)
        ]);
        exit();
    }

    // If create_with_file, attach to value
    $input['value'] = $fileUrl;
    $input['preview_url'] = in_array(strtolower($ext), ['png', 'jpg', 'jpeg', 'webp', 'svg']) ? $fileUrl : ($input['preview_url'] ?? null);
    $action = 'create';
}

switch ($action) {
    case 'create':
        $category = trim($input['category'] ?? '');
        $title = trim($input['title'] ?? '');
        $value = trim($input['value'] ?? '');
        $subtitle = trim($input['subtitle'] ?? '');
        $previewUrl = trim($input['preview_url'] ?? '');
        $formatTag = trim($input['format_tag'] ?? '');
        $sortOrder = intval($input['sort_order'] ?? 0);
        $isActive = isset($input['is_active']) ? intval($input['is_active']) : 1;

        $createdBy = trim($input['created_by'] ?? 'Admin');
        $createdByRole = strtolower(trim($input['created_by_role'] ?? 'admin'));

        // Reviewer submissions require Admin approval!
        if ($createdByRole === 'reviewer') {
            $approvalStatus = 'pending';
        } else {
            $approvalStatus = trim($input['approval_status'] ?? 'approved');
        }

        if (!$category || !$title || !$value) {
            echo json_encode(["status" => "error", "message" => "Category, Title, and Value are required"]);
            exit();
        }

        $now = date('Y-m-d H:i:s');

        try {
            $stmt = $db->prepare("INSERT INTO `cca_brand_resources` 
                (`category`, `title`, `value`, `subtitle`, `preview_url`, `format_tag`, `sort_order`, `is_active`, `created_by`, `created_by_role`, `approval_status`, `created_at`, `updated_at`) 
                VALUES (:category, :title, :value, :subtitle, :preview_url, :format_tag, :sort_order, :is_active, :created_by, :created_by_role, :approval_status, :created_at, :updated_at)");

            $stmt->execute([
                ':category' => $category,
                ':title' => $title,
                ':value' => $value,
                ':subtitle' => $subtitle ?: null,
                ':preview_url' => $previewUrl ?: null,
                ':format_tag' => $formatTag ?: null,
                ':sort_order' => $sortOrder,
                ':is_active' => $isActive,
                ':created_by' => $createdBy,
                ':created_by_role' => $createdByRole,
                ':approval_status' => $approvalStatus,
                ':created_at' => $now,
                ':updated_at' => $now
            ]);

            $newId = $db->lastInsertId();

            echo json_encode([
                "status" => "success",
                "message" => $approvalStatus === 'pending' ? "Brand resource submitted for Admin approval" : "Brand resource created successfully",
                "id" => $newId,
                "approval_status" => $approvalStatus,
                "created_at" => $now,
                "updated_at" => $now
            ]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Create failed: " . $e->getMessage()]);
        }
        break;

    case 'update_approval':
        $id = intval($input['id'] ?? 0);
        $approvalStatus = trim($input['approval_status'] ?? '');
        if (!$id || !in_array($approvalStatus, ['pending', 'approved', 'rejected'])) {
            echo json_encode(["status" => "error", "message" => "Valid resource ID and approval status ('pending', 'approved', 'rejected') are required"]);
            exit();
        }

        $now = date('Y-m-d H:i:s');
        try {
            $stmt = $db->prepare("UPDATE `cca_brand_resources` SET `approval_status` = :approval_status, `updated_at` = :updated_at WHERE `id` = :id");
            $stmt->execute([
                ':approval_status' => $approvalStatus,
                ':updated_at' => $now,
                ':id' => $id
            ]);

            echo json_encode([
                "status" => "success",
                "message" => "Resource marked as " . ucfirst($approvalStatus),
                "approval_status" => $approvalStatus,
                "updated_at" => $now
            ]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Approval update failed: " . $e->getMessage()]);
        }
        break;

    case 'update':
        $id = intval($input['id'] ?? 0);
        if (!$id) {
            echo json_encode(["status" => "error", "message" => "ID is required for update."]);
            exit();
        }

        $category = trim($input['category'] ?? '');
        $title = trim($input['title'] ?? '');
        $value = trim($input['value'] ?? '');
        $subtitle = trim($input['subtitle'] ?? '');
        $previewUrl = trim($input['preview_url'] ?? '');
        $formatTag = trim($input['format_tag'] ?? '');
        $sortOrder = intval($input['sort_order'] ?? 0);
        $isActive = isset($input['is_active']) ? intval($input['is_active']) : 1;
        $approvalStatus = trim($input['approval_status'] ?? 'approved');

        if (!$category || !$title || !$value) {
            echo json_encode(["status" => "error", "message" => "Category, Title, and Value are required."]);
            exit();
        }

        $now = date('Y-m-d H:i:s');

        try {
            $stmt = $db->prepare("UPDATE `cca_brand_resources` SET 
                `category` = :category,
                `title` = :title,
                `value` = :value,
                `subtitle` = :subtitle,
                `preview_url` = :preview_url,
                `format_tag` = :format_tag,
                `sort_order` = :sort_order,
                `is_active` = :is_active,
                `approval_status` = :approval_status,
                `updated_at` = :updated_at
                WHERE `id` = :id");

            $stmt->execute([
                ':category' => $category,
                ':title' => $title,
                ':value' => $value,
                ':subtitle' => $subtitle ?: null,
                ':preview_url' => $previewUrl ?: null,
                ':format_tag' => $formatTag ?: null,
                ':sort_order' => $sortOrder,
                ':is_active' => $isActive,
                ':approval_status' => $approvalStatus,
                ':updated_at' => $now,
                ':id' => $id
            ]);

            echo json_encode([
                "status" => "success",
                "message" => "Brand resource updated successfully",
                "updated_at" => $now
            ]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Update failed: " . $e->getMessage()]);
        }
        break;

    case 'delete':
        $id = intval($input['id'] ?? 0);
        if (!$id) {
            echo json_encode(["status" => "error", "message" => "Resource ID is required for deletion."]);
            exit();
        }

        try {
            $stmt = $db->prepare("DELETE FROM `cca_brand_resources` WHERE `id` = :id");
            $stmt->execute([':id' => $id]);

            echo json_encode([
                "status" => "success",
                "message" => "Resource deleted successfully"
            ]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Delete failed: " . $e->getMessage()]);
        }
        break;

    case 'toggle_status':
        $id = intval($input['id'] ?? 0);
        if (!$id) {
            echo json_encode(["status" => "error", "message" => "ID is required"]);
            exit();
        }

        $now = date('Y-m-d H:i:s');

        try {
            $stmt = $db->prepare("UPDATE `cca_brand_resources` SET `is_active` = NOT `is_active`, `updated_at` = :updated_at WHERE `id` = :id");
            $stmt->execute([
                ':updated_at' => $now,
                ':id' => $id
            ]);

            echo json_encode([
                "status" => "success",
                "message" => "Status toggled successfully",
                "updated_at" => $now
            ]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Toggle failed: " . $e->getMessage()]);
        }
        break;

    case 'bulk_create':
        $items = $input['items'] ?? [];
        if (empty($items) || !is_array($items)) {
            echo json_encode(["status" => "error", "message" => "No items provided for bulk creation."]);
            exit();
        }

        $now = date('Y-m-d H:i:s');
        $insertedCount = 0;

        try {
            $db->beginTransaction();
            $stmt = $db->prepare("INSERT INTO `cca_brand_resources` 
                (`category`, `title`, `value`, `subtitle`, `preview_url`, `format_tag`, `sort_order`, `is_active`, `created_at`, `updated_at`) 
                VALUES (:category, :title, :value, :subtitle, :preview_url, :format_tag, :sort_order, :is_active, :created_at, :updated_at)");

            foreach ($items as $idx => $it) {
                $category = trim($it['category'] ?? 'color');
                $title = trim($it['title'] ?? '');
                $value = trim($it['value'] ?? '');
                $subtitle = trim($it['subtitle'] ?? '');
                $previewUrl = trim($it['preview_url'] ?? '');
                $formatTag = trim($it['format_tag'] ?? '');
                $sortOrder = isset($it['sort_order']) ? intval($it['sort_order']) : ($idx + 1);
                $isActive = isset($it['is_active']) ? intval($it['is_active']) : 1;

                if (!$category || !$title || !$value) {
                    continue;
                }

                $stmt->execute([
                    ':category' => $category,
                    ':title' => $title,
                    ':value' => $value,
                    ':subtitle' => $subtitle ?: null,
                    ':preview_url' => $previewUrl ?: null,
                    ':format_tag' => $formatTag ?: null,
                    ':sort_order' => $sortOrder,
                    ':is_active' => $isActive,
                    ':created_at' => $now,
                    ':updated_at' => $now
                ]);
                $insertedCount++;
            }

            $db->commit();

            echo json_encode([
                "status" => "success",
                "message" => "Successfully created {$insertedCount} resources",
                "count" => $insertedCount
            ]);
        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            echo json_encode(["status" => "error", "message" => "Bulk create failed: " . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Invalid action specified."]);
        break;
}
?>
