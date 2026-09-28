<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';


$title = 'Refund Policy';
$slug = 'refund-policy';
$content_format = 'markdown';
$status = 'published';

$content = <<<EOT
# DayalStock Refund Policy

**Last Updated:** August 3, 2026

At DayalStock, we provide digital products such as stock photos, vectors, illustrations, PSD files, AI files, SVG files, videos, and other downloadable creative assets. Because these products are delivered instantly and cannot be returned once accessed, our refund policy is different from that of physical products.

## 1. General Policy

All purchases are considered final. Once a digital asset has been downloaded or accessed, it is generally **not eligible for a refund**.

## 2. When You May Be Eligible for a Refund

A refund request may be approved if any of the following applies:

* Your payment was processed more than once for the same order.
* You were charged but the order was not completed and no download access was provided.
* The downloaded file is permanently corrupted or technically unusable, and our support team cannot provide a working replacement within a reasonable time.
* You received a file that is significantly different from the product description due to an internal error.
* A billing or payment processing error occurred on our side.

## 3. When Refunds Will Not Be Granted

Refunds will generally not be issued if:

* The file has already been downloaded successfully.
* You purchased the wrong file by mistake.
* You changed your mind after purchase.
* The asset does not meet your personal preference or project requirements.
* You no longer need the asset.
* You do not have compatible software to open or edit the file.
* You violated our Terms of Service or License Agreement.

## 4. Subscription Refunds

Subscription fees are generally non-refundable after the subscription period has started.

If a subscription is canceled, it will remain active until the end of the current billing period. No partial refunds will be provided unless required by applicable law.

## 5. Chargebacks

If you initiate a payment dispute or chargeback without first contacting our support team, we reserve the right to suspend or permanently restrict access to your DayalStock account while the dispute is being investigated.

## 6. Refund Request Process

To request a refund, please contact our support team within **7 days** of the purchase.

Please include:

* Order ID
* Registered email address
* Payment method
* Reason for the request
* Screenshots or supporting evidence (if applicable)

Our team will review your request and usually respond within **3–7 business days**.

## 7. Refund Method

If approved, refunds will be issued through the original payment method whenever possible.

Processing time depends on your payment provider and may take **5–15 business days** after approval.

## 8. Contact Us

If you have any questions regarding this Refund Policy, please contact our support team through the Contact page available on DayalStock.

By purchasing or downloading content from DayalStock, you acknowledge that you have read, understood, and agreed to this Refund Policy.
EOT;

// Check if it already exists
$stmt = $mysqli->prepare("SELECT id FROM dynamic_pages WHERE slug = ?");
$stmt->bind_param("s", $slug);
$stmt->execute();
$res = $stmt->get_result();

if ($row = $res->fetch_assoc()) {
    // Update
    $stmt2 = $mysqli->prepare("UPDATE dynamic_pages SET title=?, content_format=?, content=?, status=?, updated_at=NOW() WHERE id=?");
    $stmt2->bind_param("ssssi", $title, $content_format, $content, $status, $row['id']);
    $stmt2->execute();
    echo "Refund Policy updated successfully.\n";
} else {
    // Insert
    $stmt2 = $mysqli->prepare("INSERT INTO dynamic_pages (title, slug, content_format, content, status) VALUES (?, ?, ?, ?, ?)");
    $stmt2->bind_param("sssss", $title, $slug, $content_format, $content, $status);
    $stmt2->execute();
    echo "Refund Policy inserted successfully.\n";
}
$mysqli->close();
?>
