# SUNAM SHOP — Technical Architecture & System Design

## 1. Architectural Principles
Sunam Shop adopts a strict headless, multi-client e-commerce architecture:
- **Customer Storefront (`customer-frontend`):** Next.js 15+ (App Router, Server Components by default, Tailwind CSS, TypeScript) focused on consumer UX, high performance on mobile, bilingual localization, and Google SEO.
- **Admin & Operations Dashboard (`admin-frontend`):** Completely separate standalone dashboard application for management, inventory managers, local bazaar procurement staff, and delivery coordinators. Kept completely isolated from customer bundle size and public surface.
- **API Tier (`backend`):** Core PHP 8.2+ RESTful API (PDO, Prepared Statements, Layered Services, Zero Framework Overhead) providing unified REST endpoints (`/api/v1/`) for both client applications with strict role-based access control.
- **Data Tier (`database`):** MySQL 8+ / MariaDB (InnoDB, `utf8mb4_unicode_ci`, Foreign Keys, Strict ACID Transactions).
- **Strict Separation:** Neither frontend connects directly to MySQL. All data flows securely through versioned REST endpoints (`/api/v1/`).

---

## 2. Directory Structure
```
sunam-shop/
├── customer-frontend/            # Customer Storefront (Next.js 15+ App Router, SSR, SEO)
│   ├── app/                      # App router routes
│   │   ├── page.tsx              # Homepage
│   │   ├── products/             # Product catalog & dynamic [slug]
│   │   ├── category/             # Category pages [slug]
│   │   ├── area/                 # Localized SEO landing pages [areaSlug]
│   │   ├── cart/                 # Shopping cart
│   │   ├── checkout/             # Multi-step checkout
│   │   ├── orders/               # Customer order tracking & history
│   │   ├── account/              # Customer profile & addresses
│   │   ├── layout.tsx            # Global layout with bilingual font & provider injection
│   │   ├── robots.ts             # Dynamic robots.txt generator
│   │   └── sitemap.ts            # Dynamic XML sitemap generator
│   ├── components/               # Customer UI Components (Header, Footer, CartDrawer, ProductCard)
│   ├── hooks/                    # Custom React hooks (useCart, useAuth, useDebounce)
│   ├── lib/                      # Helper utilities (currency, date, validation)
│   ├── services/                 # API service clients (/api/v1/products, /api/v1/orders, etc.)
│   └── types/                    # Customer storefront TypeScript interfaces
│
├── admin-frontend/               # Dedicated Admin & Operations Portal (Separate Standalone Project)
│   ├── src/                      # Admin application source
│   │   ├── components/           # Admin UI components (Sidebar, TopNav, DataTable, StatsCard, Modal)
│   │   ├── pages/                # Admin views (Dashboard, Products, Orders, Sourcing, Inventory, Delivery, Finance, Settings)
│   │   ├── hooks/                # Admin custom hooks (useAdminAuth, useOrders, useInventory)
│   │   ├── services/             # Admin API services (/api/v1/admin/*)
│   │   └── types/                # Admin data models & interfaces
│   ├── package.json              # Admin dependencies (React, Tailwind CSS, Lucide, Recharts)
│   └── vite.config.ts / next.config.ts
│
├── backend/                      # Core PHP 8.2+ REST API (Shared API for Storefront & Admin)
│   ├── api/                      # Versioned entry point & Front Controller (index.php)
│   ├── config/                   # Configuration (database, app, constants)
│   ├── core/                     # Framework Core (Database, Router, Request, Response, Auth)
│   ├── middleware/               # Middlewares (CORS, RateLimiter, Auth, RoleCheck)
│   ├── controllers/              # REST Resource Controllers (Storefront & Admin endpoints)
│   ├── services/                 # Business logic services (Orders, Inventory, Sourcing, Finance)
│   ├── validators/               # Input validation rules
│   ├── migrations/               # Database migration scripts
│   └── storage/                  # Uploads & system logs
│
├── database/                     # Master SQL Scripts
│   ├── schema.sql                # Complete 29-table DDL script
│   └── seed.sql                  # Seed data for Sunamganj Sadar
│
└── docs/                         # Technical Documentation
    ├── blueprint.md
    ├── architecture.md
    ├── api-documentation.md
    └── deployment.md
```

---

## 3. Database Architecture (All 29 Normalized Tables)

### Group 1: Identity & Access Management
1. `roles`: Defines user roles (`SUPER_ADMIN`, `ADMIN`, `STORE_MANAGER`, `DELIVERY_STAFF`, `CUSTOMER`).
2. `users`: Master user accounts (phone number is unique primary login, argon2id password hashes, soft delete support).
3. `user_addresses`: Customer delivery locations linked to verified delivery zones.

### Group 2: Catalog & Categories
4. `categories`: Hierarchical category tree with bilingual names, slugs, icons, and display ordering.
5. `products`: Comprehensive product catalog (bilingual name & description, SKU, units, prices in `DECIMAL(12,2)`, sourcing type, variable-weight attributes, SEO metadata).
6. `product_images`: Multiple product image gallery with primary selection and ordering.
7. `product_variants`: Optional size/weight variations per product.

### Group 3: Suppliers & Procurement
8. `suppliers`: Local market merchant registry (Puraton Bazar / Natun Bazar vendors) with balance and contact information.
9. `supplier_categories`: Mapping suppliers to product categories they can supply.
10. `purchases`: Restocking invoice headers from suppliers.
11. `purchase_items`: Restocking line items with unit cost and quantities.

### Group 4: Inventory & Stock Auditing
12. `inventory`: Warehouse stock tracking (`current_stock`, `reserved_stock`, `available_stock`) for `OWN_STOCK` items.
13. `stock_movements`: Immutable append-only audit trail for every single stock delta.

### Group 5: Logistics & Zones
14. `delivery_zones`: Serviceable geographic zones in Sunamganj Sadar with delivery fee and minimum order criteria.
15. `delivery_zone_areas`: Specific mohollas/areas mapped to zones (e.g., Hasason Nagar, Puraton Jail Road, Notunpara).
16. `deliveries`: Delivery staff assignment, transit milestones, and cash collected.

### Group 6: Orders & Sourcing
17. `orders`: Master order entity with unique order number, customer info, price snapshots, variable weight flags, and idempotency key.
18. `order_items`: Line items capturing historical unit price snapshot, estimated vs actual weight, and sourcing method.
19. `order_status_history`: Complete audit trail of order status progression.
20. `order_sourcing`: Procurement records for `LOCAL_MARKET` items linking order items directly to registered local vendors.

### Group 7: Finance & Transactions
21. `payments`: Payment records decoupled from orders (Cash on Delivery, bKash, Nagad).
22. `refunds`: Refund tracking with administrative authorization.
23. `expenses`: Operating expenses (packaging, delivery fuel, utilities) enabling accurate Net Profit calculation.
24. `promotions`: Coupon codes with usage caps, minimum spend rules, and validity dates.

### Group 8: Customer Engagement & System Security
25. `product_reviews`: Verified customer feedback and ratings.
26. `notifications`: In-app bilingual alerts for orders, weight approvals, and updates.
27. `settings`: Key-value application configuration store.
28. `audit_logs`: Administrative change history with IP address and JSON before/after snapshots.
29. `idempotency_keys`: Prevents accidental duplicate submissions during order checkout.
