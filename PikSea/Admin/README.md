# 🛡️ PikSea — Admin Back-Office Panel

**Tech Stack:** React 19 · Vite 8 · Tailwind CSS v4 · TanStack React Query · Lucide React

---

## 📌 Project Overview

The **PikSea Admin Panel** provides comprehensive administrative control and back-office management for the platform:
- **Direct Asset Publishing Center:** Batch upload master source archives (EPS, SVG, AI, PSD, ZIP, MP4) directly into the platform.
- **Content Management:** Multi-filter asset tables (*All Contents*, *Published*, *Rejected*, *Exclusive Buyout*).
- **Taxonomy Engine:** Category tree and Tag taxonomy management.
- **User Administration:** User management, roles (*Admin*, *Manager*, *User*), and status control.
- **Finance & Revenue:** Company earnings reports, transaction ledgers, and billing invoices.
- **Support System:** Real-time customer support ticket management.
- **Platform Health & SEO:** Dynamic CMS page management, SEO meta tags, and server health monitoring.

---

## 🗂️ Application Routes

| Route | Page / Component | Description |
| :--- | :--- | :--- |
| `/login` | `Login.jsx` | Secure administrative authentication |
| `/dashboard` | `AdminDashboard.jsx` | Real-time platform pulse, MRR, downloads, and metrics |
| `/dashboard/upload` | `UploadFiles.jsx` | Direct batch upload & metadata extraction |
| `/dashboard/allcontent` | `AllContents.jsx` | Complete asset repository |
| `/dashboard/content/published` | `Published.jsx` | Published asset library |
| `/dashboard/content/rejected` | `Rejected.jsx` | Unpublished or rejected items |
| `/dashboard/content/exclusive-buyout` | `ExclusiveBuyout.jsx` | Assets sold via exclusive buyout |
| `/dashboard/allusers` | `AllUsers.jsx` | User management & roles |
| `/dashboard/categories` | `Categories.jsx` | Category hierarchy & icons |
| `/dashboard/tags` | `Tags.jsx` | Global tag management |
| `/dashboard/finance/company-earnings` | `CompanyEarnings.jsx` | Revenue and subscription analytics |
| `/dashboard/finance/payment-history` | `PaymentHistory.jsx` | Payment transaction records |
| `/dashboard/billing-invoices` | `BillingInvoices.jsx` | Billing invoice logs |
| `/dashboard/reports/content` | `ContentReports.jsx` | Content compliance & report resolution |
| `/dashboard/support-tickets` | `SupportTickets.jsx` | Support ticketing and conversations |
| `/dashboard/settings` | `Settings.jsx` | Storage, payment, SMTP, and site configurations |
| `/dashboard/settings/seo` | `SeoManagement.jsx` | SEO metadata management |
| `/dashboard/system-health` | `SystemHealth.jsx` | Server & storage latency monitoring |
