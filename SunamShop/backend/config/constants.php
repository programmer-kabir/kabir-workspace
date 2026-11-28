<?php
declare(strict_types=1);

/**
 * SUNAM SHOP — Core Business Constants
 */
final class Constants
{
    // Roles
    public const ROLE_SUPER_ADMIN    = 1;
    public const ROLE_ADMIN          = 2;
    public const ROLE_STORE_MANAGER  = 3;
    public const ROLE_DELIVERY_STAFF = 4;
    public const ROLE_CUSTOMER       = 5;

    // Order Lifecycle Statuses
    public const ORDER_STATUS_NEW                = 'NEW';
    public const ORDER_STATUS_CONFIRMED          = 'CONFIRMED';
    public const ORDER_STATUS_SOURCING           = 'SOURCING';
    public const ORDER_STATUS_PACKING            = 'PACKING';
    public const ORDER_STATUS_READY_FOR_DELIVERY = 'READY_FOR_DELIVERY';
    public const ORDER_STATUS_OUT_FOR_DELIVERY   = 'OUT_FOR_DELIVERY';
    public const ORDER_STATUS_DELIVERED          = 'DELIVERED';
    public const ORDER_STATUS_CANCELLED          = 'CANCELLED';
    public const ORDER_STATUS_REFUND_PENDING     = 'REFUND_PENDING';
    public const ORDER_STATUS_REFUNDED           = 'REFUNDED';

    // Payment Methods
    public const PAYMENT_METHOD_COD   = 'COD';
    public const PAYMENT_METHOD_BKASH = 'BKASH';
    public const PAYMENT_METHOD_NAGAD = 'NAGAD';

    // Payment Statuses
    public const PAYMENT_STATUS_PENDING  = 'PENDING';
    public const PAYMENT_STATUS_PAID     = 'PAID';
    public const PAYMENT_STATUS_PARTIAL  = 'PARTIAL';
    public const PAYMENT_STATUS_REFUNDED = 'REFUNDED';

    // Sourcing Types
    public const SOURCING_OWN_STOCK    = 'OWN_STOCK';
    public const SOURCING_LOCAL_MARKET = 'LOCAL_MARKET';
    public const SOURCING_BOTH         = 'BOTH';

    // Supported Units
    public const UNIT_KG        = 'KG';
    public const UNIT_GRAM      = 'GRAM';
    public const UNIT_LITER     = 'LITER';
    public const UNIT_ML        = 'ML';
    public const UNIT_PIECE     = 'PIECE';
    public const UNIT_PACKET    = 'PACKET';
    public const UNIT_DOZEN     = 'DOZEN';
    public const UNIT_BUNDLE    = 'BUNDLE';

    // Stock Movement Types
    public const STOCK_IN            = 'STOCK_IN';
    public const STOCK_OUT           = 'STOCK_OUT';
    public const STOCK_ADJUSTMENT    = 'ADJUSTMENT';
    public const STOCK_DAMAGED       = 'DAMAGED';
    public const STOCK_WASTED        = 'WASTED';
    public const STOCK_ORDER_RESERVE = 'ORDER_RESERVE';
    public const STOCK_ORDER_RELEASE = 'ORDER_RELEASE';
}
