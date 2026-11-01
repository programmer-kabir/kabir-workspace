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

$input=json_decode(file_get_contents("php://input"),true);

$rows=$input['rows'] ?? [];

if(empty($rows)){
    apiError("No rows from client",$input);
}

$ids=[];

foreach($rows as $r){
    $ids[]=(int)$r['id'];
}

$idList=implode(",",$ids);

$mysqli->begin_transaction();

try{

    // 🔥 DIRECT SELECT (NO JOIN)
    $sql="
        SELECT id,card_id,profit_amount,status
        FROM profit_generator
        WHERE status='pending'
        AND id IN ($idList)
    ";

    $result=$mysqli->query($sql);

    if(!$result){
        apiError("SELECT FAILED",$mysqli->error);
    }

    // 🔥 INSERT
    $insert=$mysqli->prepare("
        INSERT INTO investment_profit_installments
        (
            profit_card_id,
            amount,
            investment_date,
            active_days,
            time_weighted_value,
            note,
            created_at
        )
        VALUES (?, ?, ?, 0, 0, 'Auto Reinvest', NOW())
    ");

    // 🔥 UPDATE
    $update=$mysqli->prepare("
        UPDATE profit_generator
        SET status='reinvest',action_date=NOW()
        WHERE id=?
    ");

    $processed=0;
    $debug=[];

    while($row=$result->fetch_assoc()){

        $debug[]=$row;

        $pg_id=(int)$row['id'];
        $profit_card_id=(int)$row['card_id']; // 🔥 DIRECT card_id use
        $amount=(float)$row['profit_amount'];
        $date=date('Y-m-d');

        $insert->bind_param("ids",$profit_card_id,$amount,$date);

        if(!$insert->execute()){
            apiError("INSERT FAILED",$insert->error);
        }

        $update->bind_param("i",$pg_id);

        if(!$update->execute()){
            apiError("UPDATE FAILED",$update->error);
        }

        $processed++;
    }

    $mysqli->commit();

    echo json_encode([
        "success"=>true,
        "processed"=>$processed,
        "debug"=>$debug
    ]);

}catch(Exception $e){

    $mysqli->rollback();
    apiError("TRANSACTION FAILED",$e->getMessage());
}
