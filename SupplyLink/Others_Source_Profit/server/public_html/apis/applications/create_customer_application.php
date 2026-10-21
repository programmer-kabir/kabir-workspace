<?php
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../utils/upload_image_webp.php';

header("Content-Type: application/json; charset=UTF-8");

ini_set('display_errors', 0);
error_reporting(0);

function jsonFail($msg) {
  echo json_encode(["success" => false, "message" => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}

try {
  $application_card = $_POST['application_card'] ?? '';
  if (!in_array($application_card, ['green','yellow','red','shop'])) {
    jsonFail("Invalid application card");
  }

  // ⚠️ created_by DB-তে varchar(20) => string রাখো
  $created_by = $_POST['created_by'] ?? '';
  $created_by = ($created_by === '') ? '' : (string)$created_by;

  $customer_name    = trim($_POST['customer_name'] ?? '');
  $customer_phone   = trim($_POST['customer_phone'] ?? '');
  $customer_address = trim($_POST['customer_address'] ?? '');

  $guarantor_name    = trim($_POST['guarantor_name'] ?? '');
  $guarantor_phone   = trim($_POST['guarantor_phone'] ?? '');
  $guarantor_address = trim($_POST['guarantor_address'] ?? '');

  $product_name = trim($_POST['product_name'] ?? '');
  $mrp          = (float)($_POST['mrp'] ?? 0);
  $sales_price  = (float)($_POST['sales_price'] ?? 0);
  $down_payment = (float)($_POST['down_payment'] ?? 0);
  $installments = (int)($_POST['installments'] ?? 0);
  $request_date = trim($_POST['request_date'] ?? '');

  if (
    $customer_name==='' || $customer_phone==='' || $customer_address==='' ||
    $guarantor_name==='' || $guarantor_phone==='' || $guarantor_address==='' ||
    $product_name==='' || $request_date===''
  ) jsonFail("Missing required fields");

  if ($mrp <= 0 || $sales_price <= 0) jsonFail("Invalid price");
  if ($sales_price > $mrp) jsonFail("Sales price cannot be greater than MRP");
  if ($installments <= 0) jsonFail("Installments must be >= 1");

  $green_note  = $_POST['green_note']  ?? null;
  $yellow_note = $_POST['yellow_note'] ?? null;
  $red_note    = $_POST['red_note']    ?? null;
  $shop_note   = $_POST['shop_note']   ?? null;

  // required images
  $customer_photo     = upload_image_as_webp("customer_photo", "customer_photo");
  $customer_nid_front = upload_image_as_webp("customer_nid_front", "customer_nid_front");
  $customer_nid_back  = upload_image_as_webp("customer_nid_back", "customer_nid_back");

  $guarantor_photo     = upload_image_as_webp("guarantor_photo", "guarantor_photo");
  $guarantor_nid_front = upload_image_as_webp("guarantor_nid_front", "guarantor_nid_front");
  $guarantor_nid_back  = upload_image_as_webp("guarantor_nid_back", "guarantor_nid_back");

  if (
    !$customer_photo || !$customer_nid_front || !$customer_nid_back ||
    !$guarantor_photo || !$guarantor_nid_front || !$guarantor_nid_back
  ) jsonFail("All required images must be uploaded");

  // bank docs conditional (red/shop required)
  $bankRequired = ($application_card === "red" || $application_card === "shop");

  $customer_bank_check = null;
  $customer_bank_statement = null;

  if (isset($_FILES['customer_bank_check']) && $_FILES['customer_bank_check']['error'] !== UPLOAD_ERR_NO_FILE) {
    $customer_bank_check = upload_image_as_webp("customer_bank_check", "customer_bank_check");
  }
  if (isset($_FILES['customer_bank_statement']) && $_FILES['customer_bank_statement']['error'] !== UPLOAD_ERR_NO_FILE) {
    $customer_bank_statement = upload_image_as_webp("customer_bank_statement", "customer_bank_statement");
  }

  if ($bankRequired) {
    if (!$customer_bank_check) jsonFail("Bank check is required for Red / Shop card");
    if (!$customer_bank_statement) jsonFail("Bank statement is required for Red / Shop card");
  }

  // ✅ FIXED INSERT
  $sql = "
    INSERT INTO customer_applications (
      application_card,

      customer_name, customer_phone, customer_address,
      customer_nid_front, customer_nid_back, customer_photo,
      customer_bank_check, customer_bank_statement,

      guarantor_name, guarantor_phone, guarantor_address,
      guarantor_nid_front, guarantor_nid_back, guarantor_photo,

      product_name, mrp, sales_price, down_payment, installments, request_date,

      green_note, yellow_note, red_note, shop_note,

      created_by,
      status,
      created_at
    ) VALUES (
      ?, ?,?,?, ?,?,?, ?,?,
      ?,?,?, ?,?,?,
      ?, ?,?,?,?, ?,
      ?,?,?,?,
      ?,
      'pending',
      NOW()
    )
  ";

  $stmt = $mysqli->prepare($sql);
  if (!$stmt) jsonFail("SQL prepare failed: " . $mysqli->error);

  // ✅ types = 25 params (খেয়াল করো: product part এ আমরা 6টা দিচ্ছি, created_by 1, notes 4)
  // total placeholders = 1 + 8 + 6 + 6 + 4 + 1 = 26  ✅
  $types = "s" . str_repeat("s", 8) . str_repeat("s", 6) . "sdddis" . str_repeat("s", 4) . "s";

  $stmt->bind_param(
    $types,
    $application_card,

    $customer_name, $customer_phone, $customer_address,
    $customer_nid_front, $customer_nid_back, $customer_photo,
    $customer_bank_check, $customer_bank_statement,

    $guarantor_name, $guarantor_phone, $guarantor_address,
    $guarantor_nid_front, $guarantor_nid_back, $guarantor_photo,

    $product_name, $mrp, $sales_price, $down_payment, $installments, $request_date,

    $green_note, $yellow_note, $red_note, $shop_note,

    $created_by
  );

  if (!$stmt->execute()) {
    jsonFail("DB insert failed: " . $stmt->error);
  }

  echo json_encode([
    "success" => true,
    "message" => "Application submitted successfully",
    "application_id" => $stmt->insert_id
  ], JSON_UNESCAPED_UNICODE);
  exit;

} catch (Exception $e) {
  jsonFail($e->getMessage());
}
