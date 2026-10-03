-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: u647959341_dayaldb
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ai_api_keys`
--

DROP TABLE IF EXISTS `ai_api_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ai_api_keys` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `provider` varchar(50) NOT NULL DEFAULT 'gemini',
  `api_key` varchar(255) NOT NULL,
  `label` varchar(100) DEFAULT 'Gemini Key',
  `status` enum('active','inactive','rate_limited') NOT NULL DEFAULT 'active',
  `usage_count` int(10) unsigned NOT NULL DEFAULT 0,
  `last_used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `api_key` (`api_key`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_api_keys`
--

LOCK TABLES `ai_api_keys` WRITE;
/*!40000 ALTER TABLE `ai_api_keys` DISABLE KEYS */;
INSERT INTO `ai_api_keys` VALUES (1,'gemini','AIzaSyB48jliTWQy7oGgMbN8Hkmi3uSkMMZrSS4','Primary Gemini Key','active',42,'2026-10-01 12:09:28','2026-09-30 10:43:17');
/*!40000 ALTER TABLE `ai_api_keys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `analytics_events`
--

DROP TABLE IF EXISTS `analytics_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `analytics_events` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `visitor_log_id` bigint(20) unsigned NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `session_id` varchar(255) NOT NULL,
  `content_id` int(11) DEFAULT NULL,
  `event_name` enum('page_view','image_view','download','premium_download','search','login','register','purchase','add_to_collection','upload') NOT NULL,
  `event_value` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `visitor_log_id` (`visitor_log_id`),
  KEY `user_id` (`user_id`),
  KEY `content_id` (`content_id`),
  KEY `event_name` (`event_name`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analytics_events`
--

LOCK TABLES `analytics_events` WRITE;
/*!40000 ALTER TABLE `analytics_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `analytics_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `api_rate_limits`
--

DROP TABLE IF EXISTS `api_rate_limits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `api_rate_limits` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `identifier` varchar(255) NOT NULL,
  `endpoint` varchar(50) NOT NULL,
  `requests` int(11) NOT NULL DEFAULT 1,
  `reset_time` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ident_end` (`identifier`,`endpoint`),
  KEY `idx_reset_time` (`reset_time`)
) ENGINE=InnoDB AUTO_INCREMENT=2520 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `api_rate_limits`
--

LOCK TABLES `api_rate_limits` WRITE;
/*!40000 ALTER TABLE `api_rate_limits` DISABLE KEYS */;
INSERT INTO `api_rate_limits` VALUES (2518,'::1','admin_contents',9,1791004759),(2519,'::1','contents',2,1791005160);
/*!40000 ALTER TABLE `api_rate_limits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_credit_rates`
--

DROP TABLE IF EXISTS `asset_credit_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `asset_credit_rates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `asset_type` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `credit_cost` int(10) unsigned NOT NULL DEFAULT 1,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_asset_type` (`asset_type`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_credit_rates`
--

LOCK TABLES `asset_credit_rates` WRITE;
/*!40000 ALTER TABLE `asset_credit_rates` DISABLE KEYS */;
INSERT INTO `asset_credit_rates` VALUES (1,'photo','Photo / Image',1,'Standard JPG, JPEG or image asset',1,1,'2026-07-22 11:41:18','2026-07-22 11:41:18'),(2,'png','PNG',1,'PNG graphics and transparent assets',1,2,'2026-07-22 11:41:18','2026-07-22 11:41:18'),(3,'svg','SVG Vector',1,'Standalone SVG vector asset',1,3,'2026-07-22 11:41:18','2026-07-22 11:41:18'),(4,'vector','Editable Vector',2,'EPS or AI editable vector source asset',1,4,'2026-07-22 11:41:18','2026-07-22 11:41:18'),(5,'psd','Editable PSD',2,'Layered and editable PSD source file',1,5,'2026-07-22 11:41:18','2026-07-22 11:41:18'),(6,'source_pack','Complete Source Pack',3,'Multiple editable source formats such as AI, EPS and SVG',1,6,'2026-07-22 11:41:18','2026-07-22 11:41:18'),(7,'video_hd','HD Video',3,'Standard HD video up to 1080p',1,7,'2026-07-22 11:41:18','2026-07-22 11:41:18'),(8,'video_4k','4K Video',4,'Ultra HD 4K video asset',1,8,'2026-07-22 11:41:18','2026-07-22 11:41:54'),(9,'video_8k','8K Video',5,'Ultra high resolution 8K video asset',1,9,'2026-07-22 11:41:18','2026-07-22 11:41:57');
/*!40000 ALTER TABLE `asset_credit_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_rate_limits`
--

DROP TABLE IF EXISTS `auth_rate_limits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_rate_limits` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `action` varchar(50) NOT NULL,
  `attempts` int(11) NOT NULL DEFAULT 1,
  `locked_until` datetime DEFAULT NULL,
  `last_attempt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_email_action` (`email`,`action`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_rate_limits`
--

LOCK TABLES `auth_rate_limits` WRITE;
/*!40000 ALTER TABLE `auth_rate_limits` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_rate_limits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `billing_history`
--

DROP TABLE IF EXISTS `billing_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `billing_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'USD',
  `transaction_id` varchar(100) NOT NULL,
  `payment_method` varchar(50) DEFAULT 'Demo',
  `status` enum('pending','success','failed','refunded') DEFAULT 'success',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billing_history`
--

LOCK TABLES `billing_history` WRITE;
/*!40000 ALTER TABLE `billing_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `billing_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(150) NOT NULL,
  `image` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=159 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (12,NULL,'People & Lifestyle','people','uploads/categories/People.webp','2026-06-21 06:48:53'),(115,NULL,'Nature & Landscapes','nature',NULL,'2026-10-01 04:18:23'),(116,115,'Mountains','mountains',NULL,'2026-10-01 04:18:23'),(117,115,'Forests & Trees','forests',NULL,'2026-10-01 04:18:23'),(118,115,'Oceans & Beaches','oceans',NULL,'2026-10-01 04:18:23'),(119,115,'Sunset & Sunrise','sunset-sunrise',NULL,'2026-10-01 04:18:23'),(120,115,'Sky & Clouds','sky-clouds',NULL,'2026-10-01 04:18:23'),(121,115,'Wildlife & Animals','wildlife',NULL,'2026-10-01 04:18:23'),(123,115,'Flowers & Plants','plants-flowers',NULL,'2026-10-01 04:18:50'),(124,12,'Portraits','portraits',NULL,'2026-10-01 04:18:50'),(125,12,'Street Photography','street-photography',NULL,'2026-10-01 04:18:50'),(126,12,'Fashion & Style','fashion',NULL,'2026-10-01 04:18:50'),(127,12,'Fitness & Sports','fitness',NULL,'2026-10-01 04:18:50'),(128,12,'Family & Lifestyle','family-lifestyle',NULL,'2026-10-01 04:18:50'),(129,12,'Emotions & Mood','emotions',NULL,'2026-10-01 04:18:50'),(130,NULL,'Architecture & City','architecture',NULL,'2026-10-01 04:18:50'),(131,130,'Cityscapes & Skylines','cityscapes',NULL,'2026-10-01 04:18:50'),(132,130,'Modern Buildings','modern-buildings',NULL,'2026-10-01 04:18:50'),(133,130,'Minimal Interiors','interiors',NULL,'2026-10-01 04:18:50'),(134,130,'Historic & Monuments','historic-monuments',NULL,'2026-10-01 04:18:50'),(135,130,'Night City','night-city',NULL,'2026-10-01 04:18:50'),(136,NULL,'Travel & Adventure','travel',NULL,'2026-10-01 04:18:50'),(137,136,'Drone & Aerial','drone-aerial',NULL,'2026-10-01 04:18:50'),(138,136,'Road Trips','road-trips',NULL,'2026-10-01 04:18:50'),(139,136,'Camping & Hiking','camping',NULL,'2026-10-01 04:18:50'),(140,136,'Cultures & Traditions','cultures',NULL,'2026-10-01 04:18:50'),(141,136,'Famous Landmarks','landmarks',NULL,'2026-10-01 04:18:50'),(142,NULL,'Food & Drink','food-drink',NULL,'2026-10-01 04:18:51'),(143,142,'Coffee & Café','coffee-cafe',NULL,'2026-10-01 04:18:51'),(144,142,'Fruits & Vegetables','fruits-vegetables',NULL,'2026-10-01 04:18:51'),(145,142,'Cooking & Kitchen','cooking',NULL,'2026-10-01 04:18:51'),(146,142,'Bakery & Desserts','bakery-desserts',NULL,'2026-10-01 04:18:51'),(147,142,'Restaurant & Dining','restaurant',NULL,'2026-10-01 04:18:51'),(148,NULL,'Business & Tech','business-tech',NULL,'2026-10-01 04:18:51'),(149,148,'Modern Workspace','modern-workspace',NULL,'2026-10-01 04:18:51'),(150,148,'Remote Work','remote-work',NULL,'2026-10-01 04:18:51'),(151,148,'Team Collaboration','teamwork',NULL,'2026-10-01 04:18:51'),(152,148,'Tech & Gadgets','technology',NULL,'2026-10-01 04:18:51'),(153,NULL,'Wallpapers & Textures','wallpapers',NULL,'2026-10-01 04:18:51'),(154,153,'Dark & Moody','dark-moody',NULL,'2026-10-01 04:18:51'),(155,153,'Minimalist Wallpapers','minimalist',NULL,'2026-10-01 04:18:51'),(156,153,'Textures & Patterns','textures',NULL,'2026-10-01 04:18:51'),(157,153,'Neon & Night Lights','neon-lights',NULL,'2026-10-01 04:18:51'),(158,153,'Macro Photography','macro',NULL,'2026-10-01 04:18:51');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `collection_items`
--

DROP TABLE IF EXISTS `collection_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `collection_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `collection_id` int(11) NOT NULL,
  `content_id` int(11) NOT NULL,
  `added_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_collection_content` (`collection_id`,`content_id`),
  KEY `fk_collection_items_content` (`content_id`),
  CONSTRAINT `fk_collection_items_collection` FOREIGN KEY (`collection_id`) REFERENCES `user_collections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_collection_items_content` FOREIGN KEY (`content_id`) REFERENCES `contents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `collection_items`
--

LOCK TABLES `collection_items` WRITE;
/*!40000 ALTER TABLE `collection_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `collection_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_earnings`
--

DROP TABLE IF EXISTS `company_earnings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `company_earnings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `transaction_type` enum('subscription','buyout','expired_sub') NOT NULL COMMENT 'subscription (30%), buyout (30%), expired_sub (70%)',
  `source_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Reference ID',
  `total_amount` decimal(10,4) NOT NULL COMMENT 'Total transaction value (100%)',
  `company_earned` decimal(10,4) NOT NULL COMMENT 'Company cut',
  `status` enum('completed','pending') NOT NULL DEFAULT 'completed',
  `earning_month` varchar(7) DEFAULT NULL COMMENT 'Format: YYYY-MM',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_earnings`
--

LOCK TABLES `company_earnings` WRITE;
/*!40000 ALTER TABLE `company_earnings` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_earnings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `content_files`
--

DROP TABLE IF EXISTS `content_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_files` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `content_id` bigint(20) unsigned NOT NULL,
  `file_url` varchar(500) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_type` varchar(30) NOT NULL,
  `file_size` bigint(20) unsigned DEFAULT NULL,
  `width` int(10) unsigned DEFAULT NULL,
  `height` int(10) unsigned DEFAULT NULL,
  `is_main_file` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_content_files_content` (`content_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `content_files`
--

LOCK TABLES `content_files` WRITE;
/*!40000 ALTER TABLE `content_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `content_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `content_reports`
--

DROP TABLE IF EXISTS `content_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content_id` int(11) NOT NULL,
  `reporter_id` int(11) DEFAULT NULL,
  `reporter_name` varchar(255) DEFAULT NULL,
  `reporter_email` varchar(255) DEFAULT NULL,
  `reason` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
  `admin_note` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_by_name` varchar(255) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `action_taken` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_content_id` (`content_id`),
  KEY `idx_reporter_id` (`reporter_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `content_reports`
--

LOCK TABLES `content_reports` WRITE;
/*!40000 ALTER TABLE `content_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `content_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `content_tags`
--

DROP TABLE IF EXISTS `content_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `content_tags` (
  `content_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`content_id`,`tag_id`),
  UNIQUE KEY `unique_content_tag` (`content_id`,`tag_id`),
  KEY `idx_content_tags_tag_content` (`tag_id`,`content_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `content_tags`
--

LOCK TABLES `content_tags` WRITE;
/*!40000 ALTER TABLE `content_tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `content_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contents`
--

DROP TABLE IF EXISTS `contents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `asset_id` varchar(20) DEFAULT NULL,
  `main_category_id` int(11) DEFAULT NULL,
  `subcategory_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(300) NOT NULL,
  `description` text DEFAULT NULL,
  `preview_image` varchar(500) DEFAULT NULL,
  `watermarked_preview_image` varchar(500) DEFAULT NULL,
  `watermarked_preview_video` varchar(500) DEFAULT NULL,
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `preview_600_url` varchar(500) DEFAULT NULL,
  `preview_1200_url` varchar(500) DEFAULT NULL,
  `content_type` enum('vector','photo','png','video') NOT NULL,
  `is_premium` tinyint(1) NOT NULL DEFAULT 0,
  `license_type` enum('free','premium','editorial') NOT NULL DEFAULT 'free',
  `ai_generated` tinyint(1) NOT NULL DEFAULT 0,
  `width` int(10) unsigned DEFAULT NULL,
  `height` int(10) unsigned DEFAULT NULL,
  `orientation` enum('horizontal','vertical','square','panoramic') DEFAULT NULL,
  `dominant_color` varchar(7) DEFAULT NULL,
  `views_count` int(10) unsigned NOT NULL DEFAULT 0,
  `downloads_count` int(10) unsigned NOT NULL DEFAULT 0,
  `likes_count` int(10) unsigned NOT NULL DEFAULT 0,
  `status` enum('draft','pending','published','rejected','exclusive_buyout') NOT NULL DEFAULT 'draft',
  `exclusive_price` decimal(10,2) DEFAULT NULL,
  `is_exclusive_sold` tinyint(1) DEFAULT 0,
  `rejection_reason` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `reviewer_note` text DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `unique_asset_id` (`asset_id`),
  KEY `idx_contents_category` (`subcategory_id`),
  KEY `idx_contents_type` (`content_type`),
  KEY `idx_contents_orientation` (`orientation`),
  KEY `idx_contents_status_published` (`status`,`published_at`),
  KEY `idx_status_cats` (`status`,`main_category_id`,`subcategory_id`),
  KEY `idx_status_filter` (`status`,`orientation`,`is_premium`),
  KEY `idx_status_popular` (`status`,`downloads_count`,`views_count`),
  KEY `idx_status_created` (`status`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contents`
--

LOCK TABLES `contents` WRITE;
/*!40000 ALTER TABLE `contents` DISABLE KEYS */;
/*!40000 ALTER TABLE `contents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `credit_packages`
--

DROP TABLE IF EXISTS `credit_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `credit_packages` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image_limit` int(10) unsigned NOT NULL DEFAULT 0,
  `video_limit` int(10) unsigned NOT NULL DEFAULT 0,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `expiry_days` int(10) unsigned NOT NULL DEFAULT 365 COMMENT '?????? ????????? valid ??????????????? (default 1 ?????????)',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `credit_packages`
--

LOCK TABLES `credit_packages` WRITE;
/*!40000 ALTER TABLE `credit_packages` DISABLE KEYS */;
INSERT INTO `credit_packages` VALUES (1,'Starter Credit','starter-credit','Download up to 3 images & 1 videos',3,1,14.99,365,1,1,'2026-07-23 06:35:24','2026-07-23 06:50:21'),(2,'Basic Credit','basic-credit','Download up to 4 images & 2 videos',4,2,17.99,365,1,2,'2026-07-23 06:35:24','2026-07-23 06:50:21'),(3,'Standard Credit','standard-credit','Download up to 8 images & 3 videos',8,3,34.99,365,1,3,'2026-07-23 06:35:24','2026-07-23 06:50:21'),(4,'Premium Credit','premium-credit','Download up to 16 images & 4 videos',16,4,68.99,365,1,4,'2026-07-23 06:35:24','2026-07-23 06:50:21'),(5,'Ultra Credit','ultra-credit','Download up to 33 images & 6 videos',33,6,124.99,365,1,5,'2026-07-23 06:35:24','2026-07-23 06:50:21'),(6,'Ultra Premium','ultra-premium','Download up to 75 images & 8 videos',75,8,249.99,365,1,6,'2026-07-23 07:01:22','2026-07-23 07:01:58');
/*!40000 ALTER TABLE `credit_packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `downloads_history`
--

DROP TABLE IF EXISTS `downloads_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `downloads_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `content_id` int(11) NOT NULL,
  `downloaded_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `downloads_history`
--

LOCK TABLES `downloads_history` WRITE;
/*!40000 ALTER TABLE `downloads_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `downloads_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dynamic_page_revisions`
--

DROP TABLE IF EXISTS `dynamic_page_revisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dynamic_page_revisions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `page_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` longtext DEFAULT NULL,
  `revision_number` int(11) NOT NULL,
  `changed_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `page_id` (`page_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `dynamic_page_revisions_ibfk_1` FOREIGN KEY (`page_id`) REFERENCES `dynamic_pages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dynamic_page_revisions_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dynamic_page_revisions`
--

LOCK TABLES `dynamic_page_revisions` WRITE;
/*!40000 ALTER TABLE `dynamic_page_revisions` DISABLE KEYS */;
INSERT INTO `dynamic_page_revisions` VALUES (1,1,'About Dayal Stock','\r\n<p class=\"mb-4\">Welcome to Dayal Stock, the premier destination for high-quality, royalty-free creative assets. Our mission is to empower creators, designers, and businesses by providing world-class photos, videos, and vectors.</p>\r\n<p class=\"mb-4\">Founded with the vision to make professional-grade assets accessible, we have built a thriving community of contributors who share their best work with the world. We believe that great design shouldn\'t be limited by budget or resources.</p>\r\n<h2 class=\"text-2xl font-bold text-gray-900 mt-8 mb-4\">Our Core Values</h2>\r\n<ul class=\"list-disc pl-5 mb-6\">\r\n<li class=\"mb-2\"><strong>Quality:</strong> Every asset is meticulously reviewed to meet our high standards.</li>\r\n<li class=\"mb-2\"><strong>Community:</strong> We support and reward our contributors fairly.</li>\r\n<li class=\"mb-2\"><strong>Innovation:</strong> We continuously improve our platform to make discovering assets effortless.</li>\r\n</ul>',1,NULL,'2026-07-20 05:43:42'),(2,1,'About Dayal Stock','\n<p class=\"mb-4\">Welcome to Dayal Stock, the premier destination for high-quality, royalty-free creative assets. Our mission is to empower creators, designers, and businesses by providing world-class photos, videos, and vectors.</p>\n<p class=\"mb-4\">Founded with the vision to make professional-grade assets accessible, we have built a thriving community of contributors who share their best work with the world. We believe that great design shouldn\'t be limited by budget or resources.</p>\n<h2 class=\"text-2xl font-bold text-gray-900 mt-8 mb-4\">Our Core Values</h2>\n<ul class=\"list-disc pl-5 mb-6\">\n<li class=\"mb-2\"><strong>Quality:</strong> Every asset is meticulously reviewed to meet our high standards.</li>\n<li class=\"mb-2\"><strong>Community:</strong> We support and reward our contributors fairly.</li>\n<li class=\"mb-2\"><strong>Innovation:</strong> We continuously improve our platform to make discovering assets effortless.</li><li class=\"mb-2\"><b>Hello: </b>Test Page</li>\n</ul>',2,NULL,'2026-07-20 05:43:50');
/*!40000 ALTER TABLE `dynamic_page_revisions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dynamic_pages`
--

DROP TABLE IF EXISTS `dynamic_pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dynamic_pages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `content_format` enum('html','json') NOT NULL DEFAULT 'html',
  `content` longtext DEFAULT NULL,
  `excerpt` text DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `meta_keywords` varchar(255) DEFAULT NULL,
  `canonical_url` varchar(255) DEFAULT NULL,
  `og_title` varchar(255) DEFAULT NULL,
  `og_description` text DEFAULT NULL,
  `og_image` varchar(500) DEFAULT NULL,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'published',
  `is_indexable` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `dynamic_pages_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `dynamic_pages_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dynamic_pages`
--

LOCK TABLES `dynamic_pages` WRITE;
/*!40000 ALTER TABLE `dynamic_pages` DISABLE KEYS */;
INSERT INTO `dynamic_pages` VALUES (1,'About Us','about-us','html','<section>\r\n  <p><strong>Welcome to PikSea</strong></p>\r\n  <p>PikSea is a modern digital asset marketplace built to help creators, designers, developers, marketers, businesses, and content creators discover high-quality creative resources quickly, securely, and affordably.</p>\r\n  <p>Our mission is to simplify the way digital assets are shared and used by providing a trusted platform where customers can find professional resources and contributors can showcase and monetize their creative work.</p>\r\n  <p>Whether you\'re designing a website, developing a mobile application, creating social media content, producing marketing campaigns, publishing digital products, or building a brand, PikSea is designed to provide the creative assets you need to bring your ideas to life.</p>\r\n\r\n  <h2>Our Vision</h2>\r\n  <p>Our vision is to become one of the world\'s most trusted digital asset marketplaces by making premium creative resources accessible to everyone while supporting creators through a fair, transparent, and secure ecosystem.</p>\r\n  <p>We believe that great ideas deserve great resources, and every creator should have access to high-quality digital content without unnecessary complexity.</p>\r\n\r\n  <h2>What We Offer</h2>\r\n  <p>PikSea provides an ever-growing collection of professional digital assets, including:</p>\r\n  <ul>\r\n    <li><strong>Stock Photos</strong></li>\r\n    <li><strong>Premium Vectors</strong></li>\r\n    <li><strong>Illustrations</strong></li>\r\n    <li><strong>PNG Images</strong></li>\r\n    <li><strong>PSD Files</strong></li>\r\n    <li><strong>AI Files</strong></li>\r\n    <li><strong>SVG Files</strong></li>\r\n    <li><strong>Motion Graphics</strong></li>\r\n    <li><strong>Stock Videos</strong></li>\r\n    <li><strong>Icons</strong></li>\r\n    <li><strong>Design Resources</strong></li>\r\n    <li><strong>Additional Creative Assets</strong></li>\r\n  </ul>\r\n  <p>Every asset is carefully categorized and optimized to help users quickly find the content they need.</p>\r\n\r\n  <h2>Why Choose PikSea?</h2>\r\n  <p>We focus on delivering a simple, reliable, and professional experience.</p>\r\n  <p>Our platform offers:</p>\r\n  <ul>\r\n    <li>High-quality digital assets</li>\r\n    <li>Fast and secure downloads</li>\r\n    <li>Easy search and category navigation</li>\r\n    <li>Affordable pricing and subscription options</li>\r\n    <li>Secure payment processing</li>\r\n    <li>Regularly updated content library</li>\r\n    <li>Reliable customer support</li>\r\n    <li>Fair licensing for personal and commercial projects</li>\r\n    <li>Secure contributor platform</li>\r\n    <li>Continuous platform improvements</li>\r\n  </ul>\r\n\r\n  <h2>Supporting Creative Professionals</h2>\r\n  <p>PikSea is more than just a marketplace.</p>\r\n  <p>We are building a community where photographers, designers, illustrators, videographers, artists, and creative professionals can publish their work, reach a global audience, protect their intellectual property, and earn from their creativity.</p>\r\n  <p>We are committed to recognizing and respecting the value of original creative work.</p>\r\n\r\n  <h2>Quality Commitment</h2>\r\n  <p>Every effort is made to maintain a high standard of quality across our platform.</p>\r\n  <p>We continuously improve our search system, website performance, security, user experience, and content management process to ensure that customers receive a reliable and enjoyable experience.</p>\r\n\r\n  <h2>Trust, Security &amp; Transparency</h2>\r\n  <p>Your trust is important to us.</p>\r\n  <p>We are committed to protecting user privacy, maintaining secure payment processing, respecting intellectual property rights, and operating our platform with transparency and integrity.</p>\r\n  <p>Our policies, including our Privacy Policy, Terms &amp; Conditions, Refund Policy, License Agreement, and DMCA Policy, are designed to provide a safe and fair experience for both customers and contributors.</p>\r\n\r\n  <h2>Our Future</h2>\r\n  <p>As PikSea continues to grow, we will expand our collection of digital assets, introduce new features, improve contributor tools, and provide even better services for creative professionals around the world.</p>\r\n  <p>Innovation and continuous improvement remain at the heart of everything we do.</p>\r\n\r\n  <h2>Contact Us</h2>\r\n  <p>We value every customer, contributor, and visitor.</p>\r\n  <p>If you have any questions, feedback, business inquiries, or partnership opportunities, please visit our Contact Us page or contact our support team.</p>\r\n  <p><strong>Email:</strong> <a href=\"mailto:support@piksea.com\">support@piksea.com</a></p>\r\n\r\n  <p>Thank you for choosing PikSea.</p>\r\n  <p>We appreciate your trust and look forward to helping you create, design, and build amazing projects with confidence.</p>\r\n</section>',NULL,'About Us - PikSea','Learn about PikSea\'s mission, values, and community.',NULL,NULL,NULL,NULL,NULL,'published',1,0,NULL,NULL,'2026-07-19 07:31:30','2026-07-19 07:31:30','2026-10-03 04:04:59'),(2,'Privacy Policy','privacy-policy','html','<p>Welcome to PikSea. Your privacy is very important to us. This Privacy Policy outlines how PikSea collects, uses, stores, shares, and protects your personal data when you visit our website, register an account, browse or download high-resolution stock photos, or subscribe to our Pro membership.</p>\n<p>By accessing or using PikSea, you acknowledge and agree to the practices described in this Privacy Policy.</p>\n\n<h2>1. Information We Collect</h2>\n<p>We collect information to provide, maintain, and improve our digital stock photo services. The types of data we collect include:</p>\n\n<p><strong>Personal Information</strong></p>\n<ul>\n  <li>Full name and preferred display name</li>\n  <li>Email address (for account verification, security notifications, and billing receipts)</li>\n  <li>Profile photo (when authenticating via Google OAuth)</li>\n  <li>Billing details and country/postal address (when required for invoice issuance)</li>\n</ul>\n\n<p><strong>Account &amp; Activity Information</strong></p>\n<ul>\n  <li>Encrypted password hashes and secure authentication session tokens</li>\n  <li>Account preferences, saved bookmarks, and custom photo collections</li>\n  <li>Subscription plan status, renewal dates, and credit pack balances</li>\n  <li>Photo download history, resolution selections, and generated license certificates</li>\n</ul>\n\n<p><strong>Technical &amp; Usage Information</strong></p>\n<ul>\n  <li>IP address and approximate geographic location</li>\n  <li>Browser type, device classification, and operating system</li>\n  <li>Search queries, category filters, and navigation paths</li>\n  <li>Photo preview views and interaction metrics</li>\n</ul>\n\n<p><strong>Payment Information</strong></p>\n<p>All financial transactions and subscription billings are securely handled by PCI-compliant payment processors (such as Lemon Squeezy and Stripe). PikSea does not store complete credit card or debit card numbers on our servers.</p>\n\n<h2>2. How We Use Your Information</h2>\n<p>We use your information strictly for legitimate service delivery purposes, including:</p>\n<ul>\n  <li>Creating, authenticating, and managing your member account.</li>\n  <li>Delivering full-resolution stock photos and transparent PNG images.</li>\n  <li>Generating verifiable digital licensing certificates for downloaded photos.</li>\n  <li>Managing daily and monthly download quotas based on your subscription tier.</li>\n  <li>Processing subscription payments, renewals, and invoices.</li>\n  <li>Providing responsive customer support and resolving technical issues.</li>\n  <li>Detecting and preventing fraud, unauthorized downloads, or security breaches.</li>\n  <li>Sending essential transactional emails, verification codes, and security updates.</li>\n</ul>\n\n<h2>3. Cookies &amp; Local Storage</h2>\n<p>PikSea uses cookies and browser local storage tokens to:</p>\n<ul>\n  <li>Keep your session securely authenticated across browser tabs.</li>\n  <li>Remember your search preferences, grid layout, and dark/light theme mode.</li>\n  <li>Analyze site performance and ensure fast photo browsing speed.</li>\n  <li>Protect against automated scraping bots and download abuse.</li>\n</ul>\n\n<h2>4. Sharing of Information</h2>\n<p>We <strong>never sell, rent, or trade your personal data</strong> to third-party advertisers.</p>\n<p>Data is shared strictly with necessary service infrastructure providers:</p>\n<ul>\n  <li><strong>Payment Gateways:</strong> To fulfill subscriptions and process billing securely.</li>\n  <li><strong>Cloud Storage:</strong> For high-speed, secure stock photo delivery.</li>\n  <li><strong>Transactional Email:</strong> For OTP verification and account alerts.</li>\n  <li><strong>Legal Authorities:</strong> Only when strictly required by enforceable law or court order.</li>\n</ul>\n\n<h2>5. Data Security &amp; Retention</h2>\n<p>We implement robust technical and organizational security measures to protect your information against unauthorized access, loss, or misuse. We retain your data only for as long as your account remains active or as needed to maintain valid commercial photo licensing records.</p>\n\n<h2>6. Your Rights</h2>\n<p>You have the right to access, update, or request deletion of your account and personal data, as well as export your past photo licenses and invoices. You may contact our support team at any time to exercise these rights.</p>\n\n<h2>7. Contact Us</h2>\n<p>If you have any questions or requests regarding your privacy on PikSea, please reach out to our team:</p>\n<p><strong>Support Email: </strong><a href=\"mailto:support@piksea.com\"><strong>support@piksea.com</strong></a></p>\n<p>Please also review our <a href=\"/terms-of-use\">Terms of Use</a>, <a href=\"/refund-policy\">Refund Policy</a>, and <a href=\"/licensing\">Licensing Agreement</a>.</p>\n<p>By using PikSea, you confirm your understanding and agreement to this Privacy Policy.</p>',NULL,'Privacy Policy - PikSea','Learn how PikSea collects, protects, and handles your personal data, photo licensing, and payment information.',NULL,NULL,NULL,NULL,NULL,'published',1,0,NULL,NULL,'2026-07-19 07:31:30','2026-07-19 07:31:30','2026-10-03 04:14:01'),(3,'Terms of Use','terms-of-use','html','<p>Welcome to PikSea. These Terms &amp; Conditions (\"Terms\") govern your access to and use of the PikSea website, services, and digital stock photo library. By accessing or using PikSea, you agree to be bound by these Terms. If you do not agree with any part of these Terms, please do not use our website or services.</p>\n\n<h2>1. Acceptance of Terms</h2>\n<p>By creating an account, browsing, subscribing, or downloading stock photos from PikSea, you acknowledge that you have read, understood, and agreed to these Terms &amp; Conditions, our Privacy Policy, Refund Policy, and Licensing Agreement.</p>\n\n<h2>2. Eligibility</h2>\n<p>You must be at least 18 years old or have the permission of a parent or legal guardian to use PikSea. You are responsible for ensuring that your use of the platform complies with all applicable local and international laws.</p>\n\n<h2>3. User Accounts</h2>\n<p>To access photo downloads and subscription benefits, you are required to create a user account.</p>\n<p>You agree to:</p>\n<ul>\n  <li>Provide accurate, current, and complete registration details.</li>\n  <li>Maintain the confidentiality and security of your login credentials.</li>\n  <li>Be fully responsible for all activities and downloads conducted through your account.</li>\n  <li>Promptly notify our support team if you detect any unauthorized access to your account.</li>\n</ul>\n<p>PikSea reserves the right to terminate or suspend accounts that violate these Terms or abuse download limits.</p>\n\n<h2>4. Pure Stock Photography &amp; Image Assets</h2>\n<p>PikSea is exclusively a high-resolution stock photography and visual imagery platform. Our catalog includes:</p>\n<ul>\n  <li>Ultra High-Resolution Stock Photos (JPEG / JPG)</li>\n  <li>Studio, Nature, Lifestyle &amp; Portrait Photography</li>\n  <li>Transparent Isolated Subject Photos (PNG)</li>\n  <li>Curated Thematic Photography Collections</li>\n  <li>High-Fidelity AI-Generated Stock Photos</li>\n</ul>\n<p><strong>Please Note:</strong> PikSea provides ready-to-use, full-resolution photographic image files (JPG/PNG). We do not provide raw vector source files (such as SVG, EPS, AI), layered design mockups, or PSD templates.</p>\n\n<h2>5. Payments &amp; Subscriptions</h2>\n<p>Access to full-resolution, watermark-free photo downloads requires an active Pro Subscription or Credit Package.</p>\n<p>All subscription fees and credit prices are clearly stated before purchase and are processed securely through certified payment gateways (e.g. Lemon Squeezy, Stripe).</p>\n<p>We reserve the right to cancel or withhold access to any transaction suspected of fraud, chargeback abuse, or unauthorized payment method usage.</p>\n\n<h2>6. Photo Licensing &amp; Permitted Use</h2>\n<p>Downloading a photograph from PikSea grants you a non-exclusive, non-transferable, royalty-free license to use the image in accordance with our Licensing Agreement.</p>\n<p>Downloading or licensing a photo does not transfer copyright or original intellectual ownership of the photograph to you.</p>\n<p><strong>Strict Restrictions:</strong></p>\n<ul>\n  <li>You may not resell, sub-license, redistribute, or give away downloaded photo files on other stock sites, wallpaper platforms, or torrent networks.</li>\n  <li>You may not claim original copyright or authorship of any downloaded photograph.</li>\n  <li>You may not use any photo in an unlawful, pornographic, defamatory, or fraudulent manner.</li>\n  <li>You may not register or trademark any unaltered photograph as your own brand logo.</li>\n</ul>\n\n<h2>7. Platform Intellectual Property</h2>\n<p>All photographs, visuals, preview watermarked images, UI branding, logos, and software code on PikSea are protected by copyright and intellectual property laws.</p>\n<p>Unauthorized automated scraping, bot crawling, bulk extraction, or circumvention of watermarks is strictly prohibited.</p>\n\n<h2>8. User Conduct &amp; Fair Usage</h2>\n<p>You agree not to:</p>\n<ul>\n  <li>Attempt to bypass daily/monthly download limits or security firewalls.</li>\n  <li>Use automated scripts or scrapers to mass-download photos.</li>\n  <li>Share your account credentials with multiple third parties to circumvent individual subscriptions.</li>\n  <li>Interfere with or disrupt the stability of our servers and networks.</li>\n</ul>\n\n<h2>9. Account Suspension &amp; Termination</h2>\n<p>PikSea reserves the right to suspend or permanently ban any account without prior notice if it is found to have violated these Terms, engaged in payment fraud, or abused download limits. Accounts terminated for policy violations are not eligible for refunds.</p>\n\n<h2>10. Disclaimer &amp; Limitation of Liability</h2>\n<p>PikSea provides its stock photography catalog on an \"as is\" and \"as available\" basis. While we maintain rigorous quality standards, we do not guarantee that every photo will meet every specific artistic or commercial requirement.</p>\n<p>To the maximum extent permitted by law, PikSea shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our website or downloaded photos.</p>\n\n<h2>11. Policy Changes</h2>\n<p>We reserve the right to revise these Terms &amp; Conditions at any time. Updates take effect immediately upon being posted on this page. Continued use of PikSea following any updates constitutes acceptance of the revised Terms.</p>\n\n<h2>12. Contact Support</h2>\n<p>If you have any questions regarding these Terms &amp; Conditions, please reach out to our team:</p>\n<p><strong>Support Email: </strong><a href=\"mailto:support@piksea.com\"><strong>support@piksea.com</strong></a></p>\n<p>For related platform policies, please visit our <a href=\"/privacy-policy\">Privacy Policy</a>, <a href=\"/refund-policy\">Refund Policy</a>, and <a href=\"/licensing\">Licensing Agreement</a>.</p>\n<p>By using PikSea, you confirm your understanding and agreement to these Terms of Use.</p>',NULL,'Terms of Use & Conditions - PikSea','Terms and Conditions governing access to and usage of the PikSea stock photo platform.',NULL,NULL,NULL,NULL,NULL,'published',1,0,NULL,NULL,'2026-07-19 07:31:30','2026-07-19 07:31:30','2026-10-03 04:14:01'),(4,'Licensing Agreement','licensing','json','{\n    \"intro\": \"PikSea provides high-resolution stock photography and visual imagery under simple, royalty-free licensing terms tailored for personal, editorial, and commercial creative projects.\",\n    \"licenses\": [\n        {\n            \"type\": \"Standard License (Free)\",\n            \"style\": \"free\",\n            \"points\": [\n                {\n                    \"label\": \"Attribution\",\n                    \"value\": \"Attribution to PikSea is appreciated but not mandatory\"\n                },\n                {\n                    \"label\": \"Commercial Use\",\n                    \"value\": \"Allowed for digital media, websites, social posts, and marketing\"\n                },\n                {\n                    \"label\": \"Print Limit\",\n                    \"value\": \"Up to 5,000 physical copies / impressions\"\n                },\n                {\n                    \"label\": \"Digital Assets\",\n                    \"value\": \"Standard resolution JPG / PNG photo downloads\"\n                }\n            ]\n        },\n        {\n            \"type\": \"Commercial Pro License (Premium)\",\n            \"style\": \"premium\",\n            \"points\": [\n                {\n                    \"label\": \"Attribution\",\n                    \"value\": \"No attribution required anywhere\"\n                },\n                {\n                    \"label\": \"Commercial Use\",\n                    \"value\": \"Full commercial, advertising, client projects & broadcast use\"\n                },\n                {\n                    \"label\": \"Print Limit\",\n                    \"value\": \"Unlimited physical prints, merchandise & packaging\"\n                },\n                {\n                    \"label\": \"Digital Assets\",\n                    \"value\": \"Full 8K/4K uncompressed original stock photography\"\n                }\n            ]\n        }\n    ],\n    \"permitted\": [\n        \"Web design, blogs, newsletters & social media campaigns\",\n        \"Digital advertising, banners, PPC ads & promotional media\",\n        \"Book covers, magazine articles & print publications\",\n        \"Video production, YouTube thumbnails & streaming backgrounds\",\n        \"Corporate presentations, decks & educational materials\",\n        \"Client branding projects & creative design mockups\"\n    ],\n    \"prohibited\": [\n        {\n            \"title\": \"Reselling & Standalone Redistribution\",\n            \"desc\": \"You cannot resell, redistribute, sub-license, or share downloaded stock photo files on other stock sites, wallpaper apps, or torrents.\"\n        },\n        {\n            \"title\": \"Trademark & Logo Ownership\",\n            \"desc\": \"You cannot trademark, copyright, or register any unaltered stock photo from PikSea as your own proprietary company logo.\"\n        },\n        {\n            \"title\": \"Unlawful & Defamatory Content\",\n            \"desc\": \"Photos must not be used in any pornographic, defamatory, illegal, or hate speech contexts.\"\n        },\n        {\n            \"title\": \"Bulk Scraping & Unauthorized AI Model Training\",\n            \"desc\": \"Automated scraping or mass extraction of PikSea stock photography for third-party AI training without an enterprise license is prohibited.\"\n        }\n    ]\n}',NULL,'Licensing - PikSea','PikSea Licensing rules and agreements.',NULL,NULL,NULL,NULL,NULL,'published',1,0,NULL,NULL,'2026-07-19 07:31:30','2026-07-19 07:31:30','2026-10-03 04:07:42'),(5,'Contributor Guidelines & Payout Policy','contributor-guidelines','json','{\"intro\":\"To maintain a high standard for our customers, all submitted assets must meet the following criteria:\",\"sections\":[{\"title\":\"Quality & Upload Requirements\",\"content\":\"<ul><li><strong>Image Dimensions:<\\/strong> [PENDING CONFIRMATION: Minimum width\\/height]<\\/li><li><strong>File Formats:<\\/strong> [PENDING CONFIRMATION: E.g., JPG, PNG, EPS]<\\/li><li><strong>Metadata:<\\/strong> [PENDING CONFIRMATION: E.g., Must include an accurate English title]<\\/li><\\/ul>\"},{\"title\":\"Review Process\",\"content\":\"<p>Once you upload an asset, it goes into the pending queue. [PENDING CONFIRMATION: Review process timeline]<\\/p>\"},{\"title\":\"Revenue Share & Earnings\",\"content\":\"<ul><li><strong>Premium Downloads:<\\/strong> [PENDING CONFIRMATION: Revenue share percentage]<\\/li><li><strong>Free Downloads:<\\/strong> [PENDING CONFIRMATION: Do contributors earn from free downloads?]<\\/li><\\/ul>\"},{\"title\":\"Payout Policy\",\"content\":\"<ul><li><strong>Minimum Payout Threshold:<\\/strong> [PENDING CONFIRMATION: E.g., $50 USD]<\\/li><li><strong>Payout Schedule:<\\/strong> [PENDING CONFIRMATION: E.g., Payments are processed on the 15th]<\\/li><li><strong>Supported Payment Methods:<\\/strong> [PENDING CONFIRMATION: E.g., Payoneer, PayPal]<\\/li><\\/ul>\"},{\"title\":\"AI-Generated Content Policy\",\"content\":\"<p>[PENDING CONFIRMATION: Do you accept AI-generated images?]<\\/p>\"},{\"title\":\"Exclusivity\",\"content\":\"<p>[PENDING CONFIRMATION: Are contributors required to upload exclusively to PikSea?]<\\/p>\"}]}',NULL,'Contributor Guidelines - PikSea','Learn how to become a contributor at PikSea.',NULL,NULL,NULL,NULL,NULL,'published',1,0,NULL,NULL,'2026-07-19 07:31:30','2026-07-19 07:31:30','2026-09-27 05:45:17'),(6,'DMCA Policy','dmca','html','<p>PikSea respects the intellectual property and copyright rights of photographers, creators, and copyright holders worldwide. This DMCA &amp; Intellectual Property Policy outlines our procedures for addressing copyright infringement notices and protecting original creative works in accordance with the Digital Millennium Copyright Act (DMCA) and international copyright legislation.</p>\n\n<h2>1. Intellectual Property Protection</h2>\n<p>All stock photography, high-resolution image assets, isolated subject photos, logos, UI designs, preview watermarked visuals, and software code displayed on PikSea are protected by international copyright, trademark, and intellectual property laws.</p>\n<p>All photos available for download are provided strictly in accordance with our <a href=\"/licensing\">Licensing Agreement</a>.</p>\n\n<h2>2. Submitting a DMCA Copyright Notice</h2>\n<p>If you are a copyright owner (or authorized to act on behalf of one) and believe that any photograph or visual asset hosted on PikSea infringes upon your copyright, please submit a written DMCA takedown notice containing the following information:</p>\n<ul>\n  <li><strong>Identification of the Copyrighted Work:</strong> A clear description of the original photograph or artwork you claim has been infringed, or a link/evidence showing the original publication.</li>\n  <li><strong>Location of Infringing Material:</strong> The exact PikSea asset URL(s), content ID, or page link where the allegedly infringing photograph is displayed.</li>\n  <li><strong>Your Contact Information:</strong> Your full legal name, company name (if applicable), mailing address, telephone number, and official email address.</li>\n  <li><strong>Good Faith Statement:</strong> A statement that you have a good-faith belief that the disputed use of the photograph is not authorized by the copyright owner, its agent, or the law.</li>\n  <li><strong>Accuracy Statement:</strong> A statement, made under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on the owner\'s behalf.</li>\n  <li><strong>Signature:</strong> A physical or electronic signature of the copyright owner or authorized representative.</li>\n</ul>\n\n<h2>3. DMCA Review &amp; Takedown Procedure</h2>\n<p>Upon receiving a formal, complete copyright infringement notice, our Trust &amp; Safety team will:</p>\n<ul>\n  <li>Acknowledge receipt of the complaint within 24 to 48 business hours.</li>\n  <li>Promptly review the provided evidence and investigate the asset in our library.</li>\n  <li>Temporarily disable access or permanently remove the contested image from public search and downloads.</li>\n  <li>Notify the relevant asset curation team regarding the inquiry.</li>\n</ul>\n\n<h2>4. Counter-Notification Procedure</h2>\n<p>If an asset was removed due to a mistaken claim or misidentification, a counter-notification may be submitted. Counter-notices must include legal identification, identification of the removed file, a statement consenting to appropriate legal jurisdiction, and a signature.</p>\n\n<h2>5. Prevention of Repeat Infringement</h2>\n<p>PikSea maintains a strict zero-tolerance policy towards copyright infringement. Any asset found to violate third-party copyright will be permanently purged from our database and content delivery servers.</p>\n\n<h2>6. Policy Against Bad Faith &amp; False Notices</h2>\n<p>Please note that submitting false, fraudulent, or bad-faith DMCA claims may result in legal liability for damages (including costs and attorney fees) under applicable copyright laws.</p>\n\n<h2>7. DMCA Contact Information</h2>\n<p>Please send all copyright inquiries and official DMCA notifications directly to our designated copyright agent:</p>\n<p><strong>Copyright Agent Email: </strong><a href=\"mailto:copyright@piksea.com\"><strong>copyright@piksea.com</strong></a></p>\n<p><strong>General Support: </strong><a href=\"mailto:support@piksea.com\"><strong>support@piksea.com</strong></a></p>\n<p>For more information, please review our <a href=\"/terms-of-use\">Terms of Use</a>, <a href=\"/privacy-policy\">Privacy Policy</a>, and <a href=\"/licensing\">Licensing Agreement</a>.</p>\n<p>By using PikSea, you acknowledge and agree to comply with this DMCA &amp; Intellectual Property Policy.</p>',NULL,'DMCA & Copyright Policy - PikSea','Learn how PikSea handles copyright protection, intellectual property rights, and DMCA takedown notices.',NULL,NULL,NULL,NULL,NULL,'published',1,0,NULL,NULL,'2026-07-19 07:31:30','2026-07-19 07:31:30','2026-10-03 04:58:15'),(7,'Contact Us','contact-us','html','<section>\n  <p><strong>Thank you for visiting PikSea.</strong></p>\n  <p>We value your questions, feedback, and suggestions. Whether you need assistance with your account, photo downloads, pro subscriptions, commercial licensing, or copyright inquiries, our dedicated team is here to assist you.</p>\n\n  <h2>Customer Support Areas</h2>\n  <p>If you need assistance with any of the following, please reach out to us:</p>\n  <ul>\n    <li>Account access, login, and registration verification</li>\n    <li>Pro subscription plans and credit pack purchases</li>\n    <li>Payment, billing, and official VAT/tax invoices</li>\n    <li>Photo download troubleshooting and file resolution inquiries</li>\n    <li>Commercial licensing certificates and copyright verification</li>\n    <li>Refund requests according to our Refund Policy</li>\n    <li>Business partnerships and enterprise volume licensing</li>\n    <li>General feedback and platform suggestions</li>\n  </ul>\n\n  <h2>Direct Email Channels</h2>\n  <p><strong>General &amp; Technical Support:</strong> <a href=\"mailto:support@piksea.com\">support@piksea.com</a><br>\n     <strong>Copyright &amp; DMCA Agent:</strong> <a href=\"mailto:copyright@piksea.com\">copyright@piksea.com</a><br>\n     <strong>Official Website:</strong> <a href=\"https://piksea.com\" target=\"_blank\" rel=\"noopener noreferrer\">https://piksea.com</a>\n  </p>\n\n  <h2>Expected Response Times</h2>\n  <p>Our global support team strives to resolve every inquiry promptly:</p>\n  <ul>\n    <li><strong>General &amp; Technical Support:</strong> 24 to 48 business hours</li>\n    <li><strong>Billing &amp; Payment Verification:</strong> 1 to 2 business days</li>\n    <li><strong>Licensing &amp; DMCA Legal Requests:</strong> 2 to 3 business days</li>\n  </ul>\n  <p>Response times may occasionally vary slightly during public holidays or high-traffic periods.</p>\n\n  <h2>Before Contacting Support</h2>\n  <p>To help us resolve your issue on first contact, please include:</p>\n  <ul>\n    <li>Your registered PikSea email address</li>\n    <li>Order ID or Subscription Transaction Number (if applicable)</li>\n    <li>Exact asset link or photo ID (for download issues)</li>\n    <li>A detailed description of the inquiry or issue screenshots</li>\n  </ul>\n\n  <h2>Business &amp; Enterprise Partnerships</h2>\n  <p>For brand collaborations, custom enterprise licensing, or volume stock photography packages, please email us directly with <strong>\"Enterprise Inquiry\"</strong> in the subject line.</p>\n\n  <h2>Our Commitment</h2>\n  <p>At PikSea, we are dedicated to providing world-class customer service and ensuring a smooth, delightful experience for every member of our creative community.</p>\n  <p>Thank you for choosing PikSea as your trusted stock photography platform.</p>\n</section>',NULL,'Contact Support & Help Desk - PikSea','Get in touch with the PikSea support team for account assistance, billing, photo licensing, and technical inquiries.',NULL,NULL,NULL,NULL,NULL,'published',1,0,NULL,NULL,'2026-07-19 07:31:30','2026-07-19 07:31:30','2026-10-03 05:03:58'),(8,'Refund Policy','refund-policy','html','<p>At PikSea, we deliver premium digital creative products, specifically high-resolution stock photography and image assets. Because digital photo downloads and subscription quotas are delivered instantly and cannot be physically returned once accessed, our refund policy differs from that of physical goods.</p>\n\n<h2>1. General Digital Goods Policy</h2>\n<p>All subscription purchases, credit packages, and stock photo downloads made through PikSea are considered final. Once an uncompressed, full-resolution photograph has been downloaded or license quota utilized, it is generally non-refundable.</p>\n\n<h2>2. When You Are Eligible for a Refund</h2>\n<p>We believe in fair business practices. A refund request will be reviewed and approved under the following conditions:</p>\n<ul>\n  <li><strong>Duplicate Billing:</strong> Your account was inadvertently charged more than once for the same subscription or credit package due to a payment processing error.</li>\n  <li><strong>Unsuccessful Delivery:</strong> You completed payment, but an internal technical error prevented activation of your plan or access to photo downloads.</li>\n  <li><strong>Corrupted Image Files:</strong> The downloaded high-resolution photo file is technically damaged or corrupted and our technical team cannot provide a working replacement within 48 hours.</li>\n  <li><strong>Fraudulent / Unauthorized Transactions:</strong> Validated fraudulent activity or unauthorized credit card usage reported promptly before extensive quota usage.</li>\n</ul>\n\n<h2>3. Non-Refundable Situations</h2>\n<p>Refunds will not be granted in the following scenarios:</p>\n<ul>\n  <li>You have already downloaded the full-resolution stock photos or transparent PNG files.</li>\n  <li>You changed your mind after purchasing a plan or credit pack.</li>\n  <li>You mistakenly purchased a subscription tier or selected the wrong photo asset.</li>\n  <li>The photograph does not align with your subjective aesthetic preference or specific project needs.</li>\n  <li>You forgot to cancel an active auto-renewing subscription before the renewal billing date occurred.</li>\n  <li>Your account was suspended or permanently banned due to a violation of our Terms of Use or fair usage limits.</li>\n</ul>\n\n<h2>4. Subscription Cancellations &amp; Renewals</h2>\n<p>You may cancel your PikSea Pro subscription at any time directly through your account dashboard or via the billing portal link in your receipt email.</p>\n<p>Upon cancellation, your subscription will remain fully active with unlimited/quota download access until the end of your paid billing period. We do not provide partial or prorated refunds for mid-cycle cancellations.</p>\n\n<h2>5. Chargebacks &amp; Payment Disputes</h2>\n<p>We encourage customers to contact our friendly support team first to resolve any billing discrepancies. Initiating a payment dispute or chargeback without prior communication may result in temporary account restriction until the financial institution resolves the inquiry.</p>\n\n<h2>6. How to Request a Refund</h2>\n<p>To request a refund under eligible conditions, please submit a request to our support team within <strong>7 days</strong> of the transaction date.</p>\n<p>Please include the following details in your message:</p>\n<ul>\n  <li>Registered PikSea email address</li>\n  <li>Order ID or Payment Transaction Number</li>\n  <li>Date and amount of the transaction</li>\n  <li>Clear description of the issue with supporting screenshots (if applicable)</li>\n</ul>\n<p>Our billing team reviews all inquiries within <strong>24 to 48 business hours</strong>.</p>\n\n<h2>7. Refund Processing Time &amp; Method</h2>\n<p>Approved refunds are credited directly back to the original payment method used during checkout (e.g. Credit Card, Debit Card, or Stripe/Lemon Squeezy account). Depending on your banking institution, funds will typically appear in your account within <strong>5 to 10 business days</strong>.</p>\n\n<h2>8. Contact Support</h2>\n<p>If you have questions regarding your billing, invoices, or this Refund Policy, please contact our support team:</p>\n<p><strong>Support Email: </strong><a href=\"mailto:support@piksea.com\"><strong>support@piksea.com</strong></a></p>\n<p>For more information on platform rules, please also review our <a href=\"/terms-of-use\">Terms of Use</a>, <a href=\"/privacy-policy\">Privacy Policy</a>, and <a href=\"/licensing\">Licensing Agreement</a>.</p>\n<p>By purchasing a subscription, credit pack, or downloading photos from PikSea, you confirm your understanding and acceptance of this Refund Policy.</p>',NULL,'Refund & Cancellation Policy - PikSea','Learn about PikSea digital goods refund policy, subscription cancellation rules, and billing support.',NULL,NULL,NULL,NULL,NULL,'published',1,0,NULL,NULL,NULL,'2026-08-03 10:30:21','2026-10-03 04:50:28');
/*!40000 ALTER TABLE `dynamic_pages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_logs`
--

DROP TABLE IF EXISTS `email_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `email_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recipient_user_id` int(11) DEFAULT NULL,
  `recipient_name` varchar(255) DEFAULT NULL,
  `recipient_email` varchar(255) NOT NULL,
  `email_type` varchar(100) NOT NULL DEFAULT 'general',
  `subject` varchar(255) NOT NULL,
  `message_title` varchar(255) DEFAULT NULL,
  `message_body` text DEFAULT NULL,
  `status` enum('sent','failed') NOT NULL DEFAULT 'sent',
  `sent_by_id` int(11) DEFAULT NULL,
  `sent_by_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_recipient_user_id` (`recipient_user_id`),
  KEY `idx_recipient_email` (`recipient_email`),
  KEY `idx_email_type` (`email_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_logs`
--

LOCK TABLES `email_logs` WRITE;
/*!40000 ALTER TABLE `email_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_verification_codes`
--

DROP TABLE IF EXISTS `email_verification_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `email_verification_codes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `code` varchar(6) NOT NULL,
  `type` enum('registration','password_reset') NOT NULL DEFAULT 'registration',
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_email_type` (`email`,`type`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_verification_codes`
--

LOCK TABLES `email_verification_codes` WRITE;
/*!40000 ALTER TABLE `email_verification_codes` DISABLE KEYS */;
INSERT INTO `email_verification_codes` VALUES (8,'mdashrafulislamsiam@gmail.com','708939','registration','2026-09-13 14:23:25','2026-09-13 08:13:25'),(11,'mdskalim20@gmail.com','281397','registration','2026-09-13 14:29:21','2026-09-13 08:19:21');
/*!40000 ALTER TABLE `email_verification_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exclusive_buyouts`
--

DROP TABLE IF EXISTS `exclusive_buyouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exclusive_buyouts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `content_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','completed','failed') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_exclusive_buyouts_user` (`user_id`),
  KEY `fk_exclusive_buyouts_content` (`content_id`),
  CONSTRAINT `fk_exclusive_buyouts_content` FOREIGN KEY (`content_id`) REFERENCES `contents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_exclusive_buyouts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exclusive_buyouts`
--

LOCK TABLES `exclusive_buyouts` WRITE;
/*!40000 ALTER TABLE `exclusive_buyouts` DISABLE KEYS */;
/*!40000 ALTER TABLE `exclusive_buyouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faq_categories`
--

DROP TABLE IF EXISTS `faq_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `faq_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'published',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faq_categories`
--

LOCK TABLES `faq_categories` WRITE;
/*!40000 ALTER TABLE `faq_categories` DISABLE KEYS */;
INSERT INTO `faq_categories` VALUES (1,'General & Platform','general','Basic information about PikSea and how our photo library works',1,'published','2026-10-03 05:05:53','2026-10-03 05:05:53'),(2,'Licensing & Commercial Use','licensing','Rules regarding commercial usage, attribution, and permissions',2,'published','2026-10-03 05:05:53','2026-10-03 05:05:53'),(3,'Subscriptions & Downloads','subscriptions','Understanding Pro plans, download limits, and account management',3,'published','2026-10-03 05:05:53','2026-10-03 05:05:53'),(4,'Billing & Invoices','billing','Payment gateways, currency, tax receipts, and refund policies',4,'published','2026-10-03 05:05:53','2026-10-03 05:05:53');
/*!40000 ALTER TABLE `faq_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faqs`
--

DROP TABLE IF EXISTS `faqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `faqs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `question` varchar(500) NOT NULL,
  `answer` text NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'published',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `faqs_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `faq_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faqs`
--

LOCK TABLES `faqs` WRITE;
/*!40000 ALTER TABLE `faqs` DISABLE KEYS */;
INSERT INTO `faqs` VALUES (1,1,'What is PikSea?','PikSea is a curated, high-resolution stock photography platform designed for creators, marketers, designers, and businesses. We provide ready-to-use, studio-quality stock photos and isolated PNG images without vector clutter or complicated licensing.',1,'published','2026-10-03 05:05:53','2026-10-03 05:05:53'),(2,1,'What image formats and resolutions are provided?','All images on PikSea are delivered in ultra high-resolution JPEG/JPG and transparent PNG formats (up to 8K resolution and 300 DPI). We focus exclusively on photographic assets to ensure maximum visual fidelity.',2,'published','2026-10-03 05:05:53','2026-10-03 05:05:53'),(3,1,'Do I need an account to download photos?','Yes, creating a free PikSea account is required to download watermark-free images, manage your saved collections, and track your license certificates.',3,'published','2026-10-03 05:05:53','2026-10-03 05:05:53'),(4,1,'Are AI-generated stock photos clearly labeled?','Yes. All AI-generated photographic imagery is clearly marked with an AI badge and filterable through our advanced search parameters so you always know the origin of every asset.',4,'published','2026-10-03 05:05:53','2026-10-03 05:05:53'),(5,2,'Can I use downloaded photos for commercial projects?','Yes. Photos downloaded with a Pro subscription or commercial credit pack can be used in commercial advertising, client projects, websites, packaging, and digital media in accordance with our Licensing Agreement.',1,'published','2026-10-03 05:05:53','2026-10-03 05:05:53'),(6,2,'Do I need to give attribution or credit to PikSea?','Attribution is not required for Pro subscribers. For free downloads, crediting PikSea is appreciated but optional.',2,'published','2026-10-03 05:05:53','2026-10-03 05:05:53'),(7,2,'Are there any restrictions on photo usage?','You cannot resell, redistribute, or share standalone photo files on other stock sites, wallpaper apps, or torrents. You also cannot claim original copyright or use unaltered photos as registered trademarks.',3,'published','2026-10-03 05:05:53','2026-10-03 05:05:53'),(8,3,'How do subscription download quotas work?','Depending on your chosen Pro plan, your account is allocated a monthly download allowance. Download quotas refresh automatically at the start of each billing cycle.',1,'published','2026-10-03 05:05:53','2026-10-03 05:05:53'),(9,3,'Can I re-download photos I have already licensed?','Yes! Any photo you have previously downloaded remains available in your Account Download History for unlimited free re-downloads without consuming your monthly quota.',2,'published','2026-10-03 05:05:53','2026-10-03 05:05:53'),(10,3,'How do I cancel my Pro subscription?','You can cancel your auto-renewing subscription at any time directly from your Account Settings. Your Pro download benefits will remain active until the end of your paid billing period.',3,'published','2026-10-03 05:05:53','2026-10-03 05:05:53'),(11,4,'What payment methods are supported?','We accept all major credit and debit cards (Visa, MasterCard, American Express) as well as secure digital checkout through Lemon Squeezy and Stripe.',1,'published','2026-10-03 05:05:53','2026-10-03 05:05:53'),(12,4,'Can I download official VAT / Tax invoices?','Yes. Automated PDF invoices with your business name, address, and VAT/Tax ID are generated for every transaction and accessible from your Billing Dashboard.',2,'published','2026-10-03 05:05:53','2026-10-03 05:05:53'),(13,4,'What is your refund policy for subscriptions?','Due to the digital nature of instant image downloads, purchases are generally non-refundable once assets are accessed. However, in cases of duplicate charges or technical failures, our billing team will promptly issue a full refund upon review.',3,'published','2026-10-03 05:05:53','2026-10-03 05:05:53');
/*!40000 ALTER TABLE `faqs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned DEFAULT NULL COMMENT 'Notification receiver, NULL for broadcast',
  `sender_id` int(11) DEFAULT NULL,
  `sender_type` enum('user','admin','system','author') NOT NULL DEFAULT 'system',
  `target_role` varchar(20) DEFAULT 'user' COMMENT 'user, admin, or contributor',
  `type` varchar(100) NOT NULL COMMENT 'application_approved, application_rejected, download_complete, etc.',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `icon` varchar(255) DEFAULT NULL COMMENT 'Icon class or image URL',
  `link` varchar(255) DEFAULT NULL COMMENT 'Page to open when clicked',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `priority` enum('low','normal','high','urgent') DEFAULT 'normal',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_role` (`target_role`),
  KEY `idx_user_read` (`user_id`,`is_read`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_transactions`
--

DROP TABLE IF EXISTS `payment_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_transactions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `transaction_id` varchar(255) NOT NULL,
  `payment_source` varchar(100) NOT NULL COMMENT '????????????: exclusive_buyout, subscription, credit_purchase',
  `source_id` bigint(20) unsigned DEFAULT NULL COMMENT 'Buyout ?????? Subscription ?????? ???????????????????????? ID',
  `payment_method` varchar(100) DEFAULT 'stripe',
  `status` enum('verified','pending','failed') DEFAULT 'pending' COMMENT 'ajaira payment ????????? failed ?????? pending ???????????????',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_transactions`
--

LOCK TABLES `payment_transactions` WRITE;
/*!40000 ALTER TABLE `payment_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'footer_text','PikSea','2026-07-19 10:50:30','2026-09-27 05:45:17'),(2,'footer_copyright','® 2026 PikSea. All rights reserved.','2026-07-19 10:50:30','2026-09-27 05:45:17'),(3,'hero_title','Pure Photography.','2026-07-19 10:50:30','2026-09-27 05:45:17'),(4,'hero_highlight_text','Breathtaking','2026-07-19 10:50:30','2026-09-27 05:45:17'),(5,'hero_subtitle','stock photos.','2026-07-19 10:50:30','2026-09-27 05:45:17'),(6,'hero_description','Explore and download millions of curated, high-resolution stock photos captured by visionary photographers worldwide.','2026-07-19 10:50:30','2026-09-27 05:45:17'),(7,'cta_title','Ready to Elevate Your Projects?','2026-07-19 10:50:30','2026-07-19 10:50:30'),(8,'cta_description','Join thousands of creators, brands, and agencies using PikSea high-resolution stock photography.','2026-07-19 10:50:30','2026-09-27 05:45:17'),(9,'cta_primary_btn_text','Create Free Account','2026-07-19 10:50:30','2026-07-19 10:50:30'),(10,'cta_primary_btn_link','/login','2026-07-19 10:50:30','2026-08-04 06:16:51'),(11,'cta_secondary_btn_text','Explore Pro Plans','2026-07-19 10:50:30','2026-07-19 10:50:30'),(12,'cta_secondary_btn_link','/join-pro','2026-07-19 10:50:30','2026-08-04 06:16:43'),(13,'cta_footer_text','No credit card required for free accounts.','2026-07-19 10:50:30','2026-07-19 10:50:30'),(14,'join_pro_title','Unlock Unlimited Creativity','2026-07-19 10:50:30','2026-07-19 10:50:30'),(15,'join_pro_badge','PikSea Pro','2026-07-19 10:50:30','2026-09-27 05:45:17'),(16,'join_pro_btn_text','Start Your Free Trial','2026-07-19 10:50:30','2026-07-19 10:50:30'),(17,'join_pro_btn_link','/join-pro','2026-07-19 10:50:30','2026-07-19 10:50:30'),(18,'badge_top_earner_min_downloads','20','2026-09-13 06:18:34','2026-09-13 06:18:34'),(19,'badge_trending_min_downloads','5','2026-09-13 06:18:34','2026-09-13 06:18:34'),(20,'badge_trending_min_views','50','2026-09-13 06:18:34','2026-09-13 06:18:34'),(21,'badge_high_views_min_views','20','2026-09-13 06:18:34','2026-09-13 06:18:34'),(22,'badge_fresh_release_max_days','14','2026-09-13 06:18:34','2026-09-13 06:18:34');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_plans`
--

DROP TABLE IF EXISTS `subscription_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscription_plans` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `billing_cycle` enum('free','monthly','yearly') NOT NULL DEFAULT 'monthly',
  `image_limit` int(10) unsigned NOT NULL DEFAULT 0,
  `video_limit` int(10) unsigned NOT NULL DEFAULT 0,
  `limit_period` enum('daily','monthly') NOT NULL DEFAULT 'monthly',
  `premium_access` tinyint(1) NOT NULL DEFAULT 0,
  `commercial_license` tinyint(1) NOT NULL DEFAULT 0,
  `attribution_required` tinyint(1) NOT NULL DEFAULT 1,
  `ad_free` tinyint(1) NOT NULL DEFAULT 0,
  `priority_support` tinyint(1) NOT NULL DEFAULT 0,
  `is_popular` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_plans`
--

LOCK TABLES `subscription_plans` WRITE;
/*!40000 ALTER TABLE `subscription_plans` DISABLE KEYS */;
INSERT INTO `subscription_plans` VALUES (1,'Free','free','Explore DayalStock with free downloads every month.',0.00,'free',50,0,'monthly',0,0,1,0,0,0,1,0,'2026-07-23 04:54:30','2026-10-01 08:02:36'),(2,'Starter Plan','starter','Perfect for individuals who need assets occasionally.',9.99,'monthly',25,0,'monthly',1,1,0,1,0,0,2,1,'2026-07-23 04:54:30','2026-10-01 08:00:39'),(3,'Premium Plan','premium','The best choice for designers and regular content creators.',19.99,'monthly',75,0,'monthly',1,1,0,1,0,0,3,1,'2026-07-23 04:54:30','2026-10-01 08:01:53'),(4,'Pro Plan	','pro','Maximum downloads for professional creators.',39.99,'monthly',200,0,'monthly',1,1,0,1,1,0,4,1,'2026-07-23 04:54:30','2026-10-01 08:02:33'),(5,'Pro Plus Plan	','pro-plus','Unlimited power for agencies and studios.',79.99,'monthly',600,0,'monthly',1,1,0,1,1,1,5,1,'2026-07-23 04:54:30','2026-10-01 08:02:34'),(6,'Starter Yearly','starter-yearly','Perfect for individuals ??? billed once a year. Save $40.',79.99,'yearly',10,1,'monthly',1,1,0,1,0,0,6,0,'2026-07-23 04:54:30','2026-07-25 07:10:55'),(7,'Premium Yearly','premium-yearly','Best for designers ??? billed once a year. Save $200.',399.99,'yearly',50,5,'monthly',1,1,0,1,0,1,7,0,'2026-07-23 04:54:30','2026-07-25 07:10:53'),(8,'Pro Yearly','pro-yearly','Professional plan ??? billed once a year. Save $360.',719.99,'yearly',90,10,'monthly',1,1,0,1,1,0,8,0,'2026-07-23 04:54:30','2026-07-25 07:10:50'),(9,'Pro+ Yearly','pro-plus-yearly','Agency plan ??? billed once a year. Save $680.',1699.99,'yearly',800,50,'monthly',1,1,0,1,1,0,9,0,'2026-07-23 04:54:30','2026-07-25 07:10:48');
/*!40000 ALTER TABLE `subscription_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_tickets`
--

DROP TABLE IF EXISTS `support_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `support_tickets` (
  `id` varchar(50) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ticket_source` varchar(50) DEFAULT 'user',
  `department` enum('Billing','Technical','Copyright','General') DEFAULT 'General',
  `subject` varchar(255) NOT NULL,
  `priority` enum('Low','Medium','High','Urgent') DEFAULT 'Medium',
  `status` enum('Open','Pending_Reply','Resolved','Closed') DEFAULT 'Open',
  `assigned_admin_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_tickets`
--

LOCK TABLES `support_tickets` WRITE;
/*!40000 ALTER TABLE `support_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `support_tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tags` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_tags_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2253 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--

LOCK TABLES `tags` WRITE;
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
INSERT INTO `tags` VALUES (1,'Ocean Wave','ocean-wave','active','2026-09-30 06:04:32','2026-09-30 06:04:32'),(2,'edd02673','edd02673','active','2026-09-30 10:22:51','2026-09-30 10:22:51'),(3,'bf4a','bf4a','active','2026-09-30 10:22:51','2026-09-30 10:22:51'),(4,'4f4d','4f4d','active','2026-09-30 10:22:51','2026-09-30 10:22:51'),(5,'bfce','bfce','active','2026-09-30 10:22:51','2026-09-30 10:22:51'),(6,'a47837dc08bd','a47837dc08bd','active','2026-09-30 10:22:51','2026-09-30 10:22:51'),(7,'removebg','removebg','active','2026-09-30 10:22:51','2026-09-30 10:22:51'),(8,'robotics','robotics','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(9,'automation','automation','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(10,'industrial','industrial','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(11,'warehouse','warehouse','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(12,'technology','technology','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(13,'manufacturing','manufacturing','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(14,'smart','smart','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(15,'logistics','logistics','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(16,'mechanical','mechanical','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(17,'engineering','engineering','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(18,'future','future','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(19,'innovation','innovation','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(20,'automated','automated','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(21,'machinery','machinery','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(22,'storage','storage','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(23,'facility','facility','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(24,'robotic','robotic','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(25,'arm','arm','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(26,'digital','digital','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(27,'industry','industry','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(28,'modern','modern','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(29,'minimalist','minimalist','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(30,'white','white','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(31,'science','science','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(32,'production','production','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(33,'system','system','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(34,'efficiency','efficiency','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(35,'tech','tech','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(36,'advanced','advanced','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(37,'process','process','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(38,'robot','robot','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(39,'laboratory','laboratory','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(40,'development','development','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(41,'precision','precision','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(42,'equipment','equipment','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(43,'data','data','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(44,'management','management','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(45,'supply','supply','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(46,'chain','chain','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(47,'solution','solution','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(48,'concept','concept','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(49,'architecture','architecture','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(50,'interior','interior','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(51,'bright','bright','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(52,'clean','clean','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(53,'work','work','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(54,'stock','stock','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(55,'vector','vector','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(56,'ai','ai','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(57,'artificial','artificial','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(58,'intelligence','intelligence','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(59,'processor','processor','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(60,'chip','chip','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(62,'computing','computing','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(63,'hardware','hardware','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(64,'circuit','circuit','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(65,'board','board','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(66,'motherboard','motherboard','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(69,'futuristic','futuristic','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(72,'electronic','electronic','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(73,'microchip','microchip','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(75,'abstract','abstract','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(76,'black','black','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(77,'gold','gold','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(78,'metallic','metallic','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(82,'network','network','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(83,'cyber','cyber','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(85,'machine','machine','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(86,'learning','learning','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(87,'processing','processing','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(88,'component','component','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(91,'server','server','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(92,'information','information','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(93,'connectivity','connectivity','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(94,'logic','logic','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(95,'integrated','integrated','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(96,'semiconductor','semiconductor','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(99,'render','render','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(100,'graphic','graphic','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(101,'design','design','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(102,'background','background','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(103,'high-tech','high-tech','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(105,'humanoid','humanoid','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(106,'android','android','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(110,'cybernetic','cybernetic','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(119,'synthetic','synthetic','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(120,'bionic','bionic','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(125,'research','research','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(126,'experiment','experiment','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(127,'metal','metal','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(129,'complex','complex','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(131,'portrait','portrait','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(132,'studio','studio','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(133,'lighting','lighting','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(140,'human','human','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(141,'imitation','imitation','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(142,'face','face','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(143,'expression','expression','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(144,'detail','detail','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(145,'high','high','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(147,'prototype','prototype','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(150,'illustration','illustration','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(155,'neon','neon','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(156,'glowing','glowing','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(157,'orange','orange','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(170,'computer','computer','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(175,'dark','dark','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(177,'3d','3d','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(193,'pattern','pattern','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(194,'texture','texture','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(195,'light','light','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(196,'signage','signage','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(197,'corporate','corporate','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(198,'business','business','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(200,'smartphone','smartphone','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(202,'artificial intelligence','artificial-intelligence','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(204,'mobile','mobile','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(205,'apps','apps','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(206,'chatgpt','chatgpt','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(207,'gemini','gemini','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(208,'claude','claude','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(209,'deepseek','deepseek','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(212,'hand','hand','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(213,'holding','holding','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(214,'screen','screen','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(215,'interface','interface','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(216,'software','software','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(219,'communication','communication','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(222,'mobile app','mobile-app','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(223,'chatbot','chatbot','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(224,'application','application','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(225,'display','display','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(226,'device','device','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(231,'virtual','virtual','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(233,'user','user','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(234,'interaction','interaction','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(235,'gadget','gadget','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(236,'mobile device','mobile-device','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(237,'tech trend','tech-trend','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(238,'software development','software-development','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(239,'ai tools','ai-tools','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(240,'digital transformation','digital-transformation','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(241,'online','online','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(242,'web','web','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(243,'platform','platform','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(244,'service','service','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(245,'tech lifestyle','tech-lifestyle','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(246,'mobile technology','mobile-technology','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(247,'phone','phone','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(266,'interactive','interactive','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(269,'tablet','tablet','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(275,'assistant','assistant','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(276,'friendly','friendly','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(277,'cute','cute','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(285,'automaton','automaton','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(290,'vision','vision','active','2026-10-01 04:06:37','2026-10-01 04:06:37'),(296,'woman','woman','active','2026-10-01 04:57:15','2026-10-01 04:57:15'),(297,'golden hour','golden-hour','active','2026-10-01 04:57:15','2026-10-01 04:57:15'),(298,'people','people','active','2026-10-01 04:57:15','2026-10-01 04:57:15'),(299,'eyes','eyes','active','2026-10-01 04:57:15','2026-10-01 04:57:15'),(300,'beauty','beauty','active','2026-10-01 04:57:15','2026-10-01 04:57:15'),(301,'fashion','fashion','active','2026-10-01 04:57:15','2026-10-01 04:57:15'),(302,'lifestyle','lifestyle','active','2026-10-01 04:57:15','2026-10-01 04:57:15'),(303,'street photography','street-photography','active','2026-10-01 04:57:15','2026-10-01 04:57:15'),(304,'tokyo','tokyo','active','2026-10-01 04:57:15','2026-10-01 04:57:15'),(305,'rain','rain','active','2026-10-01 04:57:15','2026-10-01 04:57:15'),(306,'urban','urban','active','2026-10-01 04:57:15','2026-10-01 04:57:15'),(307,'night','night','active','2026-10-01 04:57:15','2026-10-01 04:57:15'),(308,'city','city','active','2026-10-01 04:57:15','2026-10-01 04:57:15'),(309,'candid','candid','active','2026-10-01 04:57:15','2026-10-01 04:57:15'),(310,'cyberpunk','cyberpunk','active','2026-10-01 04:57:15','2026-10-01 04:57:15'),(311,'model','model','active','2026-10-01 04:57:15','2026-10-01 04:57:15'),(312,'glasses','glasses','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(313,'style','style','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(314,'fitness','fitness','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(315,'runner','runner','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(316,'athlete','athlete','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(317,'sports','sports','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(318,'training','training','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(319,'health','health','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(320,'morning','morning','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(321,'exercise','exercise','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(322,'mountain','mountain','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(323,'sunrise','sunrise','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(324,'nature','nature','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(325,'landscape','landscape','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(326,'pine','pine','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(327,'fog','fog','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(328,'wilderness','wilderness','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(329,'adventure','adventure','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(330,'travel','travel','active','2026-10-01 04:57:16','2026-10-01 04:57:16'),(331,'view','view','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(332,'forest','forest','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(333,'trees','trees','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(334,'sunbeams','sunbeams','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(335,'emerald','emerald','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(336,'woods','woods','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(337,'canopy','canopy','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(338,'green','green','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(339,'ocean','ocean','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(340,'beach','beach','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(341,'sunset','sunset','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(342,'waves','waves','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(343,'coast','coast','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(344,'sea','sea','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(345,'water','water','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(346,'tropical','tropical','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(347,'cliffs','cliffs','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(348,'bioluminescent','bioluminescent','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(349,'fantasy','fantasy','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(350,'glow','glow','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(351,'alien','alien','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(352,'digital art','digital-art','active','2026-10-01 04:57:17','2026-10-01 04:57:17'),(353,'wildlife','wildlife','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(354,'animals','animals','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(355,'snow leopard','snow-leopard','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(356,'mountains','mountains','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(357,'winter','winter','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(358,'predator','predator','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(359,'cat','cat','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(360,'flowers','flowers','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(361,'meadow','meadow','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(362,'spring','spring','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(363,'bloom','bloom','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(364,'field','field','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(365,'colorful','colorful','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(366,'plants','plants','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(367,'sunshine','sunshine','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(368,'skyscraper','skyscraper','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(369,'building','building','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(370,'glass','glass','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(371,'geometric','geometric','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(372,'sky','sky','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(373,'solarpunk','solarpunk','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(374,'cityscape','cityscape','active','2026-10-01 04:57:18','2026-10-01 04:57:18'),(375,'green city','green-city','active','2026-10-01 04:57:20','2026-10-01 04:57:20'),(376,'skyline','skyline','active','2026-10-01 04:57:20','2026-10-01 04:57:20'),(377,'living room','living-room','active','2026-10-01 04:57:20','2026-10-01 04:57:20'),(378,'scandinavian','scandinavian','active','2026-10-01 04:57:20','2026-10-01 04:57:20'),(379,'home','home','active','2026-10-01 04:57:20','2026-10-01 04:57:20'),(380,'decor','decor','active','2026-10-01 04:57:20','2026-10-01 04:57:20'),(381,'wood','wood','active','2026-10-01 04:57:20','2026-10-01 04:57:20'),(382,'historic','historic','active','2026-10-01 04:57:20','2026-10-01 04:57:20'),(383,'cathedral','cathedral','active','2026-10-01 04:57:20','2026-10-01 04:57:20'),(384,'gothic','gothic','active','2026-10-01 04:57:20','2026-10-01 04:57:20'),(385,'monument','monument','active','2026-10-01 04:57:20','2026-10-01 04:57:20'),(386,'heritage','heritage','active','2026-10-01 04:57:21','2026-10-01 04:57:21'),(387,'ancient','ancient','active','2026-10-01 04:57:21','2026-10-01 04:57:21'),(388,'stone','stone','active','2026-10-01 04:57:21','2026-10-01 04:57:21'),(389,'drone','drone','active','2026-10-01 04:57:21','2026-10-01 04:57:21'),(390,'aerial','aerial','active','2026-10-01 04:57:21','2026-10-01 04:57:21'),(391,'river','river','active','2026-10-01 04:57:21','2026-10-01 04:57:21'),(392,'valley','valley','active','2026-10-01 04:57:21','2026-10-01 04:57:21'),(393,'camping','camping','active','2026-10-01 04:57:21','2026-10-01 04:57:21'),(394,'milky way','milky-way','active','2026-10-01 04:57:21','2026-10-01 04:57:21'),(395,'stars','stars','active','2026-10-01 04:57:21','2026-10-01 04:57:21'),(396,'tent','tent','active','2026-10-01 04:57:21','2026-10-01 04:57:21'),(397,'astrophotography','astrophotography','active','2026-10-01 04:57:21','2026-10-01 04:57:21'),(398,'road trip','road-trip','active','2026-10-01 04:57:21','2026-10-01 04:57:21'),(399,'desert','desert','active','2026-10-01 04:57:21','2026-10-01 04:57:21'),(400,'highway','highway','active','2026-10-01 04:57:21','2026-10-01 04:57:21'),(401,'journey','journey','active','2026-10-01 04:57:21','2026-10-01 04:57:21'),(402,'vacation','vacation','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(403,'explore','explore','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(404,'coffee','coffee','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(405,'latte art','latte-art','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(406,'café','caf','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(407,'beans','beans','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(408,'espresso','espresso','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(409,'drink','drink','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(410,'beverage','beverage','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(411,'barista','barista','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(412,'fruits','fruits','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(413,'citrus','citrus','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(414,'healthy','healthy','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(415,'splash','splash','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(416,'food','food','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(417,'fresh','fresh','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(418,'organic','organic','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(419,'vitamins','vitamins','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(420,'dessert','dessert','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(421,'chocolate','chocolate','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(422,'gourmet','gourmet','active','2026-10-01 04:57:22','2026-10-01 04:57:22'),(423,'pastry','pastry','active','2026-10-01 04:57:23','2026-10-01 04:57:23'),(424,'bakery','bakery','active','2026-10-01 04:57:23','2026-10-01 04:57:23'),(425,'sweet','sweet','active','2026-10-01 04:57:23','2026-10-01 04:57:23'),(426,'food photography','food-photography','active','2026-10-01 04:57:23','2026-10-01 04:57:23'),(427,'workspace','workspace','active','2026-10-01 04:57:23','2026-10-01 04:57:23'),(428,'desk','desk','active','2026-10-01 04:57:23','2026-10-01 04:57:23'),(429,'laptop','laptop','active','2026-10-01 04:57:23','2026-10-01 04:57:23'),(430,'remote work','remote-work','active','2026-10-01 04:57:23','2026-10-01 04:57:23'),(431,'office','office','active','2026-10-01 04:57:23','2026-10-01 04:57:23'),(432,'teamwork','teamwork','active','2026-10-01 04:57:23','2026-10-01 04:57:23'),(433,'meeting','meeting','active','2026-10-01 04:57:23','2026-10-01 04:57:23'),(434,'collaboration','collaboration','active','2026-10-01 04:57:23','2026-10-01 04:57:23'),(435,'strategy','strategy','active','2026-10-01 04:57:23','2026-10-01 04:57:23'),(436,'quantum','quantum','active','2026-10-01 04:57:24','2026-10-01 04:57:24'),(437,'wallpaper','wallpaper','active','2026-10-01 04:57:24','2026-10-01 04:57:24'),(438,'silk','silk','active','2026-10-01 04:57:24','2026-10-01 04:57:24'),(439,'moody','moody','active','2026-10-01 04:57:24','2026-10-01 04:57:24'),(440,'gradient','gradient','active','2026-10-01 04:57:24','2026-10-01 04:57:24'),(441,'purple','purple','active','2026-10-01 04:57:24','2026-10-01 04:57:24'),(442,'macro','macro','active','2026-10-01 04:57:24','2026-10-01 04:57:24'),(443,'raindrops','raindrops','active','2026-10-01 04:57:24','2026-10-01 04:57:24'),(444,'leaf','leaf','active','2026-10-01 04:57:25','2026-10-01 04:57:25'),(445,'botanical','botanical','active','2026-10-01 04:57:25','2026-10-01 04:57:25'),(446,'natural','natural','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(447,'man','man','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(448,'bearded','bearded','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(449,'cinematic','cinematic','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(450,'shadows','shadows','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(451,'male','male','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(452,'elderly','elderly','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(453,'smile','smile','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(454,'happy','happy','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(455,'grandmother','grandmother','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(456,'warm','warm','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(457,'garden','garden','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(458,'renaissance','renaissance','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(459,'painting','painting','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(460,'royal','royal','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(461,'classical','classical','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(462,'art','art','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(463,'freckles','freckles','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(464,'summer','summer','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(465,'sunlight','sunlight','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(466,'boho','boho','active','2026-10-01 05:01:38','2026-10-01 05:01:38'),(467,'girl','girl','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(468,'hologram','hologram','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(469,'avatar','avatar','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(470,'sci fi','sci-fi','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(471,'square','square','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(472,'street','street','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(473,'japan','japan','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(474,'black and white','black-and-white','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(475,'london','london','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(476,'crosswalk','crosswalk','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(477,'commute','commute','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(478,'pedestrians','pedestrians','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(479,'musician','musician','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(480,'subway','subway','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(481,'guitar','guitar','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(482,'music','music','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(483,'vertical','vertical','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(484,'steampunk','steampunk','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(485,'victorian','victorian','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(486,'airship','airship','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(487,'megacity','megacity','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(488,'skateboarding','skateboarding','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(489,'silhouette','silhouette','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(490,'action','action','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(491,'youth','youth','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(492,'yellow','yellow','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(493,'trench coat','trench-coat','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(494,'editorial','editorial','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(495,'vibrant','vibrant','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(496,'streetwear','streetwear','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(497,'hoodie','hoodie','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(498,'sneakers','sneakers','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(499,'couture','couture','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(500,'dress','dress','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(501,'runway','runway','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(502,'elegant','elegant','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(503,'avant garde','avant-garde','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(504,'holographic','holographic','active','2026-10-01 05:01:39','2026-10-01 05:01:39'),(505,'future fashion','future-fashion','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(506,'techwear','techwear','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(507,'clothing','clothing','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(508,'yoga','yoga','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(509,'wellness','wellness','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(510,'cliff','cliff','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(511,'mindfulness','mindfulness','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(512,'workout','workout','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(513,'gym','gym','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(514,'crossfit','crossfit','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(515,'battle ropes','battle-ropes','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(516,'muscle','muscle','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(517,'running','running','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(518,'track','track','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(519,'sprint','sprint','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(520,'competition','competition','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(521,'cyborg','cyborg','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(522,'prosthetics','prosthetics','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(523,'meditation','meditation','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(524,'levitation','levitation','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(525,'zen','zen','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(526,'spiritual','spiritual','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(527,'energy','energy','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(528,'family','family','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(529,'picnic','picnic','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(530,'parents','parents','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(531,'children','children','active','2026-10-01 05:01:40','2026-10-01 05:01:40'),(532,'park','park','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(533,'couple','couple','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(534,'love','love','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(535,'romance','romance','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(536,'relationship','relationship','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(537,'hygge','hygge','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(538,'cozy','cozy','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(539,'bed','bed','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(540,'cottage','cottage','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(541,'hearth','hearth','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(542,'fireplace','fireplace','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(543,'mars','mars','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(544,'space colony','space-colony','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(545,'future living','future-living','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(546,'emotions','emotions','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(547,'joy','joy','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(548,'laughter','laughter','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(549,'play','play','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(550,'melancholy','melancholy','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(551,'window','window','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(552,'sadness','sadness','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(553,'contemplation','contemplation','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(554,'peace','peace','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(555,'solitude','solitude','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(556,'dawn','dawn','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(557,'hiking','hiking','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(558,'freedom','freedom','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(559,'anxiety','anxiety','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(560,'psychology','psychology','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(561,'mind','mind','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(562,'surreal','surreal','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(563,'euphoria','euphoria','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(564,'happiness','happiness','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(565,'golden light','golden-light','active','2026-10-01 05:01:41','2026-10-01 05:01:41'),(566,'transcendence','transcendence','active','2026-10-01 05:01:42','2026-10-01 05:01:42'),(567,'character','character','active','2026-10-01 05:02:04','2026-10-01 05:02:04'),(568,'noble','noble','active','2026-10-01 05:02:05','2026-10-01 05:02:05'),(569,'lights','lights','active','2026-10-01 05:02:05','2026-10-01 05:02:05'),(570,'snow','snow','active','2026-10-01 05:02:07','2026-10-01 05:02:07'),(571,'alps','alps','active','2026-10-01 05:02:07','2026-10-01 05:02:07'),(572,'peaks','peaks','active','2026-10-01 05:02:07','2026-10-01 05:02:07'),(573,'dolomites','dolomites','active','2026-10-01 05:02:07','2026-10-01 05:02:07'),(574,'italy','italy','active','2026-10-01 05:02:07','2026-10-01 05:02:07'),(575,'floating island','floating-island','active','2026-10-01 05:02:07','2026-10-01 05:02:07'),(576,'crystal','crystal','active','2026-10-01 05:02:07','2026-10-01 05:02:07'),(577,'lake','lake','active','2026-10-01 05:02:07','2026-10-01 05:02:07'),(578,'reflection','reflection','active','2026-10-01 05:02:07','2026-10-01 05:02:07'),(579,'glacier','glacier','active','2026-10-01 05:02:07','2026-10-01 05:02:07'),(580,'rockies','rockies','active','2026-10-01 05:02:07','2026-10-01 05:02:07'),(581,'canada','canada','active','2026-10-01 05:02:07','2026-10-01 05:02:07'),(582,'redwoods','redwoods','active','2026-10-01 05:02:07','2026-10-01 05:02:07'),(583,'autumn','autumn','active','2026-10-01 05:02:08','2026-10-01 05:02:08'),(584,'leaves','leaves','active','2026-10-01 05:02:08','2026-10-01 05:02:08'),(585,'fall','fall','active','2026-10-01 05:02:08','2026-10-01 05:02:08'),(586,'golden','golden','active','2026-10-01 05:02:08','2026-10-01 05:02:08'),(587,'path','path','active','2026-10-01 05:02:08','2026-10-01 05:02:08'),(588,'fairy tale','fairy-tale','active','2026-10-01 05:02:08','2026-10-01 05:02:08'),(589,'magic','magic','active','2026-10-01 05:02:08','2026-10-01 05:02:08'),(590,'mushrooms','mushrooms','active','2026-10-01 05:02:08','2026-10-01 05:02:08'),(591,'palm trees','palm-trees','active','2026-10-01 05:02:08','2026-10-01 05:02:08'),(592,'paradise','paradise','active','2026-10-01 05:02:08','2026-10-01 05:02:08'),(593,'surf','surf','active','2026-10-01 05:02:08','2026-10-01 05:02:08'),(594,'blue','blue','active','2026-10-01 05:02:09','2026-10-01 05:02:09'),(595,'underwater','underwater','active','2026-10-01 05:02:09','2026-10-01 05:02:09'),(596,'atlantis','atlantis','active','2026-10-01 05:02:09','2026-10-01 05:02:09'),(597,'coral','coral','active','2026-10-01 05:02:09','2026-10-01 05:02:09'),(598,'marine','marine','active','2026-10-01 05:02:09','2026-10-01 05:02:09'),(599,'horizon','horizon','active','2026-10-01 05:02:09','2026-10-01 05:02:09'),(600,'crimson','crimson','active','2026-10-01 05:02:09','2026-10-01 05:02:09'),(601,'clouds','clouds','active','2026-10-01 05:02:09','2026-10-01 05:02:09'),(602,'mist','mist','active','2026-10-01 05:02:09','2026-10-01 05:02:09'),(603,'tranquil','tranquil','active','2026-10-01 05:02:09','2026-10-01 05:02:09'),(604,'lion','lion','active','2026-10-01 05:02:09','2026-10-01 05:02:09'),(605,'safari','safari','active','2026-10-01 05:02:09','2026-10-01 05:02:09'),(606,'africa','africa','active','2026-10-01 05:02:09','2026-10-01 05:02:09'),(607,'fox','fox','active','2026-10-01 05:02:10','2026-10-01 05:02:10'),(608,'wild','wild','active','2026-10-01 05:02:10','2026-10-01 05:02:10'),(609,'cyber wolf','cyber-wolf','active','2026-10-01 05:02:10','2026-10-01 05:02:10'),(610,'cherry blossom','cherry-blossom','active','2026-10-01 05:02:10','2026-10-01 05:02:10'),(611,'sakura','sakura','active','2026-10-01 05:02:10','2026-10-01 05:02:10'),(612,'pink','pink','active','2026-10-01 05:02:10','2026-10-01 05:02:10'),(613,'rose','rose','active','2026-10-01 05:02:10','2026-10-01 05:02:10'),(614,'water drops','water-drops','active','2026-10-01 05:02:10','2026-10-01 05:02:10'),(615,'red','red','active','2026-10-01 05:02:11','2026-10-01 05:02:11'),(616,'petals','petals','active','2026-10-01 05:02:11','2026-10-01 05:02:11'),(617,'crystal flower','crystal-flower','active','2026-10-01 05:02:11','2026-10-01 05:02:11'),(642,'electronics','electronics','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(653,'biotech','biotech','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(654,'simulation','simulation','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(657,'fiction','fiction','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(660,'technical','technical','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(662,'cables','cables','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(663,'frame','frame','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(664,'structure','structure','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(702,'connection','connection','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(738,'generative','generative','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(744,'experience','experience','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(746,'folder','folder','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(747,'icons','icons','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(756,'internet','internet','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(758,'productivity','productivity','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(759,'tools','tools','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(793,'helper','helper','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(795,'customer','customer','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(796,'support','support','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(799,'bokeh','bokeh','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(804,'smooth','smooth','active','2026-10-01 06:00:03','2026-10-01 06:00:03'),(847,'mainframe','mainframe','active','2026-10-01 06:00:08','2026-10-01 06:00:08'),(852,'binary','binary','active','2026-10-01 06:00:08','2026-10-01 06:00:08'),(853,'infrastructure','infrastructure','active','2026-10-01 06:00:08','2026-10-01 06:00:08'),(900,'trend','trend','active','2026-10-01 06:02:02','2026-10-01 06:02:02'),(948,'glossy','glossy','active','2026-10-01 06:02:02','2026-10-01 06:02:02'),(950,'sensor','sensor','active','2026-10-01 06:02:02','2026-10-01 06:02:02'),(959,'cpu','cpu','active','2026-10-01 06:02:02','2026-10-01 06:02:02'),(1042,'science-fiction','science-fiction','active','2026-10-01 06:02:02','2026-10-01 06:02:02'),(1043,'scifi','scifi','active','2026-10-01 06:02:02','2026-10-01 06:02:02'),(1044,'evolution','evolution','active','2026-10-01 06:02:02','2026-10-01 06:02:02'),(1045,'human-like','human-like','active','2026-10-01 06:02:02','2026-10-01 06:02:02'),(1048,'body','body','active','2026-10-01 06:02:02','2026-10-01 06:02:02'),(1050,'joints','joints','active','2026-10-01 06:02:02','2026-10-01 06:02:02'),(1097,'techy','techy','active','2026-10-01 06:02:02','2026-10-01 06:02:02'),(1113,'progress','progress','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1114,'touch','touch','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1115,'fingers','fingers','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1116,'contact','contact','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1120,'magenta','magenta','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1130,'integration','integration','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1138,'discovery','discovery','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1144,'creative','creative','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1184,'shelving','shelving','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1185,'inventory','inventory','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1189,'mechanics','mechanics','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1204,'nodes','nodes','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1205,'lines','lines','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1222,'particle','particle','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1223,'dynamic','dynamic','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1226,'matrix','matrix','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1228,'link','link','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1230,'cloud','cloud','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1232,'security','security','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1236,'mesh','mesh','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1237,'depth','depth','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1238,'space','space','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1242,'flow','flow','active','2026-10-01 06:09:33','2026-10-01 06:09:33'),(1272,'sleek','sleek','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1290,'profile','profile','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1291,'closeup','closeup','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1322,'translucent','translucent','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1326,'reaching','reaching','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1340,'typewriter','typewriter','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1341,'vintage','vintage','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1349,'retro','retro','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1350,'writing','writing','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1361,'classic','classic','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1362,'document','document','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1363,'paper','paper','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1364,'text','text','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1365,'typography','typography','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1366,'keyboard','keyboard','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1367,'old','old','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1372,'algorithm','algorithm','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1377,'history','history','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1378,'nostalgia','nostalgia','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1380,'manual','manual','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1382,'idea','idea','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1401,'blueprint','blueprint','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1402,'grid','grid','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1434,'silicon','silicon','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1435,'innovative','innovative','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1455,'contrast','contrast','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1465,'humanity','humanity','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1473,'partnership','partnership','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1474,'unity','unity','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1478,'biology','biology','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1480,'networking','networking','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1481,'transformation','transformation','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1486,'brain','brain','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1519,'neural','neural','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1528,'analysis','analysis','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1550,'geometry','geometry','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1556,'visualization','visualization','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1561,'thought','thought','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1567,'sphere','sphere','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1620,'electrical','electrical','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1623,'memory','memory','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1624,'techology','techology','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1625,'microprocessor','microprocessor','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1633,'search','search','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1634,'engine','engine','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1637,'mode','mode','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1639,'backlit','backlit','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1641,'monitor','monitor','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1645,'browser','browser','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1656,'coding','coding','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1657,'programming','programming','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1658,'developer','developer','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1667,'startup','startup','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1670,'typing','typing','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1692,'openai','openai','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1693,'logo','logo','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1694,'symbol','symbol','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1710,'deep','deep','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1745,'button','button','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1746,'key','key','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1763,'input','input','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1770,'future tech','future-tech','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1771,'smart tech','smart-tech','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1776,'question','question','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1777,'mark','mark','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1778,'handwritten','handwritten','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1779,'marker','marker','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1780,'whiteboard','whiteboard','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1784,'uncertainty','uncertainty','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1785,'debate','debate','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1801,'minimal','minimal','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1805,'problem','problem','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1807,'ethics','ethics','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1809,'trends','trends','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1812,'systems','systems','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1818,'conceptual','conceptual','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1819,'perspective','perspective','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1846,'hexagonal','hexagonal','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1860,'digitalization','digitalization','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1862,'complexity','complexity','active','2026-10-01 06:09:49','2026-10-01 06:09:49'),(1875,'iridescent','iridescent','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(1905,'artistic','artistic','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(1907,'blocks','blocks','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(1908,'cubes','cubes','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(1911,'reality','reality','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(1915,'visual','visual','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(1931,'sticky','sticky','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(1932,'note','note','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(1938,'person','person','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(1939,'professional','professional','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(1953,'futuretech','futuretech','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(1959,'focus','focus','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(1960,'blurred','blurred','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(1963,'message','message','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(1964,'sign','sign','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(1972,'head','head','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2039,'keys','keys','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2059,'workplace','workplace','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2072,'machine learning','machine-learning','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2081,'dark mode','dark-mode','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2086,'neural network','neural-network','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2092,'knowledge','knowledge','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2100,'user experience','user-experience','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2101,'ui','ui','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2102,'ux','ux','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2103,'screen capture','screen-capture','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2108,'software engineering','software-engineering','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2161,'camera','camera','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2178,'photography','photography','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2195,'capture','capture','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2226,'bench','bench','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2227,'indoor','indoor','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2242,'tech industry','tech-industry','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2245,'intelligent','intelligent','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2246,'robot design','robot-design','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2247,'tech concept','tech-concept','active','2026-10-01 06:09:50','2026-10-01 06:09:50'),(2248,'digital world','digital-world','active','2026-10-01 06:09:50','2026-10-01 06:09:50');
/*!40000 ALTER TABLE `tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `testimonials`
--

DROP TABLE IF EXISTS `testimonials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `testimonials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `designation` varchar(100) DEFAULT '',
  `message` text NOT NULL,
  `avatar_url` varchar(255) DEFAULT '',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `testimonials`
--

LOCK TABLES `testimonials` WRITE;
/*!40000 ALTER TABLE `testimonials` DISABLE KEYS */;
INSERT INTO `testimonials` VALUES (1,'Alex Johnson','Graphic Designer','DayalStock has been a lifesaver for my freelance projects. The quality of vectors is unmatched and the pricing is very reasonable!','','active','2026-07-19 10:41:00','2026-07-19 10:41:00'),(2,'Sarah Williams','Marketing Agency','We use DayalStock for all our client campaigns. The unlimited downloads on the Pro plan makes our workflow incredibly fast and efficient.','','active','2026-07-19 10:41:00','2026-07-19 10:41:00'),(3,'Michael Chen','Web Developer','Finding good stock photos used to take hours. Now with DayalStock, I can find exactly what I need in minutes. Highly recommended for developers building landing pages.','','active','2026-07-19 10:41:00','2026-07-19 10:41:00'),(4,'Alex Johnson','Graphic Designer','DayalStock has been a lifesaver for my freelance projects. The quality of vectors is unmatched and the pricing is very reasonable!','','active','2026-07-19 10:43:27','2026-07-19 10:43:27'),(5,'Sarah Williams','Marketing Agency','We use DayalStock for all our client campaigns. The unlimited downloads on the Pro plan makes our workflow incredibly fast and efficient.','','active','2026-07-19 10:43:27','2026-07-19 10:43:27'),(6,'Michael Chen','Web Developer','Finding good stock photos used to take hours. Now with DayalStock, I can find exactly what I need in minutes. Highly recommended for developers building landing pages.','','active','2026-07-19 10:43:27','2026-07-19 10:43:27'),(7,'Alex Johnson','Graphic Designer','DayalStock has been a lifesaver for my freelance projects. The quality of vectors is unmatched and the pricing is very reasonable!','','active','2026-07-19 11:37:38','2026-07-19 11:37:38'),(8,'Sarah Williams','Marketing Agency','We use DayalStock for all our client campaigns. The unlimited downloads on the Pro plan makes our workflow incredibly fast and efficient.','','active','2026-07-19 11:37:38','2026-07-19 11:37:38'),(9,'Michael Chen','Web Developer','Finding good stock photos used to take hours. Now with DayalStock, I can find exactly what I need in minutes. Highly recommended for developers building landing pages.','','active','2026-07-19 11:37:38','2026-07-19 11:37:38'),(10,'Alex Johnson','Graphic Designer','DayalStock has been a lifesaver for my freelance projects. The quality of vectors is unmatched and the pricing is very reasonable!','','active','2026-07-19 11:37:39','2026-07-19 11:37:39'),(11,'Sarah Williams','Marketing Agency','We use DayalStock for all our client campaigns. The unlimited downloads on the Pro plan makes our workflow incredibly fast and efficient.','','active','2026-07-19 11:37:39','2026-07-19 11:37:39'),(12,'Michael Chen','Web Developer','Finding good stock photos used to take hours. Now with DayalStock, I can find exactly what I need in minutes. Highly recommended for developers building landing pages.','','active','2026-07-19 11:37:39','2026-07-19 11:37:39'),(13,'Alex Johnson','Graphic Designer','DayalStock has been a lifesaver for my freelance projects. The quality of vectors is unmatched and the pricing is very reasonable!','','active','2026-07-19 11:37:39','2026-07-19 11:37:39'),(14,'Sarah Williams','Marketing Agency','We use DayalStock for all our client campaigns. The unlimited downloads on the Pro plan makes our workflow incredibly fast and efficient.','','active','2026-07-19 11:37:39','2026-07-19 11:37:39'),(15,'Michael Chen','Web Developer','Finding good stock photos used to take hours. Now with DayalStock, I can find exactly what I need in minutes. Highly recommended for developers building landing pages.','','active','2026-07-19 11:37:39','2026-07-19 11:37:39');
/*!40000 ALTER TABLE `testimonials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_messages`
--

DROP TABLE IF EXISTS `ticket_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ticket_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` varchar(50) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `attachment_url` varchar(500) DEFAULT NULL,
  `is_admin_reply` tinyint(1) DEFAULT 0,
  `is_internal_note` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_messages`
--

LOCK TABLES `ticket_messages` WRITE;
/*!40000 ALTER TABLE `ticket_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_collections`
--

DROP TABLE IF EXISTS `user_collections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_collections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `is_public` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_user_collections_user` (`user_id`),
  CONSTRAINT `fk_user_collections_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_collections`
--

LOCK TABLES `user_collections` WRITE;
/*!40000 ALTER TABLE `user_collections` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_collections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_credits`
--

DROP TABLE IF EXISTS `user_credits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_credits` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `package_id` int(10) unsigned DEFAULT NULL COMMENT '????????? ????????????????????? ???????????? ???????????????',
  `images_total` int(10) unsigned NOT NULL DEFAULT 0,
  `images_remaining` int(10) unsigned NOT NULL DEFAULT 0,
  `videos_total` int(10) unsigned NOT NULL DEFAULT 0,
  `videos_remaining` int(10) unsigned NOT NULL DEFAULT 0,
  `audios_total` int(10) unsigned NOT NULL DEFAULT 0,
  `audios_remaining` int(10) unsigned NOT NULL DEFAULT 0,
  `status` enum('active','expired','exhausted') NOT NULL DEFAULT 'active',
  `expires_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_credits`
--

LOCK TABLES `user_credits` WRITE;
/*!40000 ALTER TABLE `user_credits` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_credits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_reports`
--

DROP TABLE IF EXISTS `user_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `target_user_id` int(11) NOT NULL,
  `reporter_id` int(11) DEFAULT NULL,
  `reporter_name` varchar(255) DEFAULT NULL,
  `reporter_email` varchar(255) DEFAULT NULL,
  `reason` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
  `admin_note` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_by_name` varchar(255) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `action_taken` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_target_user_id` (`target_user_id`),
  KEY `idx_reporter_id` (`reporter_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_reports`
--

LOCK TABLES `user_reports` WRITE;
/*!40000 ALTER TABLE `user_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `role` enum('user','premium','author','manager','admin') NOT NULL DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_role` (`user_id`,`role`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1,'user','2026-09-13 07:42:43'),(2,1,'admin','2026-09-13 07:42:43'),(3,2,'user','2026-09-13 08:13:25'),(6,5,'user','2026-09-13 08:19:21'),(9,3,'user','2026-09-13 09:13:52'),(11,4,'user','2026-09-13 10:12:59'),(13,6,'user','2026-09-13 10:34:36'),(15,7,'user','2026-09-14 04:42:49'),(18,8,'user','2026-09-29 05:13:22'),(20,8,'admin','2026-09-29 05:13:22'),(21,9,'user','2026-10-01 06:13:46');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_subscriptions`
--

DROP TABLE IF EXISTS `user_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_subscriptions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `plan_id` int(10) unsigned NOT NULL,
  `transaction_id` bigint(20) unsigned DEFAULT NULL,
  `status` enum('active','expired','cancelled','pending') NOT NULL DEFAULT 'pending',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `auto_renew` tinyint(1) NOT NULL DEFAULT 0,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `images_used` int(11) DEFAULT 0,
  `videos_used` int(11) DEFAULT 0,
  `period_start` datetime DEFAULT NULL,
  `period_end` datetime DEFAULT NULL,
  `earnings_processed` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_plan_id` (`plan_id`),
  KEY `idx_status` (`status`),
  KEY `idx_end_date` (`end_date`),
  KEY `transaction_id` (`transaction_id`),
  CONSTRAINT `fk_subscription_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_subscription_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_subscriptions_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `payment_transactions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_subscriptions`
--

LOCK TABLES `user_subscriptions` WRITE;
/*!40000 ALTER TABLE `user_subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `photo` varchar(500) DEFAULT NULL,
  `cover_photo` varchar(255) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `status` enum('active','suspended','banned','deactivated') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `last_active` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Dayal Stock','dayalstock','dayalstock.com@gmail.com','$2y$10$h3YNvhuGk1yAFo7yDtPQ0OqED2vQbP/6lkOVfcXczlxsnIxTagH66',NULL,NULL,NULL,'active','2026-09-13 07:42:43','2026-09-29 11:14:04'),(2,'Ashraful Islam','ashrafulislam','mdashrafulislamsiam@gmail.com','$2y$10$c4swNYvGKW/CkqHkuwQbSOh.sQCpoZ1eWyMNyGq5MaX6aoPZQvLzm',NULL,NULL,NULL,'suspended','2026-09-13 08:13:25',NULL),(3,'Ashraful Islam','ashrafulislam8702','mdashrafulislamsiam212@gmail.com','$2y$10$QhwHmNAcUnGpU8ZNjdRcXulfIc3OHFkfOf5lEQKj1MY9i9w3Mr0hO',NULL,NULL,NULL,'active','2026-09-13 08:14:39','2026-09-13 16:11:53'),(4,'Rahima Begum','rahimabegum','srsailasathi24022004@gmail.com','$2y$10$e128tBiJovxxo6/4x2gJK./fXpVGkYY4nCPT2NJG4Mdrm6Pc2u7Fe',NULL,NULL,NULL,'active','2026-09-13 08:16:40','2026-09-14 12:03:51'),(5,'Akhi Akter','akhiakter','mdskalim20@gmail.com','$2y$10$SZPu5ynJ8EYZ7tqlwitleei/hMR/xeQTwyq98yu8CrScoK28XnpzG',NULL,NULL,NULL,'suspended','2026-09-13 08:19:21',NULL),(6,'Akhi Akter','akhiakter7485','mdsksalim20@gmail.com','$2y$10$ZW5efOf9WflWYL1ji1k8CeF/XbAf1gpnwAcf37J6k2UhP2rgAaUhW',NULL,NULL,NULL,'active','2026-09-13 08:20:32','2026-09-19 17:14:02'),(7,'Happy Akter','happyakter','sadiya119220@gmail.com','$2y$10$DBnhw2Tt9TRSNj42On7i0.L2vlZG0BnA3ePjTXyPBod3HQlQ7tdIy',NULL,NULL,NULL,'active','2026-09-13 08:21:38','2026-09-20 09:32:45'),(8,'Admin User','admin','admin@gmail.com','$2y$10$h3YNvhuGk1yAFo7yDtPQ0OqED2vQbP/6lkOVfcXczlxsnIxTagH66',NULL,NULL,NULL,'active','2026-09-29 05:13:22','2026-10-03 11:29:35'),(9,'CREATIVE COMPUTER ACADEMY','creativecomputeracademybd','creativecomputeracademybd@gmail.com','$2y$10$uJyghtowHqUfJPM0G9PF9eySmZ.NbSqQjuPGr80V3b7WaGdidTGpW','uploads/users/creativecomputeracademybd_9_1790998224.webp',NULL,'','active','2026-10-01 06:13:46','2026-10-01 12:13:46');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `visitor_logs`
--

DROP TABLE IF EXISTS `visitor_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `visitor_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Unique Visitor Log ID',
  `user_id` int(11) DEFAULT NULL COMMENT 'Logged-in User ID, Guest ????????? NULL',
  `session_id` varchar(255) NOT NULL COMMENT 'Unique Session ID',
  `ip_address` varchar(45) NOT NULL COMMENT 'Visitor IP Address',
  `is_vpn` tinyint(1) DEFAULT 0 COMMENT '0 = No VPN, 1 = VPN',
  `country` varchar(100) DEFAULT NULL COMMENT 'Country',
  `region` varchar(100) DEFAULT NULL COMMENT 'State / Division',
  `city` varchar(100) DEFAULT NULL COMMENT 'City',
  `page_url` varchar(500) NOT NULL COMMENT 'Visited URL',
  `page_title` varchar(255) DEFAULT NULL COMMENT 'Page Title',
  `referrer` varchar(500) DEFAULT NULL COMMENT 'Google / Facebook / Direct',
  `browser` varchar(100) DEFAULT NULL COMMENT 'Chrome / Firefox / Safari',
  `os` varchar(100) DEFAULT NULL COMMENT 'Windows / Android / iOS / macOS',
  `device_type` enum('Desktop','Mobile','Tablet','Bot','Unknown') DEFAULT 'Unknown' COMMENT 'Visitor Device',
  `user_agent` text DEFAULT NULL COMMENT 'Full Browser User-Agent',
  `language` varchar(20) DEFAULT NULL COMMENT 'Browser Language',
  `visit_duration` int(10) unsigned DEFAULT 0 COMMENT 'Visit Duration (Seconds)',
  `is_logged_in` tinyint(1) DEFAULT 0 COMMENT '0 = Guest, 1 = Logged In',
  `created_at` timestamp NULL DEFAULT current_timestamp() COMMENT 'Visit Time',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_country` (`country`),
  KEY `idx_city` (`city`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_page_url` (`page_url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `visitor_logs`
--

LOCK TABLES `visitor_logs` WRITE;
/*!40000 ALTER TABLE `visitor_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `visitor_logs` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-03 11:56:57
