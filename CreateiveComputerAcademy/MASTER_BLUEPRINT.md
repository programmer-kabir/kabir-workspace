# 🏛️ Creative Computer Academy (CCA) — Master Blueprint

**Generated / Updated:** November 24, 2026  
**Role:** Lead Software Architect / Senior Full-Stack Developer Analysis  
**Scope:** Full repository — 4 React web frontends, 2 Electron Desktop Apps (`Admin-Desktop` Executive Station & `Attendance-Desktop` Staff Workstation Surveillance App v2.1.0 with 100% Web Feature Parity), 1 PHP REST backend (425 endpoints across 34 domains), 99 baseline MySQL tables + dynamic runtime self-healing tables, Live WebRTC Video Conferencing & CCA Studio Hub (`MeetingDbHelper.php`), Cloudflare R2, Google Drive Cloud Vault (`CCA_Vault/Workstation_Videos`), Pusher Realtime WebSockets, WebRTC Live Screen Streaming & Remote Control (`input_injector.exe`), Workstation 30-Min Video Surveillance & Audit Vault, Single Source of Truth (SSoT) Modular Overtime & Payroll Ledger Engine (`OvertimeEngine.php`, `PayrollLedger.php`), Scoped Staff Workstation & Idle Audit Logs (`get_my_workstation_logs.php`), Student Academic Leave Quota Management, Desktop Release & Fleet Version Governance, Multi-Tier Storage Routing, In-Browser Server Code & File Manager, Inactivity Watchdog & Idle Alerts Engine, Offline Attendance Queue & Local Vault, Desktop Download Hub, SMS Dispatcher Shield, Google Gemini AI integration, Team Feasts & Tours (`EventDbHelper`), Gamification & Career Rankings (`GamificationHelper`), Focus & Productivity Planner (`ProductivityHelper`, procedural `ambientSoundEngine`), Content Studio OS 🎬 (`ContentStudioView.jsx`), Interactive Boy Mascot & Wicker Harvest Basket (`MangoBreakTreeView.jsx`), Smart Finance & Mango Simulator, and Workspace Master Secrets Backup & 1-Click Restore Suite.

No application code or database schemas were modified, deleted, or refactored to produce this document. All statements are traced directly from the active code in this repository as of the current working tree. Anything not directly verifiable is marked `UNKNOWN — insufficient evidence in the provided codebase.`

---

# 1. PROJECT UNDERSTANDING STATUS

**Status: FULL CODEBASE ANALYZED AND VERIFIED.**

The complete repository has been exhaustively analyzed:
- **4 Frontend Web Portals**:
  - `admin-frontend` (Port 5173): Core operations suite for administrative control, live workstation monitoring, workstation video logs, idle alerts audit, payroll management, and curriculum design.
  - `staff-frontend` (Port 5174): Staff workstation hub for attendance, student leave requests, break management (Mango Break Tree), peer-to-peer overtime trading, payroll wallet, desktop app downloads, and developer suite.
  - `review-frontend` (Port 5175): QA review portal for student and staff deliverables, marketplace submissions, and gamified credit reward/penalty issuance.
  - `student-frontend` (Port 5176): Student portal containing LMS courses, interactive foundations training (Typing Lab, PenTool Bezier curve game), and progress tracking.
- **2 Desktop Applications**:
  - `Admin_Apps/Admin-Desktop`: Executive Administrator Desktop Station (Electron + React 19 + Tailwind v4 + Vite Port 5185 + Frameless TitleBar + System Tray + Real-time Telemetry & Module Viewport).
  - `Attendence_Apps/Attendance-Desktop`: Staff Attendance & Surveillance Station (Electron 35 + React 19 + Tailwind v4 + Vite + Full Workstation Suite / Compact Mode + WebRTC Screen Streamer + Native Windows Input Injector + Continuous Workstation Video Recorder + Fleet Auto-Update & Inactivity Watchdog Service + Encrypted Offline Queue).
- **Backend API**: The entire `server/api` tree (366 PHP endpoints across 28 domains), `server/config`, and `server/data`.
- **Database**: 80 baseline MySQL tables (`server/u647959341_cca_manage_db.sql`) plus dynamically provisioned runtime tables (`staff_idle_alerts`, `staff_heartbeats`, `staff_workstation_videos`, `app_releases`, `staff_app_versions`, `system_storage_settings`).
- **External Integrations**: Pusher WebSockets (`ap2` cluster), WebRTC (STUN `stun.l.google.com:19302`), Cloudflare R2 object storage, Google Drive API Cloud Vault, PHPMailer SMTP, SMS Dispatcher Shield with simulation mode, and Google Gemini REST API.

---

# 2. TECHNOLOGY STACK

### Frontend Web Applications (4 Autonomous Vite SPAs)
- **Framework & Core**: React 19.2.8, React Router DOM 7.18.2, Vite 8.2.0/8.2.1
- **Styling Architecture**:
  - `admin-frontend` & `review-frontend`: Tailwind CSS v3.4 via PostCSS & Autoprefixer
  - `staff-frontend` & `student-frontend`: Tailwind CSS v4.3 via `@tailwindcss/vite`
- **Networking & Real-Time**: `axios` (HTTP REST client), `pusher-js` (WebSocket subscription & event listener)
- **UI & Animation**: `framer-motion` (interactive animations), `sonner` + `react-toastify` (notification toasts), `react-icons`
- **Specialized Portal Libraries**:
  - `admin-frontend`: `recharts` (analytical charts), `@hello-pangea/dnd` (kanban / curriculum reordering), `jodit-react` (rich text content editor), WebRTC RTCPeerConnection (`LiveScreenMonitor.jsx`), In-Browser IDE (`ServerCodeEditor.jsx`)
  - `review-frontend`: TypeScript (`tsc`), `canvas-confetti`, `recharts`
  - `student-frontend`: `canvas-confetti`, interactive Bezier/PenTool game engine (`public/bezier/`)
  - `staff-frontend`: Developer Suite (`DeveloperConsole.jsx`, `ApiTesterTab.jsx`, `LogStreamTab.jsx`, `ServerCodeEditorTab.jsx`)
- **Code Quality**: `oxlint` configured in `admin-frontend` and `staff-frontend`.

### Desktop Applications (2 Autonomous Electron Workstations)
1. **Admin Desktop App (`Admin_Apps/Admin-Desktop`)**:
   - **Runtime**: Electron with Node.js & Chromium
   - **Frontend Layer**: React 19.0.0, Tailwind CSS v4.0.0, Vite 6.2.0 (`desktop:dev` on port 5185), `axios`, `react-icons`
   - **Native OS Integration**:
     - Frameless dark window (`frame: false`, custom `TitleBar.jsx` with minimize, maximize/unmaximize, close-to-tray)
     - Windows System Tray persistence with double-click restore and context menu
     - Native Windows notifications via Electron `Notification`
     - System uptime querying and external web browser integration
   - **Packaging**: `electron-builder` producing `portable` and `nsis` packages for Windows (`com.creativecomputeracademy.admin`).

2. **Staff Attendance & Surveillance App (`Attendence_Apps/Attendance-Desktop`)**:
   - **Runtime**: Electron v35.0.0 with Node.js & Chromium
   - **Frontend Layer**: React 19.0.0, Tailwind CSS v4.0.0, Vite 6.2.0, `pusher-js`, `axios`, `react-icons`
   - **Hardware & Native OS Integration**:
     - Windows System Tray integration (`Tray`, context menu "Quick Punch", background run)
     - `desktopCapturer` auto-authorized desktop capture
     - WebRTC live peer-to-peer screen streaming (`ScreenStreamService.js`)
     - Low-latency native Windows input injection child process (`electron/input_injector.exe`) for remote control
     - Continuous 30-minute workstation video recording & local spooling (`WorkstationRecorderService.js`)
     - Encrypted offline punch queue & local credential vault (`OfflineQueueService.js`)
     - Native Windows notifications (`Notification`) and audio punch feedback
   - **Packaging & Distribution**: `electron-builder` producing `CCA-Attendance-Standalone.exe` (portable) and `CCA-Attendance-Setup.exe` (NSIS installer).

### Backend Architecture
- **Language & Runtime**: Plain PHP (procedural per-endpoint scripts, zero external framework, no ORM).
- **Database Access**: PDO (PHP Data Objects) with prepared statements, connection timezone pinned to `+06:00` (Asia/Dhaka).
- **Core Domain Helpers**:
  - `BreakDbHelper` (`server/api/breaks/BreakDbHelper.php`): Overtime calculation, break validation, mango bank reconciliation, and double-deduction immunity
  - `OvertimeEngine` (`server/api/payroll/OvertimeEngine.php`): Single Source of Truth (SSoT) overtime calculator, running cash, shortfall compensation, and mango tree harmonization
  - `PayrollLedger` (`server/api/payroll/PayrollLedger.php`): Modular financial ledger engine, chronological cycle invoice allocation, fractional rollover, and wallet stats
  - `PayrollHelper` (`server/api/payroll/PayrollHelper.php`): Central facade orchestrating schemes, hourly rates, attendance session earnings, and withdrawals
  - `CreditHelper` (`server/api/credits/CreditHelper.php`): Double-entry idempotent credit ledger
  - `AttendanceSecurityHelper` (`server/api/attendance/AttendanceSecurityHelper.php`): Dynamic IP filter, proxy header detection, device fingerprinting
  - `CommunityDbHelper` (`server/api/community/CommunityDbHelper.php`): Feed provisioning, recursive comments, likes resolution
  - `NotificationHelper` (`server/api/notifications/NotificationHelper.php`): In-app notification creation
  - `PusherHelper` (`server/config/PusherHelper.php`): cURL-based Pusher REST API publisher
  - `SmsHelper` (`server/config/SmsHelper.php`): SMS dispatcher with simulation shield (`maintenance_status.json`)
  - `AppVersionHelper` (`server/config/AppVersionHelper.php`): Fleet version telemetry & release gatekeeper
  - `MeetingDbHelper` (`server/api/meetings/MeetingDbHelper.php`): Self-healing schema for `academy_meetings`, `meeting_attendance_logs`, and `meeting_messages`, host resolution hierarchy, and chat lock enforcement
  - `GoogleDriveClient` (`server/api/admin/storage/GoogleDriveClient.php`): Google Drive API Cloud Vault integration
- **AI Integration**: Google Gemini REST API (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.8-flash`) with deterministic rule-based fallback in `server/api/breaks/polish_break_note.php`.

### Database
- **Engine**: MySQL / MariaDB (InnoDB, `utf8mb4_unicode_ci`, 80 baseline tables + dynamic runtime tables).
- **Timezone**: Connection-level forced to `+06:00` (Asia/Dhaka).

---

# 3. ARCHITECTURE SUMMARY

The system consists of 4 web SPAs and 2 native Electron desktop apps communicating with a shared PHP REST API, database, and real-time cloud services:

```mermaid
graph TD
    subgraph Client Layer
        AF["Admin Portal (5173)<br/>React 19 + Tailwind v3"]
        SF["Staff Portal (5174)<br/>React 19 + Tailwind v4"]
        RF["Review Portal (5175)<br/>React 19 + TypeScript"]
        STF["Student Portal (5176)<br/>React 19 + Tailwind v4"]
        AD["Admin Desktop App (5185)<br/>Electron + React 19"]
        DA["Desktop Attendance App<br/>Electron 35 + React 19"]
    end

    subgraph Backend API Layer (server/api)
        API["366 PHP REST Endpoints<br/>(28 Domains)"]
        CONF["server/config<br/>(database.php, cors.php, PusherHelper.php)"]
        HELP["Domain Helpers<br/>(BreakDbHelper, PayrollHelper, CreditHelper, etc.)"]
    end

    subgraph Storage & Cloud Infrastructure
        DB[("MySQL Database<br/>80 Base Tables + Dynamic")]
        R2["Cloudflare R2 Storage<br/>(Assets, Releases, Blogs)"]
        GD["Google Drive API<br/>(Cloud Vault Failover)"]
        PUSH["Pusher Realtime<br/>(ap2 cluster)"]
        GEM["Google Gemini API<br/>(AI Note Polish)"]
        SMTP["PHPMailer / SMTP"]
    end

    AF & SF & RF & STF & AD & DA -->|"HTTP REST (JSON / Multipart)"| API
    API --> CONF
    API --> HELP
    HELP --> DB
    HELP --> R2
    HELP --> GD
    HELP --> PUSH
    HELP --> GEM
    HELP --> SMTP

    DA <===>|"WebRTC P2P Video Stream & RTCDataChannel (Input Control)"| AF
```

### Communication Flow:
1. **Client Request**: Frontend triggers an Axios call with JSON payload, form data, or URL query parameters. Electron desktop sets authorized origin headers.
2. **CORS & Headers**: Endpoint loads `config/cors.php` (allowed origin list: `localhost:5173-5180` and production domains).
3. **Database Connection**: Endpoint instantiates `Database` (`config/database.php`), retrieving a singleton PDO instance configured with `PDO::ERRMODE_EXCEPTION`.
4. **Business Logic & Helpers**: Endpoint coordinates domain helpers (`BreakDbHelper`, `PayrollHelper`, `CreditHelper`, `AttendanceSecurityHelper`, `CommunityDbHelper`, `NotificationHelper`, `PusherHelper`, `SmsHelper`).
5. **Execution & Response**: Executes atomic SQL transactions where applicable (`beginTransaction`, `commit`, `rollBack`) and outputs JSON via `echo json_encode(...)`.
6. **WebRTC Signaling**: Admin and Desktop App exchange SDP offers/answers and ICE candidates via `server/api/screen_monitor/signal.php` over Pusher channels (`screen-admin-channel` & `screen-staff-{id}`). Direct peer stream and RTCDataChannel handle mouse/keyboard inputs.

---

# 4. COMPLETE MODULE LIST

1. **Identity & Authentication**: Login, session rehydration, token sync, password hashing, multi-role profile resolution.
2. **Staff HR & Directory**: Employees, departments, designations, shifts, staff CRUD, profiles.
3. **Attendance & Geofencing**:
   - Biometric/browser check-in/out, disputes, dynamic IP allow-list, device fingerprinting (`AttendanceSecurityHelper`).
   - **Auto-Absent Manager (`cron_absent_manager.php`, `backfill_past_absents.php`)**: Nightly reconciliation with Friday and holiday awareness.
   - **Mango Tree Auto-Protection**: Staff with $\ge$ 8 hours in Mango Bank consume 1 ripe mango to cover absences automatically.
4. **Desktop Attendance, Inactivity Watchdog & Live Screen Monitoring**:
   - Dedicated lightweight Electron Desktop App with background System Tray persistence and one-click quick punch.
   - Real-time WebRTC peer-to-peer screen capture (`desktopCapturer`).
   - Admin live monitoring grid (`LiveScreenMonitor.jsx`) with multi-screen inspection.
   - Low-latency remote input injection via native Windows binary (`input_injector.exe`).
   - **Inactivity & Idle Alerts Engine (`staff_idle_alerts`, `staff_heartbeats`, `get_idle_alerts.php`, `acknowledge_idle_alert.php`, `/idle-alerts`)**: Persistent database audit logging of 5+ minute workstation inactivity, active process/window recording, Pusher live notifications, Admin notification dispatch, and dedicated Admin review dashboard (`IdleAlerts.jsx`).
5. **Breaks & Tiffin System**:
   - Standard break requesting, approval, timer, auto-tiffin cron (`auto_tiffin.php`).
   - **Tiffin Efficiency & Over-Break Policy**: 40-minute cap with credit (+25m) and penalty (-20m) deltas.
   - **Mango Break Bank & Tree**: Visual overtime accumulation, in-shift claims, full-day leave conversion.
   - **P2P Overtime Market**: Peer-to-peer overtime trading synchronized with payroll earnings.
   - **AI Break Note Polisher**: Gemini-powered formalization of informal break notes.
6. **Staff Payroll & Withdrawals**:
   - Monthly and Yearly pay schemes with hourly rates (`PayrollHelper.php`, `staff_pay_schemes`).
   - Automated sync of attendance work sessions into monetary earnings (`staff_work_earnings`).
   - Withdrawal requests, processing, bKash/Nagad/Bank payouts (`staff_withdrawals`, `staff_payout_settings`).
7. **Community Feed / Social Wall**:
   - Internal social wall for Admin & Staff (`CommunityWall.jsx`, `CommunityFeed.jsx`).
   - Post creation with rich text, categories (Announcement, Achievement, Discussion), image uploads via R2.
   - Interactive likes, nested comment threads, pinned announcements, and live updates via Pusher `community-channel`.
8. **Developer Suite & Janitor**:
   - In-app developer console (`DeveloperConsole.jsx`) protected by `DeveloperRoute.jsx` and `developer_guard.php`.
   - Live API runner, WebSocket tester, error log viewer, database snapshot export, cache cleaner (`run_janitor_clean.php`), and system maintenance toggler.
9. **Smart SMS & Maintenance Shield**:
   - `SmsHelper.php` with dry-run mode configured via `maintenance_status.json` preventing external balance deductions.
10. **Task Pipeline**:
    - Task creation (manual + AI Architect Blueprint), claiming, self-creation, timer tracking, R2 uploads.
11. **Reviewer / QA Pipeline**:
    - Review queues, task QA review, final delivery submission, marketplace upload & approval tracking.
12. **Credit & Gamification Engine**:
    - User wallet, P2P transfer, task completion rewards, rejection penalties, marketplace credits (`CreditHelper.php`).
13. **Course Curriculum & LMS**:
    - Courses, modules, lessons, milestones, quizzes, assignments, admin media uploads.
14. **Student Portal & Foundations Lab**:
    - Course dashboard, lesson video player, quiz attempts, typing lab, PenTool Bezier training game, Lumi Odyssey.
15. **Academy Blogs**:
    - Blog creation, rich-text editing, comments, emoji reactions, read count analytics.
16. **Realtime Chat & Messaging**:
    - 1:1 direct chat, group channels, reactions, receipts, Pusher WebSockets.
17. **Database Manager (Admin)**:
    - Table browser, SQL runner, R2 bucket browser guarded by `admin_db_guard.php`.
18. **Desktop App Release Governance & Fleet Version Control**:
    - Centralized desktop client versioning (`AppVersionHelper.php`, `app_releases`, `staff_app_versions`).
    - Mandatory / optional force-update gates, release publishing, installer downloads (`check_update.php`, `log_version.php`, `get_latest_release.php`).
    - Admin release management console (`AppReleases.jsx`) with fleet version adoption telemetry.
    - Native desktop update lifecycle via Electron IPC (`UpdateService.js`, `main.cjs`).
19. **Multi-Tier Cloud Storage Routing & Failover**:
    - Smart content router (`storage.php`) supporting Cloudflare R2, Google Drive API (`GoogleDriveClient.php`), and local disk.
    - Admin dynamic routing console (`StorageSettings.jsx`) backed by `system_storage_settings`.
    - Automated emergency failover from Google Drive to Cloudflare R2 if credentials expire or drive fills up.
20. **Web-Based Server Code Editor & File Manager**:
    - In-browser IDE suite in Admin Portal (`ServerCodeEditor.jsx` at `/server-editor`) and Staff Developer Console (`ServerCodeEditorTab.jsx`).
    - Recursive hierarchical directory tree with expand/collapse, file extension icons, search filtering, and dirty-state tracking.
    - Security-hardened backend (`server/api/admin/code_editor/guard.php`) restricted to `admin` and `developer` roles via active Bearer token.
    - Sandboxed file operations preventing directory traversal (`resolveServerSafePath()`), credential file isolation (`.env`, `google_drive_credentials.json`), text file size caps (<5MB), automated timestamped backups in `server/backups/editor_backups/`, and immediate PHP opcode cache invalidation (`opcache_invalidate()`).
21. **Offline Attendance Queue & Local Vault**:
    - Native Desktop attendance queue service (`OfflineQueueService.js`) maintaining encrypted local credential vault (`cca_offline_vault`) and pending punch queue (`cca_offline_punch_queue`).
    - SHA-256 credential hashing for offline sign-in and local attendance cache fallback (`cca_local_attendance_cache`).
    - Dedicated backend sync endpoint (`server/api/attendance/sync_offline.php`) for transactional bulk batching, retroactive timestamp validation, and automatic session reconciliation upon network reconnection.
22. **Desktop Download Hub**:
    - Dedicated download portal in Staff suite (`DesktopAppDownload.jsx` at `/desktop-download`).
    - Live version querying against `api/app_version/get_latest_release.php` with direct Cloudflare R2 downloads for both installer (`CCA-Attendance-Setup.exe`) and portable (`CCA-Attendance-Standalone.exe`).
23. **Workstation Video Surveillance & Google Drive Cloud Vault**:
    - Continuous screen recording service in Desktop client (`WorkstationRecorderService.js`) capturing low-bitrate (100 kbps VP8/H.264) video clips in 30-minute chunks (3-minute during testing).
    - Local disk spool with Electron IPC integration (`saveSpoolVideo`, `listSpoolVideos`, `readSpoolVideo`, `deleteSpoolVideo`) and automatic background FIFO spool flusher.
    - Multipart upload endpoint (`server/api/screen_monitor/upload_workstation_video.php`) organizing video files hierarchically in Google Drive Cloud Vault: `CCA_Vault / Workstation_Videos / {DD-MM-YYYY} / {StaffName_UserID} / clip_XX_{StartTime}_to_{EndTime}.webm`, with automatic failover to Cloudflare R2.
    - Dedicated Admin audit portal (`WorkstationVideoLogs.jsx` at `/workstation-video-logs`) with date filtering, staff selector, aggregate statistics, embedded Google Drive video player modal with variable speed playback (1x, 1.25x, 1.5x, 2x), and direct Drive links.
24. **Student Academic Leave Quota Management**:
    - Student employee recognition via schema self-provisioning in `server/api/leave/StudentLeaveHelper.php` adding `is_student`, `student_leave_quota` (default 3 days/month), and `student_institution` to the `employees` table.
    - Automated quota deduction logic excluding weekly Fridays, with balance verification endpoint (`api/leave/get_student_quota.php`), real-time quota telemetry in Staff Leave Portal (`Leave.jsx`), and Admin approval constraints (`LeaveManagement.jsx`).
25. **Staff Workstation Activity & Surveillance Review Hub**:
    - Dedicated staff portal review page (`MyWorkstation.jsx` at `/workstation` and `MyWorkstationView.jsx` in Desktop App).
    - Scoped endpoint (`server/api/screen_monitor/get_my_workstation_logs.php`) serving staff their own 30-minute recorded video clips with embedded Google Drive stream players (1x-4x speed controls), cloud sync status, inactivity audit log (5+ min idle occurrences, active application title/process, resumption timestamps), and real-time workstation heartbeat connectivity telemetry.

---

# 5. DATABASE SUMMARY

The system operates on **80 baseline tables** defined in `server/u647959341_cca_manage_db.sql` plus dynamically provisioned runtime tables.

### Table Clusters

#### 1. Identity & Permissions
- `users`: Primary accounts (id, name, email, password, status, profile_picture, cover_picture).
- `user_roles`: Multi-role mapping (`admin`, `manager`, `staff`, `instructor`, `student`, `reviewer`, `developer`).
- `user_tokens`: Session tokens (token, expires_at).
- `employees`: Staff HR profile (department_id, shift_hours, tiffin_time, designation, joining_date, `is_student`, `student_leave_quota`, `student_institution`).
- `students`: Student profile (course_id, enrollment_date, status).
- `departments`: Academy organizational units.

#### 2. Attendance & Breaks Cluster
- `attendance`: Daily work records (user_id, date, in_time, out_time, total_hours, status, ip_address, device_fingerprint).
- `attendance_device_logs`: Multi-point punch audits.
- `attendance_disputes`: Staff-submitted attendance dispute tickets.
- `holidays`: Academy calendar off-days.
- `leave_requests`: Formal staff leave requests.
- `user_breaks`: Active and completed break entries (break_type, start_time, end_time, duration_minutes, is_tiffin).
- `employee_breaks`: Scheduled daily allowances.
- `mango_break_claims`: Overtime-funded full-day off claims.
- `staff_overtime_trades`: P2P overtime market trades.
- `staff_idle_alerts`: Workstation idle events (idle_seconds, active_process, active_window_title, status).
- `staff_heartbeats`: Desktop agent real-time heartbeat, active application, and idle state.
- `staff_workstation_videos`: Workstation continuous surveillance clips (id, user_id, staff_name, date, start_time, end_time, chunk_index, duration_seconds, file_size_bytes, drive_file_id, drive_view_link, storage_provider, status, created_at, updated_at).

#### 3. Payroll & Earnings Cluster
- `staff_pay_schemes`: Compensation contracts (monthly/yearly, working days, daily hours, hourly rate).
- `staff_work_earnings`: Granular work earnings ledger (session-based attendance earnings and P2P trade balances).
- `staff_withdrawals`: Cash payout requests.
- `staff_payout_settings`: Mobile banking & bank account details.

#### 4. Community Feed Cluster
- `community_posts`: Feed posts (id, user_id, content, category, image_url, is_pinned, likes_count, comments_count, status).
- `community_likes`: Unique post reactions (post_id, user_id, reaction_type).
- `community_comments`: Nested discussions (post_id, user_id, parent_id, comment).

#### 5. Task & Review Pipeline
- `tasks`, `task_categories`, `task_history`, `task_logs`, `task_comments`, `task_submissions`, `task_final_deliveries`, `task_marketplace_submissions`, `task_reviews`, `task_blueprint_variants`.

#### 6. Credit Ledger
- `user_credits`, `credit_transactions` (idempotent double-entry ledger with `event_key`).

#### 7. LMS & Student Foundations Lab
- `courses`, `course_modules`, `course_lessons`, `course_milestones`, `course_quizzes`, `course_quiz_questions`, `course_assignments`, `course_resources`.
- `student_assignments`, `student_submissions`, `student_enrollments`, `student_daily_logs`.
- `student_lesson_progress`, `student_lesson_notes`, `student_lesson_discussions`.
- `student_typing_sessions`, `student_typing_curriculum_progress`, `student_pentool_sessions`, `student_pentool_stage_progress`, `student_foundations_drills`, `student_lumi_odyssey_progress`.

#### 8. Comms, Brand & Developer
- `chats`, `chat_participants`, `chat_messages`, `chat_message_reactions`, `chat_message_receipts`.
- `academy_blogs`, `blog_comments`, `blog_reactions`, `blog_reads`.
- `notifications`, `cca_brand_resources`, `system_settings`, `email_templates`.

#### 9. Desktop Versioning & Storage Governance
- `app_releases`: Version release directory, release notes, categories, download URLs, hash, and mandatory flags.
- `staff_app_versions`: Workstation fleet telemetry tracking user IDs, device hostnames, OS platforms, and live app versions.
- `system_storage_settings`: Multi-tier storage routing configurations, folder paths, and Google Drive / R2 failover credentials.

---

# 6. AUTHENTICATION & AUTHORIZATION

### Authentication Flow
1. **Credentials Submission**: Frontend/Desktop sends `email`, `password`, and optional intended `role` to `api/auth/login.php`.
2. **Verification**: Uses `password_verify()` against `users.password` (bcrypt).
3. **Status Check**: Validates `status = 'active'`.
4. **Role Validation**: Queries `user_roles`; verifies that the user possesses the role required by the connecting portal.
5. **Token Generation**: Generates a 64-character hex token stored in `user_tokens` with an expiration timestamp.
6. **Session Hydration**: On app load, `AuthContext` retrieves the token from `localStorage` and calls `api/auth/verify.php` to restore user identity.

### Authorization Enforcement
- **Client-Side**: Protected routes (`ProtectedRoute`, `DeveloperRoute`) guard access to portal views based on role.
- **Backend Guarded**:
  - `server/api/developer/`: Token & role verification via `developer_guard.php`.
  - `server/api/admin/database/`: Token & role verification via `admin_db_guard.php`.
  - `server/api/admin/code_editor/`: Token & role verification (`admin` or `developer`) via `guard.php` with directory traversal protection, credential isolation, and opcache invalidation.
- **Backend Open Areas**: Several legacy endpoints accept `user_id` without validating session tokens.

---

# 7. API SUMMARY & MAP

366 PHP endpoints organized under 28 functional domains:

| Domain | Base Path | Key Endpoints | Auth / Security Notes |
| :--- | :--- | :--- | :--- |
| **Auth** | `api/auth/` | `login.php`, `verify.php`, `sync.php`, `logout.php`, `make_hash.php` | ⚠️ `make_hash.php` is an unauthenticated public hash generator |
| **Attendance** | `api/attendance/` | `check_in.php`, `check_out.php`, `dispute.php`, `get_attendance.php`, `get_my_idle_status.php`, `sync_offline.php` | Dynamic IP check, device fingerprinting & offline sync queue |
| **Screen Monitor** | `api/screen_monitor/` | `get_active_staff.php`, `signal.php`, `heartbeat.php` | Pusher signaling for WebRTC video streams & remote input control |
| **Workstation Video Surveillance** | `api/screen_monitor/` | `upload_workstation_video.php`, `get_workstation_videos.php`, `get_my_workstation_logs.php` | Google Drive Cloud Vault integration with Cloudflare R2 failover & scoped staff streaming previews |
| **Admin Screen Monitor** | `api/admin/screen_monitor/` | `get_idle_alerts.php`, `acknowledge_idle_alert.php` | Workstation idle audits & alert resolution |
| **Admin Attendance** | `api/admin/attendance/` | `get_daily_roster.php`, `get_disputes.php`, `resolve_dispute.php`, `update_attendance.php` | Conventionally admin |
| **Student & Staff Leaves** | `api/leave/`<br>`api/admin/leave/` | `apply_leave.php`, `get_leaves.php`, `get_student_quota.php`, `update_leave_status.php` | Student academic leave quota enforcement excluding Fridays (`StudentLeaveHelper.php`) |
| **Breaks & Tiffin** | `api/breaks/` | `start_break.php`, `end_break.php`, `request_break.php`, `get_live_breaks.php`, `manage_break_request.php`, `claim_mango_break.php`, `get_mango_break_bank.php`, `polish_break_note.php`, `backfill_tiffin_delta.php` | Realtime Pusher events; Gemini AI note polisher |
| **Break Trades (P2P)** | `api/breaks/trades/` | `create_trade_request.php`, `seller_respond_trade.php`, `admin_manage_trade.php`, `get_market_peers.php`, `get_my_trades.php`, `get_pending_admin_trades.php` | Multi-party trade settlement; synchronizes with payroll earnings |
| **Staff Payroll** | `api/payroll/` | `get_my_payroll.php`, `request_withdrawal.php`, `record_timer_session.php`, `get_payout_settings.php`, `save_payout_settings.php` | Dynamic rate calculation; balance validation |
| **Admin Payroll** | `api/admin/payroll/` | `get_all_schemes.php`, `save_scheme.php`, `get_staff_payroll_details.php`, `get_withdrawals.php`, `process_withdrawal.php`, `sync_attendance_earnings.php` | Admin financial control; contractual compensation |
| **Community Feed** | `api/community/` | `get_feed.php`, `create_post.php`, `toggle_like.php`, `add_comment.php`, `pin_post.php`, `delete_post.php`, `upload_post_image.php`, `get_mention_users.php` | Pusher channel `community-channel`; schema self-provisioning |
| **Developer Suite** | `api/developer/` | `get_dev_status.php`, `dispatch_websocket_event.php`, `export_db_snapshot.php`, `export_full_system_snapshot.php`, `get_api_directory.php`, `get_error_log.php`, `run_janitor_clean.php`, `toggle_maintenance.php` | Token-gated via `developer_guard.php` (admin/developer role required) |
| **Server Code Editor** | `api/admin/code_editor/` | `list_files.php`, `get_file.php`, `save_file.php`, `create_file.php` | Guarded by `guard.php` (Bearer token + Admin/Developer role); path traversal check, auto-backups & opcache clear |
| **Tasks (Staff)** | `api/tasks/` | `claim_task.php`, `create_self_task.php`, `start_timer.php`, `pause_timer.php`, `update_checklist.php`, `update_task_status.php`, `task_comments.php`, `upload_task_files.php`, `marketplace_submissions.php`, `architect_blueprint.php` | Core staff workflow |
| **Tasks (Admin)** | `api/admin/tasks/` | `create_task.php`, `edit_task.php`, `delete_task.php`, `get_all_tasks.php`, `update_task_assignee.php`, `get_workload.php` | Operational task management |
| **Reviewer QA** | `api/reviewer/` | `get_pending_reviews.php`, `update_task_status.php`, `submit_final_delivery.php`, `get_team_stats.php`, `get_daily_report.php` | Triggers credit engine reward / penalty workflows |
| **Credit Engine** | `api/credits/` | `get_wallet.php`, `send_credits.php`, `admin_adjust.php`, `get_users.php` | Managed via `CreditHelper.php` |
| **Courses & LMS** | `api/admin/courses/`<br>`api/student/` | `save_course.php`, `lessons/*`, `quizzes/*`, `enroll_course.php`, `update_lesson_progress.php`, `assignment_submission.php` | Admin curriculum & student LMS |
| **Foundations Lab** | `api/student/foundations/` | `get_typing_curriculum.php`, `save_typing_session.php`, `save_mouse_drill.php`, `get_pentool_progress.php`, `save_pentool_progress.php` | Typing, mouse, and PenTool interactive engines |
| **Academy Blogs** | `api/blogs/` | `create_blog.php`, `get_blogs.php`, `add_comment.php`, `react_blog.php`, `upload_blog_image.php` | Content marketing & student articles |
| **Realtime Chat** | `api/chat/` | `create_chat.php`, `send_message.php`, `get_messages.php`, `edit_message.php`, `toggle_reaction.php`, `mark_read.php`, `add_group_members.php` | Pusher channels `chat_{id}` |
| **Admin Database** | `api/admin/database/` | `run_query.php`, `get_tables.php`, `get_table_data.php`, `insert_row.php`, `update_row.php`, `delete_row.php`, `delete_r2_object.php` | Guarded by `admin_db_guard.php` (Bearer token + Admin role) |
| **App Version Governance** | `api/app_version/`<br>`api/admin/app_version/` | `check_update.php`, `log_version.php`, `get_latest_release.php`, `get_releases.php`, `publish_release.php`, `toggle_force_update.php` | Managed via `AppVersionHelper.php`; desktop client telemetry & force updates |
| **Storage Governance** | `api/admin/storage/` | `get_storage_settings.php`, `save_storage_settings.php`, `test_storage_connection.php` | Dynamic cloud storage routing (R2, GDrive, Local) & failover config |
| **Crons** | `api/crons/` | `auto_checkout.php`, `auto_tiffin.php`, `cron_absent_manager.php`, `backfill_past_absents.php`, `migrate_categories.php` | Nightly attendance and break reconcilers |

---

# 8. IMPORTANT DATA FLOWS

### 1. WebRTC Live Screen Streaming & Remote Input Control
```
[Staff Desktop App] Checks in via AttendanceView.jsx
      │
      ▼ ScreenStreamService.init(user)
      │  Subscribes to Pusher channel `screen-staff-${user.id}`
      │  Dispatches 'staff-online' signal to `screen-admin-channel`
      ▼
[Admin] Opens LiveScreenMonitor.jsx
      │  Fetches active roster from /api/screen_monitor/get_active_staff.php
      │  Sends 'request-stream' via /api/screen_monitor/signal.php
      ▼
[Staff Desktop App] Receives 'request-stream'
      │  Invokes desktopCapturer.getSources({ types: ['screen'] })
      │  Creates RTCPeerConnection with Google STUN servers
      │  Creates RTCDataChannel ('remote-control')
      │  Generates WebRTC Offer & sends via signal.php
      ▼
[Admin LiveScreenMonitor.jsx]
      │  Receives Offer, creates Answer, sets Remote Description
      │  Renders live <video> element
      │  When Admin controls mouse/keys, sends JSON over RTCDataChannel
      ▼
[Staff Desktop App]
      │  Receives data channel message: { type: 'mouse-move', x, y }
      │  IPC to Electron main process -> writes to `input_injector.exe` via stdin
      │  Cursor / Keyboard action physically executes on Windows host!
```

### 2. Inactivity Watchdog & Idle Alerts Pipeline
```
[Desktop Inactivity Watchdog]
      │  Monitors system idle time via powerMonitor / user activity hooks
      │  When idle exceeds 300 seconds (5 minutes):
      ▼
[Desktop App sends heartbeat / signal]
      │  POST /api/screen_monitor/heartbeat.php (is_idle=1, idle_seconds, active_process, active_window_title)
      ▼
[Backend Database Table `staff_idle_alerts`]
      │  Inserts/updates idle record with status='idle', started_at=NOW()
      │  Dispatches Pusher event to Admin channel
      ▼
[Admin Portal Notification Bell & /idle-alerts]
      │  Admin receives sound & visual alert
      │  Admin reviews workstation in LiveScreenMonitor or acknowledges alert via /api/admin/screen_monitor/acknowledge_idle_alert.php
```

### 3. P2P Overtime Trade Settlement
```
[Buyer Staff] Requests Overtime (P2POvertimeMarket.jsx)
      │  POST /api/breaks/trades/create_trade_request.php (Status: pending_seller)
      ▼
[Seller Staff] Accepts Trade (P2POvertimeMarket.jsx)
      │  POST /api/breaks/trades/seller_respond_trade.php (Status: pending_admin)
      ▼
[Admin] Approves Trade (BreakMonitor.jsx)
      │  POST /api/breaks/trades/admin_manage_trade.php (Atomic Transaction)
      │  1. Updates trade status to 'approved'
      │  2. Credits Seller in staff_work_earnings ('overtime_trade_sale')
      │  3. Debits Buyer in staff_work_earnings ('overtime_trade_purchase')
      │  4. Overtime minutes automatically transfer in BreakDbHelper
      │  5. Emits Pusher events to update interfaces live
```

### 4. Mango Break Bank & Full-Day Off Claim
```
[Staff] Views Mango Tree (MangoBreakTree.jsx)
      │  Formula: Net Mins = (Worked OT + Bought OT) - (Claimed Breaks + Cashed OT + Sold OT)
      │  8 hours (480 mins) = 1 Ripe Mango = 1 Full-Day Paid Leave
      ▼ Clicks "Claim Full-Day Off"
      │  POST /api/breaks/claim_mango_break.php
      │  Inserts user_breaks row (break_type = 'Mango Full Day', duration = 480 mins)
```

### 5. Server Code Editor File Read/Write Lifecycle
```
[Admin / Developer User] Opens ServerCodeEditor.jsx or ServerCodeEditorTab.jsx
      │
      ▼ GET /api/admin/code_editor/list_files.php (Bearer Token)
      │  guard.php checks Bearer token in user_tokens & role in ('admin', 'developer')
      │  Recursively scans server/ excluding sensitive (.env, vendor, backups) files
      │  Returns hierarchical JSON tree for left sidebar
      ▼
[User] Selects a file, edits in syntax editor, then presses Ctrl+S / Save
      │
      ▼ POST /api/admin/code_editor/save_file.php { path, content, create_backup: true }
      │  guard.php verifies authorization & resolveServerSafePath() blocks traversal
      │  Generates timestamped backup in server/backups/editor_backups/{file}_{timestamp}.bak
      │  Writes content atomically to target path via file_put_contents()
      │  Calls opcache_invalidate() so changes execute immediately without web server restart
      ▼
### 6. Workstation Continuous Video Surveillance & Google Drive Cloud Vault
```
[Staff Desktop App] Checks in / Launches
      │
      ▼ WorkstationRecorderService.startContinuousRecording()
      │  Acquires screen via getDisplayMedia / desktopCapturer (1280x720, 5-10 fps, 100kbps)
      │  Records continuous WebM chunks (3-min testing / 30-min prod)
      ▼ Rollover boundary reached
      │  Seamlessly initializes next MediaRecorder chunk with zero dropped frames
      │  Flushes completed chunk to encrypted local disk spool via IPC (saveSpoolVideo)
      ▼ Background Spool Worker (flushPendingSpool)
      │  Picks up spooled WebM files in FIFO order
      │  POST /api/screen_monitor/upload_workstation_video.php (multipart/form-data)
      ▼ Backend Storage Router
      │  1. Uploads to Google Drive API: CCA_Vault / Workstation_Videos / {DD-MM-YYYY} / {Staff_Name_ID} / clip_XX.webm
      │  2. Fallback to Cloudflare R2 if Drive quota/network fails
      │  3. Inserts metadata into MySQL table `staff_workstation_videos`
      │  4. Returns view_link & Google Drive file ID
      ▼ Electron Desktop App
      │  Deletes uploaded clip from local disk spool via deleteSpoolVideo
      ▼ Admin Workstation Video Audit Vault (/workstation-video-logs)
      │  Admin selects date & staff member -> streams embedded WebM video with 1x-2x playback
```

### 7. Student Academic Leave Quota Validation & Deduction
```
[Student Employee] Applies for Leave in Staff Portal (Leave.jsx)
      │  Selects "Student Academic Leave"
      ▼ Frontend requests remaining quota: GET /api/leave/get_student_quota.php
      │  StudentLeaveHelper queries employees table (`is_student`, `student_leave_quota`)
      │  Counts active Approved/Pending leaves for current calendar month excluding Fridays
      │  Returns { monthly_quota, approved_days, pending_days, remaining_days }
      ▼ If applied days <= remaining_days:
      │  POST /api/leave/apply_leave.php
      │  Inserts leave_requests row with type='Student Academic Leave', status='Pending'
      ▼ Admin Leave Management (/leave)
      │  Admin reviews applicant with student institution tag & quota badge
      │  POST /api/admin/leave/update_leave_status.php
      │  Approves / Rejects; student leave balance dynamically recalculated
```

---

# 9. FEATURE INVENTORY

| Feature | Frontend Portal / Client | Backend Controller | API Route | Database Tables | Status | Critical Files |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication** | All Portals + Desktops | Procedural PHP | `api/auth/*` | `users`, `user_roles`, `user_tokens` | ✅ Active | `api/auth/login.php`, `AuthContext.jsx` |
| **Admin Desktop Console** | Admin Desktop App | Procedural PHP | `api/dashboard/get_stats.php` | `users`, `attendance`, `tasks` | ✅ Active | `Admin_Apps/Admin-Desktop/electron/main.cjs`, `App.jsx` |
| **Desktop Attendance** | Electron Desktop | Procedural PHP | `api/attendance/*` | `attendance`, `attendance_device_logs` | ✅ Active | `electron/main.cjs`, `AttendanceView.jsx` |
| **Live Screen Monitor** | Admin + Electron Desktop | `signal.php` | `api/screen_monitor/*` | `attendance`, `users` | ✅ Active | `LiveScreenMonitor.jsx`, `ScreenStreamService.js` |
| **Workstation Video Audit Vault** | Admin + Electron Desktop | `upload_workstation_video.php`, `get_workstation_videos.php` | `api/screen_monitor/*` | `staff_workstation_videos` | ✅ Active | `WorkstationRecorderService.js`, `WorkstationVideoLogs.jsx` |
| **Inactivity & Idle Alerts** | Admin Portal | `signal.php`, `heartbeat.php` | `api/admin/screen_monitor/*` | `staff_idle_alerts`, `staff_heartbeats` | ✅ Active | `IdleAlerts.jsx`, `get_idle_alerts.php` |
| **Remote Input Injection** | Electron Desktop | Native Win32 CLI | IPC / Local stdin | None | ✅ Active | `input_injector.exe`, `electron/main.cjs` |
| **Student Academic Leaves** | Staff, Admin | `StudentLeaveHelper.php` | `api/leave/*`, `api/admin/leave/*` | `employees`, `leave_requests` | ✅ Active | `StudentLeaveHelper.php`, `get_student_quota.php`, `Leave.jsx` |
| **Community Feed** | Admin, Staff | `CommunityDbHelper` | `api/community/*` | `community_posts`, `community_likes`, `community_comments` | ✅ Active | `CommunityWall.jsx`, `CommunityFeed.jsx` |
| **Developer Console** | Staff (Dev role) | `developer_guard` | `api/developer/*` | `system_settings`, error logs | ✅ Active | `DeveloperConsole.jsx`, `DeveloperRoute.jsx` |
| **Server Code Editor** | Admin, Staff (Dev role) | `code_editor/guard.php` | `api/admin/code_editor/*` | Backups filesystem | ✅ Guarded (Bearer + Admin/Dev) | `ServerCodeEditor.jsx`, `ServerCodeEditorTab.jsx`, `guard.php` |
| **Break Monitoring** | Admin, Staff | `BreakDbHelper.php` | `api/breaks/*` | `user_breaks` | ✅ Active | `BreakMonitor.jsx`, `Breaks.jsx` |
| **P2P Break Trades** | Admin, Staff | Procedural + Helpers | `api/breaks/trades/*` | `staff_overtime_trades`, `staff_work_earnings` | ✅ Active | `P2POvertimeMarket.jsx`, `admin_manage_trade.php` |
| **Mango Break Tree** | Staff | `BreakDbHelper.php` | `api/breaks/get_mango_break_bank.php` | `user_breaks`, `attendance` | ✅ Active | `MangoBreakTree.jsx`, `claim_mango_break.php` |
| **Staff Payroll** | Admin, Staff | `PayrollHelper.php` | `api/payroll/*`, `api/admin/payroll/*` | `staff_pay_schemes`, `staff_work_earnings`, `staff_withdrawals` | ✅ Active | `PayrollManagement.jsx`, `PayrollWallet.jsx` |
| **Attendance** | Staff, Admin | `AttendanceSecurityHelper` | `api/attendance/*` | `attendance`, `attendance_disputes` | ✅ Active | `api/attendance/check_in.php` |
| **Task Lifecycle** | Staff, Admin | Procedural PHP | `api/tasks/*`, `api/admin/tasks/*` | `tasks`, `task_history`, `task_logs` | ✅ Active | `staff-frontend/src/pages/Tasks.jsx` |
| **Reviewer QA** | Review Portal | Procedural PHP | `api/reviewer/*` | `task_reviews`, `task_final_deliveries` | ✅ Active | `PendingReviews.jsx` |
| **Credit Engine** | Admin, Staff, Review | `CreditHelper.php` | `api/credits/*` | `user_credits`, `credit_transactions` | ✅ Active | `server/api/credits/CreditHelper.php` |
| **LMS / Courses** | Admin, Student | Procedural PHP | `api/admin/courses/*`, `api/student/*` | `courses`, `course_lessons`, `course_quizzes` | ✅ Active | `CoursesAndCurriculum.jsx`, `CoursePlayer.jsx` |
| **PenTool Lab** | Student, Admin | Foundations API | `api/student/foundations/*pentool*` | `student_pentool_sessions` | ✅ Active | `PenToolLab.jsx`, `PenToolReports.jsx` |
| **Typing Lab** | Student | Procedural PHP | `api/student/foundations/*typing*` | `student_typing_sessions` | ✅ Active | `TypingLab.jsx`, `TypingReports.jsx` |
| **Academy Blogs** | Admin, Staff | `BlogDbHelper.php` | `api/blogs/*` | `academy_blogs`, `blog_comments` | ✅ Active | `AcademyBlog.jsx` |
| **Realtime Chat** | All 4 portals | Pusher Helper | `api/chat/*` | `chats`, `chat_messages` | ✅ Active | `Messages.jsx` across all portals |
| **Database Manager**| Admin | Procedural PHP | `api/admin/database/*` | Any table (Raw SQL) | ✅ Guarded (Bearer + Admin) | `DatabaseManager.jsx`, `run_query.php` |
| **App Releases & Fleet Telemetry** | Admin + Electron Desktop | `AppVersionHelper.php` | `api/app_version/*`, `api/admin/app_version/*` | `app_releases`, `staff_app_versions` | ✅ Active | `AppReleases.jsx`, `UpdateService.js`, `main.cjs` |
| **Multi-Tier Storage Settings** | Admin Portal | `storage.php` | `api/admin/storage/*` | `system_storage_settings` | ✅ Active | `StorageSettings.jsx`, `storage.php`, `GoogleDriveClient.php` |
| **Offline Attendance Sync** | Electron Desktop | Procedural PHP | `api/attendance/sync_offline.php` | `attendance`, `attendance_device_logs` | ✅ Active | `OfflineQueueService.js`, `sync_offline.php` |
| **Desktop App Download Hub** | Staff Portal | Procedural PHP | `api/app_version/get_latest_release.php` | `app_releases` | ✅ Active | `DesktopAppDownload.jsx`, `get_latest_release.php` |
| **Live WebRTC Meetings & CCA Studio** | Admin, Staff | `MeetingDbHelper.php` | `api/meetings/*` | `academy_meetings`, `meeting_attendance_logs`, `meeting_messages` | ✅ Active | `MeetingRoomView.jsx`, `MeetingRoom.jsx`, `AdminMeetingRoom.jsx`, `MeetingDbHelper.php` |
| **Live Meeting Raise Hand & Moderation** | Admin, Staff | WebRTC DataChannels | Peer-to-Peer DataChannel | Ephemeral state | ✅ Active | `MeetingRoomView.jsx` |
| **Live Floating Reactions & Synth Audio** | Admin, Staff | Web Audio API | Peer-to-Peer DataChannel | Ephemeral state | ✅ Active | `MeetingRoomView.jsx` |
| **Spotlight & Pin User Focus** | Admin, Staff | DataChannel Broadcast | Peer-to-Peer DataChannel | Ephemeral state | ✅ Active | `MeetingRoomView.jsx` |

---

# 10. EXISTING ISSUES

### 🔴 Security & Integrity Items
1. **Public Hash Generator (`api/auth/make_hash.php`)**:
   - Accepts `?pass=` and outputs valid Bcrypt hashes without authentication. Should be restricted or removed in production.
2. **Hardcoded Fallback Credentials in Source**:
   - `server/config/r2.php` and `server/config/PusherHelper.php` contain hardcoded fallbacks if `.env` values are absent.
3. **Remote Input Injection Permissions**:
   - `input_injector.exe` executes arbitrary mouse movements, clicks, and keystrokes sent over WebRTC data channels without physical user confirmation prompts on the staff computer.
4. **Unauthenticated Legacy Endpoints**:
   - While sensitive sections (`developer/`, `admin/database/`, `admin/code_editor/`) are strictly guarded by Bearer tokens, several legacy endpoints accept raw `user_id` from client payloads.

### 🟡 Architectural Debt
1. **Tailwind Version Divergence**:
   - Tailwind v3 (Admin, Review) vs Tailwind v4 (Staff, Student, Desktop App).
2. **Dual Category Representations on Tasks**:
   - Both hierarchical foreign keys (`category_id`, `subcategory_id`) and legacy string columns exist.
3. **Redundant Layout & Auth Code**:
   - Login forms and layout wrappers are duplicated across the 4 frontends rather than shared via an internal component library.

### 🟢 Recently Resolved Issues (November 2026)
1. **MeetingRoomView TDZ Initialization Error (Resolved Nov 24, 2026)**:
   - In `admin-frontend` and `staff-frontend`, `remotePeerList` and `totalInRoom` were originally declared below `useEffect` stage resolution hooks, throwing a fatal `ReferenceError: Cannot access 'remotePeerList' before initialization` during component mount. Resolved by lifting both declarations above the effects.
2. **Single Mute State Discrepancy (Resolved Nov 2026)**:
   - Bidirectional DataChannel synchronization (`set_mic_state` and `peer_mic_state`) integrated into WebRTC mesh preventing mute desync between remote clients and host.

---

# 11. CRITICAL FILES

- `server/config/database.php`: Central PDO database connection provider with forced timezone `+06:00`.
- `server/config/cors.php`: Primary access origin filter for web & electron communication.
- `server/config/SmsHelper.php`: SMS dispatcher with simulation shield (`maintenance_status.json`).
- `server/api/breaks/BreakDbHelper.php`: Central overtime, break limit, and mango tree calculation engine with Friday and distinct date deduplication.
- `server/api/payroll/OvertimeEngine.php`: Single Source of Truth (SSoT) engine for all overtime, tiffin savings, short shifts, excess breaks, absences, mango claims, cashed-out OT, P2P trades, and admin vault calculations.
- `server/api/payroll/PayrollSync.php`: Dedicated engine for attendance earnings & break claim synchronization.
- `server/api/payroll/PayrollRoadmap.php`: Dedicated engine for contract tiers, staggered roadmaps, and promotion milestones.
- `server/api/payroll/PayrollWithdrawal.php`: Dedicated engine for withdrawal validation, execution, and payout notifications.
- `server/api/payroll/PayrollLedger.php`: Modular financial ledger engine, chronological cycle invoice allocation, fractional rollover, and wallet stats calculation.
- `server/api/payroll/PayrollHelper.php`: Core compensation facade orchestrator, coordinating `PayrollLedger`, `OvertimeEngine`, and payout cycle locks.
- `staff-frontend/src/components/Payroll/PayrollWithdrawModal.jsx`: Interactive shortfall calculator with sticky header, scrollable body, sticky footer, mango cashout toggle, and submission lock.
- `server/api/screen_monitor/get_my_workstation_logs.php`: Scoped staff surveillance clips & inactivity/idle audit logs endpoint.
- `staff-frontend/src/pages/MyWorkstation.jsx`: Staff workstation review page with embedded Google Drive video player (1x-4x speed controls) and inactivity audit logs.
- `staff-frontend/src/components/Payroll/PayrollHeaderBanner.jsx`: Withdrawal eligibility badges, lock state visualizer, and target status banner.
- `server/api/leave/StudentLeaveHelper.php`: Student academic leave quota calculation, Friday off-day exemption, and employee schema provisioning.
- `server/api/screen_monitor/upload_workstation_video.php`: Workstation surveillance video router uploading to Google Drive Cloud Vault (`CCA_Vault`) with R2 failover.
- `server/api/screen_monitor/signal.php`: Pusher signaling gateway for WebRTC screen streaming.
- `server/api/admin/code_editor/guard.php`: Code editor security guard with path traversal protection, credential isolation, and role checking.
- `Attendence_Apps/Attendance-Desktop/electron/main.cjs`: Native desktop lifecycle, system tray, window mode toggler, and input injector manager.
- `Attendence_Apps/Attendance-Desktop/src/services/ScreenStreamService.js`: WebRTC peer connection & media streamer.
- `Attendence_Apps/Attendance-Desktop/src/services/WorkstationRecorderService.js`: Continuous desktop screen video recorder, local spool manager, and background uploader.
- `server/api/community/CommunityDbHelper.php`: Self-provisioning community post and reaction engine.
- `server/api/developer/developer_guard.php`: Standardized token-based developer and admin access guard.
- `server/api/admin/database/admin_db_guard.php`: Strict token-based database manager security guard.
- `staff-frontend/src/components/MeetingRoomView.jsx`: Core staff conference room view (PeerJS mesh, Hero Stage, side filmstrip, spotlighting, pinning, chat, raise hand, floating reactions).
- `admin-frontend/src/components/MeetingRoomView.jsx`: Admin host broadcast studio view (full moderation, remote audio control, spotlights, stage direction).
- `server/api/meetings/MeetingDbHelper.php`: Self-healing schema for `academy_meetings`, `meeting_attendance_logs`, and `meeting_messages`.
- `server/u647959341_cca_manage_db.sql`: Baseline MySQL schema dump.

---

# 12. MASTER BLUEPRINT

### 12.1 Project Overview
Creative Computer Academy (CCA) is an enterprise academy operations, workforce governance, and learning management platform. It encompasses staff attendance, native desktop tracking, live screen streaming, remote input injection, continuous workstation video surveillance (30-min Google Drive vault syncing), student academic leave quota governance, real-time break monitoring, peer-to-peer overtime trading, staff compensation and withdrawals, task assignment and verification, QA delivery workflows, gamified credit economies, student LMS training labs, a community social wall, and developer tooling.

### 12.2 Technology Stack
Refer to Section 2.

### 12.3 Complete Folder Structure
```
CreateiveComputerAcademy/
├── Admin_Apps/                 # Executive Desktop Applications
│   └── Admin-Desktop/          # Electron + React 19 + Tailwind v4 (Executive Station, Port 5185)
│       ├── electron/           # main.cjs, preload.cjs (frameless window, system tray, shell, notifications)
│       ├── src/                # App.jsx, TitleBar.jsx, AdminDesktopSidebar.jsx, Login.jsx
│       └── package.json        # scripts: desktop:dev, dist:portable, dist:nsis
├── Attendence_Apps/            # Desktop Attendance & Screen Monitoring
│   ├── Attendance-Desktop/     # Electron + React 19 + Tailwind v4 (Staff Station)
│   │   ├── electron/           # main.cjs, preload.cjs, input_injector.exe
│   │   ├── src/                # AttendanceView.jsx, DashboardView.jsx, DesktopHeader.jsx, ScreenStreamService.js, WorkstationRecorderService.js
│   │   └── package.json
│   ├── CCA-Attendance-Live.exe
│   ├── CCA-Attendance-Standalone.exe
│   └── run-attendance-app.bat
├── admin-frontend/            # React 19 + Tailwind v3 (Vite, Port 5173)
│   ├── src/
│   │   ├── components/        # BreakMonitor.jsx, AdminSidebar.jsx, NotificationBell.jsx, etc.
│   │   ├── pages/             # LiveScreenMonitor.jsx, WorkstationVideoLogs.jsx, IdleAlerts.jsx, CommunityWall.jsx, PayrollManagement.jsx, LeaveManagement.jsx
│   │   └── routes/            # ProtectedRoute.jsx
├── staff-frontend/            # React 19 + Tailwind v4 (Vite, Port 5174)
│   ├── src/
│   │   ├── components/        # P2POvertimeMarket.jsx, ActiveBreakWidget.jsx, DeveloperConsole/
│   │   └── pages/             # CommunityFeed.jsx, DeveloperConsole.jsx, MangoBreakTree.jsx, DesktopAppDownload.jsx, Leave.jsx
├── review-frontend/           # React 19 + TypeScript + Tailwind v3 (Vite, Port 5175)
├── student-frontend/          # React 19 + Tailwind v4 (Vite, Port 5176)
│   ├── public/bezier/         # PenTool interactive game assets
│   └── src/pages/             # PenToolLab.jsx, TypingLab.jsx, CoursePlayer.jsx
├── server/
│   ├── api/                   # 366 PHP REST endpoint files
│   │   ├── admin/             # tasks/, courses/, database/, payroll/, attendance/, staff/, storage/, app_version/, code_editor/, screen_monitor/, leave/
│   │   ├── attendance/        # check_in.php, check_out.php, get_my_idle_status.php, sync_offline.php, AttendanceSecurityHelper.php
│   │   ├── screen_monitor/    # get_active_staff.php, signal.php, heartbeat.php, upload_workstation_video.php, get_workstation_videos.php
│   │   ├── auth/              # login.php, verify.php, sync.php, make_hash.php
│   │   ├── breaks/            # BreakDbHelper.php, trades/, polish_break_note.php
│   │   ├── leave/             # StudentLeaveHelper.php, apply_leave.php, get_student_quota.php
│   │   ├── community/         # CommunityDbHelper.php, get_feed.php, create_post.php
│   │   ├── developer/         # developer_guard.php, get_dev_status.php, run_janitor_clean.php
│   │   ├── credits/           # CreditHelper.php, get_wallet.php, send_credits.php
│   │   ├── payroll/           # PayrollHelper.php, get_my_payroll.php, request_withdrawal.php
│   │   ├── tasks/             # claim_task.php, architect_blueprint.php
│   │   ├── student/           # courses/, foundations/ (typing, pentool)
│   │   ├── chat/              # 1:1 and group chat endpoints
│   │   └── crons/             # auto_checkout.php, auto_tiffin.php, cron_absent_manager.php
│   ├── config/                # database.php, cors.php, env.php, r2.php, PusherHelper.php, SmsHelper.php, AppVersionHelper.php, GoogleDriveClient.php
│   └── u647959341_cca_manage_db.sql
├── COMMUNITY_POSTS_BLUEPRINT.md
└── MASTER_BLUEPRINT.md        # Canonical architectural blueprint
```
├── COMMUNITY_POSTS_BLUEPRINT.md
└── MASTER_BLUEPRINT.md        # Canonical architectural blueprint
```

### 12.4 Frontend Architecture
Four autonomous web SPAs and one native Electron desktop application. Each frontend isolates its view logic and state while consuming shared REST and WebSocket services.

### 12.5 Backend Architecture
Flat, non-framework PHP REST API. Endpoints reside in domain-specific folders under `server/api/`. Shared functionality is encapsulated within static helper classes (`BreakDbHelper`, `PayrollHelper`, `CreditHelper`, `CommunityDbHelper`, `AttendanceSecurityHelper`, `NotificationHelper`, `PusherHelper`, `SmsHelper`, `AppVersionHelper`).

### 12.6 PHP Architecture
Procedural scripts relying on `require_once` for configuration and helpers. Endpoints read input via `json_decode(file_get_contents("php://input"), true)` or `$_GET`/`$_POST`, interact with MySQL through PDO, and return structured JSON responses.

### 12.7 React Architecture
Component-driven architecture utilizing Vite for fast HMR. Global authentication state is managed via React Context (`AuthContext`). Realtime updates are consumed via Pusher WebSocket channels inside components with cleanup hooks.

### 12.8 Database Architecture
Normalized relational database running on InnoDB with foreign keys configured to `ON DELETE CASCADE` for user-owned records (attendance, breaks, trades, submissions) and `ON DELETE SET NULL` for optional references (departments, courses). Dynamic tables are automatically created if absent (`BreakDbHelper::ensureSchema`, `CommunityDbHelper::ensureSchema`, `AppVersionHelper::ensureSchema`).

### 12.9 Database Relationship Map
```
users ──1:1──▶ employees ──N:1──▶ departments
users ──1:1──▶ user_credits ──1:N──▶ credit_transactions
users ──1:N──▶ user_roles
users ──1:N──▶ user_tokens
users ──1:N──▶ attendance ──1:1──▶ attendance_disputes
users ──1:N──▶ user_breaks
users ──1:N──▶ staff_idle_alerts
users ──1:1──▶ staff_heartbeats
users ──1:N──▶ staff_workstation_videos
users ──1:N──▶ community_posts ──1:N──▶ community_comments
community_posts ──1:N──▶ community_likes
users ──1:N──▶ staff_overtime_trades (as seller_id & buyer_id)
users ──1:N──▶ staff_pay_schemes ──1:N──▶ staff_work_earnings
users ──1:N──▶ staff_withdrawals
users ──1:N──▶ tasks (as creator or assignee) ──1:N──▶ task_submissions / comments / logs
courses ──1:N──▶ course_modules ──1:N──▶ course_lessons ──1:N──▶ student_lesson_progress
chats ──1:N──▶ chat_participants ──N:1──▶ users
chats ──1:N──▶ chat_messages ──1:N──▶ chat_message_reactions / receipts
```

### 12.10 Authentication Flow
Described in Section 6.

### 12.11 Authorization / Role System
Roles: `admin`, `manager`, `staff`, `instructor`, `student`, `reviewer`, `developer`. Stored in `user_roles`. Multi-role accounts are supported.

### 12.12 API Architecture
RESTful semantics using standard HTTP verbs, returning JSON payloads. URL paths correspond directly to physical filesystem paths under `server/api/`.

### 12.13 API Endpoint Map
Described in Section 7.

### 12.14 Feature Inventory
Described in Section 9.

### 12.15 Component Map
Key cross-portal components:
- `LiveScreenMonitor.jsx`: Admin WebRTC live monitoring grid with remote input injection.
- `WorkstationVideoLogs.jsx`: Admin continuous surveillance review player with date/staff filtering, aggregate statistics, embedded Google Drive video player, and variable speed (1x, 1.25x, 1.5x, 2x).
- `IdleAlerts.jsx`: Workstation inactivity tracking, alert logs, and dispute inspection.
- `DashboardView.jsx` (Desktop): Unified desktop workstation hub featuring shift status, live active break widget, quick punch, recent history, and credit balance.
- `ScreenStreamService.js`: Electron client WebRTC peer connection and desktop capturer.
- `ServerCodeEditor.jsx` / `ServerCodeEditorTab.jsx`: Web-based IDE with tree navigator, syntax editing, opcache clear, and auto-backups.
- `CommunityWall.jsx` / `CommunityFeed.jsx`: Interactive internal social wall.
- `DeveloperConsole.jsx`: Developer diagnostics and maintenance suite.
- `BreakMonitor.jsx`: Realtime administrative break monitor with live trades approval tab.
- `P2POvertimeMarket.jsx`: Staff portal overtime market modal (Buy, Incoming, History).
- `MangoBreakTree.jsx`: Interactive visual representation of accumulated overtime and leave conversion.
- `PayrollManagement.jsx` / `PayrollWallet.jsx`: Financial compensation and withdrawal managers.
- `DesktopAppDownload.jsx`: Staff portal installer and standalone binary distribution interface.

### 12.16 Controller Map
Each PHP script file under `server/api/` serves as its own independent controller.

### 12.17 Service Map
Key backend & client services:
- `OvertimeEngine`: Single Source of Truth (SSoT) overtime calculator computing gross attendance OT, tiffin efficiency savings, short shifts, excess breaks, absences/leaves, mango claims, cashed-out OT, P2P trades, and admin vault holds.
- `PayrollSync`: Dedicated synchronization service for attendance earnings, mango leave day compensations, and yearly contract surplus flags.
- `PayrollRoadmap`: Contract tier resolution, staggered roadmap progressions, promotion milestones, and rate freezes.
- `PayrollWithdrawal`: Payout request validation, minimum salary limit enforcement, audit cycle stamping, and notifications.
- `PayrollLedger`: Dedicated financial ledger engine calculating staff wallet summaries, monthly cycle invoice chronologies, fractional rollovers, and active overtime value.
- `PayrollHelper`: Central compensation facade and staff wallet orchestrator.
- `BreakDbHelper`: Break verification, Mango minute calculation, trade validation, and deduplicated absence penalties.
- `StudentLeaveHelper`: Academic leave quota management, Friday off-day exemption, and employee schema provisioning.
- `CreditHelper`: Ledger balance updates and idempotency protection.
- `AttendanceSecurityHelper`: IP filtering, proxy resolution, and device fingerprint validation.
- `AppVersionHelper`: Client telemetry, version tracking, and release management.
- `WorkstationRecorderService`: Background continuous desktop surveillance recorder, local spool manager, and FIFO Google Drive uploader.
- `OfflineQueueService`: Local client queue management and offline SHA-256 credential authentication.
- `ScreenStreamService`: Desktop WebRTC media capture, peer connection, and data channel routing.
- `PusherHelper`: WebSocket event broadcast wrapper.
- `SmsHelper`: Dry-run shielded SMS dispatching.

### 12.18 Model Map
The MySQL database tables defined in Section 5 serve as the data model layer.

### 12.19 Important Business Logic
- **Unified Single Bucket Overtime Engine (SSoT)**:
  `Net Overtime = (Attendance OT beyond shift + Tiffin Savings + P2P Bought + Vault Transferred In) - (Short Shifts + Excess Breaks (>40m) + Mango Full Day Claims + In-Shift Mango Breaks + Cashed Out + P2P Sold + Absent/Leave Penalties + Vault Out)`.
  `Staff Available Overtime = max(0, Net Overtime - Vault Held)`.
  **Zero Divergence Rule**: All absent penalties are deducted from the Overtime pool first; base salary remains 100% intact as long as Overtime is available.
- **P2P Trade Financial Settlement**:
  Selling staff receives a monetary earnings credit; buying staff incurs a monetary deduction at the seller's active hourly rate.
- **Student Academic Leave Quotas**:
  Employees with `is_student = 1` receive a monthly academic leave allowance (default: 3 days). Only leaves of type `'Student Academic Leave'` with status in `('Approved', 'Pending')` deduct from this quota. Weekly off-days (Fridays, ISO-8601 day 5) are explicitly excluded from quota consumption.
- **Continuous Workstation Surveillance Rollover**:
  Workstation screen is captured at 1280x720, 5-10 fps, 100 kbps VP8 into 30-minute WebM chunks (3-minute during testing). Chunk boundaries roll over seamlessly with zero frame drops, flush to local disk spool via Electron IPC, and upload via background spool worker to `CCA_Vault / Workstation_Videos / {DD-MM-YYYY} / {StaffName_UserID} / clip_XX.webm` in Google Drive with Cloudflare R2 failover.
- **Credit Idempotency**:
  `event_key` uniquely identifies ledger entries to prevent double-crediting on retries.
- **Hourly Rate Calculation**:
  Monthly: `salary / (working_days * daily_hours)`. Yearly: `contract_amount / (working_days * duration_months * daily_hours)`.
- **Tiffin Delta Calculation**:
  Early return ($\le$ 40m) earns up to +25m OT; overstay ($>$ 40m) incurs up to -20m penalty.

### 12.20 Data Flow Map
Described in Section 8.

### 12.21 Module Dependency Map
All endpoints depend on `config/database.php` and `config/cors.php`. Developer suite depends on `developer_guard.php`. Database manager depends on `admin_db_guard.php`. Payroll and breaks depend on `PayrollHelper.php` and `BreakDbHelper.php`. Realtime events depend on `PusherHelper.php`.

### 12.22 Existing Bugs
Described in Section 10.

### 12.23 Incomplete Features
- Live SMS Gateway integration (currently handled safely via `SmsHelper::isDryRun()` simulation mode).
- Desktop client auto-updater: Core architecture implemented (`UpdateService.js`, `AppVersionHelper.php`, `app_releases`, `AppReleases.jsx`), with NSIS/portable binaries distributed via Cloudflare R2 and fleet telemetry logging live versions.

### 12.24 Security Concerns
Described in Section 10.

### 12.25 Technical Debt
- Lack of uniform server-side token middleware across legacy endpoints.
- Tailwind CSS version divergence (v3 vs v4).
- Redundant duplication of layout and auth components across portals.
- Dual task category representations.

### 12.26 Naming Conventions
- Backend files: `snake_case.php`
- Backend classes: `PascalCase.php` (e.g., `BreakDbHelper.php`, `CommunityDbHelper.php`)
- Frontend components: `PascalCase.jsx`
- Frontend hooks: `useCamelCase.js`
- Database tables and columns: `snake_case`

### 12.27 Important Development Rules
1. **Never bypass `BreakDbHelper`** when calculating overtime minutes or managing break records.
2. **Always use atomic transactions** (`beginTransaction` / `commit` / `rollBack`) when modifying financial ledgers or multi-table records.
3. **Always assign unique `event_key` values** in `credit_transactions` to guarantee idempotency.
4. **Never execute unvalidated queries** in database endpoints.
5. **Always provide rule-based fallbacks** when integrating external AI APIs (e.g., Gemini).
6. **Always respect dry-run flags** in `SmsHelper` to prevent accidental cost deductions.
7. **Always invoke `opcache_invalidate()` and `resolveServerSafePath()`** when updating or writing server-side script files dynamically.
8. **Always buffer ICE candidates until remote description is set** in WebRTC streaming services to prevent negotiation race conditions.

### 12.28 Critical Files
Described in Section 11.

### 12.29 Areas That Require Extra Care
- **Financial & Payroll Calculations**: Any error in `PayrollHelper` or `BreakDbHelper` directly affects staff compensation.
- **Admin Database Controller**: Fully secured with `admin_db_guard.php`.
- **WebRTC Remote Input Control**: `input_injector.exe` controls physical hardware on staff computers.
- **Credit Engine**: Direct impact on gamification balances.

### 12.30 Unknown / Unclear Areas
Described in Section 13.

### 12.31 Holidays & Center Closures (Official Wage Protection & Attendance Exemption)
- **Engine**: `server/api/admin/holidays/HolidayHelper.php` with self-healing JIT schema migration (`is_paid`, `closure_type`, `notes`, `created_by`, `updated_at`, unique key on `date`, and `staff_work_earnings.source_type` altered to `VARCHAR(50)`).
- **Attendance Exemption**: `cron_absent_manager.php` checks `holidays` where `expected_hours <= 0` and skips marking active staff absent. When a holiday is declared, `HolidayHelper::saveHoliday` automatically purges any existing `Absent` attendance records for that date.
- **Full Base Wage Protection**: In `PayrollSync::syncAttendanceEarnings`, paid holidays (`is_paid = 1`) credit standard daily shift hours (8h = 480m for 8h staff, 6h = 360m for 6h staff) into `staff_work_earnings` under `source_type = 'paid_holiday'`. Zero overtime or mango debt is deducted.
- **Automatic Rollback**: Deleting a holiday via `HolidayHelper::deleteHoliday` automatically deletes corresponding `paid_holiday` rows from `staff_work_earnings`.
- **Admin Portal Interface**: Dedicated `admin-frontend/src/pages/HolidaysManagement.jsx` (route `/holidays`), with metric cards, Bangladesh national holiday presets, and create/edit modal.
- **Staff Portal Visibility**: `get_attendance.php` surfaces `today_holiday` and merges holiday records into monthly history as `status: 'Holiday'` with `Paid Day Off (8h)`.

### 12.32 Staff Gamification, XP & Career Leveling Engine
- **Engine**: `server/api/gamification/GamificationHelper.php` with self-healing schema:
  - `staff_gamification_profiles`: Total XP, calculated Level (1-20+), Tier, and Attendance Streaks.
  - `staff_badges`: Milestone achievement awards (Streak 3, Streak 7, Streak 30, Mango Baron, Holiday Hero, Five-Star Virtuoso, Century Centurion).
  - `staff_xp_ledger`: Granular audit log of points awarded (on-time check-ins, full shifts, holiday service, quality tasks).
- **Auto-Sync**: Automatically computes and awards XP from historical attendance and shift records without manual initialization.
- **Endpoints**: `server/api/gamification/get_my_career.php`, `server/api/gamification/get_leaderboard.php`.
- **Staff Portal UI**:
  - Dedicated page `staff-frontend/src/pages/CareerRankings.jsx` (route `/career`), with 3D metallic level badges, unlockable badge showcase, Top 3 podium, and full company leaderboard.
  - Interactive HUD badge integrated directly into `DashboardHeroBanner.jsx`.
  - Sidebar link: `Career & Badges 🏆` with bilingual translations.

### 12.33 Staff Productivity & Focus Planner (1-3-5 Architecture, Ambient Audio & Scratchpad)
- **Engine**: `server/api/productivity/ProductivityHelper.php` with self-healing schema:
  - `staff_daily_plans`: Date-based 1-3-5 priority plans (1 Big Win, 3 Medium Priorities, 5 Quick Checklists) with completion tracking and XP flag.
  - `staff_scratchpads`: User-scoped persistent markdown/plain notepad auto-synced to cloud.
- **Gamification Linkage**: Automatically awards +25 XP via `GamificationHelper::awardXp` when 100% of a day's non-empty 1-3-5 priorities are completed.
- **Zero-Bandwidth Procedural Ambient Sound**: `staff-frontend/src/utils/ambientSoundEngine.js` generates authentic acoustic noise and chord flows using the browser's native Web Audio API (Rainy Academy, Ocean Waves, Cozy Campfire, Deep Work Flow, Cafe & Keyboard, Pure White Noise) with zero external assets, zero bandwidth, and 100% offline reliability.
- **Endpoints**:
  - `server/api/productivity/get_daily_plan.php`
  - `server/api/productivity/save_daily_plan.php`
  - `server/api/productivity/get_scratchpad.php`
  - `server/api/productivity/save_scratchpad.php`
- **Staff Portal UI**:
  - Dedicated page `staff-frontend/src/pages/ProductivityPlanner.jsx` (routes `/productivity` and `/planner`).
  - Interactive Date Switcher (view past days' plans or future tasks).
  - Debounced auto-save on scratchpad with word/character counters.
  - Sidebar navigation item: `Focus & Planner 📝🎧` with English and Bengali translations.

### 12.34 Smart Finance & Mango Simulator (Earnings Projection Engine)
- **Model**: Interactive client-side projection engine `staff-frontend/src/components/Payroll/EarningsSimulator.jsx` connected to real contract parameters via `PayrollHelper::getStaffWalletSummary` and `OvertimeEngine`.
- **Simulation Dimensions**:
  - **Projected Overtime Work**: 0 to 60 hours slider dynamically calculating additional cash earnings and newly yielded ripe mangoes + minutes.
  - **Mango Liquidation vs Paid Leave Reserve Strategy**: Slider allocating available ripe mangoes into cashout at withdrawal vs reserving as paid days off (zero wage reduction on emergency leaves).
  - **Committed Working Days**: 18 to 26 days schedule simulator calculating regular base wage.
  - **Quarterly Milestone Tier Explorer**: Current tier vs +10% boost vs +25% promotion boost recalculating entire monthly earnings.
- **Visual Output**: Total simulated payout with live animated counter, dynamic stacked progress breakdown (Base Pay vs Overtime vs Mango Cashout), and automated strategic optimizer insights.
- **Routing**: Integrated as a dedicated tab within `PayrollWallet.jsx` and directly accessible via `/payroll?tab=simulator` or `/simulator`.

### 12.35 Staff Desktop App & Web 100% Feature Parity Architecture
- **Objective**: Eliminate any functional divide between `staff-frontend` (browser SPA) and `Staff_Apps/Attendance-Desktop` (Electron Workstation Client).
- **Parity Implementations**:
  1. **Career & Badges (`/career`)**:
     - `Staff_Apps/Attendance-Desktop/src/components/CareerRankingsView.jsx`: Ported full 3D metallic level badges, unlockable achievement badge showcase, Top 3 podium, and full company leaderboard.
  2. **Smart Finance & Mango Simulator (`/simulator`, `/payroll/simulator`)**:
     - `Staff_Apps/Attendance-Desktop/src/components/EarningsSimulator.jsx`: Dual-tab toggle in `PayrollWalletView.jsx` (`[Wallet Overview & Ledgers]` & `[Smart Earnings & Mango Simulator 🔮🥭]`).
  3. **Team Feasts & Tours (`/events`)**:
     - Ported modular architecture: `TeamEventsView.jsx`, `TeamEventsTopBar.jsx`, `EventInfoBanner.jsx`, `EventLedgerSection.jsx`, `EventParticipantsList.jsx`, `EventExpensesBoard.jsx`. Mounted in `App.jsx`, `DesktopSidebar.jsx`, and `CommandPalette.jsx`.
  4. **Developer Tools Sub-Modules (`/developer/events`, `/developer/mango-vault`)**:
     - Standalone single-page layout for Developer Events (`DeveloperEvents.jsx`, `TeamEventsManagerTab.jsx`).
     - Mango Vault Manager (`MangoVaultManager.jsx`) with `MangoHoldModal`, `MangoReleaseModal`, `MangoStaffTable`, `MangoTransferModal`, `MangoVaultAuditLogs`, `MangoVaultHeader`, `MangoVaultModals`.
  5. **My Workstation (`/workstation`)**:
     - `MyWorkstationView.jsx` connecting to `server/api/screen_monitor/get_my_workstation_logs.php` displaying scoped video archives, idle penalty breakdowns, and surveillance timeline.
  6. **Productivity Planner & Ambient Focus Audio (`/planner`, `/productivity`)**:
     - `ProductivityPlannerView.jsx` with 1-3-5 matrix, cloud scratchpad auto-save, and Web Audio API procedural audio engine (`ambientSoundEngine.js`).
  7. **Universal Command Palette (`CommandPalette.jsx`)**:
     - `Ctrl+K` palette mapped with instant hotkeys to all modules across attendance, payroll, simulator, career, events, developer suite, workstation, and focus planner.

### 12.36 Workspace Master Secrets Backup & 1-Click Restore Architecture
- **Objective**: Zero-configuration, zero-manual-entry backup and restore mechanism across all 7 projects in `kabir-workspace` during PC migration.
- **Fast Pruned Recursive Scanning**:
  - `BACKUP_ALL_PROJECTS_SECRETS.ps1`: Uses `[System.IO.Directory]::GetDirectories` skipping `node_modules`, `.git`, `dist`, `build`, `vendor`, `release` in <2 seconds.
  - Bundles 40 secret files (`.env`, `.env.local`, `.env.production`, `google_drive_credentials.json`, `token.json`) across `CreateiveComputerAcademy`, `DayalStock_WithContributor`, `DayalStock_WithoutContributor`, `SupplyLink`, `PikSea`, `FF_TopUp`, and `downloader` into `KABIR_WORKSPACE_ALL_SECRETS_BACKUP.zip` preserving exact relative directory paths.
- **1-Click Restore Automation**:
  - `RESTORE_ALL_PROJECTS_SECRETS.ps1`: Single-click or PowerShell command extracting `KABIR_WORKSPACE_ALL_SECRETS_BACKUP.zip` directly into the workspace root on a new PC, restoring every `.env` into its exact project and subproject directory without typing.
- **Multi-Tier Git Shield**:
  - Root `.gitignore` and child `.gitignore` rules ensure `*.zip`, `.env*`, and `*credentials*.json` are strictly prevented from accidental git commits.

### 12.37 100% Staff Desktop App & Web Portal Parity Completion (v2.1.0)
- **Assembly Line Content Studio (`/content-studio`)**: Complete 6-stage video production pipeline ported to desktop app (`ContentStudioView.jsx`, project pipeline modal, credit assignment, stages overview).
- **Security Deposit Vault Card (`/payroll`)**: Integrated `SecurityDepositVaultCard.jsx` showing reserved salary deposit, refund eligibility threshold, and automated return tracking.
- **National Holiday Banner & History Row Lock (`/attendance`)**: Official paid holiday banner, 3D clock "Holiday Overtime Mode", and dispute lock for approved holidays.
- **Daily Motivational Quotes Ticker (`/`)**: `DashboardMotivationTicker.jsx` mounted below Executive Hero Banner with bilingual dynamic rotation.
- **Interactive Profile & Cover Image Cropper (`/profile`)**: Dual modal image cropper (`react-easy-crop`, `cropImage.js`) with 1:1 circular profile crop and 16:9 / 3:1 cover crop.
- **Central Bilingual Language System (`LanguageContext.jsx`)**: Ported dictionary with `bn` and `en` support, dynamic realtime toggle, and deep integration into sidebar and views.
- **Dynamic Theme System (`ThemeContext.jsx`)**: Dark/light mode synchronization with pure white uniform light styling.
- **Sidebar Ordering & Visual Alignment**: Identical menu item hierarchy, developer suite sequence, unified icons, and expanded accordion height (500px).
- **Interactive Boy Mascot & Wicker Harvest Basket (`MangoBreakTreeView.jsx`)**: Vector SVG boy character ("আমের দিকে চেয়ে থাকা খোকা") with clicking bounce, thought bubble dialogue rotation, pop audio, and harvest wicker basket.
- **Packaging & Distribution**: Built and signed `CCA-Staff-App-Setup.exe` (NSIS installer) and `CCA-Staff-App-Standalone.exe` (portable executable) v2.1.0 in `Staff_Apps/Attendance-Desktop/release`.

### 12.38 Live WebRTC Meetings & CCA Studio System (Native Video Conferencing, Audio Orchestration, JIT Schema, DataChannels & Moderation)
- **Objective**: Full autonomous, zero-dependency, Zoom-style multi-party video conferencing, live screen sharing, bidirectional remote audio orchestration, and pinned in-meeting chat directly inside CCA Admin and Staff portals without third-party meeting subscription dependencies.
- **Self-Healing JIT Schema (`MeetingDbHelper.php`)**:
  - `academy_meetings`: Meeting records with `room_id`, `title`, `agenda`, `meeting_type`, `created_by`, `status`, `is_chat_locked`, `hosts_json`, and timestamps.
  - `meeting_attendance_logs`: Session tracking with `meeting_id`, `user_id`, `peer_id`, `joined_at`, `left_at`, `duration_minutes`, and `last_ping` keepalive.
  - `meeting_messages`: Real-time chat archive storing `meeting_id`, `user_id`, `user_name`, `user_role`, `message`, `is_pinned`, `pinned_by`, `pinned_at`, and `created_at`.
- **Peer-to-Peer Mesh Architecture (`PeerJS` & Google STUN)**:
  - Connects to Google public STUN infrastructure (`stun.l.google.com:19302`, `stun1`, `stun2`).
  - Automated 7-second heartbeat and peer discovery loop discovering incoming members dynamically.
  - DataChannel mesh dispatcher handling high-speed peer messages without server round-trips:
    - `chat_message`: Real-time text broadcast with avatar rendering.
    - `pin_toggle`: Pinned announcement synchronization.
    - `chat_lock_toggle`: Instant lock/unlock propagation.
    - `host_update`: Dynamic Co-Host promotion/demotion.
    - `set_mic_state`: Direct bidirectional remote microphone toggle.
    - `peer_mic_state`: Real-time audio waveform / mute indicator broadcast.
    - `mute_all` / `unmute_all`: Room-wide audio moderation commands.
- **Host & Role Hierarchy Governance**:
  - **Permanent Primary Host**: The creator of the meeting (`created_by`) is permanently assigned the primary `👑 Host` badge.
  - **Developer Superuser Role (`developer`)**: Automatically and permanently receives `⭐ Co-Host` status upon entering any meeting room across the academy.
  - **Dynamic Co-Host Delegation**: Primary Host and existing Co-Hosts can promote participants to Co-Host or demote them at will. The primary creator cannot be demoted.
- **Bidirectional Instant Audio Control Matrix (Mute ⇄ Unmute)**:
  - Host or Co-Host can directly toggle any participant's microphone on or off at will (`handleToggleParticipantMic`).
  - Synchronous track manipulation (`audioTrack.enabled = true / false`) triggers immediately over DataChannels without re-prompting browser `getUserMedia` permissions.
  - Prominent 1-click toggle buttons on the participant video card (top-left), clickable mic icon in the user pill, and per-user rows in the Participants Modal.
  - Room-wide `[ 🔇 Mute All ]` and `[ 🎙️ Unmute All ]` controls available in both the top navigation bar and the Participants Modal.
- **Fault-Tolerant Media Acquisition (Anti-Freeze Guard)**:
  - `getUserMedia` executes with a 4-second asynchronous promise race timeout against hardware mutex lockups or permission delays.
  - Automatic fallback to audio-only (3s timeout) and synthetic silent/canvas stream (`createFallbackStream`).
  - Loading screen features an immediate `[ 🚀 Skip & Join (Listen-Only) ]` button preventing members from ever stalling on connection screens.
- **Zoom-Style Presentation & Screen Sharing**:
  - Dynamic WebRTC track replacement (`sender.replaceTrack(screenTrack)`) on all active peer connections without renegotiation.
  - Prominent "You are currently sharing your screen" control banner with 1-click revert to camera.
  - Dynamic responsive layout: Gallery grid for group discussions, dynamic stage + participant filmstrip when screen presenting.
  - Visual audio indicators with triple-bar CSS pulsing wave animations for active speakers and clear muted status badges.
- **In-Meeting Chat with Avatars & Message Pinning**:
  - Host-moderated chat lock (`is_chat_locked = 1` by default) with host broadcast capability.
  - Sender avatars and role badges rendered on every message bubble.
  - Sticky pinned message bar with 1-click jump-to-message highlighting (`scrollIntoView`).
- **✋ Raise Hand & Priority Speaker Queue**:
  - Attendees can raise/lower hand via floating dock or hotkey; triggers `hand_raise_toggle` DataChannel broadcast (`{ type: 'hand_raise_toggle', payload: { userId, userName, isHandRaised } }`).
  - Web Audio API synthesizes a two-tone ascending chime `C5 (523.25Hz) -> G5 (783.99Hz)` to notify room members without downloading external audio assets.
  - Video cards display glowing bounce badges (`✋ Hand Raised` / `✋ হাত তুলেছে`).
  - `ParticipantsModal` renders an amber-accented priority speaker queue at the top of the list with instant `[ 🎙️ Allow Speak ]` (unmutes participant and lowers hand) and `[ Lower Hand ]` controls for Hosts.
- **🎉 Live Floating Emoji Reactions & Web Audio Pop Synthesis**:
  - Attendees can dispatch 6 dynamic floating reactions (`❤️`, `👏`, `🔥`, `🎉`, `💡`, `🚀`) from a hover popover tray.
  - Triggers `reaction` DataChannel broadcast (`{ type: 'reaction', payload: { emoji, userId, userName } }`).
  - Floating visual physics engine: Dynamic upward translation with randomized horizontal jitter (`-40px` to `+40px`), variable scale (`0.85` to `1.35`), and automatic DOM lifecycle cleanup after 2.8 seconds.
  - Web Audio API synthesizes an authentic acoustic pop via frequency sweep `F5 (698.46Hz) -> A5 (880Hz)` over 80ms with exponential gain ramp down.
  - Local and remote participant video tiles display a 2.5-second bounce attribution badge reflecting recent reactions.
- **🌟 Spotlight & 📌 Pin User Focus (Hero Stage + Filmstrip)**:
  - **Local Pin (`📌`)**: Any attendee can pin any participant (or self) locally. The pinned speaker immediately occupies the full Hero Stage while other participants collapse into a responsive side/bottom Filmstrip. Includes a quick `[ ✕ Unpin ]` button.
  - **Room-Wide Spotlight (`🌟`)**: Host and Co-Hosts can broadcast room-wide spotlights over WebRTC DataChannel (`spotlight_toggle` payload: `{ targetPeerId, targetUserId, targetName, isSpotlighted, spotlightedBy }`). Plays a tri-tone fanfare synthesizer chime `C5 -> E5 -> G5` and displays an amber glowing badge banner `🌟 Spotlight for Everyone: [Name]`.
  - **Smart Stage Hierarchy**:
    1. Screen Sharing active $\to$ Presentation Stage + Mini Filmstrip.
    2. Effective Focus active (Local Pin overrides room-wide Spotlight for personal viewing preference) $\to$ Speaker Hero Stage + Side Filmstrip.
    3. Default $\to$ Zoom-style responsive Gallery Grid.
  - **Local Camera Multi-Attach**: When a remote user is focused on the Hero Stage, the local user's camera feed is seamlessly attached to `localFilmstripVideoRef`, ensuring self-view is never lost in filmstrip mode.
  - **Anti-Stale Disconnection Self-Healing**: `useEffect` monitors active `remotePeerList` and resets pinned/spotlighted states immediately if the focused participant leaves or disconnects.
  - **Temporal Dead Zone (TDZ) Memory Protection**: Variable declaration hoisting (`remotePeerList`, `totalInRoom`) placed above stage resolution effects guarantees zero initialization crashes across all browser rendering lifecycles.
- **🎨 Live Interactive Whiteboard (`InteractiveWhiteboard.jsx`)**:
  - Full collaborative vector canvas without external screen-sharing dependencies.
  - Features drawing tools: Pen/Brush (size 2-24px, 12 presets), Eraser, Shapes (Rectangle, Circle, Line, Arrow), Text annotations, and Pan/Clear.
  - Real-time P2P synchronization over WebRTC DataChannel (`wb_action`, `wb_undo`, `wb_clear`, `wb_sync`).
  - Late-joiner automatic sync: new participants automatically receive existing whiteboard canvas state on entry.
  - 1-Click PNG snapshot export (`canvas.toBlob`) directly in the whiteboard header.
  - Host moderation: Host controls board presentation and can toggle `allowOthers` permission for collaborative classroom drawing.
- **💻 In-Meeting Syntax Code Snippets & File Sharing**:
  - **Code Snippets**: Formatted syntax-highlighted code sharing directly in meeting chat with language selector (JavaScript, Python, PHP, HTML/CSS, SQL, Java, C++, TypeScript, Bash, JSON, etc.), monospace preview with dark IDE container, language badge, and 1-click `[ 📋 Copy Code ]` button.
  - **File & Document Sharing**: Upload and distribute PDFs, documents, presentations, and ZIP archives up to 25MB via `api/meetings/upload_chat_file.php`. File cards display file type icon, name, formatted size (B/KB/MB), and direct download button.
  - **Image Previews & Lightbox**: Shared images render clickable inline previews with click-to-expand lightbox modal and download link.
  - **Zero Round-Trip DataChannel Broadcast**: Messages and attachments broadcast immediately over WebRTC DataChannel (`{ type: 'chat_message', payload: newMsg }`) with fallback DB persistence in `meeting_messages`.
  - **JIT Self-Healing Schema (`MeetingDbHelper.php`)**: Dynamically provisions `message_type`, `attachment_url`, `attachment_name`, `attachment_size`, and `code_language` columns on the `meeting_messages` table without requiring manual migration.

### 12.39 In-Browser Studio Recording Engine, Google Drive Auto-Vault & Modular Architecture
- **In-Browser Audio/Video Compositor Engine (`useMeetingRecorder.js`)**:
  - Direct in-browser recording without heavy server-side transcoding infrastructure or third-party SFU dependencies.
  - Mixes local microphone audio, remote peer audio elements via `AudioContext` destination node, and video feeds (Presenter Hero Stage, Screen Sharing, or Gallery Grid) onto an HTML5 `<canvas>` rendering stream.
  - Employs native `MediaRecorder` API recording into high-compression `video/webm;codecs=vp9,opus` (with MP4 fallback) at 30 fps and 1080p full definition.
  - Floating Live REC indicator badge with live elapsed duration timer (`HH:MM:SS`) in the top meeting header and toast lifecycle alerts.
- **Recording Preview & Playback Modal (`MeetingRecordingModal.jsx`)**:
  - Automatically pops up when the host or co-host stops a recording.
  - Embedded HTML5 `<video>` player with play/pause, seek scrub bar, volume, duration counter, file size indicator, and 1080p HD badge.
  - 1-Click local PC download with clean standardized naming: `CCA_Meeting_<roomId>_<YYYYMMDD_HHmmss>.webm`.
  - Dual-tier cloud save button with real-time percentage progress bar and visual cloud storage badge ("Saved to Google Drive Vault" vs "Saved to CCA Server Vault").
- **Google Drive Auto-Vault & Failover System (`upload_recording_drive.php`)**:
  - Multipart upload endpoint saving recorded media to `uploads/meeting_recordings/CCA_Meeting_<roomId>_<dateStr>.webm`.
  - Primary cloud target: Google Drive Cloud Vault under `My Drive > CCA_Vault (ID: 18HFbN429toI-WJ1NUMTXcK3bVY69Kcno) > Meeting_Recordings (ID: 1ylVVos5JaUoi4PBnewR2Danbd3AR5P4D)`.
  - Pure PHP Google Drive API v3 client (`GoogleDriveClient.php`) utilizing OAuth2 refresh tokens, self-healing token cache with MD5 hash validation, and MySQL database fallback (`system_storage_settings`).
  - Automatic fallback to local server vault if Google Drive is temporarily unreachable or undergoing token renewal, maintaining zero data loss.
- **Self-Healing Meeting Schema Extension (`MeetingDbHelper.php`)**:
  - Automatically verifies and provisions the recording columns on `academy_meetings`:
    - `recording_url`: Web link to video on Google Drive or local server vault.
    - `recording_drive_id`: Google Drive File ID for direct Drive viewer/download integration.
    - `recording_duration`: Recorded meeting duration in seconds.
    - `recording_size`: Exact file size in bytes.
    - `recorded_at`: Timestamp of recording completion.
- **Ultra-Modular Component Refactoring (235-Line Architecture)**:
  - Decomposed legacy monolithic 3,543-line `MeetingRoomView.jsx` into a clean, modular ~235-line component in both `staff-frontend` and `admin-frontend`:
    - `src/components/Meeting/hooks/useMeetingSession.js`: WebRTC mesh, peer discovery, and signal lifecycle.
    - `src/components/Meeting/hooks/useMeetingRecorder.js`: Audio/video canvas mixing, recording timer, and upload handler.
    - `src/components/Meeting/components/MeetingRecordingModal.jsx`: Playback preview and local/Drive download modal.
    - `src/components/Meeting/components/MeetingHeader.jsx`: Room title, time elapsed, badge indicators, and audio/record controls.
    - `src/components/Meeting/components/MeetingFloatingDock.jsx`: Dock controls for mic, camera, screen share, whiteboard, chat, hand raise, and reactions.
    - `src/components/Meeting/components/MeetingParticipantsModal.jsx`: Attendee roster, hand raise priority queue, and host moderation tools.
    - `src/components/Meeting/components/MeetingChatPanel.jsx`: Moderated chat, syntax code snippet viewer, and file transfer.
    - `src/components/Meeting/components/MeetingVideoGrid.jsx`: Gallery grid, Hero Stage, spotlighting, and side filmstrip.
    - `src/components/Meeting/components/InteractiveWhiteboard.jsx`: Collaborative vector whiteboard canvas.
    - `src/components/Meeting/components/FloatingReactions.jsx`: Web Audio synthesized reaction animations.
  - Bilingual localization wrapped in `LanguageContext.jsx` for seamless English and Bengali switching.

---

# 13. UNKNOWN / UNCERTAIN AREAS

1. **Production SMS Gateway Credentials**: Live SMS gateway endpoints and credentials are not yet configured; the system operates safely under `SmsHelper` simulation mode.
2. **Native Input Injector Source Code**: `electron/input_injector.exe` is a pre-compiled Windows executable without raw source code in the repository. Its command protocol (`MOVE x y`, `CLICK btn`, `KEY key`) is inferred from `electron/main.cjs`.
3. **Turn/Relay Servers for WebRTC**: WebRTC configuration currently uses public Google STUN servers (`stun.l.google.com:19302`). Environments behind symmetric NAT firewalls may require a dedicated TURN server for live screen streaming.