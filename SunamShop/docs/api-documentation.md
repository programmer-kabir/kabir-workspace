# SUNAM SHOP — REST API Documentation

**Base API URL:** `/api/v1`  
**Data Format:** JSON (`application/json; charset=utf-8`)  
**Standard Response Envelope:**
```json
{
  "success": true,
  "status_code": 200,
  "message": "Operation completed successfully.",
  "data": {},
  "errors": null,
  "meta": {
    "timestamp": "2026-11-28T15:00:00+06:00",
    "version": "v1"
  }
}
```

---

## 1. Authentication Endpoints (`/api/v1/auth`)

### 1.1 Register Customer
* **Endpoint:** `POST /api/v1/auth/register`
* **Access:** Public
* **Payload:**
```json
{
  "phone": "01712345678",
  "full_name": "মোঃ রফিকুল ইসলাম",
  "password": "SecurePassword123"
}
```

### 1.2 User Login
* **Endpoint:** `POST /api/v1/auth/login`
* **Access:** Public
* **Payload:**
```json
{
  "phone": "01712345678",
  "password": "SecurePassword123"
}
```

### 1.3 Active User Profile
* **Endpoint:** `GET /api/v1/auth/me`
* **Access:** Authenticated (Bearer Token or HttpOnly Session)

---

## 2. Customer Storefront Endpoints

### 2.1 Category Tree
* **Endpoint:** `GET /api/v1/categories`
* **Access:** Public

### 2.2 Product Catalog
* **Endpoint:** `GET /api/v1/products`
* **Access:** Public
* **Query Parameters:** `category_id`, `sourcing_type`, `search`, `min_price`, `max_price`, `page`, `limit`, `sort`

### 2.3 Product Details
* **Endpoint:** `GET /api/v1/products/{slug}`
* **Access:** Public

### 2.4 Delivery Zones
* **Endpoint:** `GET /api/v1/delivery-zones`
* **Access:** Public

### 2.5 Place Order (Idempotent)
* **Endpoint:** `POST /api/v1/orders`
* **Access:** Public (supports both registered customers and guest checkout)
* **Header:** `Idempotency-Key: <UUIDv4>`
* **Payload:**
```json
{
  "customer_name": "করিম উদ্দিন",
  "customer_phone": "01812345678",
  "delivery_zone_id": 1,
  "delivery_address": "হাসন নগর, সুনামগঞ্জ সদর",
  "payment_method": "COD",
  "customer_notes": "সকালের মধ্যে ডেলিভারি দিলে ভালো হয়",
  "items": [
    {
      "product_id": 5,
      "quantity": 2
    },
    {
      "product_id": 12,
      "quantity": 1.5,
      "is_variable_weight": true,
      "approved_weight_tolerance_percent": 10
    }
  ]
}
```

### 2.6 Track Order
* **Endpoint:** `GET /api/v1/orders/{orderNumber}/track`
* **Access:** Public

### 2.7 Customer Confirm Variable Weight
* **Endpoint:** `POST /api/v1/orders/{id}/approve-weight`
* **Access:** Authenticated Customer
* **Payload:** `{"approved": true}`

---

## 3. Admin & Operational Endpoints (`/api/v1/admin/*`)

### 3.1 Admin Dashboard Metrics
* **Endpoint:** `GET /api/v1/admin/dashboard`
* **Access:** Admin, Manager

### 3.2 Product CRUD
* `GET /api/v1/admin/products`
* `POST /api/v1/admin/products`
* `PUT /api/v1/admin/products/{id}`
* `DELETE /api/v1/admin/products/{id}`

### 3.3 Order Management
* `GET /api/v1/admin/orders`
* `PATCH /api/v1/admin/orders/{id}/status`
* `PATCH /api/v1/admin/orders/{id}/record-weight` (Records actual fish/meat scale weight)
* `POST /api/v1/admin/orders/{id}/assign-delivery`

### 3.4 Sourcing & Local Suppliers
* `GET /api/v1/admin/suppliers`
* `POST /api/v1/admin/suppliers`
* `GET /api/v1/admin/sourcing/pending` (Items needed from morning bazaars)

### 3.5 Inventory & Stock Movements
* `GET /api/v1/admin/inventory`
* `POST /api/v1/admin/inventory/adjust`
* `GET /api/v1/admin/inventory/movements`

### 3.6 Financial Reports
* `GET /api/v1/admin/reports/sales`
* `GET /api/v1/admin/reports/profit-loss` (Gross vs Net Profit with expense deduction)
* `POST /api/v1/admin/expenses`
