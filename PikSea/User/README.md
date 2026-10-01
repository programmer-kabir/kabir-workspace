# 🌊 PikSea — User Marketplace

**Tech Stack:** React 19 · Vite 8 · Tailwind CSS v4 · TanStack React Query · Framer Motion

---

## 📌 Project Overview

**PikSea** is a premium 1st-party Digital Stock Media Marketplace & Studio platform where users can:
- Discover and search thousands of high-quality **Vectors, Photos, PSDs, 3D Graphics, Video footage, and Templates**.
- Download **Free & Pro** assets.
- Subscribe to monthly/annual **Pro Membership Plans** or buy **Credit Packages**.
- Curate and save items to personalized **Collections**.
- Purchase full **Exclusive Rights Buyouts** for selected assets.

---

## 🗂️ Application Routes

| Route | Page / Component | Description | Access |
| :--- | :--- | :--- | :--- |
| `/` | `HomePage.jsx` | Hero search, category filters, spotlight curation, and masonry feed | Public |
| `/search` | `SearchPage.jsx` | Multi-facet filtering (file type, license, orientation, colors) | Public |
| `/:category` | `HomePage.jsx` | Category landing page | Public |
| `/:category/:slugOrSub` | `CategoryDispatcher.jsx` | Dynamic dispatcher for subcategories and single asset details | Public |
| `/join-pro` | `PricingPage.jsx` | Subscription plan matrix and credit packages | Public |
| `/checkout/:planId` | `CheckoutPage.jsx` | Dynamic billing checkout & PDF invoice generation | Auth |
| `/success` | `SuccessPage.jsx` | Order confirmation | Auth |
| `/accounts` | `AccountPage.jsx` | User profile, active subscription status, and download history | Auth |
| `/account/collections` | `CollectionsDashboard.jsx` | User bookmark and collection folders | Auth |
| `/collection/:id` | `SingleCollectionView.jsx` | Public / private collection view | Public / Auth |
| `/login` | `Login.jsx` | Google & Email authentication | Guest |
| `/about-us` | `AboutUs.jsx` | Company information | Public |
| `/contact-us` | `ContactUs.jsx` | Support contact form | Public |
| `/faqs` | `FaqPage.jsx` | Categorized FAQs | Public |
| `/licensing` | `Licensing.jsx` | Commercial standard & exclusive license terms | Public |
| `/privacy-policy` | `PrivacyPolicy.jsx` | Privacy policy | Public |
| `/terms-of-use` | `Terms.jsx` | Terms of use | Public |
| `/dmca` | `Dmca.jsx` | Copyright & DMCA compliance | Public |
| `/refund-policy` | `RefundPolicy.jsx` | Refund terms | Public |
