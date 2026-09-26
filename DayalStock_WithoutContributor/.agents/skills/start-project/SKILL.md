---
name: start-project
description: Use this skill when the user asks to "start the project" or "run servers".
---

# Start the project

When the user asks you to start the project or run servers, you must run the following 3 React apps in the background:

1. `User` using `npm run dev`
2. `Admin` using `npm run dev -- --port 5174`
3. `Contributor` using `npm run dev -- --port 5175`

Note: The backend is in the 'Server' folder (PHP).

## After Starting the Servers

After all servers are running, you MUST do the following:

1. **Read the full codebase** — Explore all major folders: `User/src`, `Admin/src`, `Contributor/src`, and `Server/`.
2. **Understand the project** — Figure out:
   - What the overall project is (its name, purpose, goal)
   - What each frontend app does (User, Admin, Contributor)
   - What the backend PHP API does (key endpoints, folders)
   - Key features and functionality implemented so far
3. **Give the user a clear summary** — After reading the codebase, present a friendly summary to the user covering:
   - 📌 Project overview & goal
   - 🖥️ What each app (User, Admin, Contributor) does
   - 🔧 Backend API overview
   - ✅ Key features already built
   - 🚀 Running URLs for each app
   - 💡 Any observations, suggestions, or potential improvements you noticed