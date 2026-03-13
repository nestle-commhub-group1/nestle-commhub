# Technical Decision Log — Nestlé CommHub

Documents **why** architectural and implementation decisions were made.
New entries are appended at the top.

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

