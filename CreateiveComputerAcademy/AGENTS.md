# Creative Computer Academy (CCA) — Agent Directives & Project Rules

## 1. Full Autonomous Permissions & Authority
- **User Grant**: The project owner/admin has explicitly granted full permission and autonomous execution authority for this workspace (`CreateiveComputerAcademy`).
- **No Redundant Confirmation**: Do not repeatedly pause or ask the user for permission to read files, run terminal commands, edit existing files, start/stop dev servers, create migrations, or update documentation. Proceed directly with execution.
- **Execution Mandate**: When given a feature request, bug fix, or instruction, proceed end-to-end to research, implement, verify, and report results concisely.

## 2. Core Workspace Ports & Environments
- **Admin Frontend**: `http://localhost:5173/` (`admin-frontend`, `npm.cmd run dev -- --port 5173`)
- **Staff Frontend**: `http://localhost:5174/` (`staff-frontend`, `npm.cmd run dev -- --port 5174`)
- **Reviewer Frontend**: `http://localhost:5175/` (`review-frontend`, `npm.cmd run dev -- --port 5175`)
- **Student Frontend**: `http://localhost:5176/` (`student-frontend`, `npm.cmd run dev -- --port 5176`)
- **Backend API**: PHP REST API on Apache (`server/api/`) connecting to MySQL `u647959341_cca_manage_db`.

## 3. Architecture & Development Guidelines
1. **Self-Healing JIT Schema**:
   Always use helper self-healing schema methods (e.g., `EventDbHelper::ensureSchema($db)`, `BreakDbHelper::ensureSchema($db)`) so newly added tables or columns auto-create on Hostinger production with zero manual migrations.
2. **Role & Privileges (Developer & Admin)**:
   - Developer (`developer`) role is a superuser with equal or superior access to Admin on all endpoints and tools.
   - Any feature enabled for Admin must also allow Developer role (`verifyDeveloperAccess` or `canManage`).
   - In Staff Portal, developer tools must be separate standalone single pages under `/developer/*` (no bloated horizontal tab bars).
3. **Authentication Token Precedence**:
   Always support both `cca_token` and `cca_admin_token` via `getAuthToken()` in shared components and pages.
4. **Bilingual Requirement**:
   Any UI addition in Staff Portal must maintain both English (`en`) and Bengali (`bn`) labels in `src/context/LanguageContext.jsx`.
5. **Smallest Correct Change**:
   Make minimal, surgical edits. Preserve all existing comments, docstrings, and working business logic.

