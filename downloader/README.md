# 🎬 StreamVault — All-in-One Video Downloader

StreamVault is a modern, high-performance, full-stack video downloader platform. It extracts high-resolution streams (up to 1080p Full HD) and MP3 audio from **YouTube, TikTok (No Watermark), Instagram Reels, Facebook Watch, Twitter / X, Vimeo**, and 1,500+ supported platforms.

---

## 📁 Project Architecture (Decoupled Client & Server)

```text
downloader/
│
├── client/                     # Frontend Web App (React 18 + Vite + TypeScript + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # HeroSection, VideoCard, Navbar, FAQ, Features, etc.
│   │   ├── services/           # api.ts (handles /api/extract and direct streaming)
│   │   └── types/              # Video metadata and format definitions
│   ├── package.json
│   └── vite.config.ts          # Automatic proxy to backend API (:5000)
│
└── server/                     # Backend API Service (Node.js + Express + yt-dlp + FFmpeg)
    ├── bin/
    │   └── yt-dlp.exe          # Standalone high-speed media extractor binary
    ├── src/
    │   ├── server.js           # Express REST API (CORS, Rate Limiting, Routes)
    │   ├── services/
    │   │   └── extractor.js    # Multi-resolution parser & FFmpeg stream muxer
    │   └── utils/
    │       └── platformDetector.js # Smart URL & platform recognition
    ├── package.json
    └── .env                    # PORT=5000
```

---

## 🚀 Quick Start Guide

### 1. Run the Backend API Server:
```bash
cd downloader/server
npm run dev
# Server will run on: http://localhost:5000
```

### 2. Run the Frontend Client:
```bash
cd downloader/client
npm run dev
# Client will run on: http://localhost:5173 (or assigned port)
```

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Healthcheck and server uptime |
| `POST` | `/api/extract` | Extracts video metadata, thumbnail, duration, and formats |
| `GET` | `/api/download` | Direct streaming download (`?url=...&formatId=...&type=video\|audio`) |

---

## 🔒 Compliance & Fair Use Notice
StreamVault is strictly designed for non-DRM, public content where users possess authorization to download (creator backups, creative commons, public domain). DRM-protected or private restricted media are blocked by default.
