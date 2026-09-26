# 📊 Creative Computer Academy (CCA) — Complete Project Audit & Action Goals Report

**Generated Date:** September 8, 2026  
**System Architecture:** Multi-Portal React (Admin, Staff, Reviewer, Student) + PHP REST API + MySQL + Cloudflare R2 + Pusher Real-time  
**Timezone Reference:** Asia/Dhaka (+06:00)

---

## 📌 ১. প্রজেক্ট পরিচিতি ও আর্কিটেকচার (Project Overview & Architecture)

| কম্পোনেন্ট | পোর্ট / ডিরেক্টরি | ভূমিকা ও দায়িত্ব |
| :--- | :--- | :--- |
| **Admin Portal** | `http://localhost:5173`<br>[`admin-frontend`](file:///c:/Users/DAYALGURU/Desktop/KABIR/CreateiveComputerAcademy/admin-frontend) | অ্যাডমিন ড্যাশবোর্ড, স্টাফ ও স্টুডেন্ট ডিরেক্টরি, কোর্স ও ব্যাচ, টাস্ক তদারকি, অ্যাটেন্ডেন্স ডিসপিউট সমাধান, লিভ অ্যাপ্রুভাল, ডাটাবেজ ম্যানেজার, মাস্টার ও রিভিউর রিপোর্ট। |
| **Staff Portal** | `http://localhost:5174`<br>[`staff-frontend`](file:///c:/Users/DAYALGURU/Desktop/KABIR/CreateiveComputerAcademy/staff-frontend) | স্টাফ ড্যাশবোর্ড, টাস্ক লাইফসাইকেল (Create, Work, Submit), স্মার্ট অ্যাটেন্ডেন্স ও ব্রেক ট্র্যাকার, ক্রেডিট ব্যালেন্স ও লিডারবোর্ড, লিভ অ্যাপ্লিকেশন, ব্র্যান্ড কিট। |
| **Review Portal** | `http://localhost:5175`<br>[`review-frontend`](file:///c:/Users/DAYALGURU/Desktop/KABIR/CreateiveComputerAcademy/review-frontend) | QA ও রিভিউয়ার পোর্টাল (Pending, Completed, Rejected কিউ), কোয়ালিটি স্কোরিং ও ফিডব্যাক, রিজেকশন হ্যান্ডলিং, টিম লিডারবোর্ড ও অ্যানালিটিক্স। |
| **Student Portal** | `http://localhost:5176`<br>[`student-frontend`](file:///c:/Users/DAYALGURU/Desktop/KABIR/CreateiveComputerAcademy/student-frontend) | স্টুডেন্ট ড্যাশবোর্ড, কোর্স রুটিন ও ব্যাচ ইনফো, অ্যাসাইনমেন্ট সাবমিশন, অ্যাটেন্ডেন্স রেকর্ড ও স্টাডি রিসোর্স লাইব্রেরি। |
| **Backend API** | [`server/`](file:///c:/Users/DAYALGURU/Desktop/KABIR/CreateiveComputerAcademy/server) | মডুলার PHP RESTful API, MySQL PDO, Cloudflare R2 ক্লাউড স্টোরেজ, Pusher রিয়েল-টাইম ইভেন্টস। |

---

## 🚨 ২. চিহ্নিত বাগ ও সম্ভাব্য সমস্যার তালিকা (Identified Bugs & Potential Issues)

### 🔴 High Priority (জরুরি ফিক্স প্রয়োজন)

1. **ডাটাবেজ ম্যানেজার এন্ডপয়েন্টে অথরাইজেশন মিসিং (`run_query.php`)**
   - **ফাইল:** [`server/api/admin/database/run_query.php`](file:///c:/Users/DAYALGURU/Desktop/KABIR/CreateiveComputerAcademy/server/api/admin/database/run_query.php)
   - **সমস্যা:** সরাসরি র-SQL এক্সিকিউট করে কিন্তু ফাইলটিতে কোনো অ্যাডমিন টোকেন বা সেশন চেক নেই। যে কেউ সরাসরি POST রিকোয়েস্ট পাঠিয়ে ডাটাবেজ টেবিল ড্রপ/ডিলিট করতে পারে।
   - **করণীয়:** রিকোয়েস্টের শুরুতে টোকেন এবং অ্যাডমিন রোল ভ্যালিডেশন যুক্ত করা।

2. **অটো চেক-আউট ক্রন লজিক বাগ (`auto_checkout.php`)**
   - **ফাইল:** [`server/api/crons/auto_checkout.php`](file:///c:/Users/DAYALGURU/Desktop/KABIR/CreateiveComputerAcademy/server/api/crons/auto_checkout.php)
   - **সমস্যা:** কুয়েরি ফিল্টার `WHERE a.date <= :date AND a.check_out IS NULL` থাকায় দিনের বেলা ক্রন রান হলে যারা আজ কর্মরত আছেন তাদের সবাইকে আগেই ৫:০০ টায় চেক-আউট করে দিবে।
   - **করণীয়:** কুয়েরি পরিবর্তন করে শুধুমাত্র অতীতের তারিখ (`a.date < :date`) অথবা আজকের দিনের জন্য রাত ১১:৫৯ এর পর শিফট শেষ বিবেচনা করে রান করার শর্ত দেওয়া।

3. **টাস্ক স্ট্যাটাস আপডেটে আন-রোলব্যাকড ট্রানজেকশন (`update_task_status.php`)**
   - **ফাইল:** [`server/api/reviewer/update_task_status.php`](file:///c:/Users/DAYALGURU/Desktop/KABIR/CreateiveComputerAcademy/server/api/reviewer/update_task_status.php)
   - **সমস্যা:** `$db->beginTransaction()` শুরু করার পর টাস্ক না পেলে সরাসরি `echo` করে `exit;` করা হয়েছে কিন্তু `$db->rollBack()` কল করা হয়নি।
   - **করণীয়:** `exit;` এর পূর্বে `$db->rollBack();` নিশ্চিত করা।

4. **হার্ডকোডেড অফিস IP ও প্রক্সি ইস্যু (`check_in.php`, `check_out.php`)**
   - **ফাইল:** [`server/api/attendance/check_in.php`](file:///c:/Users/DAYALGURU/Desktop/KABIR/CreateiveComputerAcademy/server/api/attendance/check_in.php), [`server/api/attendance/check_out.php`](file:///c:/Users/DAYALGURU/Desktop/KABIR/CreateiveComputerAcademy/server/api/attendance/check_out.php)
   - **সমস্যা:** সরাসরি হার্ডকোডেড IP (`182.48.76.182`) চেক করা। ক্লাউডফ্লেয়ার বা প্রক্সির পেছনে থাকলে `$_SERVER['REMOTE_ADDR']` ক্লাউডফ্লেয়ারের IP ধরবে এবং স্টাফদের চেক-ইন ব্লক হয়ে যাবে।
   - **করণীয়:** `HTTP_CF_CONNECTING_IP` / `HTTP_X_FORWARDED_FOR` চেক করা এবং IP অ্যাড্রেস সেটিংস টেবিল থেকে ডায়নামিক করা।

5. **এক্সপোজড ওয়ান-টাইম পাসওয়ার্ড হ্যাশ মেকার (`make_hash.php`)**
   - **ফাইল:** [`server/api/auth/make_hash.php`](file:///c:/Users/DAYALGURU/Desktop/KABIR/CreateiveComputerAcademy/server/api/auth/make_hash.php)
   - **সমস্যা:** টেস্ট ফাইল যা ওপেন রাখা আছে। প্রোডাকশন সিকিউরিটির জন্য এটি মুছে ফেলা উচিত।

---

### 🟡 Medium Priority (পারফরম্যান্স ও কোড কোয়ালিটি)

6. **ফ্রন্টএন্ড হুক ডিপেন্ডেন্সি লিন্ট সতর্কতা:**
   - **ফাইল:** `admin-frontend/src/hooks/useTaskOversight.js`, `useMasterReport.js`, `useDatabaseManager.js`
   - **সমস্যা:** `useEffect` ও `useMemo` তে কিছু মিসিং ডিপেন্ডেন্সি রয়েছে।
   - **করণীয়:** `useCallback` ব্যবহার করে ফেচ ফাংশন মেমোইজ করা।

7. **AI কোয়ালিটি স্ক্যানার রেজেক্স এস্কেপ:**
   - **ফাইল:** `staff-frontend/src/components/AIQualityScanner.jsx`
   - **সমস্যা:** রেজেক্স প্যাটার্নে অপ্রয়োজনীয় এস্কেপ ক্যারেক্টার (`\+`, `\-`, `\.`) রয়েছে।

8. **CORS হেডার কনসিস্টেন্সি:**
   - **ফাইল:** কিছু এন্ডপয়েন্টে `header("Access-Control-Allow-Origin: *");` হার্ডকোডেড আছে যা `config/cors.php` এর সাথে কনফ্লিক্ট করতে পারে।

---

## 🎯 ৩. প্রজেক্টের লক্ষ্য ও ভবিষ্যৎ ফিক্সিং গোল (Actionable Goals & Roadmap)

### 🎯 Goal 1: সিকিউরিটি ও ডাটাবেজ প্রটেকশন
- [ ] `server/api/admin/database/` এর সমস্ত ফাইলে অ্যাডমিন JWT/টোকেন অথরাইজেশন মিডলওয়্যার বাধ্যতামূলক করা।
- [ ] `server/api/auth/make_hash.php` ফাইলটি ডিলিট বা নিরাপদ করা।
- [ ] সমস্ত ফাইল আপলোডে MIME-টাইপ ও এক্সটেনশন ভ্যালিডেশন কঠোর রাখা।

### 🎯 Goal 2: অ্যাটেন্ডেন্স ও ক্রন জব স্ট্যাবিলিটি
- [ ] `auto_checkout.php` ক্রন কুয়েরি শুধুমাত্র অতীতের তারিখ (`a.date < :date`) অথবা মধ্যরাতের শিফট এন্ড ফিল্টারে সীমাবদ্ধ করা।
- [ ] `check_in.php` ও `check_out.php` ফাইলে Cloudflare Header (`HTTP_CF_CONNECTING_IP`) সাপোর্ট যুক্ত করা এবং IP কনফিগারেশন ডাটাবেজ সেটিংসে স্থানান্তর করা।

### 🎯 Goal 3: ক্রেডিট সিস্টেম ও টাস্ক পাইপলাইন ইন্টিগ্রিটি
- [ ] `CreditHelper.php` এর মতো টাস্ক রিভিউর সমস্ত এন্ডপয়েন্টে ট্রানজেকশন ফেইল-সেফ ও রোলব্যাক নিশ্চিত করা।
- [ ] রিজেকশন ও অ্যাপ্রুভাল ইমেইল এবং নোটিফিকেশন টেমপ্লেটের সাথে সঠিক টাস্ক লিঙ্ক ম্যাপিং করা।

### 🎯 Goal 4: ফ্রন্টএন্ড ক্লিনআপ ও অপ্টিমাইজেশন
- [ ] চারটি ফ্রন্টএন্ডে অপ্রয়োজনীয় আইকন ও আনইউজড ভেরিয়েবল ক্লিন করা।
- [ ] হুক ডিপেন্ডেন্সি (`useEffect`, `useCallback`) অপ্টিমাইজ করে অপ্রয়োজনীয় রি-রেন্ডারিং কমানো।

---

## ✅ ৪. সিস্টেমের বর্তমান কার্যকারিতা (System Health Summary)

- 🟢 **Admin Frontend (Port 5173):** সম্পূর্ণ সচল ও রানিং।
- 🟢 **Staff Frontend (Port 5174):** সম্পূর্ণ সচল ও রানিং।
- 🟢 **Review Frontend (Port 5175):** সম্পূর্ণ সচল ও রানিং।
- 🟢 **Student Frontend (Port 5176):** সম্পূর্ণ সচল ও রানিং।
- 🟢 **Credit & Gamification Engine:** সম্পূর্ণ কার্যকরী ও অ্যাটমিক ট্রানজেকশনে সুরক্ষিত।
- 🟢 **Cloudflare R2 & Pusher Realtime:** কনফিগারেশন সম্পন্ন।

---
*রিপোর্টটি আপনার প্রজেক্টের মূল ডিরেক্টরিতে `PROJECT_AUDIT_REPORT.md` ফাইলে সংরক্ষিত করা হয়েছে।*
