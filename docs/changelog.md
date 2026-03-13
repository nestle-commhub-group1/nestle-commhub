# Changelog — Nestlé CommHub

All notable changes to this project will be documented here.
Format: `## [Date] - [Sprint Number]` → `### Added / Changed / Fixed / Removed`

---

## [13 March 2026] - Sprint
### Changed
- Deleted `retailer-portal/` and `management-dashboard/` folders from the repo
- Created single unified PWA in `app/` folder (React + Vite)
- Installed dependencies: `react-router-dom`, `vite-plugin-pwa`, `tailwindcss`, `postcss`, `autoprefixer`
- Configured Tailwind CSS (`tailwind.config.js`, `postcss.config.js`, directives in `src/index.css`)
- Configured `vite-plugin-pwa` with Nestlé brand colours (theme `#3D2B1F`, background `#ffffff`)
- Set up React Router in `App.jsx` with role-based protected routes (retailer, staff, manager, admin, distributor)
- Created `AuthContext.jsx` for JWT and user state management
- Created `ProtectedRoute.jsx` for role-based route protection
- Created placeholder pages for all role-based routes

---

## [11 March 2026] - Pre-Sprint
### Changed
- Both `retailer-portal` and `management-dashboard` upgraded to PWAs
- Added `vite-plugin-pwa` to both frontend apps
- PWA decision replaces the need for React Native
- Team task responsibilities confirmed and reassigned:
  - **Ryan** takes Ticket System (`TKT-01`–`TKT-12`, `SLA-01`–`SLA-03`, `INF-04`) — previously Ganidu
  - **Ganidu** takes Management Dashboard UI (`STF-01`–`STF-05`, `MGR-01`–`MGR-06`, `ADM-01`–`ADM-08`, `BRD-01`–`BRD-03`) — previously Ryan
  - **Thihas** — Backend, Auth & Infrastructure (`INF-01`–`INF-03`, `INF-05`, `AUTH-01`–`AUTH-06`)
  - **Kavinda** — Retailer Portal (`RET-01`–`RET-08`, `BOT-01`–`BOT-04`, `NOT-04`)

