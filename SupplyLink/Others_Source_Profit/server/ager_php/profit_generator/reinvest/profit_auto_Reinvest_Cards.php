<?php
require_once __DIR__ . '/../../db.php';
require_once __DIR__ . '/../../cors.php';

header("Content-Type: application/json; charset=UTF-8");

$mysqli->set_charset("utf8mb4");

function apiError($msg,$debug=null){
    echo json_encode([
        "success"=>false,
        "message"=>$msg,
        "debug"=>$debug
    ],JSON_UNESCAPED_UNICODE);
    exit;
}

try{

    $sql = "
        SELECT 
            id,
            main_card_id,
            amount,
            status,
            created_at,
            total_time_weighted_value
        FROM investment_profit_cards
        ORDER BY id ASC
    ";

    $result = $mysqli->query($sql);

    if(!$result){
        apiError("SELECT FAILED",$mysqli->error);
    }

    $data = [];

    while($row = $result->fetch_assoc()){
        $data[] = $row;
    }

    echo json_encode([
        "success"=>true,
        "total"=>count($data),
        "data"=>$data
    ],JSON_UNESCAPED_UNICODE);

}catch(Exception $e){
    apiError("SERVER ERROR",$e->getMessage());
}
