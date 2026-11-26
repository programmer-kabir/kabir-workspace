# IconBaba Admin Panel — Deployment Guide (cPanel / Apache / No Node.js)

This standalone Admin Panel is built with **Vite + React + TypeScript + Tailwind CSS** (`admin/`).
It compiles into 100% static HTML, CSS, and JavaScript files (`admin/dist/`), meaning **it does NOT require Node.js on the server**.

---

## 1. Local Development
To run the admin panel locally:
```bash
cd admin
npm install
npm run dev
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 2. Building for Production
To build the production bundle:
```bash
cd admin
npm run build
```
This will compile all code and output production files to the `admin/dist/` folder:
- `admin/dist/index.html`
- `admin/dist/assets/` (.js and .css files)
- `admin/dist/.htaccess` (for Apache SPA fallback routing)

---

## 3. Deploying to cPanel (`admin.iconbaba.com`)
1. In cPanel, create a subdomain: **`admin.iconbaba.com`**
2. Point its Document Root to a folder (e.g. `public_html/admin` or `admin.iconbaba.com`).
3. Open cPanel **File Manager**.
4. Upload all files from inside `admin/dist/` into that document root folder:
   - `index.html`
   - `assets/` folder
   - `.htaccess`
5. Configure your production API URL:
   - If needed, update `.env` in `admin/` to:
     ```env
     VITE_API_URL=https://iconbaba.com/backend/api
     ```
   - Re-run `npm run build` before uploading.

---

## 4. Why this works without Node.js
- The browser downloads `index.html`, JavaScript, and CSS directly from Apache.
- All routing is handled client-side by `react-router-dom`.
- The `.htaccess` file ensures that if a user visits `admin.iconbaba.com/icons` or reloads the page, Apache redirects them to `index.html` instead of giving a 404 error.
- All data requests (icons, users, categories, stats, pricing, FAQ) are sent directly to the PHP backend (`/backend/api/...`).
