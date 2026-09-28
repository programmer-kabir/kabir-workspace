-- database/migration_clean_tables.sql
-- Restructure subscriptions and payments tables cleanly

-- 1. Modify subscriptions table: remove card and redundant product/variant columns
ALTER TABLE `subscriptions`
    MODIFY COLUMN `plan_type` ENUM('solo', 'team') NOT NULL DEFAULT 'solo',
    DROP COLUMN IF EXISTS `card_brand`,
    DROP COLUMN IF EXISTS `card_last_four`,
    DROP COLUMN IF EXISTS `update_payment_method_url`,
    DROP COLUMN IF EXISTS `product_id`,
    DROP COLUMN IF EXISTS `variant_id`,
    DROP COLUMN IF EXISTS `product_name`,
    DROP COLUMN IF EXISTS `variant_name`;

-- 2. Modify payments table: add payment_method, card_brand, card_last_four
ALTER TABLE `payments`
    ADD COLUMN IF NOT EXISTS `payment_method` VARCHAR(50) DEFAULT 'card' AFTER `status`,
    ADD COLUMN IF NOT EXISTS `card_brand` VARCHAR(50) DEFAULT NULL AFTER `payment_method`,
    ADD COLUMN IF NOT EXISTS `card_last_four` VARCHAR(4) DEFAULT NULL AFTER `card_brand`;
