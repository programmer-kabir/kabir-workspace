# SupplyLink — Admin Panel

> React 19 + Vite 7 + Tailwind CSS v4 Back-Office Operations Portal.

For the project-wide architectural blueprint, database schemas, and mathematical models, see the [Root Master Blueprint](../MASTER_BLUEPRINT.md) and [Root README](../README.md).

---

## 🚀 Quick Run (Development)

```bash
# Install dependencies
npm install

# Run Vite dev server on port 5175 (Windows PowerShell: npm.cmd run dev)
npm run dev
```

URL: [http://localhost:5175/](http://localhost:5175/)

---

## 📦 Production Build

```bash
npm run build
# Output will be generated in ./dist
```

---

## ⚙️ Environment Variables (`.env`)

```env
VITE_LOCALHOST_KEY=http://localhost/supplylink/apis
VITE_IMG_KEY=http://localhost/supplylink/uploads
VITE_USER_APP_URL=http://localhost:5176
```

---

## 🔑 Key Roles & Routing
- `admin`: Full administrative access
- `manager`: Branch operations, collections, and report verification
- `staff`: Field collection, installment records, and cash voucher entry
- `developer`: Diagnostics, system activity logs, and technical telemetry
