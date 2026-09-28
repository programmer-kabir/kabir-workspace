# 🚀 IconBaba — Modern Vector Icon Library & Customization SaaS Platform

**IconBaba** is an enterprise-grade, full-stack digital asset platform and SaaS designed for designers, developers, and creative teams. It features **5,170+ precision-crafted vector icons (10,340+ Outlined and Filled variants)** across 42 curated categories, real-time in-browser vector manipulation, multi-format exports (SVG, PNG, React JSX), **Google Gemini AI-powered taxonomy & visual audit**, a dedicated **Admin Management Suite**, and **Lemon Squeezy** subscription billing.

---

## 🌟 Architecture & Key Features

### 🎨 1. Public Frontend (Vite + React 18 + TypeScript + Tailwind CSS)
- **5,170+ Icons & 10,340+ Variants**: High-quality MIT-licensed vector icons with instant toggling between **Outlined** and **Filled** styles.
- **Interactive Icon Canvas & Customization Toolbar**:
  - Live, debounced search across titles, categories, and AI-generated keyword tags.
  - Granular sizing stepper & slider (`16px` to `96px`).
  - Curated color palettes + full Hex / RGBA color picker.
  - Real-time stroke width adjustment (`1px` to `4px`).
  - Line Cap (`round`, `butt`, `square`) & Line Join (`round`, `bevel`, `miter`) selectors.
- **Multi-Format Vector & Raster Exporters**:
  - **Download SVG**: Clean, minified vector files matching live styling.
  - **Download PNG**: Instant HTML5 Canvas rendering at custom dimensions (`24px` to `512px`).
  - **Copy SVG**: Formatted raw vector markup copied to clipboard.
  - **Copy React JSX**: Converts SVG into modern, typed React / React Native components.
- **User Dashboard & Workspaces**:
  - **Favorites**: Instant icon bookmarking with persistent database sync.
  - **Collections**: Create, rename, share, and manage project-specific icon collections.
  - **Export History**: Comprehensive audit log of previously downloaded icons and formats.
  - **Team Seats & Collaboration**: Invite and manage team member access under Pro licenses.
- **Integrated CMS Pages**:
  - Dynamic Markdown-rendered legal and info pages: **Terms of Service**, **Privacy Policy**, **Refund Policy**, **Licenses (Free & Pro)**, **Pricing Plans**, **FAQ**, and **Contact Form**.

### 🤖 2. Google Gemini AI 2.5 Flash Engine
- **Automated SEO Tag Generation**: Batched multimodal AI taxonomy generator that analyzes icon geometry and produces 8–12 high-intent search keywords per icon.
- **Visual & Name Mismatch Auditor**: Analyzes raw SVG vector drawings against proposed filenames to detect misleading names, wrong glyphs, or mismatched categories with one-click **Auto-Fix** correction.

### 🛡️ 3. Layer 2 Vector Protection & DRM Security
- **Vector Obfuscation Engine**: Encodes raw SVG paths in server responses to prevent bulk automated catalog scraping while deobfuscating seamlessly in client memory.
- **Rate-Limiting & Quota Management**: Daily download tracking preventing brute-force harvesting.

### 💳 4. Billing & Subscription Management (Lemon Squeezy)
- **Flexible Plans**: Free Forever, Solo Pro Pass, Team Pro Subscription, and Lifetime Pass.
- **Webhook Integration**: Real-time webhook listener (`backend/api/subscriptions/webhook.php`) synchronizing orders, subscription renewals, seat allocations, and cancellations.
- **14-Day Money-Back Guarantee**: Full transparency and refund workflows.

### 👑 5. Dedicated Admin Control Panel (`admin/`)
- **Dashboard Analytics**: Real-time metrics on total icons, categories, users, downloads, revenue, and system health.
- **Batch & Single Icon Upload**: Multi-file SVG uploader, drag-and-drop batch processing, and ZIP archive extraction.
- **Visual & Name Audit Tool**: Batch audit icon queue with Google Gemini AI before publishing.
- **Category & Taxonomy Manager**: Reorder, create, edit, and manage category hierarchies.
- **User & Subscription Admin**: Manage user roles (`admin`, `user`), suspend malicious accounts, and inspect active Pro passes.
- **Audit Logs & Activity Stream**: Immutable system event logging for all admin actions.

---

## 📁 Project Structure

```
iconbaba/
├── frontend/                          # Public User Application (Vite + React 18 + TS)
│   ├── public/                        # Static assets, logos, favicon, .htaccess
│   ├── src/
│   │   ├── components/                # UI Components (Header, Footer, Toolbar, Grid, Drawers)
│   │   │   ├── auth/                  # AuthModal, WelcomeToast, OTP Verification
│   │   │   ├── content/               # ContentPage, MarkdownRenderer
│   │   │   ├── drawer/                # IconDetailDrawer, ProtectedCanvasPreview
│   │   │   ├── grid/                  # IconGrid, IconCard
│   │   │   ├── header/                # SiteHeader, NotificationDropdown
│   │   │   ├── hero/                  # HomeHero
│   │   │   └── sidebar/               # CategorySidebar
│   │   ├── context/                   # AuthContext, IconCustomizationContext
│   │   ├── lib/                       # api.ts, svg-utils.ts, seo.ts
│   │   ├── pages/                     # HomePage, IconPage, PricingPage, TermsPage, etc.
│   │   ├── types/                     # TypeScript interfaces (icon.ts, cms.ts)
│   │   ├── App.tsx                    # React Router DOM configuration
│   │   └── main.tsx                   # React root mount
│   ├── .env.local                     # Frontend environment variables
│   └── package.json
│
├── admin/                             # Admin Management Suite (Vite + React 18 + TS)
│   ├── public/                        # Admin assets, logos, .htaccess
│   ├── src/
│   │   ├── components/                # AdminLayout, AdminNotificationDropdown
│   │   ├── lib/                       # api.ts (Admin typed endpoints)
│   │   ├── pages/                     # DashboardPage, IconsPage, IconUploadPage, UsersPage,
│   │   │                              # CategoriesPage, BillingPage, FaqPage, AuditLogsPage, etc.
│   │   ├── types/                     # Admin TypeScript definitions
│   │   ├── App.tsx                    # Admin Router configuration
│   │   └── main.tsx                   # Admin root mount
│   ├── .env                           # Admin environment variables
│   └── package.json
│
├── backend/                           # PHP 8.2+ REST API (Apache / LiteSpeed / Nginx)
│   ├── api/                           # Public & Admin JSON API Endpoints
│   │   ├── admin/                     # dashboard/, icons/, categories/, users/, pricing/, faq/
│   │   │   └── icons/                 # upload.php, batch_upload.php, ai_inspect_icons.php, ai_generate_tags.php
│   │   ├── auth/                      # register.php, login.php, logout.php, me.php, send_otp.php, verify_otp.php
│   │   ├── categories/                # list.php
│   │   ├── collections/               # list.php, create.php, single.php, add_item.php, remove_item.php
│   │   ├── contact/                   # submit.php
│   │   ├── content-pages/             # list.php, single.php, create.php, update.php, delete.php
│   │   ├── downloads/                 # history.php, log.php
│   │   ├── favorites/                 # list.php, add.php, remove.php, check.php
│   │   ├── icons/                     # list.php, single.php, quota.php, track_export.php
│   │   ├── notifications/             # list.php, mark_read.php, delete.php
│   │   ├── pricing/                   # list.php
│   │   ├── subscriptions/             # my.php, sync.php, webhook.php (Lemon Squeezy)
│   │   └── team/                      # list.php, add.php, remove.php, respond_invite.php
│   ├── config/
│   │   ├── database.php               # PDO connection, automatic .env loader
│   │   └── cors.php                   # Universal CORS, preflight OPTIONS & security headers
│   ├── database/
│   │   ├── migration_cms.php          # CMS & Legal tables migration script
│   │   ├── schema.sql                 # Base MySQL database schema
│   │   └── seed.sql                   # Full 5,170+ icon database seed
│   ├── helpers/
│   │   ├── auth.php                   # Session token auth & requireAdmin()
│   │   ├── gemini.php                 # Google Gemini API AI integration
│   │   ├── response.php               # Standardized JSON response helper
│   │   └── validator.php              # Input sanitizer & email/password validator
│   ├── uploads/                       # Storage directory for uploaded SVG assets
│   ├── .env                           # Backend environment secrets (DB, Gemini, Lemon Squeezy)
│   └── .htaccess                      # Authorization header forwarding & mod_rewrite
│
├── start-all.bat                      # One-click Windows launch script
└── README.md
```

---

## ⚙️ Environment Configuration

### 1. Backend Secrets (`backend/.env`)
```env
# Database Credentials
DB_HOST=localhost
DB_NAME=iconbaba
DB_USER=root
DB_PASSWORD=

# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Lemon Squeezy Payment Gateway
LEMON_SQUEEZY_API_KEY=your_lemon_squeezy_api_key
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_signing_secret
LEMON_SQUEEZY_STORE_ID=your_store_id
LEMON_SQUEEZY_SOLO_UUID=your_solo_product_uuid
LEMON_SQUEEZY_TEAM_UUID=your_team_product_uuid
```

### 2. Frontend Environment (`frontend/.env.local`)
```env
# Local Development
VITE_API_URL=http://localhost/iconbaba/backend/api
NEXT_PUBLIC_API_URL=http://localhost/iconbaba/backend/api

# Production Deployment
# VITE_API_URL=https://api.yourdomain.com/api
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### 3. Admin Environment (`admin/.env`)
```env
# Local Development
VITE_API_URL=http://localhost/iconbaba/backend/api

# Production Deployment
# VITE_API_URL=https://api.yourdomain.com/api
```

---

## 🚀 Running Locally (Windows / XAMPP)

### Prerequisites
- **XAMPP** installed at `C:\xampp` (with Apache and MySQL active).
- **Node.js 18+** & **npm**.
- Directory junction in `htdocs`:
  ```cmd
  mklink /J "C:\xampp\htdocs\iconbaba" "c:\Users\DAYALGURU\Desktop\KABIR\iconbaba"
  ```

### One-Click Launch
Double-click `start-all.bat` or run:
```cmd
start-all.bat
```

### Manual Service Start
1. **Start Backend**: Start Apache & MySQL in XAMPP.
2. **Start Frontend (Port 3000)**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. **Start Admin Panel (Port 3001)**:
   ```bash
   cd admin
   npm install
   npm run dev
   ```

---

## 🌐 Production Deployment Guide

### 1. Backend & Database (cPanel / Apache / LiteSpeed)
1. Point your API subdomain (e.g. `api.yourdomain.com`) to the `backend/` directory.
2. In cPanel phpMyAdmin, import `backend/database/schema.sql` and `backend/database/seed.sql`.
3. In `backend/.env`, set your live MySQL credentials and API keys.
4. Run the CMS migration to seed legal pages & pricing:
   ```bash
   php backend/database/migration_cms.php
   ```

### 2. Frontend & Admin Deployment (Vercel / Cloudflare / Netlify / cPanel)
1. **Frontend**:
   ```bash
   cd frontend
   # Set VITE_API_URL=https://api.yourdomain.com/api in .env.production
   npm run build
   # Deploy the generated `dist/` directory to your main domain (e.g. yourdomain.com)
   ```
2. **Admin Panel**:
   ```bash
   cd admin
   # Set VITE_API_URL=https://api.yourdomain.com/api in .env.production
   npm run build
   # Deploy the generated `dist/` directory to your admin subdomain (e.g. admin.yourdomain.com)
   ```

---

## 📜 Legal & Compliance

IconBaba includes complete, production-ready legal documentation:
- **Terms of Service** (`/terms`): 14-point international SaaS terms including DMCA takedowns, anti-scraping protections, and limitation of liability.
- **Privacy Policy** (`/privacy-policy`): GDPR & CCPA compliant data handling practices.
- **Refund Policy** (`/refund-policy`): 14-day 100% money-back guarantee terms.
- **Free License** (`/licenses/free`): Commercial & personal usage with simple attribution.
- **Pro License** (`/licenses/pro`): Commercial client usage with zero attribution required.

---

## 🏗️ Full Site Blueprint & Architecture

The following blueprint illustrates the end-to-end multi-tier architecture, security boundaries, and data pipelines powering IconBaba:

```text
====================================================================================================
                                      ICONBABA FULL SYSTEM BLUEPRINT
====================================================================================================

               +-------------------------------------------------------------+
               |                       DNS & EDGE LAYER                      |
               |         (Cloudflare / CDN / SSL Termination / DDoS Guard)   |
               +------------------------------+------------------------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
         [ HTTPS // yourdomain.com ]                      [ HTTPS // admin.yourdomain.com ]
                     |                                                 |
                     v                                                 v
  +------------------------------------+             +------------------------------------+
  |         FRONTEND SPA               |             |          ADMIN DASHBOARD           |
  | (React 18 + Vite + TailwindCSS)    |             | (React 18 + Vite + TailwindCSS)    |
  |                                    |             |                                    |
  |  * Hero & Instant Search Bar       |             |  * Realtime KPI Metrics & Revenue  |
  |  * Category & Tag Filters          |             |  * Layer 2 DRM Icon Studio Upload  |
  |  * Interactive SVG Customizer      |             |  * Gemini AI 2.5 Flash Auto-Auditor|
  |  * Pro Pricing & Checkout Gate     |             |  * CMS Legal Page & Pricing Editor |
  |  * Animated Canvas Backgrounds     |             |  * User Management & Role Control  |
  +-----------------+------------------+             +-----------------+------------------+
                    |                                                  |
                    | (Axios / Fetch REST JSON)                        | (Bearer JWT / Token)
                    +------------------------+-------------------------+
                                             |
                                             v
  +---------------------------------------------------------------------------------------+
  |                                  BACKEND API GATEWAY                                  |
  |                                 (PHP 8.x + Apache/Nginx)                              |
  +---------------------------------------------------------------------------------------+
  |                                                                                       |
  |  [ Middleware & Security Shield ]                                                     |
  |   ├── CORS Origin Validator (`cors.php`)                                              |
  |   ├── Bearer Token / Role-Based Auth Guard (`auth_middleware.php`)                    |
  |   ├── Rate Limiting & Input Sanitization                                              |
  |   └── Error Handler & Unified JSON Response Formatter                                 |
  |                                                                                       |
  |  [ Core Functional Modules & REST Endpoints ]                                         |
  |   ├── /api/auth.php               -> JWT Authentication, Registration, Session Check  |
  |   ├── /api/icons.php              -> Multi-criteria Search, Pagination, Metadata Fetch|
  |   ├── /api/download.php           -> Layer 2 DRM, Watermarking, Clean SVG Generation  |
  |   ├── /api/ai_inspect_icons.php   -> Google Gemini 2.5 Flash Autonomous Icon Audit    |
  |   ├── /api/cms.php                -> CMS Content Management & Legal Terms Sync        |
  |   ├── /api/pricing.php            -> Lemon Squeezy Plans, Tiers & Currency Formatter  |
  |   ├── /api/webhook_lemonsqueezy   -> Automated License & Subscription Activation      |
  |   └── /api/admin_stats.php        -> Server Metrics, DB Diagnostics, Aggregated Logs  |
  |                                                                                       |
  +--------------------+-------------------------+--------------------+--------------------+
                       |                         |                    |
                       v                         v                    v
  +-------------------------+  +----------------------+  +--------------------------------+
  |     PERSISTENCE LAYER   |  |   INTELLIGENCE ENGINE|  |    PAYMENT & EXTERNAL APIS     |
  |      (MySQL 8.0/PDO)    |  | (Google Gemini Flash)|  |      (Lemon Squeezy Webhooks)  |
  +-------------------------+  +----------------------+  +--------------------------------+
  | * users & user_roles    |  | * Gemini 2.5 Flash   |  | * HMAC-SHA256 Signature Auth   |
  | * icons & icon_tags     |  | * Multi-model Vision |  | * Subscription Webhook Router  |
  | * categories & styles   |  | * Tag Generator      |  | * Instant Pro License Unlocks  |
  | * content_pages (CMS)   |  | * Visual Name Auditor|  | * Automated Invoice & Receipt  |
  | * downloads_log         |  | * Style Categorizer  |  | * Auto-Downgrade on Cancel     |
  +-------------------------+  +----------------------+  +--------------------------------+
```

### 🔄 End-to-End Data Flow Pipelines

#### 1. Public Icon Search & Customization Pipeline
```text
User Search Query ──▶ Frontend Debounced Input ──▶ GET /api/icons.php?search=...
                 ──▶ MySQL Fulltext & Tag Join ──▶ JSON Array of Icon Objects
                 ──▶ Client-side SVG Canvas ──▶ Color, Stroke, Size Live Modification
```

#### 2. Layer 2 DRM Protected Asset Download
```text
User Click Download ──▶ GET /api/download.php?id=...&format=svg/png
                   ──▶ Auth Middleware (Checks Free vs Pro Tier Limits)
                   ──▶ DRM Sanitizer: Strips malicious scripts & injects signature
                   ──▶ Dynamic Watermark (If Free Tier Non-Attributed)
                   ──▶ Clean Asset Stream (Forces HTTP Attachment Header)
```

#### 3. AI Quality & Visual Consistency Inspection
```text
Admin Triggers Audit ──▶ POST /api/ai_inspect_icons.php
                    ──▶ Backend fetches batch of 10 SVGs
                    ──▶ Sends Base64 payloads to Google Gemini 2.5 Flash API
                    ──▶ AI analyzes visual shapes vs icon names & categories
                    ──▶ Returns Confidence Score + Auto-corrected Tags & Names
                    ──▶ Admin verifies and persists updates in MySQL
```

---

## 👨‍💻 Admin Credentials
- **Username**: `admin`
- **Email**: `admin@yourdomain.com`
- **Password**: *(Configured in database / OTP verification supported)*

---

## 📄 License
The IconBaba icon library is distributed under the **MIT License**.
Platform software, backend infrastructure, and design systems are proprietary to **IconBaba**.
