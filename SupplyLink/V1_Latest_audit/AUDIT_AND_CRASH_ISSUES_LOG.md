# 📋 SupplyLink: সিস্টেম অডিট, রানটাইম ক্র্যাশ ও ৪০৪ এরর লগবুক
> **তারিখ:** ০২ নভেম্বর ২০২৬  
> **প্রজেক্ট:** SupplyLink (Admin Panel & User Dashboard)  
> **সংরক্ষণের উদ্দেশ্য:** ভবিষ্যতে যেকোনো সময় সমস্যাগুলোর রেফারেন্স দেখা এবং ধারাবাহিকভাবে সমাধান নিশ্চিত করা।

---

## ১. সারসংক্ষেপ ও ব্যাকগ্রাউন্ড হিস্ট্রি (Background History)

সম্প্রতি অ্যাপ্লিকেশনে দুটি ভিন্ন প্রকৃতির সমস্যা দেখা দিয়েছিল:
1. **সমস্যা ১ (স্ক্রিন ক্র্যাশ ৪০৪):** `/customers/installment_cards/card_Details?cardId=...` পেজে ঢুকলে সম্পূর্ণ পেজ ক্র্যাশ করে রিঅ্যাক্ট রাউটারের ফলব্যাক `ErrorPage` (পৃষ্ঠাটি খুঁজে পাওয়া যায়নি - 404) প্রদর্শন করত।
   - **আসল কারণ:** `CustomerCardDetails.jsx`-এ `isCustomerInstallmentsCardsError` ভ্যারিয়েবলটি `useCustomerInstallmentCards()` হুক থেকে ডিস্ট্রাকচার না করায় লাইন ১৩৭-এ `ReferenceError` ঘটেছিল।
   - **বর্তমান অবস্থা:** ✅ **সমাধান করা হয়েছে ও গিটহাবে পুশ সম্পন্ন (Commit: `090744f`)**।

2. **সমস্যা ২ (এপিআই কল ৪০৪):** `/cash/bank_reconciliation` পেজে ঢুকলে লাল টোস্টে `"লোড ব্যর্থ ❌ - The requested URL was not found on this server."` আসত এবং নেটওয়ার্ক ট্যাবে `get_reconciliation_list.php`, `manage_ai_settings.php`, `historical_gap.php` সব 404 দেখাত।
   - **আসল কারণ:** `BankReconciliation.jsx` এবং `HistoricalGapCard.jsx`-এ ফেচ রিকোয়েস্টে `credentials: "include"` ছিল না। ফলে ব্যাকএন্ডের `auth_guard.php` সেশন কুকি (`PHPSESSID`) না পেয়ে সিকিউরিটি হিসেবে সরাসরি 404 রিটার্ন করছিল।
   - **বর্তমান অবস্থা:** ✅ **উভয় ফাইলে `credentials: "include"` যোগ করা হয়েছে এবং `Admin_panel/src/main.jsx` ও `User_Dashboard/src/main.jsx`-এ গ্লোবাল `window.fetch` ইন্টারসেপ্টর সক্রিয় করা হয়েছে (Commit: `090744f`)**।

---

## ২. অডিট ও ফিক্সকৃত ফাইলসমূহ (Audited & Resolved Critical Bugs)

কোডবেজের সম্পূর্ণ স্ট্যাটিক অ্যানালাইসিস ও ইএসলিন্ট (ESLint) অডিটে পাওয়া ৪টি মারাত্মক ফাইল যেখানে রানটাইম ক্র্যাশ হতে পারত, সবগুলোই সফলভাবে ফিক্স করা হয়েছে:

---

### ✅ বাগ ১: `DailyInstallmentsUsersDetails.jsx` (লাইন ১১৭) — [ফিক্সড]
- **ফাইলের অবস্থান:** `Admin_panel/src/Pages/shared/DailyInstallments/DailyInstallmentsUsersDetails.jsx`
- **পূর্বের সমস্যা:** `cleanName` ফাংশন ইমপোর্ট বা ডিফাইন করা ছিল না (`no-undef`)।
- **প্রয়োগকৃত সমাধান:** ফাইলে সঠিক `cleanName` হেল্পার ফাংশন যুক্ত করা হয়েছে।

---

### ✅ বাগ ২: `InvestmentPayments.jsx` (লাইন ৫০১) — [ফিক্সড]
- **ফাইলের অবস্থান:** `Admin_panel/src/Pages/shared/Investors/InvestmentPayments.jsx`
- **পূর্বের সমস্যা:** রিভিউ মডাল সাবমিটে অস্তিত্বহীন `refetch()` কল করায় ক্র্যাশ হতো।
- **প্রয়োগকৃত সমাধান:** `refetch()` পরিবর্তন করে সঠিক ফাংশন `fetchCardInstallments(true)` কল করা হয়েছে।

---

### ✅ বাগ ৩: `CashEditModal.jsx` (লাইন ৮৭) — [ফিক্সড]
- **ফাইলের অবস্থান:** `Admin_panel/src/components/cash/CashEditModal.jsx`
- **পূর্বের সমস্যা:** টোস্ট ম্যাসেজে `formData.amount` খোঁজা হয়েছিল যা অনির্ধারিত ছিল।
- **প্রয়োগকৃত সমাধান:** মডালের সঠিক স্টেট `newAmount` বসানো হয়েছে (`Number(newAmount) || 0`)।

---

### ✅ বাগ ৪: `StaffCard.jsx` (লাইন ৫৭ ও ১০৮) — [ফিক্সড]
- **ফাইলের অবস্থান:** `Admin_panel/src/components/StaffCard/StaffCard.jsx`
- **পূর্বের সমস্যা:** `useMemo` হুকের আগে `if (allowed.length === 0) return null;` থাকায় রিঅ্যাক্টের Rules of Hooks ভঙ্গ হতো।
- **প্রয়োগকৃত সমাধান:** আর্লি রিটার্ন চেকটিকে `useMemo` হুকের নিচে নিরাপদ স্থানে সরিয়ে আনা হয়েছে।

---

## ৩. ব্রাউজার ও সেশন কুকি সংক্রান্ত এপিআই ৪০৪ ইস্যু (Brave Shield & CORS Cloaking)

### কেন ছবি ২-এর মতো 404 আসে?
1. **ব্র্যাভ ব্রাউজার (Brave Shields):**
   - ব্র্যাভ ব্রাউজার ডিফল্টভাবে ক্রস-অরিজিন রিকোয়েস্টে (`http://localhost:5175` -> `https://api.supplylinkbd.com`) কুকি ও স্টোরেজ এক্সেস ব্লক করে রাখে।
   - ব্যাকএন্ডের `server/public_html/apis/auth_guard.php` ফাইলে স্পষ্ট লেখা আছে:
     ```php
     if (!isAuthenticated()) {
         http_response_code(404);
         echo json_encode(["success" => false, "error" => "Not Found", "message" => $customMessage]);
         exit;
     }
     ```
   - অর্থাৎ ইউজার লগইন থাকা সত্ত্বেও যদি ব্রাউজার কুকি না পাঠায়, ব্যাকএন্ড 401 বা 403 না দেখিয়ে সরাসরি ছদ্মবেশী **404 Not Found** ফিরিয়ে দেয়।

2. **Vite Proxy কনফিগারেশন অসামঞ্জস্য:**
   - `Admin_panel/vite.config.js`-এ সুন্দর প্রক্সি তৈরি করা আছে:
     ```javascript
     proxy: {
       "/apis": {
         target: "https://api.supplylinkbd.com",
         changeOrigin: true,
         cookieDomainRewrite: { "*": "" }
       }
     }
     ```
   - কিন্তু `Admin_panel/.env` ফাইলে সরাসরি `VITE_LOCALHOST_KEY=https://api.supplylinkbd.com/apis` বসানো। যদি এটি পরিবর্তন করে লোকাল প্রক্সি পাথ `/apis` ব্যবহার করা হয়, তবে ব্রাউজার মনে করবে রিকোয়েস্ট লোকালহোস্টেই যাচ্ছে, ফলে ব্র্যাভ শিল্ড বা থার্ড-পার্টি কুকি ব্লকিংয়ের কোনো ঝুঁকি থাকবে না।

---

## ৪. ইউজার রোল পারমিশন সংক্রান্ত ৪০৪ (Role-based Cloaked 404)

ব্যাকএন্ডের কিছু নির্দিষ্ট ফাইলে শুধুমাত্র ম্যানেজার, এডমিন ও ডেভেলপারদের অনুমতি দেওয়া হয়েছে (`guardManagerAdminOnly()`):
- **Other Sources & Assets:** `apis/other_sources/*` (`create_asset.php`, `get_assets.php`, `sell_asset.php`, `collect_dividend.php` ইত্যাদি)
- **Profit Management:** `apis/profit/*` (`getAllProfitHistory.php`, `getTotalProfit.php`, `get_profit_status.php`, `save_profit_action.php` ইত্যাদি)
- **Withdraw Applications:** `apis/withdraw_applications/*` (`create_withdraw_request.php`, `update_withdraw_request.php` ইত্যাদি)

> **ঝুঁকি:** যদি কোনো সাধারণ কর্মী (`staff` রোল) লগইন অবস্থায় এই পেজগুলোতে প্রবেশের চেষ্টা করে বা এমন বাটনে ক্লিক করে যা এই এপিআইগুলো কল করে, তাহলে ব্যাকএন্ড থেকে সাথে সাথে ছবি ২-এর মতো `404 Not Found` রিটার্ন আসবে।

---

## ৫. ইউজার ড্যাশবোর্ড কনফিগ অসামঞ্জস্য (`User_Dashboard`)

1. **`User_Dashboard/.env`:**
   - বর্তমান ভ্যালু: `VITE_LOCALHOST_KEY=http://localhost/supplylink/apis`
   - সমস্যা: লোকাল পিসিতে অ্যাপাচি চালু না থাকলে ইউজার ড্যাশবোর্ডের সব প্রোফাইল ও পেমেন্ট কল ব্যর্থ হবে। এটি প্রোডাকশন এপিআই `https://api.supplylinkbd.com/apis`-এর সাথে সামঞ্জস্যপূর্ণ হওয়া উচিত।
2. **`User_Dashboard/eslint.config.js`:**
   - লাইন ২-এ সিনট্যাক্স এরর: `import globals, { node } from "globals";` যা Node.js মডিউল লোডারে ফেইল করে।

---

## 📌 সংক্ষেপিত অ্যাকশন গাইড (Quick Action Reference)

যখনই আপনি বলবেন **"ফিক্স করো"**, নিচের ৪টি ফাইলে সরাসরি এক ক্লিকে সমাধান বাস্তবায়ন করা যাবে:
1. `Admin_panel/src/Pages/shared/DailyInstallments/DailyInstallmentsUsersDetails.jsx` -> `cleanName` ফাংশন যোগ।
2. `Admin_panel/src/Pages/shared/Investors/InvestmentPayments.jsx` -> লাইন ৫০১-এ `refetch()` এর বদলে `fetchCardInstallments(true)` দেওয়া।
3. `Admin_panel/src/components/cash/CashEditModal.jsx` -> লাইন ৮৭-এ `formData.amount` এর বদলে `newAmount` দেওয়া।
4. `Admin_panel/src/components/StaffCard/StaffCard.jsx` -> `useMemo` এর পর `if (allowed.length === 0)` সরানো।

