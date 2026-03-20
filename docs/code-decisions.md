# Technical Decision Log — Nestlé CommHub

Documents **why** architectural and implementation decisions were made.
New entries are appended at the top.

---

## Startup Orchestration — run.sh Script
**Date:** 19 March 2026

**What it does:** A single bash script at the project root (`./run.sh`) kills any stale processes on ports 5001 and 5173, runs `npm install` for both apps, starts the backend in the background, waits for it to initialize, then starts the frontend. Prints a summary of live URLs on success.

**Why we built it:** On macOS, VSCode terminals and manual `cd`/`npm run dev` sequences were causing port conflicts and inconsistent startup order (frontend trying to contact backend before it was ready). A single deterministic script eliminates all of these issues.

**Alternatives considered:**
- **`concurrently` npm package** — Rejected. Adds a dependency; requires both apps to be in the same `package.json`. Our backend and frontend are in separate directories.
- **`npm-run-all`** — Same issue as `concurrently`.
- **Docker Compose** — Rejected. Overkill for a student project; adds environment complexity.

---

## Dev Server — nodemon over node --watch
**Date:** 19 March 2026

**What it does:** The `backend` dev script (`npm run dev`) uses `nodemon` instead of Node's built-in `--watch` flag.

**Why:** `node --watch` is still experimental and was silently hanging without restarting on some file change events, making backend development unreliable. `nodemon` is the established, battle-tested solution with consistent behaviour across Node versions.

**Change made:** `backend/package.json` `dev` script changed from `node --watch src/index.js` → `nodemon src/index.js`. `nodemon ^3.1.9` added to `devDependencies`.

---

## UI Pattern — Role-Specific Layout Components
**Date:** 19 March 2026

**What it does:** Each user role has its own layout wrapper component (`RetailerLayout`, `StaffLayout`, `AdminLayout`, `ManagerLayout`) that contains the sidebar, notification panel, and mobile topbar. Dashboard pages render inside the layout via `{children}`.

**Why:** Keeps the sidebar and notification logic completely separate from page content. Each role requires a different navigation structure, badge colour, and notification set — embedding these in individual page files would cause massive duplication.

**How it works:**
- Dashboard page wraps all its content in `<AdminLayout>` / `<ManagerLayout>` etc.
- The layout reads the user from `localStorage` to populate the sidebar avatar and name.
- Logout is handled inside the layout so all pages in that role get it for free.

**Alternatives considered:**
- **Single `DashboardLayout` with props** — Considered but rejected. The differences between roles (nav links, badge colours, notification content) are significant enough that one generic layout with many conditionals would be harder to read and maintain than separate role layouts.

---


## State Management — React Context API
**Date:** 13 March 2026

**What it does:** `AuthContext.jsx` provides global auth state (`user`, `token`, `isAuthenticated`) to all components in the app without prop drilling.

**Why we chose it:** The app only needs global state for authentication. React Context is built in and sufficient for this use case — no need for Redux or Zustand at this scale.

**How it works:**
- `AuthProvider` wraps the entire app in `App.jsx`
- Any component calls `useAuth()` to read or update auth state
- JWT and user object are persisted in `localStorage` so the session survives page refreshes

**Alternatives considered:**
- **Redux** — Rejected. Overkill for auth-only global state; adds unnecessary boilerplate.
- **Prop drilling** — Rejected. Becomes unmanageable across deeply nested components.

---

## Routing Strategy — React Router with Role-Based Protected Routes
**Date:** 13 March 2026

**What it does:** React Router manages all navigation inside the single PWA. `ProtectedRoute.jsx` wraps every dashboard route and checks two things — is the user authenticated, and does their role match the route they are trying to access.

**Why we built it this way:** With five different roles all using the same app, we need a reliable way to ensure each user only sees their own dashboard. Centralising this logic in one `ProtectedRoute` component means we only maintain it in one place.

**How it works:**
- `AuthContext` stores the JWT and user object globally
- `ProtectedRoute` reads the role from `AuthContext`
- If not authenticated → redirect to `/login`
- If wrong role → redirect to `/unauthorized`
- If correct → render the requested page

**Alternatives considered:**
- **Separate apps per role** — Rejected. Would recreate the two-app duplication problem we just eliminated.
- **Conditional rendering in `App.jsx`** — Rejected. Would make `App.jsx` unmanageable as the number of routes and roles grows.

**Dependencies:** `react-router-dom`

---

## Architecture — Progressive Web App (PWA)
**Date:** 11 March 2026

**What it does:** Both `retailer-portal` and `management-dashboard` are built as PWAs using Vite + `vite-plugin-pwa`.

**Why:** Retailers operate in the field on poor mobile connections in Sri Lanka. A PWA allows installation on the phone directly from the browser (no app store), supports offline use via service workers, and delivers push notifications natively — all without maintaining a separate mobile codebase. Directly satisfies NFR-1.1.

**Alternatives considered:**
- **React Native** — Rejected. Requires a separate codebase, separate build pipeline, and app store submission for each platform.
- **Regular web app** — Rejected. No offline support, no mobile home-screen install, no push notifications.

**Dependencies:** `vite-plugin-pwa` added to both `retailer-portal` and `management-dashboard`.

**Known limitations:**
- Requires HTTPS in production (Netlify or Vercel).
- PWA features (especially push notifications and install prompts) are more limited on iOS Safari compared to Android Chrome.

