# 🚀 Project Instructions & Workflow Rules (FF_TopUp)

## Project Overview
- **Name:** FF_TopUp (TopUp BD)
- **Type:** Gaming Diamond Top-Up Platform (BD Server)
- **Folders:**
  - `topup/`: React + Vite Frontend Storefront (Port 5175)
  - `admin/`: Dedicated Admin Control Center
  - `server/`: Backend Engine (PHP + MySQL via local XAMPP)

## Pre-Approved Commands & Operations
- `npm.cmd run dev` (run from `topup/` directory)
- `npm.cmd run build` (run from `topup/` directory)
- PowerShell standard commands (`Get-ChildItem`, `Test-Path`, `Move-Item`, `Copy-Item`)
- Terminal OS: Windows PowerShell

## Language & Communication Preference
- **Language:** Bengali / Banglish (সহজ ও স্পষ্ট বাংলায় কথা বলা)
- **Style:** Direct, helpful, concise, with clickable file links

## Future Architecture Guidelines
- Incrementally migrate data services from Firebase to local PHP + MySQL (XAMPP).
- Do not make breaking edits without user's explicit confirmation.

## 📌 Project Status & Memory Checkpoint (Current State)
- **Frontend (`topup/`):** 
  - Pure Tailwind CSS + White mode permanently configured.
  - Container widened to `max-width: 1560px` (`topup/src/index.css`).
  - Hero carousel, product catalog, notice ticker, live stats counter fully styled.
  - Builds cleanly with 0 errors (`npm run build`). Dev server active on port 5175.
- **Backend (`server/` & XAMPP):**
  - Database: `ff_topup_db` on MySQL port 3306.
  - Apache linked to `C:\xampp\htdocs\ff_topup_api`.
- **TopUp API Research (`ucbot.net`):**
  - Selected System: **UcBot Stockless Reseller API (`https://ucapi.ucbot.net/api/topup`)**
  - Package Codes:
    - 25 💎 -> item `20`
    - 50 💎 -> item `36`
    - 115 💎 -> item `80`
    - 240 💎 -> item `160`
    - 610 💎 -> item `405`
    - 1240 💎 -> item `810`
    - 2530 💎 -> item `1625`
  - Contact details: Telegram `@asraf_nabil`, WhatsApp `+8801858881017`.
- **Waiting On:** User has contacted UcBot for a Demo / Sandbox API Key.
- **Resume Trigger Phrase:** User can just say **"UcBot এর কি পেয়েছি, আগের প্রজেক্ট শুরু করো"** or provide the API Key.


