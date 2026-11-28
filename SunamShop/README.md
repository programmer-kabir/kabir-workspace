# SUNAM SHOP (সুনাম শপ)
> **"আপনার বাজার, এখন আপনার হাতেই।"**  
> Complete Local E-Commerce & Grocery Delivery Platform for Sunamganj Sadar & District.

---

## 📌 Project Overview
- **Project Type:** Local E-commerce / Online Grocery / Home Delivery
- **Initial Launch Location:** Sunamganj Sadar, Bangladesh
- **Future Expansion:** All 11 Upazilas of Sunamganj District
- **Customer Storefront:** Next.js 15+ (App Router, Server Components, TypeScript, Tailwind CSS)
- **Admin & Operations Dashboard:** Standalone Admin Portal (Separate Project, React/Next.js, Tailwind CSS)
- **Backend:** Core PHP 8.2+ (RESTful API, PDO, Prepared Statements)
- **Database:** MySQL 8+ / MariaDB 10.4+ (InnoDB, `utf8mb4_unicode_ci`)
- **Architecture:** Headless E-commerce (Multi-client: Storefront + Admin Dashboard decoupled)
- **Primary Language:** Bengali (বাংলা)
- **Secondary Language:** English
- **Currency:** BDT (৳)

---

## 📂 Project Structure
```
sunam-shop/
├── customer-frontend/            # Customer Storefront (Next.js App Router, SSR, SEO, Bilingual)
├── admin-frontend/               # Standalone Admin Portal (Dashboard, Orders, Sourcing, Inventory, Finance)
├── backend/                      # Core PHP 8.2+ REST API (Shared API for Storefront & Admin)
├── database/                     # MySQL Schema, Migrations, and Seeders
│   ├── schema.sql                # Complete 29 relational tables
│   └── seed.sql                  # Initial Sunamganj Sadar seed data
├── docs/                         # Specifications & Architectural Documentation
│   ├── blueprint.md              # Master Blueprint & Requirements
│   ├── architecture.md           # System Architecture & Technical Specifications
│   ├── api-documentation.md      # REST API Endpoints & Request/Response Contracts
│   ├── deployment.md             # Deployment Guidelines for PHP/MySQL hosting
│   └── testing.md                # Automated Testing & Quality Assurance Plan
└── README.md                     # Project documentation entry point
```

---

## 🚀 Business Model & Features
1. **Dual Sourcing Model:**
   - **`OWN_STOCK` (নিজস্ব মজুদ):** Packaged dry grocery staples, oils, rice, lentils, toiletries, and household goods.
   - **`LOCAL_MARKET` (স্থানীয় বাজার সংগ্রহ):** Live/fresh fish (Surma river/haor catch), fresh meat, and morning fresh produce collected from local bazaars (Puraton Bazar & Natun Bazar) upon customer order.
   - **`BOTH`:** Items fulfilled from warehouse stock if available, falling back to local bazaar sourcing.
2. **Variable-Weight Products:**
   - Fish, meat, and fresh produce support estimated vs. actual weight.
   - Price adjustment tolerance (+10% ceiling) approved at checkout.
   - Requires explicit customer confirmation if actual weight exceeds approved ceiling.
3. **Delivery Logistics:**
   - Verified delivery zones in Sunamganj Sadar (Hasason Nagar, Puraton Jail Road, Notunpara, Jagannathbari Road, Hason Raja Goli, etc.).
   - Assigned delivery rider portal for delivery status and Cash on Delivery (COD) collection.
4. **Business Finance & Profitability:**
   - Complete tracking of Gross Profit and Net Profit (deducting delivery fuel, packaging, and operating expenses).
   - Exact `DECIMAL(12,2)` arithmetic for all financial balances.

---

## 📖 Detailed Documentation
- [Phase-by-Phase Implementation Roadmap (ফেজভিত্তিক বিস্তারিত কাজের রোডম্যাপ)](docs/phases-roadmap.md)
- [Master Blueprint](docs/blueprint.md)
- [System Architecture & 29-Table Database Design](docs/architecture.md)
- [API Documentation](docs/api-documentation.md)

