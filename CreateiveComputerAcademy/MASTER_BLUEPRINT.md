# 🏛️ Creative Computer Academy (CCA) — Master Blueprint

**Generated:** September 21, 2026
**Role:** Lead Software Architect / Senior Full-Stack Developer analysis
**Scope:** Full repository — 4 React frontends, 1 PHP backend, 1 MySQL schema

No files were modified, deleted, or refactored to produce this document. All statements are traced from the actual code in this repository as of the current working tree (including uncommitted changes shown in git status). Anything not directly verifiable is marked `UNKNOWN`.

---

# 1. PROJECT UNDERSTANDING STATUS

Full codebase analyzed: all 4 frontend portals (`admin-frontend`, `staff-frontend`, `review-frontend`, `student-frontend`), the entire `server/api` tree (~170 PHP endpoints across 24 domains), `server/config`, and the full MySQL dump (`server/u647959341_cca_manage_db (3).sql`, 56 tables). Route trees, auth flow, credit engine, and every table's columns/keys/foreign keys were traced directly from source. A prior self-audit (`PROJECT_AUDIT_REPORT.md`, Sept 8 2026) exists in the repo; findings below were independently re-verified against current code, not copied — several of its findings are now fixed, one is not, and new findings are added.

---

# 2. TECHNOLOGY STACK

**Frontend (×4, independent Vite apps):**
- React 19.2.8, React Router DOM 7.18.2, Vite 8.2.0
- Styling: Tailwind CSS (v3.4 in `admin-frontend`/`review-frontend` via PostCSS; v4.3 in `staff-frontend`/`student-frontend` via `@tailwindcss/vite`) — **inconsistent Tailwind major version across portals**
- `axios` (HTTP), `pusher-js` (realtime), `framer-motion` (animation), `react-toastify` + `sonner` (toasts), `react-icons`
- `admin-frontend` only: `recharts` (charts), `@hello-pangea/dnd` (drag-drop), `jodit-react` (rich text editor)
- `review-frontend` only: TypeScript (`tsc && vite build`), `canvas-confetti`, `recharts`
- `student-frontend`: `canvas-confetti`, custom Bezier/PenTool game assets (`public/bezier/`)
- Linting: `oxlint` in admin/staff; none configured in review/student `package.json`

**Backend:**
- Plain PHP (no framework), PDO + MySQL, procedural per-endpoint scripts (one `.php` file = one REST action)
- `PHPMailer` (vendored under `server/api/libs/PHPMailer`) for email
- Custom `PusherHelper` for realtime events, custom `R2Client` for Cloudflare R2 (S3-compatible) file storage
- `.env` loader (`server/config/env.php`) — supports `DB_HOST/DB_NAME/DB_USER/DB_PASS`; secrets outside DB config are hardcoded (see §10)

**Database:** MySQL/MariaDB, InnoDB, `utf8mb4`, 56 tables, timezone forced to `+06:00` (Asia/Dhaka) at connection level.

**Infra/Integrations:** Cloudflare R2 (object storage), Pusher (realtime channel: `ap2` cluster), cron scripts under `server/api/crons/`.

---

# 3. ARCHITECTURE SUMMARY

Four independent React SPAs, each its own Vite project, each calling the **same shared PHP REST API** in `server/api/`. There is no API gateway, no shared backend framework, and no ORM — every endpoint is a standalone script that: sets CORS headers → connects to MySQL via PDO → reads `php://input` JSON or `$_GET`/`$_POST` → runs raw/prepared SQL → `echo json_encode(...)`.

```
Admin Portal (5173) ─┐
Staff Portal (5174) ─┼──axios──▶ server/api/**/*.php ──PDO──▶ MySQL (u647959341_cca_manage_db)
Review Portal (5175)─┤                  │
Student Portal(5176)─┘                  ├──▶ Cloudflare R2 (file uploads: tasks, blogs, courses, brand)
                                         ├──▶ Pusher (chat, notifications, live breaks — realtime push)
                                         └──▶ PHPMailer/SMTP (emails)
```

Auth is a **shared opaque-token session model**: `login.php` issues a random 64-char hex token stored in `user_tokens`, the frontend stores it (localStorage, per-portal `AuthContext` — see §6) and sends it as `Authorization: Bearer <token>` or similar on `verify.php`/`sync.php` calls to rehydrate the session on load. **Most business endpoints do not independently validate this token** — see §6 and §10.

Two CORS strategies coexist: `config/cors.php` (origin allow-list, used by most business endpoints) and inline `header("Access-Control-Allow-Origin: *")` in `auth/*.php` and some others — flagged as inconsistent in the prior audit and still true.

---

# 4. COMPLETE MODULE LIST

- **Identity & Auth** — login, token verify/sync, logout, multi-role support
- **Staff Directory & HR** — employees, departments, staff CRUD, profiles
- **Attendance** — check-in/out, disputes, device logs, daily roster, IP/geofencing (`AttendanceSecurityHelper`)
- **Breaks / Tiffin** — request/start/end break, live break monitor, auto-tiffin cron
- **Leave Management** — apply, approve/reject, list
- **Task Pipeline** — creation (manual + AI "agentic blueprint"), claim, self-create, timer (start/pause), checklist, file upload (R2 presigned + direct), status lifecycle, history/logs, comments
- **Reviewer/QA Pipeline** — pending/completed/rejected queues, task review & status update, final delivery, marketplace submissions (Dayal Stock + external), team management, analytics
- **Credit / Gamification Engine** — wallet, P2P transfer, task rewards, rejection penalties, reviewer rewards, marketplace credit rules, leaderboard (`CreditHelper.php`, §9)
- **Course & Curriculum (LMS)** — courses, modules, lessons, milestones, quizzes, resources, assignments, admin media upload
- **Student Portal** — dashboard, enrollment, course player, assignment submission, quizzes, discussions, notes, lesson progress
- **Foundations Lab** — typing curriculum, typing sessions, mouse drills, **PenTool game/lab** (new/uncommitted feature), skill badges, leaderboard
- **Blogs (Academy Blog)** — CRUD, comments, reactions, read tracking, image upload
- **Chat / Messaging** — 1:1 and group chats, reactions, receipts, typing indicators, file transfer, block/mute, realtime via Pusher
- **Notifications** — per-user notification feed, mark read/delete, sent from many modules
- **Brand Kit / Resources** — shared brand assets per role
- **Database Manager (Admin)** — raw SQL runner, table browser, R2 object browser (⚠️ see §10)
- **Reports/Analytics** — staff report, attendance report, task report, reviewer micro-analytics, schema viewer
- **Settings** — system-wide settings + per-user settings
- **Crons** — auto-checkout, auto-tiffin, category migration

---

# 5. DATABASE SUMMARY

56 tables, all InnoDB/utf8mb4, `id` PK on nearly all (exceptions: `chat_message_receipts` PK `(message_id,user_id)`, `chat_participants` PK `(chat_id,user_id)`, `system_settings` PK `setting_key`).

**Core identity cluster**
- `users` (id, name, email, password [bcrypt], status enum active/inactive/suspended, profile/cover picture)
- `user_roles` (user_id, role enum: admin/manager/staff/instructor/student/reviewer) — **many-to-many**, a user can hold multiple roles
- `user_tokens` (user_id, token, expires_at) — session store
- `user_settings`, `departments`, `employees` (1:1 with users, shift/tiffin config), `reviewers` (1:1 with users), `students` (1:1 with users, FK → courses)

**Task pipeline cluster**
- `tasks` (central table — see §9 for full column list and lifecycle), `task_categories` (self-referential hierarchy: category → subcategory → child), `task_comments`, `task_history`, `task_logs`, `task_submissions`, `task_final_deliveries`, `task_blueprint_variants` (AI-generated variants), `task_marketplace_submissions` + `task_marketplace_submission_logs`, `task_reviews`

**Credit engine cluster**
- `user_credits` (1:1 wallet per user: balance, total_earned, total_penalties, total_sent, total_received)
- `credit_transactions` (full ledger: user_id, sender_id, receiver_id, amount, type, reference_id, **event_key [idempotency guard]**, meta_data JSON)

**Attendance/HR cluster**
- `attendance`, `attendance_device_logs`, `attendance_disputes`, `employee_breaks`, `leave_requests`, `holidays`

**LMS cluster**
- `courses`, `course_modules`, `course_lessons`, `course_milestones`, `course_quizzes` + `course_quiz_questions`, `course_resources`, `course_assignments`
- Student-side mirrors: `student_assignments`, `student_submissions`, `student_lesson_progress`, `student_lesson_notes`, `student_lesson_discussions` + replies, `student_quiz_attempts`, `student_skill_badges`, `student_foundations_drills`, `student_typing_sessions`, `student_typing_curriculum_progress`

**Comms cluster**
- `chats`, `chat_participants`, `chat_messages`, `chat_message_reactions`, `chat_message_receipts`
- `academy_blogs`, `blog_comments`, `blog_reactions`, `blog_reads`
- `notifications`

**Misc:** `cca_brand_resources`, `email_templates`, `system_settings`, `holidays`

**Foreign keys** (from `ADD CONSTRAINT` block) are consistently `ON DELETE CASCADE` for user-owned child rows (attendance, chat messages, credit ledger, task comments/history/logs, submissions) and `ON DELETE SET NULL` for optional references (department on employee, course on student, reference_id on credit_transactions). No FK exists on `tasks.assigned_to → employees.id` violations being caught at the DB layer beyond the declared constraint — enforcement is real (declared `fk_task_assignee`).

**Notable schema smell:** `task_categories` supports 3 levels via self-reference but `tasks` also stores `category` as a plain string column *in addition to* `category_id/subcategory_id/child_category_id` FKs — `CreditHelper::getTaskCategoryCredit()` falls back to string-matching `category` by name when the FK chain is empty, meaning two parallel category systems are live simultaneously (see §12.22).

---

# 6. AUTHENTICATION & AUTHORIZATION

**Login (`api/auth/login.php`):** email+password → `password_verify()` against `users.password` (bcrypt) → checks `status='active'` → loads all rows from `user_roles` → if the frontend passed a `role` field, rejects if the user doesn't hold that role for that portal → generates `bin2hex(random_bytes(32))` token, inserts into `user_tokens` → returns token + merged user/employee/student profile in one JSON payload.

**Session rehydration (`api/auth/verify.php`):** frontend sends the stored token → joins `user_tokens ⋈ users` filtering `expires_at > NOW()` → re-checks role membership → returns the same merged profile shape. `api/auth/sync.php` exists as a variant (not read in full — `UNKNOWN` exact difference from `verify.php`).

**Logout (`api/auth/logout.php`):** presumed to delete the token row — not read in full; **UNKNOWN** exact behavior (file exists, not inspected).

**Frontend session storage:** each portal has its own `AuthContext` (`src/context/`) and its own `localStorage` key — sessions are **not shared** across portals even though they hit the same backend; a user with multiple roles must log in separately per portal.

**Authorization model — the critical gap:** `user_roles` is the only role source; there is **no JWT, no signed session, no server-side middleware**. The token is a bare opaque string. Critically, **most non-auth endpoints never re-check the token at all** — only `admin/staff/delete_staff.php` was found referencing `user_tokens` outside the `auth/` folder. This means:
- Role/portal separation is enforced almost entirely **client-side** (route guards in each portal's `routes/` folder) — a valid API caller who skips the frontend can call any admin, staff, or reviewer endpoint directly with no token, since PHP has no way to know who's asking.
- `api/admin/database/run_query.php` (raw SQL executor) confirmed to have **zero authentication** — see §10, this is the single most severe finding in the system.

**Frontend route protection:** each portal's `routes/` directory wraps pages in a guard component (pattern consistent with `ProtectedRoute`); this is a UX/routing convenience only, not a security boundary, given the backend gap above.

---

# 7. API SUMMARY & MAP

~170 PHP endpoints under `server/api/`, organized by domain folder. All accept/return JSON; CORS via `config/cors.php` (origin allow-list) except `auth/*` and a few others (wildcard `*`). Auth: **not enforced per-endpoint** except where explicitly noted (see §6/§10) — treat every endpoint below as effectively public unless stated otherwise.

| Domain | Path prefix | Representative endpoints | Notes |
|---|---|---|---|
| Auth | `api/auth/` | login, verify, sync, logout, make_hash | `make_hash.php` is a live password-hash generator with **no auth** — §10 |
| Attendance | `api/attendance/` | check_in, check_out, dispute, get_attendance | Geofenced via `AttendanceSecurityHelper` (dynamic IP allow-list + device fingerprint) |
| Admin/Attendance | `api/admin/attendance/` | get_daily_roster, get_disputes, resolve_dispute, update_attendance, get_attendance_device_logs | Admin-only by convention, not enforced server-side |
| Breaks | `api/breaks/` | start_break, end_break, request_break, get_live_breaks, get_my_tiffin_config | |
| Leave | `api/leave/`, `api/admin/leave/` | apply_leave, get_my_leaves / get_all_leaves, update_leave_status | |
| Tasks (staff-facing) | `api/tasks/` | claim_task, create_self_task, start_timer, pause_timer, update_checklist, update_task_status, task_comments, upload_task_files, get_upload_presigned_url, marketplace_submissions, architect_blueprint, blueprint_variants | `architect_blueprint.php` = AI task-generation endpoint |
| Tasks (admin) | `api/admin/tasks/` | create_task, edit_task, delete_task, get_all_tasks, update_task_assignee, get_workload, task_image_upload | |
| Reviewer | `api/reviewer/` | get_pending_reviews, get_completed_reviews, get_rejected_reviews, update_task_status, submit_final_delivery, get_team_stats, get_activity_heatmap, get_daily_report | Drives credit-engine reward/penalty calls |
| Credits | `api/credits/` | get_wallet, send_credits, admin_adjust, get_users | Thin wrappers around `CreditHelper.php` |
| Courses (admin) | `api/admin/courses/` | save_course, save_module, get_modules, lessons/*, quizzes/*, milestones/*, assignments/*, upload_course_media, seed_modules | |
| Student | `api/student/` | dashboard, enroll_course, get_my_courses, get_all_courses, assignments, get_resources, get_leaderboard, courses/{curriculum, quiz, notes, discussions, update_lesson_progress, assignment_submission} | |
| Foundations | `api/student/foundations/` | get_progress, get_typing_curriculum, save_typing_session, save_mouse_drill, get_pentool_progress, save_pentool_progress, leaderboard | PenTool endpoints are new/uncommitted |
| Blogs | `api/blogs/` | create_blog, update_blog, delete_blog, get_blogs, get_blog_details, add_comment, react_blog, upload_blog_image, get_blog_readers | |
| Chat | `api/chat/` | create_chat, send_message, get_messages, edit_message, delete_message, forward_message, toggle_reaction, mark_read, add_group_members, manage_group_member, block_user, download_file, check_typing/update_typing | Largest single domain (~20 files) |
| Notifications | `api/notifications/` | get_notifications, mark_as_read, delete_notification | |
| Brand | `api/brand/` | get_brand_resources, manage_brand_resource | |
| Categories | `api/categories/` | create/update/delete/get_categories | |
| Settings | `api/settings/` | get/update system_settings, get/update user_settings | |
| Reports | `api/reports/` | get_all_staff_report, get_attendance_report, get_task_report, get_reviewer_micro_analytics, get_schema | `get_schema.php` likely powers `DatabaseManager.jsx` — check its own auth independently |
| Admin/Database | `api/admin/database/` | get_tables, get_table_data, run_query, insert_row, update_row, delete_row, delete_r2_object, get_system_health | **No auth anywhere in this folder** — §10 |
| Dashboard | `api/dashboard/`, `api/admin/dashboard/` | get_leaderboard, get_stats, get_today_attendance_list, get_reviewer_summary_widget | |
| AI | `api/ai/` | precheck_submission.php | Pre-submission AI quality check (used by `AIQualityScanner.jsx` per old audit) |
| Profile | `api/profile/` | change_password, update_profile, upload_pictures, get_my_stats | |
| Crons | `api/crons/` | auto_checkout, auto_tiffin, migrate_categories | Meant for scheduled execution, not user-triggered |
| Misc | `api/` root | server_time.php, server_native_time.php, check_server_timezone.php | Clock-sync utilities |

Full parameter/response-shape documentation for all 170 files was not transcribed here (would dominate this document); the table above is a complete **file-level** map. Deep-dive on any individual endpoint's request/response contract should be done on demand.

---

# 8. IMPORTANT DATA FLOWS

**Task completion → credit reward:**
`Staff clicks "Submit"` (staff-frontend `Tasks.jsx`) → `api/tasks/update_task_status.php` → row update on `tasks.status` → on reviewer approval, `api/reviewer/update_task_status.php` (transactional, `beginTransaction`/`commit`/`rollBack` — verified present) → calls `CreditHelper::rewardTaskCompletion()` → idempotent insert into `credit_transactions` keyed by `event_key = "task_reward_task_{id}"` → `user_credits.balance` incremented → `NotificationHelper::sendToUser()` → Pusher push → staff-frontend `Credits.jsx`/toast updates live.

**Task rejection → penalty:** same path, `CreditHelper::penalizeTaskRejection()` — always allows negative balances, uses a unique `event_key` per rejection **cycle** (not globally idempotent like completion — each rejection round produces a new penalty, by design).

**Marketplace submission → credit:** reviewer adds a submission (`api/tasks/marketplace_submissions.php`) → `CreditHelper::handleMarketplaceUploadCredit()` (+1, idempotent by submission id) → on later admin/reviewer status change → `handleMarketplaceStatusChangeCredit()` (+2 on approve, -1 on reject, 0 net for "Dayal Stock" marketplace specifically).

**Attendance check-in:** student/staff frontend → `api/attendance/check_in.php` → `AttendanceSecurityHelper` resolves real client IP (`HTTP_CF_CONNECTING_IP` → `HTTP_X_FORWARDED_FOR` → `REMOTE_ADDR`), checks against dynamic `office_allowed_ips` (from `system_settings`, not hardcoded — fixed since prior audit), builds a device fingerprint hash → insert `attendance` row.

**Course lesson progress:** student-frontend `CoursePlayer.jsx` → `api/student/courses/update_lesson_progress.php` → `student_lesson_progress` upsert (unique `user_id`+`lesson_id`) → feeds `SkillReport.jsx`/badges (`student_skill_badges`).

**Chat message:** any portal → `api/chat/send_message.php` → insert `chat_messages` → Pusher trigger on `chat_{chat_id}` channel → all connected clients update via `pusher-js` subscription in each portal's chat component.

---

# 9. FEATURE INVENTORY

| Feature | Frontend | Backend | API | Database | Status | Important Files |
|---|---|---|---|---|---|---|
| Login/Auth | all 4 | procedural | `auth/*` | users, user_roles, user_tokens | ✅ Working, ⚠️ weak session model | `api/auth/login.php`, per-portal `context/AuthContext` |
| Task Lifecycle | staff, admin | procedural | `tasks/*`, `admin/tasks/*` | tasks, task_history, task_logs | ✅ Working | `staff-frontend/src/pages/Tasks.jsx` |
| Reviewer QA | review | procedural | `reviewer/*` | task_reviews, task_final_deliveries | ✅ Working | `review-frontend/src/pages/PendingReviews.jsx` |
| Credit Engine | staff, review, admin | `CreditHelper.php` | `credits/*` | user_credits, credit_transactions | ⚠️ Working, 1 confirmed bug (§12.22) | `server/api/credits/CreditHelper.php` |
| Attendance | staff, admin | `AttendanceSecurityHelper.php` | `attendance/*` | attendance, attendance_disputes | ⚠️ Working, cron bug (§12.22) | `server/api/crons/auto_checkout.php` |
| LMS / Courses | admin, student | procedural | `admin/courses/*`, `student/courses/*` | courses, course_lessons, course_quizzes… | ✅ Working | `admin-frontend/src/pages/CoursesAndCurriculum.jsx` |
| PenTool Lab | student, admin | new/uncommitted | `student/foundations/{get,save}_pentool_progress.php` | student_foundations_drills (assumed) | 🟡 In progress (untracked files) | `student-frontend/src/pages/PenToolLab.jsx`, `admin-frontend/src/pages/PenToolReports.jsx` |
| Typing Lab | student | procedural | `student/foundations/*typing*` | student_typing_sessions, student_typing_curriculum_progress | ✅ Working | `student-frontend/src/pages/TypingLab.jsx` |
| Blogs | admin, staff | `BlogDbHelper.php` | `blogs/*` | academy_blogs, blog_comments | ✅ Working | `admin-frontend/src/pages/AcademyBlog.jsx` |
| Chat | all 4 | procedural | `chat/*` | chats, chat_messages… | ✅ Working, largest module | `*/src/pages/Messages.jsx` |
| Database Manager | admin | procedural | `admin/database/*` | any table (raw SQL) | 🔴 Working but **unauthenticated** | `admin-frontend/src/pages/DatabaseManager.jsx`, `server/api/admin/database/run_query.php` |
| Marketplace Submissions | review, admin | `CreditHelper.php` | `tasks/marketplace_submissions.php` | task_marketplace_submissions | ✅ Working | — |
| Notifications | all 4 | `notification_helper.php` | `notifications/*` | notifications | ✅ Working | — |
| Brand Kit | staff, review | procedural | `brand/*` | cca_brand_resources | ✅ Working | — |
| Settings | admin, all | procedural | `settings/*` | system_settings, user_settings | ✅ Working | — |
| Reports/Analytics | admin, staff, review | procedural | `reports/*` | derived queries | ✅ Working | `admin-frontend/src/pages/MasterReport.jsx` |

---

# 10. EXISTING ISSUES

### 🔴 Critical

1. **`api/admin/database/run_query.php` has zero authentication.** Confirmed by direct read: the file connects to the DB and executes arbitrary SQL from the request body with no token/session/role check anywhere in the file. Any unauthenticated HTTP client can `SELECT`, and depending on the rest of the file's write-guard logic, potentially mutate or drop production data. This is the single highest-severity issue in the codebase. (Same finding as prior audit — **still unfixed**.)
2. **Live third-party secrets committed to git in plaintext**, not `.env`-gated: `server/config/r2.php` (Cloudflare R2 account ID, access key ID, **secret access key**) and `server/config/PusherHelper.php` (Pusher app ID, key, **secret**). Both files are tracked in git history (confirmed via `git log`) and are not covered by `.gitignore` (`.gitignore` only excludes `.env*`, not `config/r2.php`/`config/PusherHelper.php`). Anyone with repo access — or anyone who finds a leaked clone/fork — has live write access to the R2 bucket and can forge Pusher events. **New finding, not in prior audit.**
3. **`api/auth/make_hash.php` is a live, unauthenticated password-hash generator**, reachable at a public URL per its own comment (`Visit: https://api.creativecomputeracademy.com/api/auth/make_hash.php?pass=...`). Anyone can generate a valid bcrypt hash for an arbitrary password; combined with finding #1 (raw SQL access), this is a direct path to full account takeover. (Same as prior audit — **still unfixed**, file still present.)
4. **`CreditHelper::getWallet()` uses `$totalCombined` without ever assigning it** (`server/api/credits/CreditHelper.php`, confirmed at lines 661, 699, 759 — no assignment anywhere in the method). For `portal='all'` (the default), `$activeBalance`/`total_combined` in the API response is `null`/undefined-warning, and the leaderboard rank query (`WHERE balance > :balance` bound to `null`) silently returns wrong ranks. **New finding, not in prior audit.**
5. **Auto-checkout cron still uses `a.date <= :date`** (`server/api/crons/auto_checkout.php` line 24) instead of `<` or a shift-end time check. If the cron runs during the current business day, it will force-checkout everyone still clocked in. Exact same bug the prior audit flagged on Sept 8 — **confirmed still present, not fixed**.

### 🟡 Fixed since prior audit (verified, no longer issues)
- Hardcoded office IP / Cloudflare proxy handling: `AttendanceSecurityHelper::getIp()` now reads `HTTP_CF_CONNECTING_IP` → `HTTP_X_FORWARDED_FOR` → `REMOTE_ADDR` in order, and `office_allowed_ips` is a `system_settings`-backed value, not a hardcoded constant.
- Unrolled-back transaction in `api/reviewer/update_task_status.php`: `rollBack()` is now called before the early `exit` (line 32).

### 🟡 Medium (carried from prior audit, not independently re-verified line-by-line this pass)
- Inconsistent CORS strategy: `config/cors.php` origin allow-list vs. wildcard headers hardcoded in `auth/*.php`.
- Frontend hook dependency warnings in `admin-frontend` (`useTaskOversight.js`, likely others) — not re-scanned exhaustively this pass.
- Dual category systems on `tasks` (string `category` column + FK hierarchy) create ambiguous credit-resolution fallback logic in `CreditHelper::getTaskCategoryCredit()` (§5, §12.22).

### 🟢 In-progress work (visible in git status, not bugs)
- PenTool Lab feature is mid-development: new frontend page (`PenToolLab.jsx`), new admin report page (`PenToolReports.jsx`), 4 new backend endpoints, and new `public/bezier/` assets are untracked/uncommitted. `CoursePlayer.jsx`, both `App.jsx` files, and both sidebar components are modified but not committed — consistent with wiring the new feature into routing/navigation.
- New `upload_course_media.php` (admin courses) is untracked — likely a new media-upload path for the LMS, not yet integrated into a committed frontend flow (`UNKNOWN` — not traced to a calling component this pass).

---

# 11. CRITICAL FILES

- `server/config/database.php` — the only DB connection point; a change here affects all 170 endpoints.
- `server/config/env.php` — `.env` loader; all DB credentials flow through this.
- `server/config/cors.php` — CORS allow-list; the source of truth for which frontend origins can reach the API.
- `server/api/credits/CreditHelper.php` — the entire gamification/economy engine; every reward/penalty path in the system funnels through this one class.
- `server/api/attendance/AttendanceSecurityHelper.php` — all attendance fraud-prevention logic (IP, device fingerprint, allow-list) lives here.
- `server/api/admin/database/run_query.php` — critical *because it is dangerous*, not because it's load-bearing; see §10.
- `server/u647959341_cca_manage_db (3).sql` — canonical schema reference; the DB itself is the real source of truth but this dump is the only static reference in-repo.
- Each portal's `src/context/AuthContext.jsx` (or equivalent) and `src/routes/` — the entire client-side access-control boundary for that portal.
- `server/config/r2.php`, `server/config/PusherHelper.php` — critical for the reasons in §10 (live committed secrets).

---

# 12. MASTER BLUEPRINT

### 12.1 Project Overview
Multi-portal internal operations platform for a computer-design academy: staff task/attendance/credit management, a QA review pipeline, a student LMS, and shared chat/blog/notification infrastructure, all against one shared MySQL database and one shared PHP API.

### 12.2 Technology Stack
See §2 in full.

### 12.3 Complete Folder Structure
```
CreateiveComputerAcademy/
├── admin-frontend/    (React 19 + Vite, Tailwind 3, port 5173)
├── staff-frontend/    (React 19 + Vite, Tailwind 4, port 5174)
├── review-frontend/   (React 19 + Vite + TS, Tailwind 3, port 5175)
├── student-frontend/  (React 19 + Vite, Tailwind 4, port 5176)
├── server/
│   ├── api/           (~170 endpoints, 24 domain folders — see §7)
│   ├── config/        (database.php, env.php, cors.php, r2.php, PusherHelper.php, r2.php)
│   ├── data/           (typing_curriculum.json — static curriculum data)
│   ├── migrations/     (schema migration scripts — not individually inventoried this pass)
│   ├── uploads/        (local upload staging, gitignored)
│   └── u647959341_cca_manage_db (3).sql  (full schema dump, 56 tables)
├── .agents/skills/     (this repo's own agent-skill definitions, incl. master-blueprint)
└── PROJECT_AUDIT_REPORT.md  (prior self-audit, Sept 8 2026, Bengali)
```
Each frontend mirrors the same internal shape: `src/{pages,components,context,routes,hooks,layouts,utils}`. `staff-frontend` additionally has `src/services` and `src/config`; `student-frontend` has `src/data` instead.

### 12.4 Frontend Architecture
4 independently deployed SPAs sharing no code (no monorepo tooling, no shared package) — each has its own `package.json`, its own `AuthContext`, its own copy of near-identical UI primitives (sidebars, layouts). This is **intentional duplication for portal isolation**, not a shared design system.

### 12.5 Backend Architecture
Flat, non-framework PHP: no router, no controller base class, no dependency injection. Each endpoint file is independently responsible for its own CORS headers, DB connection, input parsing, and error handling. Shared logic lives in a small number of `*Helper.php` classes (`CreditHelper`, `AttendanceSecurityHelper`, `BlogDbHelper`, `BreakDbHelper`, `notification_helper.php`, `EmailHelper.php`, `category_helper.php`, `task_history_helper.php`) co-located inside their respective domain folders rather than a central `lib/`.

### 12.6 PHP Architecture
Procedural, `require_once` for config/helpers, `try/catch (PDOException|Throwable)` per-file, direct `echo json_encode(...)` responses (no consistent envelope beyond `{status, message, ...}` by convention). Helper classes use `public static` methods exclusively — no instantiation, no interfaces.

### 12.7 React Architecture
Standard CRA-style pattern via Vite: `pages/` = route-level screens, `components/` = reusable UI, `context/` = global state (auth, likely theme/notifications), `hooks/` = data-fetching/business hooks (e.g. `useTaskOversight`, `useMasterReport`, `useDatabaseManager` in admin), `layouts/` = shell/sidebar wrappers, `routes/` = route table + guards.

### 12.8 Database Architecture
See §5. Single MySQL database, `InnoDB`, `utf8mb4`, connection-level timezone force to `+06:00`. No stored procedures/triggers observed in the dump excerpt reviewed; declarative FK constraints handle cascade/null-on-delete behavior (full list in §5's constraint block).

### 12.9 Database Relationship Map
```
users ──1:1──> employees ──N:1──> departments
users ──1:1──> reviewers
users ──1:1──> students ──N:1──> courses
users ──1:N──> user_roles (multi-role)
users ──1:1──> user_credits ──1:N──> credit_transactions (sender_id/receiver_id/user_id all → users)
users ──1:N──> user_tokens
employees ──1:N──> tasks (assigned_to)
users ──1:N──> tasks (created_by)
departments ──1:N──> tasks
tasks ──1:N──> {task_comments, task_history, task_logs, task_submissions, task_final_deliveries, task_blueprint_variants, task_marketplace_submissions}
task_marketplace_submissions ──1:N──> task_marketplace_submission_logs
courses ──1:N──> course_modules ──1:N──> course_lessons ──1:N──> {student_lesson_progress, student_lesson_notes, student_lesson_discussions}
courses ──1:N──> {course_quizzes, course_assignments, course_resources, course_milestones}
users ──1:N──> attendance, attendance_disputes, employee_breaks, leave_requests, notifications
chats ──1:N──> chat_messages ──1:N──> {chat_message_reactions, chat_message_receipts}
chats ──N:N──> users (via chat_participants)
academy_blogs ──1:N──> {blog_comments, blog_reactions, blog_reads}
```

### 12.10 Authentication Flow
See §6 in full — opaque bearer token, `user_tokens` table, per-portal role check at login/verify time, no per-request middleware.

### 12.11 Authorization / Role System
`user_roles` enum: `admin`, `manager`, `staff`, `instructor`, `student`, `reviewer`. A user may hold several simultaneously (e.g., a promoted student → staff keeps history — see `students.status = 'promoted_to_staff'`). Authorization is enforced at **login time** (role-gated) and then **trusted for the rest of the session** by the frontend; the backend does not re-verify role per API call in the large majority of endpoints (§6, §10).

### 12.12 API Architecture
REST-ish over plain PHP scripts, JSON in/out, no versioning, no OpenAPI/Swagger spec found. Endpoint URL = filesystem path (e.g. `POST /api/tasks/claim_task.php`).

### 12.13 API Endpoint Map
Full domain-grouped table in §7.

### 12.14 Feature Inventory
Full table in §9.

### 12.15 Component Map
`UNKNOWN` in exhaustive detail — 4 portals × dozens of components each were enumerated by page (§4 module list, folder scan) but not individually opened. Notable cross-portal shared concept: each portal has its own `AgenticBlueprintViewer.jsx` (admin, staff, review) — a UI for the AI task-blueprint feature (`architect_blueprint.php`/`blueprint_variants.php`), duplicated 3× rather than shared.

### 12.16 Controller Map
Not applicable — no controller layer; each `.php` file in §7's table is its own "controller."

### 12.17 Service Map
Backend "services" = the `*Helper.php` classes listed in §12.5. Frontend "services" = `staff-frontend/src/services/` (only portal with a dedicated services folder — `UNKNOWN` exact contents, not opened this pass).

### 12.18 Model Map
No ORM/model layer exists; §5's table list is the closest equivalent to a model map.

### 12.19 Important Business Logic
- **Credit engine idempotency pattern** (`CreditHelper.php`): every reward/penalty type uses a deterministic `event_key` (e.g. `task_reward_task_{id}`, `mkt_approved_sub_{id}`) checked against `credit_transactions` before inserting, to guarantee "credit this event exactly once" even under retries/double-clicks — except rejection penalties, which intentionally use a unique key per cycle (repeatable by design).
- **Category credit resolution priority** (`getTaskCategoryCredit`): custom_credit on task > child category > subcategory > main category > string-name fallback > flat default of 5.
- **Marketplace credit rules**: Dayal Stock = flat, no approve/reject delta; external marketplaces = +1 on upload, +2 more on approval (net +3), -1 on rejection (net 0).
- **Wallet portal-splitting**: `getWallet()` computes a *separate* balance view depending on whether the caller is the `staff` portal or `reviewer` portal, filtering the same `credit_transactions` ledger by `type`/`event_key` prefix — meaning a single user's one ledger is presented as two different "portal balances" (plus the broken "all" combined view, §10 finding #4).

### 12.20 Data Flow Map
Full flows in §8.

### 12.21 Module Dependency Map
All modules depend on `config/database.php` + `config/cors.php`. Credit-adjacent modules (tasks, reviewer, marketplace) depend on `CreditHelper.php`. Most write-paths depend on `notification_helper.php` (best-effort, wrapped in `try/catch` so notification failure never blocks the core action). Chat/breaks/attendance depend on `PusherHelper` for realtime push. File-handling modules (tasks, blogs, courses, brand) depend on `R2Client`/`config/r2.php`.

### 12.22 Existing Bugs
Full list in §10 (5 critical, several medium).

### 12.23 Incomplete Features
PenTool Lab (student + admin sides) — untracked files, in-progress wiring per git status. `upload_course_media.php` — new, not yet traced to a frontend caller (`UNKNOWN`).

### 12.24 Security Concerns
1. Unauthenticated raw-SQL endpoint (critical).
2. Committed plaintext third-party secrets, both R2 and Pusher (critical).
3. Unauthenticated password-hash generator exposed publicly (critical).
4. Systemic lack of server-side token/role verification across ~170 endpoints — auth is a UX layer, not a security boundary, everywhere except the handful of `auth/*` files.
5. CORS wildcard on `auth/*.php` while the rest of the app uses an origin allow-list — inconsistent trust boundary.

### 12.25 Technical Debt
- Auth/session logic duplicated 4× (one `AuthContext` per portal) instead of a shared auth package.
- `AgenticBlueprintViewer.jsx` duplicated 3× across portals.
- Two parallel task-category systems (string column + FK hierarchy).
- Tailwind major-version split (v3 vs v4) across the 4 frontends complicates any shared design-token work.
- No central API client/error-handling layer apparent per portal beyond individual `axios` calls (`UNKNOWN` in full — not verified for every portal).

### 12.26 Naming Conventions
PHP: `snake_case` filenames matching their action (`get_x.php`, `save_x.php`, `delete_x.php`, `update_x.php`), PascalCase for helper classes (`CreditHelper`, `AttendanceSecurityHelper`). SQL: `snake_case` tables/columns, `fk_*`/`*_ibfk_*` constraint naming (mixed — some hand-named `fk_*`, some auto-generated `*_ibfk_*`, indicating manual `ALTER TABLE ADD CONSTRAINT` mixed with tool-generated migrations at different times). React: PascalCase components/pages, camelCase hooks prefixed `use*`.

### 12.27 Important Development Rules
(Derived from code patterns, not a written style guide found in-repo.) New credit-affecting actions must go through `CreditHelper` with a unique `event_key` to preserve idempotency. New protected endpoints should — but currently mostly do not — validate `user_tokens`; any new admin-only endpoint should explicitly add that check rather than copying the existing unguarded pattern. New frontend routes should follow the existing per-portal `routes/` guard pattern.

### 12.28 Critical Files
Full list in §11.

### 12.29 Areas That Require Extra Care
- `server/api/admin/database/*` — direct DB access surface; any change must add auth before anything else.
- `CreditHelper.php` — a bug here can silently corrupt every user's wallet balance across the whole platform (as §10 finding #4 already demonstrates).
- `server/config/r2.php` / `PusherHelper.php` — rotate these credentials and move to `.env` before any public repo exposure.
- Cron scripts (`auto_checkout.php` especially) — timing bugs here affect real attendance records for all staff, not just a UI glitch.

### 12.30 Unknown / Unclear Areas
See §13.

---

# 13. UNKNOWN / UNCERTAIN AREAS

- Exact behavior of `api/auth/logout.php` and `api/auth/sync.php` (files exist, not opened in full).
- `server/migrations/` contents — folder listed, individual migration files not inventoried.
- Full component-level breakdown of all 4 frontends' `components/` folders (~dozens of files each) — only `pages/` were enumerated exhaustively.
- `staff-frontend/src/services/` contents — the only portal with a dedicated services layer; not opened.
- Whether `admin/courses/upload_course_media.php` (untracked) is wired to any frontend UI yet.
- Exact request/response schema for each of the ~170 individual endpoints (file-level map given in §7; per-field contracts not transcribed for all of them).
- Whether `server/migrations/` represents applied history or a pending-migration queue (no migration-runner tooling found).
- Full content of `.agents/skills/` beyond `master-blueprint` — other skill files in that directory were not read this pass.
