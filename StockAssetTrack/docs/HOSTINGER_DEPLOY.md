# StockAssetTrack — Hostinger Business (`PHP/HTML`) & Official Adobe Stock API Deployment Guide

StockAssetTrack runs 24/7 on standard Hostinger **Business Shared Hosting (`PHP/HTML`)** using Pure PHP 8.2 + MySQL/MariaDB with zero Composer, Node.js, or Redis server requirements.

## 1. Build Frontend (`client/`) Locally
```bash
cd client
cp .env.production.example .env.production
# Set VITE_API_BASE_URL=https://api.stockassettrack.com (and optional VITE_TURNSTILE_SITE_KEY)
npm run build
```
Upload the entire contents of `client/dist/` into the frontend domain root (`public_html/`) and include a SPA fallback `.htaccess` in `public_html/`:
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

## 2. Deploy Backend (`server/`) to `api.stockassettrack.com`
1. Create a MySQL database in Hostinger **hPanel → Databases** and import `server/database/schema.sql`.
2. Point `api.stockassettrack.com` web root to `server/public/` (or upload `server/` and route `public_html` to `server/public/index.php`).
3. Create `server/.env` from `server/.env.example`:
   - `APP_ENV=production`
   - `APP_DEBUG=false`
   - `APP_URL=https://api.stockassettrack.com`
   - `CORS_ALLOWED_ORIGINS=https://stockassettrack.com,https://www.stockassettrack.com`
   - Strong random `APP_SECRET` and `CRON_SECRET`
   - `REQUIRE_AUTH_FOR_METERED=true` (when enforcing SaaS quotas for logged-in/free tiers)
   - Set `TURNSTILE_SECRET_KEY`, `GEMINI_API_KEY` / `OPENAI_API_KEY`, and `STRIPE_WEBHOOK_SECRET` / `CREEM_WEBHOOK_SECRET` / `CRYPTOMUS_API_KEY`.
4. Confirm `https://api.stockassettrack.com/api/health` returns `{"success":true,"database":{"status":"connected"}}`.

## 3. Switch Demo Mode to Official Adobe Stock API (`ADOBE_DATA_MODE=official`)
Once your Adobe Developer / Affiliate key is approved:
1. Update `server/.env`:
   ```env
   ADOBE_DATA_MODE=official
   ADOBE_API_KEY=your-approved-adobe-stock-api-key
   ADOBE_PRODUCT_HEADER=StockAssetTrack/1.0
   ```
2. Clear any stale `demo:` cache rows via `cleanup_cache.php` or MySQL `TRUNCATE TABLE cache_entries;`.
3. Refresh `https://api.stockassettrack.com/api/health` and confirm `"adobeDataMode":"official"` and `"adobeKeyConfigured":true`.

## 4. Configure Hostinger Cron Jobs (**hPanel → Advanced → Cron Jobs**)
- **Heat Map Daily Snapshot (02:00 UTC):**
  `php /home/<USER>/domains/api.stockassettrack.com/server/cli/generate_heatmap.php`
- **Expired Cache & Rate Limit Cleanup (03:30 UTC):**
  `php /home/<USER>/domains/api.stockassettrack.com/server/cli/cleanup_cache.php`
