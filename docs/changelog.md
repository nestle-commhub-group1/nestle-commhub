# Changelog — Nestlé CommHub

All notable changes to this project will be documented here.
Format: `## [Date] - [Sprint Number]` → `### Added / Changed / Fixed / Removed`

---

## [15 March 2026] - Sprint 1
### Added
- MongoDB Atlas connected successfully to backend
- User model created with bcryptjs password hashing
- ValidEmployee model created for employee ID verification
- Seed script created and run — 5 valid employee IDs seeded (NES001-NES005)
- Auth controller created with registerUser and loginUser functions
- Auth routes created:
  POST /api/auth/register
  POST /api/auth/login
- JWT authentication implemented
- Auth middleware created (protect, restrictTo)
- Registration tested and working for retailers and Nestlé staff
- Login tested and working with role-based redirection
- Placeholder dashboards created for all 6 roles: RetailerDashboard, StaffDashboard, ManagerDashboard, AdminDashboard, DistributorDashboard, DriverDashboard
- Unauthorized.jsx page created
- AuthContext updated with localStorage persistence
- ProtectedRoute updated with role-based protection
- Login.jsx connected to backend auth API
- Session persistence working on page refresh
- Logout working and clearing localStorage

## [14 March 2026] - Sprint 1
### Added
- Added Delivery Driver tab to `Register.jsx` — Driving License No., Vehicle Plate No., Assigned Zone / Region
- Created `AuthLayout.jsx` shared component — Nestlé logo displayed above the card on all auth pages
- Added `nestle-logo.png` to `app/public/` and applied to `Login`, `Register`, `OTP`, `ForgotPassword`

### Changed
- Added Delivery Driver as a new actor following lecturer feedback
- Delivery Driver added to management dashboard with lightweight driver view
- New use cases added: View Assigned Deliveries, Update Delivery Status, File Retailer Complaint, Attach Evidence, View Complaint Status
- Driver-related tasks `DRV-01` to `DRV-08` added to Sprint 2 backlog

---

## [13 March 2026] - Pre-Sprint
### Added
- Built `Login.jsx` — email/password fields, show/hide toggle, inline validation, forgot password link, routes to `/register`
- Built `Register.jsx` — Retailer / Nestlé Employee tabbed form, all required fields per tab, show/hide password toggles, full inline validation

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

