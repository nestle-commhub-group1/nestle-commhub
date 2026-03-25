# Changelog — Nestlé CommHub

All notable changes to this project will be documented here.
Format: `## [Date] - [Sprint Number]` → `### Added / Changed / Fixed / Removed`

---

## [25 March 2026] - Sprint 2

### Added
- **Distributor Portal Full Implementation** (`app/src/pages/distributor/`) — Secure dashboard and ticket detail pages tailored for distribution partners.
- **Isolated Communication Channels** (`chatRoom` enum) — Three distinct rooms (`general`, `staff_distributor`, `retailer_distributor`) to ensure privacy across different ticket stakeholders.
- **Allocation Workflow** (`PUT /api/tickets/:id/allocate`) — Allows sales staff to delegate logistics tasks with automatic notification to the distributor.
- **`distributorId` field** on `Ticket` model — Formalizing the link between tickets and logistics partners.
- **Universal Dev IDs** (`NES-DEV-999`, `NES-DEV-888`, `NES-DEV-777`) — Auto-seeded accounts for rapid testing across all core system roles.
- **Multi-Channel Chat UI** in Staff and Retailer dashboards — Dynamic tabs that reveal distributor communication channels only when a partner is assigned.

### Fixed
- **Critical White Screen Errors** — Resolved `ReferenceError` crashes in Admin Dashboard, User Management, and Retailer Profile by ensuring correct `lucide-react` imports.
- **Notification Persistence** — Aligned frontend and backend notification models to prevent "Unread" badges from resetting during navigation.
- **Restricted Distributor Access** — Closed security gap where distributors could view all tickets; they are now isolated to their assigned allocations only.
- **Chat Privacy Violation** — Implemented backend guards to prevent distributors from reading staff-retailer private messages.

### Changed
- **`seedEmployees.js` & `cleanTestAccounts.js`** — Enhanced to provide deterministic database resets for development.
- **Render Deployment** — Added auto-ping loop to prevent the free-tier backend from sleeping.

---

## [19 March 2026] - Sprint 1
### Fixed
- Reverted sci-fi UI redesign back to 
  original Nestle brown design
- Restored all original sidebar labels
  (My Tickets, Submit Issue, Home etc)
- Fixed image attachments — files now 
  converted to base64 and stored in DB
- Staff ticket detail now displays 
  attached images from retailer
- Removed hardcoded data from Admin 
  and Staff dashboards
- Notification badges now show real 
  unread count from API
- Applied mobile responsiveness across 
  all dashboards without changing design
- Mobile sidebar now collapses to 
  hamburger menu overlay
- Stock Requests, Promotions and 
  Delivery Tracking replaced with 
  Coming Soon pages
- Global Mongoose error handler added 
  to backend (CastError, ValidationError)
- All 4 previously failing tests now 
  pass — test pass rate 100%

---

## [18 March 2026] - Sprint 1
### Fixed
- BUG-001: Success screen now shows real ticket number from API response
- BUG-002: Retailer My Tickets now fetches real data from GET /api/tickets/my
- BUG-003: Staff My Tickets now shows all tickets including unassigned ones. Auto-assignment logic fixed with detailed logging
- BUG-004: In-ticket messaging fixed for both retailer and staff. Permission checks simplified. useParams added to TicketDetail pages
- BUG-005: Category and priority format mismatch fixed. Frontend now converts "Stock Out" to "stock_out" and "High" to "high" before sending to API
- BUG-006: run.sh replaced with robust version that handles stuck ports reliably with timeout checking

### Added
- Staff Dashboard connected to real API:
  - GET /api/tickets for live ticket counts
  - Dynamic SLA compliance calculation
  - Real assigned tickets table
  - Personalized greeting using dateUtils.js
- Notifications system fully connected across all dashboards (Retailer, Staff, Admin layouts):
  - Real notifications from GET /api/notifications
  - Unread count on bell icon
  - Mark as read on click
  - Mark all as read button
  - Relative timestamps (2 hours ago)
- User Management page connected to real API:
  - GET /api/users shows all registered users
  - Activate/Deactivate toggle working
  - Live search by name and email
  - Tab filtering by role
  - Real user counts in summary header
- Under Development placeholder pages created for Analytics, Broadcasts, Distributor Evaluations
- dateUtils.js created for date formatting and personalized greetings
- userController.js updated with profile update endpoint
- userRoutes.js updated and mounted

---

## [17 March 2026] - Sprint 1
### Added
- Ticket model created (Ticket.js)
- Message model created (Message.js)
- Notification model created (Notification.js)
- Ticket controller created with:
  createTicket, getMyTickets, getAllTickets,
  getTicketById, updateTicketStatus,
  escalateTicket
- Message controller created with:
  sendMessage, getMessages
- Notification controller created with:
  getMyNotifications, markAsRead, 
  markAllAsRead
- SLA auto escalation job created
- Upload middleware created (Cloudinary)
- All ticket and notification routes created
- Staff missing pages built:
  MyTickets, TicketDetail, 
  RetailerDirectory, Broadcasts
- Retailer missing pages built:
  SubmitIssue, MyTickets, TicketDetail,
  Promotions, StockRequests, 
  DeliveryTracking
- User profile update endpoint created
- Dev launcher updated to 4 roles only
- Regional manager and delivery driver 
  roles removed completely

### Changed
- Final roles confirmed: retailer, 
  sales_staff, hq_admin, distributor
- Register form updated to 2 tabs only
- Seed data updated to remove removed roles

### Known Issues
- Ticket submission success screen shows
  hardcoded TKT-1041 instead of real 
  ticket number
- Retailer My Tickets page not loading 
  real tickets from API
- Staff My Tickets not showing retailer 
  tickets
- In-ticket messaging not working
- System restart script getting stuck 
  on port cleanup
- Category and priority format mismatch 
  between frontend and backend

---

## [16 March 2026] - Sprint 1
### Changed
- Removed `delivery_driver` role completely
- Removed `regional_manager` role completely
- Final confirmed roles: `retailer`, `sales_staff`, `hq_admin`, `distributor`
- Updated `User` model role enum to 4 final roles
- Updated seed data — removed NES003 (regional_manager) and NES005 (delivery_driver)
- Updated `Register.jsx` — removed Driver tab; now 2 tabs only (Retailer, Nestlé Staff)
- Updated Employee Role dropdown to show: Sales Staff, HQ Admin, Distributor only
- Deleted `app/src/pages/manager/` and `app/src/pages/driver/` folders
- Updated all routing, auth, and redirect logic to reflect 4 final roles

---

## [19 March 2026] - Sprint 2
### Added
- `run.sh` — one-command startup script for the entire system (kills existing processes on ports 5001/5173, installs deps, starts backend then frontend, prints status URLs)
- `.vscode/settings.json` — suppresses VS Code CSS linter warnings for Tailwind `@tailwind` directives (`"css.validate": false`)
- `GET /api/health` endpoint in `backend/src/index.js` — returns `{ status, message, database }` with live MongoDB connection state
- `AdminDashboard.jsx` — full HQ Admin home page: 6 summary cards, Platform SLA Compliance table with regional breakdown, Escalated to HQ table, All Tickets table with filter tabs, Recent Activity timeline
- `AdminProfile.jsx` — HQ Admin profile page with dark red HQ Admin badge, editable personal info and office location
- `UserManagement.jsx` — User Management page with role/status filter tabs, search bar, role badges (colour-coded per role), active/inactive status, edit/deactivate actions
- `SLAMonitor.jsx` — SLA Monitor page with 4 metric cards, regional SLA table, breach detail table with date filter
- `ManagerDashboard.jsx` — full Regional Manager home page: 4 summary cards, Western Province SLA section with priority bars, Escalated from Sales Staff table with Resolve/Escalate buttons, My Sales Staff grid cards, Regional Tickets table
- `ManagerProfile.jsx` — Regional Manager profile page with purple Regional Manager badge, editable personal info and office location, read-only region field
- `Heatmap.jsx` — Issue Heatmap page with styled placeholder map, coloured location markers, issue type filter tabs, Top 5 Hotspots list
- `DistributorScorecards.jsx` — Distributor Performance page with 3 scorecards (delivery accuracy bars, avg response, satisfaction rating, performance badge)
- `Broadcasts.jsx` — Broadcasts page with Send/Sent tabs, target dropdown, subject/message/attach, schedule toggle, and sent broadcast list with view-rate progress bars
- `AdminLayout.jsx` — layout/sidebar for HQ Admin with dark red HQ Admin badge, all admin nav links, notification panel with admin-specific notifications
- `ManagerLayout.jsx` — layout/sidebar for Regional Manager with purple Regional Manager badge, manager nav links, notification panel with manager-specific notifications
- All new admin/manager routes registered in `App.jsx` with correct `ProtectedRoute` role guards (`hq_admin`, `regional_manager`)

### Changed
- `backend/package.json` — `dev` script changed from `node --watch` to `nodemon src/index.js`; added `nodemon ^3.1.9` to `devDependencies`
- `backend/src/index.js` — `PORT` fallback corrected from `5000` → `5001`; `/api/health` endpoint added
- `backend/.env` — added `NODE_ENV=development`

### Fixed
- Backend dev server failing to restart on file changes (was using unstable `node --watch`; now uses `nodemon`)
- PORT defaulting to 5000 instead of 5001 when `.env` was not loaded
- VS Code showing 3 CSS lint warnings for `@tailwind` directives in `index.css`

---


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

