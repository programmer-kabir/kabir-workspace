# 📊 StockAssetTrack — Adobe Stock & Microstock Intelligence Platform

**StockAssetTrack** is a data-driven SaaS tool built for Adobe Stock contributors, photographers, and Generative AI creators to research high-converting niches, track competitor portfolios, and extract top-ranking metadata.

---

## 📁 Architecture

- **`client/`**: React 18 + TypeScript + Vite + Tailwind CSS + Recharts + Lucide Icons + Sonner (Interactive Dashboard, Port `5174`)
- **`server/`**: Clean Pure PHP 8.2 + PDO + MySQL/MariaDB REST API (Hostinger `PHP/HTML` & XAMPP ready, Port `5001`)
- **`docs/`**: Master blueprint & system specifications ([PROJECT_BLUEPRINT.md](docs/PROJECT_BLUEPRINT.md))

---

## ⚡ Core Capabilities

1. **Keyword, Niche & Market Explorer**: Market summary, Demand/Competition/Opportunity Index, 12 instant client-side sorts, and CSV export.
2. **Visual Similar & Image Upload Discovery**: Fully enriched similar asset search by ID or uploaded image.
3. **Portfolio Velocity Tracker**: Track competitor uploads, AI vs Real splits, country flags, and download velocity charts.
4. **Category Heat Map**: 6-media-type category demand heatmap (`Photo`, `Illustration`, `Vector`, `Video`, `Template`, `3D`).
5. **Metadata & Top-10 Tag Cluster Extractor**: Frequency-ranked keyword clusters formatted for Adobe Stock CSV submission.
6. **AI Prompt Reverse Engineer & Seasonal Calendar**: Reconstructs Midjourney/Flux/SD prompts and maps 60–90 day seasonal opportunities.

---

## 🚀 Quick Start (Windows / XAMPP)

### 1. Database Setup (MariaDB / MySQL):
Import `server/database/schema.sql` into phpMyAdmin or MySQL (`stockassettrack` database) and copy `server/.env.example` to `server/.env`.

### 2. Backend (Pure PHP 8.2 on `http://localhost:5001`):
```powershell
cd server
C:\xampp\php\php.exe -S localhost:5001 -t public
```

### 3. Frontend (React + Vite on `http://localhost:5174`):
```powershell
cd client
npm.cmd install
npm.cmd run dev
```
