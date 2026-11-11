# 🌐 SupplyLink Enterprise — Micro-Financing & Profit Distribution Platform

[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PHP](https://img.shields.io/badge/PHP-8.x-777BB4?style=flat&logo=php&logoColor=white)](https://php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-InnoDB-4479A1?style=flat&logo=mysql&logoColor=white)](https://mysql.com/)

A comprehensive financial management and profit-sharing software suite designed for installment product financing, micro-investments, asset lease management, and multi-source profit distribution.

> 📖 **Architectural Blueprint:** For in-depth mathematical models, database schemas, and data flow diagrams, refer to [`MASTER_BLUEPRINT.md`](./MASTER_BLUEPRINT.md).

---

## 📂 Repository Structure

```text
Others_Source_Profit/
├── Admin_panel/                 # Back-office web application (React 19 + Tailwind v4 + Vite)
│   ├── src/                     # Components, Pages, Redux store, Custom Hooks, Providers
│   ├── public/                  # Static assets & menu configurations
│   ├── dist/                    # Compiled production build output
│   └── package.json             # Admin panel scripts & dependencies
│
├── User_Dashboard/              # Borrower & Investor client portal (React 19 + Vite)
│   ├── src/                     # Client views, Statement pages, Invoice generator
│   ├── dist/                    # Compiled production build output
│   └── package.json             # User portal dependencies
│
├── server/                      # Backend REST API & Database engine
│   ├── public_html/
│   │   ├── apis/                # PHP REST micro-endpoints (Auth, Cash, Loans, Assets, etc.)
│   │   ├── cron/                # Scheduled background automation scripts
│   │   └── .htaccess            # Apache SPA fallback & URL rewrite rules
│   └── u647959341_sl_app_db.sql # Production MySQL database schema dump
│
├── MASTER_BLUEPRINT.md          # Complete system architecture and formula blueprint
└── README.md                    # Project quick-start & operations guide
```

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- **Node.js:** v18.x or v20+ (recommended v24)
- **PHP:** v8.0 or higher
- **MySQL / MariaDB:** v10.4+ or MySQL 8.0+
- **Local Server:** XAMPP / Laragon / WampServer / native Apache

---

### 1. Database Setup
1. Create a new MySQL database named `u647959341_sl_db` (or your preferred local DB name):
   ```sql
   CREATE DATABASE u647959341_sl_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Import the schema dump:
   ```bash
   mysql -u root -p u647959341_sl_db < server/u647959341_sl_app_db.sql
   ```
3. Update connection credentials in `server/public_html/apis/db.php`:
   ```php
   $DB_HOST = "localhost";
   $DB_USER = "root";
   $DB_PASS = "";
   $DB_NAME = "u647959341_sl_db";
   ```

---

### 2. Admin Panel Setup (`/Admin_panel`)
The back-office admin portal runs on **port 5175**:

```bash
# Navigate to admin panel directory
cd Admin_panel

# Install dependencies
npm install

# Run development server (on Windows PowerShell, run: npm.cmd run dev)
npm run dev
```
Open [http://localhost:5175/](http://localhost:5175/) in your browser.

#### Environment Variables (`Admin_panel/.env`):
```env
VITE_LOCALHOST_KEY=http://localhost/supplylink/apis
VITE_IMG_KEY=http://localhost/supplylink/uploads
VITE_USER_APP_URL=http://localhost:5176
```

---

### 3. User Dashboard Setup (`/User_Dashboard`)
The borrower/investor portal runs on **port 5176**:

```bash
# Navigate to user dashboard directory
cd User_Dashboard

# Install dependencies
npm install

# Run development server (on Windows PowerShell, run: npm.cmd run dev)
npm run dev
```
Open [http://localhost:5176/](http://localhost:5176/) in your browser.

#### Environment Variables (`User_Dashboard/.env`):
```env
VITE_LOCALHOST_KEY=http://localhost/supplylink/apis
VITE_IMG_KEY=http://localhost/supplylink/uploads
```

---

## 🛠️ Building for Production

### Build Admin Portal:
```bash
cd Admin_panel
npm run build
# (On Windows PowerShell: npm.cmd run build)
```
The compiled assets will be created in `Admin_panel/dist`.

### Build User Dashboard:
```bash
cd User_Dashboard
npm run build
# (On Windows PowerShell: npm.cmd run build)
```
The compiled assets will be created in `User_Dashboard/dist`.

---

## ⚙️ Core Modules Overview

| Module | Location | Purpose |
| :--- | :--- | :--- |
| **Cash Management** | `Admin_panel/src/Pages/shared/CashMenage/` | Double-entry cash registry, voucher approval workflow, dynamic opening balance calculator. |
| **Installment Financing** | `Admin_panel/src/Pages/shared/Customers/` | Customer loan cards, payment schedules, guarantor verification, and collection tracking. |
| **Daily Collections** | `Admin_panel/src/Pages/shared/DailyInstallments/` | Daily field collection records, full-paid reports, and printable slips. |
| **Investors Desk** | `Admin_panel/src/Pages/shared/Investors/` | Micro-investment portfolios, time-weighted profit calculation, withdrawal approvals. |
| **Other Sources Profit**| `Admin_panel/src/Pages/shared/OtherSourcesProfit/` | Tangible asset investments (bikes, shops, houses) & external company shares with lease rent agreements. |
| **Inventory & Supply** | `Admin_panel/src/Pages/shared/MobileInventory/` | Mobile phone IMEI records, stock counts, and supplier payout scheduling. |
| **Finance & Solvency** | `Admin_panel/src/Pages/shared/Finance/` | Company health scores, equity-to-debt ratio, and portfolio settlement simulation. |

---

## ⏰ Automated Cron Tasks

To maintain automated profit allocation and loan penalty increments, configure these cron entries in your hosting server (`Asia/Dhaka` timezone):

```bash
# 1. Update overdue days on installment loans (Daily at 00:05 AM)
5 0 * * * php /path/to/public_html/cron/update_installment_days.php >> /path/to/public_html/cron/installment.log 2>&1

# 2. Update investor capital weight multipliers (Daily at 01:00 AM)
0 1 * * * php /path/to/public_html/cron/update_profit_weight.php >> /path/to/public_html/cron/weight.log 2>&1

# 3. Generate monthly profit history distribution (Monthly on 1st at 02:00 AM)
0 2 1 * * php /path/to/public_html/cron/cron_create_profit_history.php >> /path/to/public_html/cron/profit_distribute.log 2>&1
```

---

## 🔒 Security & Best Practices
- **Role-Based Routing:** Protected routes verified against cookie sessions using `AuthProvider.jsx` (`admin`, `manager`, `staff`, `developer`).
- **Data Protection:** Prepared statements (`mysqli_stmt`) for all database operations to prevent SQL injection.
- **Cross-Origin Resource Sharing (CORS):** Strict domain origin checks in `cors.php` with credential persistence (`credentials: "include"`).
- **Timezone Synchronization:** Server and client standardize on `Asia/Dhaka` (`GMT+6`) to ensure accurate daily opening cash and collection accounting.

---

## 📄 License
Proprietary software developed for **SupplyLink Bangladesh**. All rights reserved.
