# 📋 সম্প্রতি এডিট ও তৈরি করা PHP ফাইলসমূহের তালিকা (SupplyLink Backend APIs)

এই ডকুমেন্টে সম্প্রতি কিস্তি অতিরিক্ত জমা ওয়ালেট (Extra Balance), জালিয়াতি রোধ (Anti-Fraud Row Locking) এবং নতুন `data_entry` রোলের পারমিশন গার্ড বাস্তবায়নে যে যে PHP ফাইলগুলো এডিট বা তৈরি করা হয়েছে তার বিস্তারিত তালিকা দেওয়া হলো:

---

### ১. `server/public_html/apis/customers/installment_payment_update.php`
* **পাথ:** `c:\Users\CCA\Desktop\kabir-workspace\SupplyLink\Others_Source_Profit\server\public_html\apis\customers\installment_payment_update.php`
* **কী কী পরিবর্তন হয়েছে:**
  1. **পারমিশন গার্ড (`guardEntryOnly()`):** শুধুমাত্র `admin`, `developer`, এবং `data_entry` কিস্তি পেইড/সেভ করতে পারবে। সাধারণ `manager` বা `staff` পারবে না।
  2. **ডাটাবেজ রো লকিং (`FOR UPDATE`):** কিস্তি সেভ হওয়ার সময় `SELECT extra_balance FROM installment_cards WHERE id = ? FOR UPDATE` দিয়ে ডাটাবেজ রো লক করা হয়েছে, যাতে একই জমা টাকা একাধিক ট্যাবে ডাবল খরচ করা না যায়।
  3. **স্বয়ংক্রিয় ব্যালেন্স হিসাব ও ট্রানজেকশন:** কিস্তির অতিরিক্ত টাকা দেওয়া বা সমন্বয় করার সঠিক হিসাব এবং `$mysqli->begin_transaction()` ও `$mysqli->commit()` যুক্ত করা হয়েছে।
  4. **আর্গুমেন্ট টাইপ ফিক্স:** `bind_param('sssidddi', ...)` প্যারামিটার কাউন্ট ঠিক করা হয়েছে।
  5. **রেসপন্সে ব্যালেন্স ফেরত:** রেসপন্স অবজেক্টে `"card_extra_balance"` পাঠানো হয়েছে যেন ফ্রন্টএন্ড ০-সেকেন্ডে আপডেট হতে পারে।

---

### ২. `server/public_html/apis/customers/refund_extra_amount.php`
* **পাথ:** `c:\Users\CCA\Desktop\kabir-workspace\SupplyLink\Others_Source_Profit\server\public_html\apis\customers\refund_extra_amount.php`
* **কী কী পরিবর্তন হয়েছে:**
  1. **পারমিশন গার্ড (`guardEntryOnly()`):** শুধুমাত্র `admin`, `developer`, এবং `data_entry` ক্যাশ রিফান্ড করতে পারবে।
  2. **অ্যাটমিক রো লকিং (`FOR UPDATE`):** টাকা ফেরত দেওয়ার আগে কার্ডের ব্যালেন্স লক করে যাচাই করা হয় পর্যাপ্ত ব্যালেন্স আছে কি না।
  3. **ক্যাশ আউট ভাউচার:** স্বয়ংক্রিয়ভাবে `cash` টেবিলে `out` ক্যাটাগরির অ্যাপ্রুভড ভাউচার তৈরি করে।
  4. **লেজার লগ:** `installment_extra_logs` টেবিলে অডিট হিস্ট্রি রাখে।

---

### ৩. `server/public_html/apis/auth_guard.php`
* **পাথ:** `c:\Users\CCA\Desktop\kabir-workspace\SupplyLink\Others_Source_Profit\server\public_html\apis\auth_guard.php`
* **কী কী পরিবর্তন হয়েছে:**
  1. **নতুন ফাংশন `guardEntryOnly()` যুক্ত:** 
     ```php
     function guardEntryOnly() {
         return requireRole(['admin', 'developer', 'data_entry'], "আপনার ডাটা এন্ট্রি করার অনুমতি নেই (data_entry রোল প্রয়োজন)");
     }
     ```
  2. **ক্রন জব বাইপাস ফিক্স:** রাত ১১:৫৫ মিনিটের ব্যাকআপ স্ক্রিপ্টের জন্য `isCronOrCli()` বাইপাস সাপোর্ট।

---

### ৪. `server/public_html/apis/cash/cashIn.php`
* **পাথ:** `c:\Users\CCA\Desktop\kabir-workspace\SupplyLink\Others_Source_Profit\server\public_html\apis\cash\cashIn.php`
* **কী কী পরিবর্তন হয়েছে:**
  - `guardAdminOnly();` পরিবর্তন করে `guardEntryOnly();` করা হয়েছে। ফলে সাধারণ স্টাফ বা ম্যানেজার ম্যানুয়ালি ক্যাশ ইন দিয়ে ডাবল এন্ট্রি করতে পারবে না—শুধুমাত্র `admin`, `developer`, এবং `data_entry` পারবে।

---

### ৫. `server/public_html/apis/cash/cashOut.php`
* **পাথ:** `c:\Users\CCA\Desktop\kabir-workspace\SupplyLink\Others_Source_Profit\server\public_html\apis\cash\cashOut.php`
* **কী কী পরিবর্তন হয়েছে:**
  - `guardAdminOnly();` পরিবর্তন করে `guardEntryOnly();` করা হয়েছে। সাধারণ স্টাফ বা ম্যানেজার চাইলেই ক্যাশ আউট করতে পারবে না।

---

### ৬. `server/public_html/apis/customers/get_extra_logs.php`
* **পাথ:** `c:\Users\CCA\Desktop\kabir-workspace\SupplyLink\Others_Source_Profit\server\public_html\apis\customers\get_extra_logs.php`
* **কী কী কাজ করে:**
  - নির্দিষ্ট কিস্তি কার্ডের অতিরিক্ত জমার সম্পূর্ণ খতিয়ান (হিস্ট্রি) রিটার্ন করে: কবে কত টাকা অতিরিক্ত জমা হয়েছে, কোন কিস্তিতে কত সমন্বয় হয়েছে, এবং কত টাকা নগদ ফেরত দেওয়া হয়েছে।

---

### ৭. `server/public_html/apis/customers/migrate_installment_extra.php`
* **পাথ:** `c:\Users\CCA\Desktop\kabir-workspace\SupplyLink\Others_Source_Profit\server\public_html\apis\customers\migrate_installment_extra.php`
* **কী কী কাজ করে:**
  - ডাটাবেজে `installment_payments` টেবিলে `extra_amount`, `adjusted_from_extra`, `total_paid_cash` কলাম এবং `installment_cards` টেবিলে `extra_balance` কলাম ও `installment_extra_logs` টেবিল স্বয়ংক্রিয়ভাবে তৈরি/মাইগ্রেট করেছে।

---

### ৮. `server/public_html/apis/customers/get_installment_payments.php`
* **পাথ:** `c:\Users\CCA\Desktop\kabir-workspace\SupplyLink\Others_Source_Profit\server\public_html\apis\customers\get_installment_payments.php`
* **কী কী পরিবর্তন হয়েছে:**
  - কিস্তি পেমেন্ট ফেচ করার সময় নতুন কলামগুলো (`extra_amount`, `adjusted_from_extra`, `total_paid_cash`) রিটার্ন করা হচ্ছে।

---

### ৯. `server/public_html/apis/customers/get_installment_cards.php`
* **পাথ:** `c:\Users\CCA\Desktop\kabir-workspace\SupplyLink\Others_Source_Profit\server\public_html\apis\customers\get_installment_cards.php`
* **কী কী পরিবর্তন হয়েছে:**
  - কিস্তি কার্ডের ডাটার সাথে কার্ডের বর্তমান অতিরিক্ত জমার ব্যালেন্স (`extra_balance`) সিলেক্ট করে ক্লায়েন্ট রেডাক্স স্টোরে সরবরাহ করা হচ্ছে।

---

### ১০. `server/public_html/apis/helpers/mailer.php`
* **পাথ:** `c:\Users\CCA\Desktop\kabir-workspace\SupplyLink\Others_Source_Profit\server\public_html\apis\helpers\mailer.php`
* **কী কী পরিবর্তন হয়েছে:**
  - কিস্তি পরিশোধের সময় ইমেইল টেমপ্লেট ও নোটিফিকেশনে অতিরিক্ত জমার পরিমাণ সঠিকভাবে রেন্ডার হওয়া নিশ্চিত করা হয়েছে।
