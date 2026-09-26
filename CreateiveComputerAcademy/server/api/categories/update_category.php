<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once 'category_helper.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    echo json_encode(["status" => "error", "message" => "Database connection error."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id) || empty($data->id)) {
    echo json_encode(["status" => "error", "message" => "Category ID is required."]);
    exit;
}

try {
    $id = (int)$data->id;
    $name = isset($data->name) ? trim($data->name) : null;
    $icon = isset($data->icon) ? trim($data->icon) : null;
    $color = isset($data->color) ? trim($data->color) : null;
    $status = isset($data->status) ? trim($data->status) : 'active';
    $estimated_minutes = isset($data->estimated_minutes) ? (int)$data->estimated_minutes : null;
    $has_credit = array_key_exists('credit', (array)$data);
    $credit = null;
    if ($has_credit) {
        if ($data->credit !== null && $data->credit !== '' && (int)$data->credit > 0) {
            $credit = (int)$data->credit;
        } else {
            $credit = null;
        }
    }

    $checklists = null;
    if (isset($data->checklists) && is_array($data->checklists)) {
        $checklists = json_encode(array_values(array_filter($data->checklists)), JSON_UNESCAPED_UNICODE);
    }

    $specs = null;
    if (isset($data->specs) && is_array($data->specs)) {
        $specs = json_encode($data->specs, JSON_UNESCAPED_UNICODE);
    }

    $query = "UPDATE task_categories SET 
                name = COALESCE(:name, name),
                icon = COALESCE(:icon, icon),
                color = COALESCE(:color, color),
                credit = CASE WHEN :has_credit = 1 THEN :credit ELSE credit END,
                status = :status,
                default_checklists = CASE WHEN :has_checklists = 1 THEN :checklists ELSE default_checklists END,
                default_specs = CASE WHEN :has_specs = 1 THEN :specs ELSE default_specs END,
                estimated_minutes = COALESCE(:est_min, estimated_minutes),
                updated_at = NOW()
              WHERE id = :id";

    $stmt = $db->prepare($query);
    $stmt->execute([
        ':name' => $name,
        ':icon' => $icon,
        ':color' => $color,
        ':has_credit' => $has_credit ? 1 : 0,
        ':credit' => $credit,
        ':status' => $status,
        ':has_checklists' => isset($data->checklists) ? 1 : 0,
        ':checklists' => $checklists,
        ':has_specs' => isset($data->specs) ? 1 : 0,
        ':specs' => $specs,
        ':est_min' => $estimated_minutes,
        ':id' => $id
    ]);

    // If cascade_credit is true, apply this credit to all child categories under this subcategory
    if (!empty($data->cascade_credit) && $credit !== null) {
        $stmtCascade = $db->prepare("UPDATE task_categories SET credit = :credit, updated_at = NOW() WHERE parent_id = :id");
        $stmtCascade->execute([':credit' => $credit, ':id' => $id]);
    }

    echo json_encode(["status" => "success", "message" => "Category updated successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
