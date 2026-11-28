<?php
declare(strict_types=1);

namespace SunamShop\Controllers;

use SunamShop\Core\Database;
use SunamShop\Core\Request;
use SunamShop\Core\Response;

final class ProductController
{
    public function index(Request $request): void
    {
        $db = Database::getConnection();

        $categoryId = $request->getQuery('category_id');
        $search = $request->getQuery('search');
        $sourcingType = $request->getQuery('sourcing_type');
        $page = max(1, (int)$request->getQuery('page', 1));
        $limit = min(50, max(1, (int)$request->getQuery('limit', 20)));
        $offset = ($page - 1) * $limit;

        $conditions = ['p.deleted_at IS NULL'];
        $params = [];

        if (!empty($categoryId)) {
            $conditions[] = 'p.category_id = ?';
            $params[] = (int)$categoryId;
        }

        if (!empty($sourcingType)) {
            $conditions[] = 'p.sourcing_type = ?';
            $params[] = $sourcingType;
        }

        if (!empty($search)) {
            $conditions[] = '(p.name_bn LIKE ? OR p.name_en LIKE ? OR p.description_bn LIKE ?)';
            $searchTerm = '%' . $search . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $whereClause = implode(' AND ', $conditions);

        // Count total
        $countStmt = $db->prepare("SELECT COUNT(*) FROM products p WHERE $whereClause");
        $countStmt->execute($params);
        $totalItems = (int)$countStmt->fetchColumn();

        // Fetch paginated products
        $sql = "SELECT p.id, p.category_id, c.name_bn as category_name_bn, c.name_en as category_name_en,
                       p.name_bn, p.name_en, p.slug, p.sku, p.unit, p.selling_price, p.discount_price,
                       p.stock_quantity, p.sourcing_type, p.is_variable_weight, p.weight_tolerance_percentage,
                       p.availability_status, p.is_featured,
                       (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
                FROM products p
                JOIN categories c ON p.category_id = c.id
                WHERE $whereClause
                ORDER BY p.is_featured DESC, p.id DESC
                LIMIT $limit OFFSET $offset";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll();

        Response::success($products, 'Products retrieved successfully.', 200, [
            'pagination' => [
                'current_page' => $page,
                'limit'        => $limit,
                'total_items'  => $totalItems,
                'total_pages'  => (int)ceil($totalItems / $limit),
            ],
        ]);
    }

    public function show(Request $request, array $params): void
    {
        $slug = $params['slug'] ?? '';
        if (empty($slug)) {
            Response::notFound('Product slug not specified.');
            return;
        }

        $db = Database::getConnection();
        $stmt = $db->prepare(
            'SELECT p.*, c.name_bn as category_name_bn, c.name_en as category_name_en 
             FROM products p
             JOIN categories c ON p.category_id = c.id
             WHERE p.slug = ? AND p.deleted_at IS NULL
             LIMIT 1'
        );
        $stmt->execute([$slug]);
        $product = $stmt->fetch();

        if (!$product) {
            Response::notFound('Product not found.');
            return;
        }

        // Get gallery images
        $imgStmt = $db->prepare('SELECT id, image_url, alt_text_bn, alt_text_en, is_primary FROM product_images WHERE product_id = ? ORDER BY display_order ASC');
        $imgStmt->execute([$product['id']]);
        $product['images'] = $imgStmt->fetchAll();

        // Get variants if any
        $varStmt = $db->prepare('SELECT id, variant_name_bn, variant_name_en, sku, unit_value, unit, price, discount_price FROM product_variants WHERE product_id = ?');
        $varStmt->execute([$product['id']]);
        $product['variants'] = $varStmt->fetchAll();

        Response::success($product, 'Product details retrieved successfully.');
    }
}
