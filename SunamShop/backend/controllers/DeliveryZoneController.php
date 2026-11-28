<?php
declare(strict_types=1);

namespace SunamShop\Controllers;

use SunamShop\Core\Database;
use SunamShop\Core\Request;
use SunamShop\Core\Response;

final class DeliveryZoneController
{
    public function index(Request $request): void
    {
        $db = Database::getConnection();
        $zonesStmt = $db->query(
            'SELECT id, zone_name_bn, zone_name_en, slug, delivery_charge, min_order_amount, estimated_delivery_time 
             FROM delivery_zones 
             WHERE is_active = 1 
             ORDER BY display_order ASC'
        );
        $zones = $zonesStmt->fetchAll();

        $areasStmt = $db->query(
            'SELECT id, delivery_zone_id, area_name_bn, area_name_en, postal_code 
             FROM delivery_zone_areas 
             WHERE is_active = 1 
             ORDER BY area_name_bn ASC'
        );
        $areas = $areasStmt->fetchAll();

        // Nest areas inside their respective zones
        $areasByZone = [];
        foreach ($areas as $area) {
            $areasByZone[$area['delivery_zone_id']][] = $area;
        }

        foreach ($zones as &$zone) {
            $zone['areas'] = $areasByZone[$zone['id']] ?? [];
        }

        Response::success($zones, 'Delivery zones retrieved successfully.');
    }
}
