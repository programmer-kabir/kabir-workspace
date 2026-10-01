-- ==============================================================================
-- 🌊 PikSea Database Cleanup & Optimization Script
-- Converts Database to 100% Contributor-Free Studio Model
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. DROP UNUSED CONTRIBUTOR / AUTHOR TABLES
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `author_followers`;
DROP TABLE IF EXISTS `author_level_history`;
DROP TABLE IF EXISTS `author_level_rules`;
DROP TABLE IF EXISTS `author_upload_limits`;
DROP TABLE IF EXISTS `author_buyout_earnings`;
DROP TABLE IF EXISTS `author_earning_transactions`;
DROP TABLE IF EXISTS `author_identities`;
DROP TABLE IF EXISTS `author_invoices`;
DROP TABLE IF EXISTS `author_payout_methods`;
DROP TABLE IF EXISTS `contributor_applications`;
DROP TABLE IF EXISTS `authors`;

-- ------------------------------------------------------------------------------
-- 2. CLEAN UP CONTENTS TABLE (DROP AUTHOR COLUMNS)
-- ------------------------------------------------------------------------------
ALTER TABLE `contents` 
  DROP COLUMN IF EXISTS `author_id`,
  DROP COLUMN IF EXISTS `author_preview_url`;

-- ------------------------------------------------------------------------------
-- 3. CLEAN UP USER ROLES (REMOVE 'contributor' & 'author' ROLES)
-- ------------------------------------------------------------------------------
DELETE FROM `user_roles` 
WHERE `role` IN ('author', 'contributor');

-- ------------------------------------------------------------------------------
-- 4. CLEAN UP NOTIFICATIONS (REMOVE STALE CONTRIBUTOR NOTIFICATIONS)
-- ------------------------------------------------------------------------------
UPDATE `notifications`
SET `target_role` = 'user'
WHERE `target_role` IN ('author', 'contributor');

DELETE FROM `notifications`
WHERE `type` IN ('new_application', 'contributor_application_received', 'contributor_application_approved');

-- ------------------------------------------------------------------------------
-- 5. CLEAN UP EMAIL LOGS (OPTIONAL LOG PURGE FOR CONTRIBUTOR EMAILS)
-- ------------------------------------------------------------------------------
DELETE FROM `email_logs`
WHERE `email_type` IN ('contributor_application_received', 'contributor_application_approved');

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- ✅ Database cleanup completed successfully!
-- ==============================================================================
