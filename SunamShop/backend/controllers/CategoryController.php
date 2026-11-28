<?php
declare(strict_types=1);

namespace SunamShop\Controllers;

use SunamShop\Core\Database;
use SunamShop\Core\Request;
use SunamShop\Core\Response;

final class CategoryController
{
    public function index(Request $request): void
    {
        $db = Database::getConnection();
        $stmt = $db->query(
            'SELECT id, parent_id, name_bn, name_en, slug, icon, image, display_order 
             FROM categories 
             WHERE is_active = 1 
             ORDER BY display_order ASC, name_bn ASC'
        );
        $categories = $stmt->fetchAll();

        Response::success($categories, 'Categories retrieved successfully.');
    }
}
