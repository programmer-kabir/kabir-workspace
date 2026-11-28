# SUNAM SHOP — Complete Software Development & Implementation Blueprint

**Project Type:** Local E-commerce / Online Grocery / Home Delivery  
**Initial Launch Location:** Sunamganj Sadar, Bangladesh  
**Future Expansion:** All Upazilas of Sunamganj District  
**Frontend:** Next.js (App Router) + TypeScript  
**Backend:** Core PHP (REST API, PDO)  
**Database:** MySQL / MariaDB  
**Architecture:** Headless E-commerce  
**Primary Language:** Bengali  
**Secondary Language:** English  
**Currency:** BDT (৳)

---

# 1. PROJECT VISION

Build a production-ready local e-commerce platform named SUNAM SHOP.

Sunam Shop will allow customers in Sunamganj Sadar to order almost all daily necessities online, including:

- Rice, lentils, flour, oil and spices
- Fresh fish
- Meat and chicken
- Vegetables
- Fruits
- Milk and eggs
- Snacks and beverages
- Household products
- Other daily necessities

Customers can browse products, view prices, add products to cart, place orders and receive home delivery.

The business will operate using two sourcing methods:

1. OWN INVENTORY: Products purchased and stocked by Sunam Shop.
2. LOCAL MARKET SOURCING: Products collected from local market suppliers after receiving customer orders.

Sunam Shop will initially operate as a centralized retailer. Do not implement a multi-vendor marketplace in the MVP.

# 2. NON-NEGOTIABLE TECHNOLOGY STACK

## Frontend
- Next.js with App Router
- TypeScript
- Server Components by default
- Tailwind CSS
- Responsive mobile-first design
- Next.js Metadata API
- Server-side rendering and static generation where appropriate

Use a currently supported stable Next.js release.

## Backend
- Core PHP
- RESTful API architecture
- PDO for database access
- Prepared SQL statements
- PHP sessions or secure token-based authentication
- Centralized API response handling
- Input validation
- Role-based authorization

Do not use Laravel unless explicitly authorized.

## Database
- MySQL 8+ or compatible MariaDB
- InnoDB
- utf8mb4 character encoding
- Foreign keys
- Appropriate indexes
- Database migrations
- Transaction-based order processing

## Infrastructure
- Next.js frontend hosting
- PHP-compatible backend hosting
- MySQL database hosting
- HTTPS
- Environment-based configuration

The application must be compatible with affordable PHP/MySQL hosting.

# 3. PROJECT ARCHITECTURE

Separate the frontend and backend.

Suggested structure:

sunam-shop/
  customer-frontend/
    app/
    components/
    hooks/
    lib/
    services/
    types/
    public/
    styles/

  admin-frontend/
    src/
      components/
      pages/
      hooks/
      services/
      types/
    public/

  backend/
    api/
      auth/
      products/
      categories/
      orders/
      cart/
      customers/
      admin/
      suppliers/
      inventory/
      purchases/
      delivery/
      reports/
    config/
    core/
    middleware/
    models/
    services/
    validators/
    migrations/
    storage/

  database/
    schema.sql
    seed.sql

  docs/
    architecture.md
    api-documentation.md
    deployment.md
    testing.md

Use a clean, modular architecture.
Never mix frontend business logic with backend database operations.
The browser must never connect directly to MySQL.

# 4. CUSTOMER WEBSITE

Implement the following pages.

## Homepage
- Header and logo
- Location selector
- Product search
- Category navigation
- Hero banner
- Popular categories
- Featured products
- Best-selling products
- Today's offers
- New arrivals
- Delivery information
- Customer testimonials
- Footer

## Product Pages
- All products
- Category products
- Product details
- Related products
- Search results
- Price filters
- Availability filters

## Shopping
- Shopping cart
- Quantity management
- Checkout
- Order confirmation

## Customer Account
- Registration
- Login
- Profile
- Saved addresses
- Order history
- Order details
- Order tracking
- Reorder functionality

Support both registered customers and guest checkout.

## Informational Pages
- About Us
- Contact Us
- Delivery Policy
- Return and Refund Policy
- Privacy Policy
- Terms and Conditions

# 5. PRODUCT MANAGEMENT

Each product must support:

- Product name in Bengali
- Product name in English
- Slug
- SKU
- Description
- Category
- Multiple images
- Purchase price
- Selling price
- Discount price
- Unit
- Stock quantity
- Minimum stock
- Sourcing type
- Availability status
- Featured status
- SEO title
- SEO description

Supported units:
- Kilogram
- Gram
- Liter
- Milliliter
- Piece
- Packet
- Dozen
- Bundle

Sourcing types:
- OWN_STOCK
- LOCAL_MARKET
- BOTH

Products must be manageable from the Admin Dashboard.

# 6. ADMIN DASHBOARD

Create a separate protected Admin Dashboard.

## Dashboard
- Today's orders
- Today's sales
- Monthly sales
- Total customers
- Pending orders
- Completed orders
- Low-stock products
- Gross profit
- Net profit

## Management Modules
1. Product Management
2. Category Management
3. Order Management
4. Customer Management
5. Supplier Management
6. Inventory Management
7. Purchase Management
8. Delivery Management
9. Delivery Zone Management
10. Payment Management
11. Expense Management
12. Promotion Management
13. Reports
14. Website Settings
15. Admin User Management
16. Audit Logs

Implement proper permissions for Admin and Manager roles.

# 7. SUPPLIER MANAGEMENT

Admin can register local market suppliers.

Supplier fields:
- Name
- Shop name
- Phone
- Address
- Supplied categories
- Notes
- Active status

Maintain supplier purchase history and outstanding balances.

# 8. INVENTORY MANAGEMENT

Support:
- Stock In
- Stock Out
- Stock Adjustment
- Stock History
- Purchase Records
- Damaged Products
- Wasted Products
- Low Stock Notifications

Every inventory modification must generate a stock movement record.
Never silently overwrite stock history.
For LOCAL_MARKET products, support order-based procurement without falsely increasing owned inventory.

# 9. ORDER MANAGEMENT

Order workflow:
NEW -> CONFIRMED -> SOURCING -> PACKING -> READY_FOR_DELIVERY -> OUT_FOR_DELIVERY -> DELIVERED

Additional statuses:
CANCELLED, REFUND_PENDING, REFUNDED

Every order must have:
- Unique order number
- Customer information
- Address
- Ordered products
- Quantity
- Unit
- Unit price snapshot
- Estimated total
- Delivery charge
- Final total
- Payment method
- Payment status
- Order status
- Order timeline

Do not modify historical order prices when product prices change.
Prevent duplicate order submissions through idempotency protection.

# 10. VARIABLE-WEIGHT PRODUCTS

Fish, meat and vegetables may have variable final weight.

Support:
- Estimated weight
- Actual weight
- Unit price
- Estimated amount
- Final amount
- Customer approval status

Allow Admin to record actual weight.
If final price changes beyond the customer's approved limit, require customer confirmation before finalizing the order.
Never silently charge a customer more than the authorized amount.

# 11. DELIVERY MANAGEMENT

Implement hybrid delivery:
- Owner delivery
- Assigned delivery staff

Delivery zones initially cover verified serviceable areas in Sunamganj Sadar.

Each delivery zone must support:
- Zone name
- Area list
- Delivery charge
- Minimum order amount
- Estimated delivery time
- Active/inactive status

Delivery staff can:
- View assigned orders
- View delivery address
- Update delivery status
- Record cash collected
- Report failed delivery

Do not expose unrelated customer orders to delivery staff.

# 12. PAYMENT SYSTEM

MVP payment methods:
- Cash on Delivery

Prepare architecture for future:
- bKash
- Nagad
- Other supported payment gateways

Maintain payment records separately from orders.
Never mark online payments as successful based only on frontend requests.
Verify payment gateway callbacks server-side.

# 13. BUSINESS FINANCE

Implement proper financial calculations.

Track:
- Product purchase cost
- Product selling revenue
- Gross profit
- Delivery income
- Delivery expenses
- Packaging expenses
- Other operating expenses
- Net profit
- Supplier due
- COD collection
- Refunds

Net Profit must account for actual expenses.
Keep financial reports separate from simple sales totals.
Store monetary values in integer minor units (paisa) or an appropriate exact DECIMAL representation. Never use floating-point arithmetic for financial calculations.

# 14. MYSQL DATABASE DESIGN

Create normalized relational tables.
Required tables:
1. users
2. user_addresses
3. roles
4. categories
5. products
6. product_images
7. product_variants (if needed)
8. suppliers
9. supplier_categories
10. purchases
11. purchase_items
12. inventory
13. stock_movements
14. delivery_zones
15. delivery_zone_areas
16. orders
17. order_items
18. order_status_history
19. order_sourcing
20. deliveries
21. payments
22. refunds
23. expenses
24. promotions
25. product_reviews
26. notifications
27. settings
28. audit_logs
29. idempotency_keys

# 15. PHP REST API
Use versioned API routes: `/api/v1/`
Use consistent JSON responses and appropriate HTTP status codes.

# 16. SEO — HIGH PRIORITY
- Unique page titles & meta descriptions (Bengali & English)
- Canonical URLs, Open Graph, Twitter cards, XML sitemap, Robots.txt
- Structured data (Organization, LocalBusiness, WebSite, Product, Offer, BreadcrumbList)
- Mobile-first Core Web Vitals optimization

# 17. SECURITY
- PDO prepared statements
- Password hashing using Argon2id or bcrypt
- Secure authentication & HttpOnly cookies
- Role-based authorization & rate limiting
- Server-side input validation

# 18. UI/UX DESIGN
- Brand: SUNAM SHOP
- Tagline: "আপনার বাজার, এখন আপনার হাতেই।"
- Colors: Green primary, Orange accent
- Bengali typography & mobile-first UI
