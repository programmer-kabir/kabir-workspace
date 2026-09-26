---
name: start-project
description: Use this skill when the user asks to "start the project" or "run servers".
---

# Start the project

When the user asks you to start the project or run servers, you must run the following 4 React apps in the background:

1. `admin-frontend` using `npm run dev`
2. `staff-frontend` using `npm run dev -- --port 5174`
3. `review-frontend` using `npm run dev -- --port 5175`
4. `student-frontend` using `npm run dev -- --port 5176`

Note: The backend is in the 'Server' folder (PHP).

## After Starting the Servers

After all servers are running, you MUST do the following:

1. **Read the full codebase** — Explore all major folders: `admin-frontend/src`, `staff-frontend/src`, `review-frontend/src`, `student-frontend`, and `server/`.
2. **Understand the project** — Figure out:
   - What the overall project is (its name, purpose, goal)
   - What each frontend app does (admin, staff, review)
   - What the backend PHP API does (key endpoints, folders)
   - Key features and functionality implemented so far
3. **Give the user a clear summary** — After reading the codebase, present a friendly summary to the user covering:
   - 📌 Project overview & goal
   - 🖥️ What each app (admin/staff/review) does
   - 🔧 Backend API overview
   - ✅ Key features already built
   - 🚀 Running URLs for each app
   - 💡 Any observations, suggestions, or potential improvements you noticed