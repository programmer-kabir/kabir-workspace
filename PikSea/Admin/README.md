# DayalStock — প্রজেক্ট ডকুমেন্টেশন
### (Vecteezy-এর মতো Stock Media Website)
**Tech Stack:** PHP (Backend API) · MySQL (Database) · React (Frontend)

---

## 📌 প্রজেক্ট ওভারভিউ

DayalStock একটি Stock Media Marketplace যেখানে User রা:
- **Vector, Photo, Video, Template** ডাউনলোড করতে পারবে
- **Free ও Pro** লাইসেন্সে কন্টেন্ট পাবে
- **কন্ট্রিবিউটর** হিসেবে নিজের ফাইল আপলোড করতে পারবে
- **Subscription** কিনে Unlimited ডাউনলোড করতে পারবে

---

## 🗂️ সব Page এর তালিকা

| # | Page Name | Route | Access |
|---|-----------|-------|--------|
| 1 | Homepage | `/` | Public |
| 2 | Search Results | `/search?q=...&type=...` | Public |
| 3 | Vectors Browse | `/free-vectors` | Public |
| 4 | Photos Browse | `/free-photos` | Public |
| 5 | Videos Browse | `/free-videos` | Public |
| 6 | Templates Browse | `/templates` | Public |
| 7 | Bundles Browse | `/bundles` | Public |
| 8 | Category Page | `/category/:slug` | Public |
| 9 | Asset Detail Page | `/asset/:id/:slug` | Public |
| 10 | Pricing / Join Pro | `/pricing` | Public |
| 11 | Login | `/login` | Guest |
| 12 | Register | `/register` | Guest |
| 13 | User Dashboard | `/dashboard` | Auth |
| 14 | My Downloads | `/dashboard/downloads` | Auth |
| 15 | My Favorites | `/dashboard/favorites` | Auth |
| 16 | My Subscription | `/dashboard/subscription` | Auth |
| 17 | Contributor Upload | `/contribute/upload` | Auth |
| 18 | Contributor Portfolio | `/contributor/:username` | Public |
| 19 | Admin Panel | `/admin` | Admin |
| 20 | 404 Not Found | `*` | Public |

---

## 📄 Page-ওয়াইজ বিস্তারিত কন্টেন্ট

---

### 1️⃣ Homepage (`/`)

**উদ্দেশ্য:** User দের আকর্ষণ করা, Search শুরু করানো

#### Header / Navbar
- Logo (বামে)
- Navigation Links: **Vectors | Photos | Videos | Templates | Bundles**
- Right Side: **Sign Up** বাটন | **Log In** বাটন
- (Logged in হলে): User avatar dropdown → Dashboard, Downloads, Logout

#### Hero Section
```
┌─────────────────────────────────────────────────────────┐
│  [Vectors ▼]  [ Search box... ]  [🔍 Search]           │
│  Popular: background · nature · business · texture      │
└─────────────────────────────────────────────────────────┘
```
- Background: Animated gradient বা Masonry image grid
- Content Type Dropdown: **Vectors / Photos / Videos / Templates**
- Search Input (text)
- Trending Tags (clickable chips)

#### Content Sections
1. **Browse by Type** — 6টি card grid (Vectors, Photos, Videos, Templates, Bundles, SVGs)
2. **Trending This Week** — 12টি asset card (masonry/grid layout)
3. **Popular Vectors** — horizontal scroll বা 3-column grid
4. **Popular Photos** — same layout
5. **Free vs Pro Banner** — CTA to Join Pro
6. **Why DayalStock** — 3টি feature card (Fresh Content, Simple Licensing, Worry-free)
7. **Become a Contributor** — Stats + CTA
8. **Footer**

---

### 2️⃣ Search Results Page (`/search`)

**URL Example:** `/search?q=background&type=vectors&license=free&orientation=horizontal`

#### Layout
```
[Header]
[Search Bar — sticky top]
────────────────────────────────────
| Filter Sidebar |  Results Grid   |
| (বামে)         |  (ডানে)         |
────────────────────────────────────
[Pagination / Load More]
```

#### Results Grid
- Masonry বা 3/4 column grid
- প্রতিটি card এ:
  - Thumbnail image/video preview
  - Hover করলে: Download icon, Favorite icon, Pro badge
  - নিচে: Title, Contributor name, License type badge

---

### 3️⃣ Vectors Browse (`/free-vectors`)

- Default `type=vectors`
- Top এ Category chips: Nature · Business · Abstract · Animals · People · Technology · Food
- SEO H1: "Free Vector Graphics"

---

### 4️⃣ Photos Browse (`/free-photos`)

- Default `type=photos`
- Top এ Category chips
- SEO H1: "Free Stock Photos"

---

### 5️⃣ Videos Browse (`/free-videos`)

- Default `type=videos`
- Video thumbnail hover করলে **preview autoplay**
- Extra filter: **Duration, Aspect Ratio, Resolution**

---

### 6️⃣ Templates Browse (`/templates`)

- Card এ template preview image
- Category: Social Media · Presentation · Flyer · Banner · Card

---

### 7️⃣ Bundles Browse (`/bundles`)

- Full-width vertical card list (প্রতিটি bundle বড় card)
- প্রতিটি card এ:
  - Bundle preview collage image
  - Title: "450 Abstract Paint Backgrounds Bundle"
  - Badge: **PRO** বা **FREE**
  - Asset count: "450 items included"
  - Download/View button
- Filter: Category, License type

---

### 8️⃣ Category Page (`/category/:slug`)

**URL:** `/category/nature-vectors`, `/category/business-photos`

- H1: "Nature Vectors" (slug থেকে generate)
- Search Results page এর মতো layout + filter
- SEO Description auto-generate

---

### 9️⃣ Asset Detail Page (`/asset/:id/:slug`)

#### Layout
```
┌──────────────────────────────────────────────────────┐
│ [Asset Preview — large]    │ [Download Panel]        │
│ (Vector SVG / Photo / Video│  • License: Free/Pro   │
│  preview with zoom)        │  • File type: SVG, EPS │
│                            │  • File size: 2.5 MB   │
│                            │  • [⬇ Free Download]   │
│                            │  • [⬇ Pro Download]    │
│                            │  • [♡ Save to Favorites]│
└──────────────────────────────────────────────────────┘
│ Tags: [nature] [green] [plant] [leaf]                │
│ Category: Nature · Sub-category: Plants              │
│ Contributor: @username | Date: June 2024             │
├──────────────────────────────────────────────────────┤
│ Related Assets (Similar content grid)                │
└──────────────────────────────────────────────────────┘
```

#### Download Panel Logic
- **Free License** → সরাসরি ডাউনলোড (attribution required)
- **Pro License** → Login + Subscription check করবে
- **Guest user** → Download click করলে Login modal দেখাবে

---

### 🔟 Pricing Page (`/pricing`)

#### Sections
1. **Plan Comparison Table:**

| Feature | Free | Pro |
|---------|------|-----|
| Access to Free Assets | ✅ | ✅ |
| Access to 10M+ Pro Assets | ❌ | ✅ |
| Commercial Use | ✅ (with attribution) | ✅ |
| Unlimited Downloads | ❌ | ✅ |
| Ad-Free Experience | ❌ | ✅ |
| Legal Indemnification | ❌ | ✅ |

2. **Pricing Cards:**
   - **Yearly Plan** — ৳X/month (billed annually) — MOST POPULAR badge
   - **Monthly Plan** — ৳X/month
   - **Team/Enterprise** — Custom pricing

3. **FAQ Accordion** — Common license questions

---

### 1️⃣1️⃣ Login Page (`/login`)

- Email input
- Password input (show/hide toggle)
- "Remember me" checkbox
- **Login** button
- OR divider
- Google / Facebook social login buttons
- Link: "Don't have an account? **Register**"
- Link: "Forgot Password?"

---

### 1️⃣2️⃣ Register Page (`/register`)

- Full Name input
- Email input
- Password input (min 8 chars, strength indicator)
- Confirm Password
- Checkbox: "I agree to Terms & Conditions"
- **Register** button
- OR divider
- Google / Facebook social login
- Link: "Already have an account? **Login**"

---

### 1️⃣3️⃣ User Dashboard (`/dashboard`)

#### Sidebar Navigation
- Profile Overview
- My Downloads
- My Favorites
- My Subscription
- Settings

#### Main Content (Overview)
- Download count this month
- Subscription status + expiry date
- Recent downloads (last 5)
- Quick action buttons

---

### 1️⃣4️⃣ Contributor Upload (`/contribute/upload`)

- Drag & drop file upload area
- File type validation: SVG, EPS, AI, JPG, PNG, MP4
- Form fields:
  - Title
  - Description
  - Tags (comma separated)
  - Category (dropdown)
  - Sub-category (dropdown)
  - License type (Free / Pro)
  - Content type (Vector / Photo / Video / Template)
- Preview generator
- **Submit for Review** button

---

### 1️⃣5️⃣ Admin Panel (`/admin`)

- Dashboard: Total assets, users, downloads, revenue
- Asset Management: Approve/Reject uploaded assets
- User Management: Ban/unban users, view subscriptions
- Category Management: Add/edit/delete categories
- Bundle Management: Create/edit bundles

---

## 🔍 Filter Bar — বিস্তারিত

### Vectors & Photos Filter
```
📁 Sort By
  ○ Best Match  ○ Newest  ○ Most Downloaded

📋 License Type
  ○ All  ○ Free License  ○ Pro License  ○ Editorial Only

🤖 AI Generated
  ○ All  ○ Only AI  ○ Non-AI

📐 Orientation
  □ Horizontal  □ Vertical  □ Square  □ Panoramic

🎨 Color
  [Color Wheel Picker]
  [# Hex Input      ]
  Threshold: [====●====] 50%

🏷️ File Type
  □ SVG  □ EPS  □ AI  □ PNG
```

### Videos Filter
```
📁 Sort By
  ○ Best Match  ○ Newest

📋 License Type
  ○ All  ○ Free License  ○ Pro License

🤖 AI Generated
  ○ All  ○ Only AI  ○ Non-AI

📺 Aspect Ratio
  □ 16:9  □ 4:3  □ Square (1:1)  □ Vertical (9:16)

⏱️ Duration
  [0:00 ══════●══════ 2:00+]  (dual handle range slider)

🎬 Resolution
  □ HD (720p)  □ Full HD (1080p)  □ 2K  □ 4K

🎨 Color
  [Color Wheel + Hex Input]
```

### Filter কীভাবে কাজ করে (Technical Flow)
```
User clicks filter
    → React state update
    → URL query params update (React Router)
    → API call: GET /api/search?q=...&type=vectors&license=free&orientation=horizontal
    → PHP builds MySQL WHERE clause dynamically
    → Returns paginated JSON
    → React renders results (no full page reload)
```

---

## 🗄️ Database Schema (MySQL)

```sql
-- Users Table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'contributor', 'admin') DEFAULT 'user',
  avatar VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions Table
CREATE TABLE subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  plan ENUM('monthly', 'yearly') NOT NULL,
  status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
  starts_at TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Assets Table
CREATE TABLE assets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contributor_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  type ENUM('vector', 'photo', 'video', 'template') NOT NULL,
  license ENUM('free', 'pro', 'editorial') DEFAULT 'free',
  orientation ENUM('horizontal', 'vertical', 'square', 'panoramic'),
  file_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500) NOT NULL,
  file_size INT,
  file_type VARCHAR(20),
  width INT,
  height INT,
  duration INT,
  resolution VARCHAR(20),
  is_ai_generated TINYINT(1) DEFAULT 0,
  download_count INT DEFAULT 0,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contributor_id) REFERENCES users(id)
);

-- Categories Table
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  parent_id INT DEFAULT NULL,
  asset_type ENUM('vector', 'photo', 'video', 'template', 'all') DEFAULT 'all',
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Asset-Category Pivot
CREATE TABLE asset_categories (
  asset_id INT,
  category_id INT,
  PRIMARY KEY (asset_id, category_id)
);

-- Tags Table
CREATE TABLE tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- Asset-Tags Pivot
CREATE TABLE asset_tags (
  asset_id INT,
  tag_id INT,
  PRIMARY KEY (asset_id, tag_id)
);

-- Downloads Table
CREATE TABLE downloads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  asset_id INT NOT NULL,
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);

-- Favorites Table
CREATE TABLE favorites (
  user_id INT,
  asset_id INT,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, asset_id)
);

-- Bundles Table
CREATE TABLE bundles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_path VARCHAR(500),
  license ENUM('free', 'pro') DEFAULT 'pro',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bundle-Assets Pivot
CREATE TABLE bundle_assets (
  bundle_id INT,
  asset_id INT,
  PRIMARY KEY (bundle_id, asset_id)
);
```

---

## 🔌 PHP API Endpoints

```
Auth:
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/logout
  GET    /api/auth/me

Assets:
  GET    /api/assets?q=&type=&license=&orientation=&ai=&sort=&page=
  GET    /api/assets/:id
  POST   /api/assets          (contributor upload)
  PUT    /api/assets/:id      (contributor edit)
  DELETE /api/assets/:id      (admin/contributor)

Categories:
  GET    /api/categories
  GET    /api/categories/:slug/assets

Tags:
  GET    /api/tags/popular

Downloads:
  POST   /api/downloads/:asset_id   (log + return file URL)
  GET    /api/downloads/my

Favorites:
  POST   /api/favorites/:asset_id
  DELETE /api/favorites/:asset_id
  GET    /api/favorites/my

Subscription:
  GET    /api/subscription/my
  POST   /api/subscription/checkout

Admin:
  GET    /api/admin/assets?status=pending
  PUT    /api/admin/assets/:id/approve
  PUT    /api/admin/assets/:id/reject
  GET    /api/admin/users
```

---

## 📁 Project Folder Structure

```
DayalStock/
├── backend/                    # PHP API
│   ├── config/
│   │   ├── database.php
│   │   └── config.php
│   ├── controllers/
│   │   ├── AuthController.php
│   │   ├── AssetController.php
│   │   ├── SearchController.php
│   │   ├── DownloadController.php
│   │   └── AdminController.php
│   ├── middleware/
│   │   ├── AuthMiddleware.php
│   │   └── AdminMiddleware.php
│   ├── models/
│   │   ├── User.php
│   │   ├── Asset.php
│   │   ├── Category.php
│   │   └── Subscription.php
│   ├── routes/
│   │   └── api.php
│   ├── uploads/
│   │   ├── vectors/
│   │   ├── photos/
│   │   ├── videos/
│   │   └── thumbnails/
│   └── index.php
│
├── frontend/                   # React App
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar/
│   │   │   ├── Footer/
│   │   │   ├── SearchBar/
│   │   │   ├── FilterSidebar/
│   │   │   ├── AssetCard/
│   │   │   ├── AssetGrid/
│   │   │   └── Pagination/
│   │   ├── pages/
│   │   │   ├── Home/
│   │   │   ├── Search/
│   │   │   ├── Vectors/
│   │   │   ├── Photos/
│   │   │   ├── Videos/
│   │   │   ├── AssetDetail/
│   │   │   ├── Pricing/
│   │   │   ├── Login/
│   │   │   ├── Register/
│   │   │   ├── Dashboard/
│   │   │   └── Admin/
│   │   ├── hooks/
│   │   │   ├── useSearch.js
│   │   │   ├── useFilters.js
│   │   │   └── useAuth.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.jsx
│   └── package.json
│
└── database/
    └── schema.sql
```

---

## 🚀 Development Phase Plan

### Phase 1 — Foundation (Week 1-2)
- [ ] MySQL database setup + schema
- [ ] PHP Auth API (register, login, JWT/session)
- [ ] React project setup + routing
- [ ] Navbar + Footer components
- [ ] Login/Register pages

### Phase 2 — Core Features (Week 3-4)
- [ ] Asset upload system (PHP + file handling)
- [ ] Search API with filters
- [ ] Homepage layout + trending assets
- [ ] Search Results page + Filter Sidebar
- [ ] Asset Detail page

### Phase 3 — Browse Pages (Week 5)
- [ ] Vectors/Photos/Videos browse pages
- [ ] Category pages
- [ ] Bundles page

### Phase 4 — User Features (Week 6)
- [ ] User Dashboard
- [ ] Download system (free vs pro logic)
- [ ] Favorites system
- [ ] Subscription/Pricing page

### Phase 5 — Admin & Polish (Week 7-8)
- [ ] Admin panel (approve/reject assets)
- [ ] Contributor upload page
- [ ] UI polish + animations
- [ ] Mobile responsive

---

## 🎨 Design System

- **Primary Color:** `#6C4FE0` (Purple)
- **Secondary:** `#FF6B6B` (Accent Red)
- **Background:** `#0F0F1A` (Dark) / `#FFFFFF` (Light)
- **Font:** Inter (Google Fonts)
- **Card border-radius:** 12px
- **Transition:** 0.2s ease-in-out

---

*শেষ আপডেট: June 2026 | DayalStock Project*
