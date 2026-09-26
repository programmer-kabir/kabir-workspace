<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

$input = json_decode(file_get_contents("php://input"), true);
$action = $input['action'] ?? $_GET['action'] ?? 'get';
$task_id = $input['task_id'] ?? $_GET['task_id'] ?? null;

if (!$task_id) {
    echo json_encode(["status" => "error", "message" => "task_id is required."]);
    exit();
}

try {
    if ($action === 'get') {
        $stmt = $db->prepare("SELECT * FROM task_blueprint_variants WHERE task_id = :task_id ORDER BY is_active DESC, id ASC");
        $stmt->execute([':task_id' => $task_id]);
        $variants = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $parsedVariants = array_map(function($v) {
            $v['blueprint_data'] = !empty($v['blueprint_json']) ? json_decode($v['blueprint_json'], true) : null;
            $v['is_active'] = (int)$v['is_active'] === 1;
            return $v;
        }, $variants);

        echo json_encode([
            "status" => "success",
            "task_id" => (int)$task_id,
            "variants" => $parsedVariants
        ]);
        exit();
    }

    if ($action === 'save') {
        $variant_id = !empty($input['id']) ? (int)$input['id'] : null;
        $variant_name = !empty($input['variant_name']) ? trim($input['variant_name']) : 'Variant 1';
        $ai_model_used = !empty($input['ai_model_used']) ? trim($input['ai_model_used']) : null;
        $is_active = !empty($input['is_active']) ? 1 : 0;
        
        $raw_blueprint = $input['blueprint_json'] ?? $input['blueprint_data'] ?? null;
        $blueprint_json_str = is_array($raw_blueprint) ? json_encode($raw_blueprint) : (string)$raw_blueprint;

        if (empty($blueprint_json_str)) {
            echo json_encode(["status" => "error", "message" => "Blueprint data is required."]);
            exit();
        }

        if ($is_active === 1) {
            $db->prepare("UPDATE task_blueprint_variants SET is_active = 0 WHERE task_id = :task_id")->execute([':task_id' => $task_id]);
        }

        if ($variant_id) {
            $stmt = $db->prepare("UPDATE task_blueprint_variants SET 
                variant_name = :variant_name, 
                ai_model_used = :ai_model_used, 
                is_active = :is_active, 
                blueprint_json = :blueprint_json 
                WHERE id = :id AND task_id = :task_id");
            $stmt->execute([
                ':variant_name' => $variant_name,
                ':ai_model_used' => $ai_model_used,
                ':is_active' => $is_active,
                ':blueprint_json' => $blueprint_json_str,
                ':id' => $variant_id,
                ':task_id' => $task_id
            ]);
            $saved_id = $variant_id;
        } else {
            // If it's the only variant for this task, force is_active = 1
            $countStmt = $db->prepare("SELECT COUNT(*) FROM task_blueprint_variants WHERE task_id = :task_id");
            $countStmt->execute([':task_id' => $task_id]);
            if ((int)$countStmt->fetchColumn() === 0) {
                $is_active = 1;
            }

            $stmt = $db->prepare("INSERT INTO task_blueprint_variants (task_id, variant_name, ai_model_used, is_active, blueprint_json) 
                VALUES (:task_id, :variant_name, :ai_model_used, :is_active, :blueprint_json)");
            $stmt->execute([
                ':task_id' => $task_id,
                ':variant_name' => $variant_name,
                ':ai_model_used' => $ai_model_used,
                ':is_active' => $is_active,
                ':blueprint_json' => $blueprint_json_str
            ]);
            $saved_id = $db->lastInsertId();
        }

        // Keep main tasks table creation_mode updated
        if ($is_active === 1) {
            try {
                $db->prepare("UPDATE tasks SET creation_mode = 'agentic' WHERE id = :task_id")
                   ->execute([':task_id' => $task_id]);
            } catch (Exception $e) {}
        }

        echo json_encode([
            "status" => "success",
            "message" => "Blueprint variant saved successfully.",
            "variant_id" => (int)$saved_id
        ]);
        exit();
    }

    if ($action === 'set_active') {
        $variant_id = !empty($input['variant_id']) ? (int)$input['variant_id'] : null;
        if (!$variant_id) {
            echo json_encode(["status" => "error", "message" => "variant_id is required."]);
            exit();
        }

        $db->prepare("UPDATE task_blueprint_variants SET is_active = 0 WHERE task_id = :task_id")->execute([':task_id' => $task_id]);
        $upd = $db->prepare("UPDATE task_blueprint_variants SET is_active = 1 WHERE id = :id AND task_id = :task_id");
        $upd->execute([':id' => $variant_id, ':task_id' => $task_id]);

        try {
            $db->prepare("UPDATE tasks SET creation_mode = 'agentic' WHERE id = :task_id")
               ->execute([':task_id' => $task_id]);
        } catch (Exception $e) {}

        echo json_encode([
            "status" => "success",
            "message" => "Active variant updated successfully."
        ]);
        exit();
    }

    if ($action === 'delete') {
        $variant_id = !empty($input['variant_id']) ? (int)$input['variant_id'] : null;
        if (!$variant_id) {
            echo json_encode(["status" => "error", "message" => "variant_id is required."]);
            exit();
        }

        // Check if deleted variant was active
        $chk = $db->prepare("SELECT is_active FROM task_blueprint_variants WHERE id = :id AND task_id = :task_id");
        $chk->execute([':id' => $variant_id, ':task_id' => $task_id]);
        $was_active = (int)$chk->fetchColumn() === 1;

        $db->prepare("DELETE FROM task_blueprint_variants WHERE id = :id AND task_id = :task_id")->execute([':id' => $variant_id, ':task_id' => $task_id]);

        // If it was active, activate the next available variant
        if ($was_active) {
            $next = $db->prepare("SELECT id, blueprint_json FROM task_blueprint_variants WHERE task_id = :task_id ORDER BY id ASC LIMIT 1");
            $next->execute([':task_id' => $task_id]);
            if ($nextRow = $next->fetch(PDO::FETCH_ASSOC)) {
                $db->prepare("UPDATE task_blueprint_variants SET is_active = 1 WHERE id = :id")->execute([':id' => $nextRow['id']]);
            }
        }

        echo json_encode([
            "status" => "success",
            "message" => "Variant deleted successfully."
        ]);
        exit();
    }

    if ($action === 'save_batch') {
        $variants = $input['variants'] ?? [];
        if (!is_array($variants)) $variants = [];

        // Delete existing variants and re-insert batch cleanly
        $db->prepare("DELETE FROM task_blueprint_variants WHERE task_id = :task_id")->execute([':task_id' => $task_id]);

        $active_bdata = null;
        $ins = $db->prepare("INSERT INTO task_blueprint_variants (task_id, variant_name, ai_model_used, is_active, blueprint_json) 
            VALUES (:task_id, :variant_name, :ai_model_used, :is_active, :blueprint_json)");

        $hasActive = false;
        foreach ($variants as $v) {
            if (!empty($v['is_active'])) {
                $hasActive = true;
                break;
            }
        }

        foreach ($variants as $idx => $v) {
            $v_name = !empty($v['variant_name']) ? trim($v['variant_name']) : ('Variant ' . ($idx + 1));
            $v_model = !empty($v['ai_model_used']) ? trim($v['ai_model_used']) : null;
            $v_active = (!empty($v['is_active']) || (!$hasActive && $idx === 0)) ? 1 : 0;
            
            $raw_b = $v['blueprint_data'] ?? $v['blueprint_json'] ?? null;
            $v_json = is_array($raw_b) ? json_encode($raw_b) : (string)$raw_b;

            if (!empty($v_json)) {
                $ins->execute([
                    ':task_id' => $task_id,
                    ':variant_name' => $v_name,
                    ':ai_model_used' => $v_model,
                    ':is_active' => $v_active,
                    ':blueprint_json' => $v_json
                ]);
                if ($v_active === 1) {
                    $active_bdata = $v_json;
                }
            }
        }

        if ($active_bdata) {
            try {
                $db->prepare("UPDATE tasks SET creation_mode = 'agentic' WHERE id = :task_id")
                   ->execute([':task_id' => $task_id]);
            } catch (Exception $e) {}
        }

        echo json_encode([
            "status" => "success",
            "message" => "All blueprint variants saved successfully."
        ]);
        exit();
    }

    echo json_encode(["status" => "error", "message" => "Invalid action requested."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
