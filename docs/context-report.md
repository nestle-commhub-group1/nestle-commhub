# Project Context Report — Nestlé CommHub
> Living document. Updated as the project evolves.
> Last updated: 13 March 2026

---

## 1. Project Overview

### What is Nestlé CommHub?
**Nestlé CommHub** is a centralized digital communication platform built specifically for **Nestlé Sri Lanka's supply chain operations**. It connects three key groups — retailers, Nestlé sales representatives, and Nestlé HQ management — into a single unified system, replacing the fragmented, informal channels (WhatsApp, phone calls, paper forms) currently used for day-to-day field operations.

### Who is it for?
| Actor | Role in the supply chain |
|---|---|
| **Retailers** | Small and medium shop owners across Sri Lanka who stock and sell Nestlé products |
| **Sales Representatives** | Field staff who manage retailer accounts and visit stores regularly |
| **Regional Managers** | Oversee multiple sales reps and their territories |
| **HQ Admins** | Nestlé head office staff who manage the platform, promotions, and high-level reporting |
| **Delivery Drivers** | Drivers responsible for last-mile delivery to retailers; file complaints and update delivery statuses |

### What problem does it solve?
Nestlé Sri Lanka's field operations currently rely on ad-hoc communication methods — phone calls, WhatsApp groups, physical paperwork — which result in:
- **Delayed issue resolution** — retailer complaints take days to reach the right person
- **Poor stock visibility** — no central record of stock requests or delivery statuses
- **Missed promotions** — promotions are communicated inconsistently through informal channels
- **No audit trail** — no record of conversations, requests, or resolutions

Nestlé CommHub solves this by providing a structured, traceable, and accessible platform for all communication between retailers and Nestlé's internal teams.

**Course:** COMP50001 — Commercial Computing
**Team:** Thihas, Ganidu, Kavinda, Ryan
**Methodology:** Agile — 3 Sprints

---

## 2. Tech Stack

### Frontend
| App | Framework | Notes |
|---|---|---|
| `app/` | React (Vite) + `vite-plugin-pwa` + Tailwind CSS | Single PWA — installable on Android/iOS/desktop from browser |

One unified frontend. All user roles share the same codebase; routing and dashboard rendering are determined by the JWT role after login.

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Middleware | `cors`, `dotenv` |
| Entry point | `backend/src/index.js` |

### Database
| Technology | Notes |
|---|---|
| MongoDB | Chosen for flexible document schema suited to tickets, promotions, and notifications |

### Additional Services and Tools
| Tool / Service | Purpose |
|---|---|
| `vite-plugin-pwa` | Service worker generation, offline caching, install prompts, push notifications |
| Tailwind CSS | Utility-first CSS framework for styling the `app/` frontend |
| Netlify / Vercel | Production hosting (HTTPS required for PWA features) |
| Git + GitHub | Version control and collaboration |
| `.env` / `.env.example` | Environment variable management |

---

## 3. App Architecture

### How many apps?
There is **one unified frontend app** and **one shared backend**:

```
nestle-commhub/
├── app/        ← Single React + Vite PWA (all roles)
└── backend/    ← Shared API server
```

> **Architecture change (13 March 2026):** The previous two-app structure (`retailer-portal/` and `management-dashboard/`) has been consolidated into a single PWA in `app/`. Both folders have been deleted.

### What type of app?
The frontend is a **Progressive Web App (PWA)** — it runs in the browser but can be installed on a mobile phone or desktop like a native app, without going through an app store. It works on low-bandwidth (3G) connections and supports offline use via service workers. Styled with **Tailwind CSS**.

### Registration
A single registration page presents **two tabs**:
- **Retailer tab** — registers with business details
- **Nestlé Employee tab** — registers with an Employee ID, which is verified against the database before the account is created

### How routing and roles work
- The JWT returned on login contains the user's **role**.
- The frontend reads the role from the JWT and renders the appropriate dashboard.
- Authentication and role-based access control (RBAC) are enforced on the **backend**.

| Role | Dashboard rendered after login |
|---|---|
| Retailer | Retailer dashboard |
| Sales Staff | Sales Staff dashboard |
| Regional Manager | Regional Manager dashboard |
| HQ Admin | HQ Admin dashboard |
| Distributor | Distributor dashboard |
| Delivery Driver | Driver dashboard (management app — driver view) |

---

## 4. User Roles

### Retailer
- Report issues / raise support tickets
- View the status of their open tickets
- View current promotions sent by Nestlé
- Request stock replenishment
- Track delivery status

### Sales Representative
- View and respond to retailer tickets assigned to them
- Update delivery and stock status for their accounts
- Send promotions to retailers in their territory
- View performance reports for their own accounts

### Regional Manager
- View all tickets and activity within their region
- View analytics and performance metrics for their region
- Escalate or reassign tickets
- Send promotions to all retailers in their region
- Review and approve stock requests

### HQ Admin
- Full platform access — all regions, all tickets, all users
- Create and manage promotions platform-wide
- Manage user accounts (create, deactivate, assign roles)
- View platform-wide analytics and reports
- Configure system settings

### Delivery Driver
- Login, OTP verification, password reset, manage profile
- View assigned deliveries for the day
- Update delivery status (Out for Delivery, Delivered, Failed Delivery)
- File complaints against retailers (late payment, refused delivery, misconduct)
- Attach evidence to complaints (photos, voice notes)
- View status and resolution of filed complaints

---

## 5. Current File Structure

```
nestle-commhub/
├── app/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Register.jsx
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── OTP.jsx
│   │   │   │   ├── ForgotPassword.jsx
│   │   │   │   └── Unauthorized.jsx
│   │   │   ├── retailer/
│   │   │   │   └── RetailerDashboard.jsx
│   │   │   ├── staff/
│   │   │   │   └── StaffDashboard.jsx
│   │   │   ├── manager/
│   │   │   │   └── ManagerDashboard.jsx
│   │   │   ├── admin/
│   │   │   │   └── AdminDashboard.jsx
│   │   │   └── distributor/
│   │   │       └── DistributorDashboard.jsx
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── App.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── index.js
│   └── package.json
└── docs/
```

---

## 6. What Has Been Completed

| # | Task | Date |
|---|---|---|
| 1 | Defined project scope and team (Thihas, Ganidu, Kavinda, Ryan) | Pre-Sprint |
| 2 | Chose Agile methodology — 3 sprints | Pre-Sprint |
| 3 | Created initial project folder structure (`backend/`, `docs/`) | 01 March 2026 |
| 4 | Initialized all documentation files (`changelog.md`, `code-decisions.md`, `context-report.md`, `bug-tracker.md`, `api-documentation.md`, `sprint-reviews.md`) | 01 March 2026 |
| 5 | Decided to build two separate PWA frontends instead of one web + one mobile app | 11 March 2026 |
| 6 | Deleted legacy `mobile/` and `web/` folders | 11 March 2026 |
| 7 | Deleted duplicate root-level `CHANGELOG.md` | 11 March 2026 |
| 8 | Renamed `env` → `.env` and `env.example` → `.env.example` | 11 March 2026 |
| 9 | Scaffolded `retailer-portal` with Vite + React | 11 March 2026 |
| 10 | Scaffolded `management-dashboard` with Vite + React | 11 March 2026 |
| 11 | Initialised Node.js + Express backend (`npm init`, installed `express`, `dotenv`, `cors`) | 11 March 2026 |
| 12 | Created `backend/src/index.js` with health check endpoint | 11 March 2026 |
| 13 | Added `start` and `dev` scripts to `backend/package.json` | 11 March 2026 |
| 14 | Recorded PWA decision in `code-decisions.md` | 11 March 2026 |
| 15 | Updated all four relevant docs with PWA architectural decision | 11 March 2026 |
| 16 | Consolidated two-app architecture into single PWA in `app/` — deleted `retailer-portal/` and `management-dashboard/` | 13 March 2026 |
| 17 | Adopted Tailwind CSS as styling framework for `app/` | 13 March 2026 |
| 18 | Defined role-based routing via JWT — single login/registration page, role determines dashboard rendered | 13 March 2026 |
| 19 | Scaffolded single unified PWA in `app/` (Vite + React) | 13 March 2026 |
| 20 | Installed and configured Tailwind CSS (`tailwind.config.js`, `postcss.config.js`, directives in `index.css`) | 13 March 2026 |
| 21 | Installed and configured `vite-plugin-pwa` with Nestlé brand colours | 13 March 2026 |
| 22 | Set up React Router in `App.jsx` with all role-based protected routes | 13 March 2026 |
| 23 | Created `AuthContext.jsx` — user object, JWT token, `login()`, `logout()`, `isAuthenticated` | 13 March 2026 |
| 24 | Created `ProtectedRoute.jsx` — auth check and role-based access control | 13 March 2026 |
| 25 | Created placeholder pages for all role-based routes (retailer, staff, manager, admin, distributor) | 13 March 2026 |
| 26 | Created auth placeholder pages (`Register`, `Login`, `OTP`, `ForgotPassword`, `Unauthorized`) | 13 March 2026 |
| 27 | Built `Login.jsx` UI — email/password fields, show/hide toggle, inline validation, forgot password link | 13 March 2026 |
| 28 | Built `Register.jsx` UI — Retailer / Nestlé Employee tabs, all required fields per tab, inline validation, show/hide toggles | 13 March 2026 |
| 29 | Added Delivery Driver tab to `Register.jsx` — Driving License No., Vehicle Plate No., Assigned Zone / Region fields | 14 March 2026 |
| 30 | Created `AuthLayout.jsx` shared component — Nestlé logo floating above card on all auth pages | 14 March 2026 |
| 31 | Added `nestle-logo.png` to `app/public/` and integrated across `Login`, `Register`, `OTP`, `ForgotPassword` pages | 14 March 2026 |

---

## 7. What Is In Progress

| Task | Owner | Notes |
|---|---|---|
| `Login.jsx` — connect to backend `POST /api/auth/login` | TBD | UI complete — awaiting backend endpoint |
| `Register.jsx` — connect to backend `POST /api/auth/register` | TBD | UI complete — awaiting backend endpoint and Employee ID verification |
| Backend auth endpoints (`POST /api/auth/register`, `POST /api/auth/login`) | TBD | Not yet built — no User schema or auth routes |
| MongoDB Atlas connection | TBD | Not yet set up — backend has no DB connection |

---

## 8. Sprint 1 Plan

> Sprint 1 has not been formally kicked off yet. The following reflects the expected scope based on what has been discussed.

### Goal
Get both apps and the backend to a functional "skeleton" state — authenticated, role-aware, and connected to the database.

### Tasks to build in Sprint 1

#### Backend
- [ ] Connect backend to MongoDB (Mongoose)
- [ ] Design and implement User schema (name, email, password hash, role)
- [ ] `POST /api/auth/register` — user registration
- [ ] `POST /api/auth/login` — returns JWT
- [ ] Auth middleware — validate JWT on protected routes
- [ ] Role middleware — restrict routes by role

#### Frontend (`app/`)
- [ ] Scaffold `app/` with Vite + React
- [ ] Install and configure Tailwind CSS
- [ ] Install and configure `vite-plugin-pwa`
- [ ] Set up React Router
- [ ] Implement Login page (email + password)
- [ ] Implement registration page — tabbed form (Retailer | Nestlé Employee)
  - [ ] Retailer tab: business details form
  - [ ] Nestlé Employee tab: Employee ID verified against database
- [ ] Context / auth state management (store JWT, expose role)
- [ ] Role-based route guards
- [ ] Dashboard shells (empty home screen per role, post-login):
  - [ ] Retailer dashboard shell
  - [ ] Sales Staff dashboard shell
  - [ ] Regional Manager dashboard shell
  - [ ] HQ Admin dashboard shell
  - [ ] Distributor dashboard shell
- [ ] Connect to backend auth API

### Responsibility Assignment
> Confirmed 11 March 2026. Supersedes earlier TBD placeholders.

| Team Member | Area | Task Codes |
|---|---|---|
| **Thihas** | Backend, Auth & Infrastructure | `INF-01`, `INF-02`, `INF-03`, `INF-05`, `AUTH-01` to `AUTH-06` |
| **Ryan** | Ticket System | `TKT-01` to `TKT-12`, `SLA-01` to `SLA-03`, `INF-04` (Cloudinary file uploads) |
| **Kavinda** | Retailer Portal | `RET-01` to `RET-08`, `BOT-01` to `BOT-04`, `NOT-04` |
| **Ganidu** | Management Dashboard | `STF-01` to `STF-05`, `MGR-01` to `MGR-06`, `ADM-01` to `ADM-08`, `BRD-01` to `BRD-03` |


---

## 9. Full Backlog Summary

> Status key: 🟢 Done · 🟡 In Progress · ⬜ Not Started

### Pre-Sprint / Setup
| Task | Status |
|---|---|
| Define project scope and roles | 🟢 Done |
| Choose tech stack | 🟢 Done |
| Scaffold folder structure | 🟢 Done |
| ~~Scaffold `retailer-portal` (Vite + React)~~ | 🟢 Done (deleted — merged into `app/`) |
| ~~Scaffold `management-dashboard` (Vite + React)~~ | 🟢 Done (deleted — merged into `app/`) |
| Scaffold `backend` (Node + Express) | 🟢 Done |
| Scaffold `app/` (Vite + React + Tailwind + PWA) | ⬜ Not Started |
| Set up MongoDB Atlas cluster | ⬜ Not Started |

### Sprint 1 — Authentication & Skeleton
| Task | Status |
|---|---|
| User schema (Mongoose) | ⬜ Not Started |
| `POST /api/auth/register` | ⬜ Not Started |
| `POST /api/auth/login` (JWT) | ⬜ Not Started |
| JWT auth middleware | ⬜ Not Started |
| RBAC middleware | ⬜ Not Started |
| `app/` — Login page | ⬜ Not Started |
| `app/` — Registration page (tabbed: Retailer / Nestlé Employee) | ⬜ Not Started |
| `app/` — Employee ID verification on registration | ⬜ Not Started |
| `app/` — Role-based dashboard shells (Retailer, Sales Staff, Manager, Admin, Distributor) | ⬜ Not Started |

### Sprint 2 — Core Features
| Task | Status |
|---|---|
| Ticker / Issue reporting (retailer raises a ticket) | ⬜ Not Started |
| Ticket management (sales rep responds, updates status) | ⬜ Not Started |
| Promotions — create and send (HQ Admin / Regional Manager) | ⬜ Not Started |
| Promotions — view (Retailer) | ⬜ Not Started |
| Stock request form (Retailer) | ⬜ Not Started |
| Delivery status tracking (Retailer) | ⬜ Not Started |
| Push notifications via PWA | ⬜ Not Started |
| `DRV-01` Driver dashboard UI | ⬜ Not Started |
| `DRV-02` View assigned deliveries page | ⬜ Not Started |
| `DRV-03` Update delivery status functionality (Out for Delivery, Delivered, Failed Delivery) | ⬜ Not Started |
| `DRV-04` File retailer complaint form | ⬜ Not Started |
| `DRV-05` Attach evidence to complaint (Cloudinary — photos, voice notes) | ⬜ Not Started |
| `DRV-06` View complaint status page | ⬜ Not Started |
| `DRV-07` Driver complaint backend API endpoints | ⬜ Not Started |
| `DRV-08` Auto-escalate unresolved driver complaints to Regional Manager | ⬜ Not Started |

### Sprint 3 — Analytics, Polish & Deployment
| Task | Status |
|---|---|
| Analytics dashboard for Regional Managers / HQ | ⬜ Not Started |
| Report generation | ⬜ Not Started |
| Offline support (service worker caching strategy) | ⬜ Not Started |
| UI polish and responsive design review | ⬜ Not Started |
| End-to-end testing | ⬜ Not Started |
| Production deployment (Netlify/Vercel + hosting for backend) | ⬜ Not Started |
| Final documentation | ⬜ Not Started |

---

## 10. Current Blockers

| # | Blocker | Impact | Owner |
|---|---|---|---|
| 1 | `app/` not yet scaffolded (Vite + React + Tailwind + PWA) | No frontend to build on | TBD |
| 2 | MongoDB not connected | Backend cannot persist any data | TBD |
| 3 | No authentication system | No protected routes, no role separation, app cannot be used in production | TBD |
| 4 | Employee ID verification endpoint not designed | Cannot build the Nestlé Employee registration tab | TBD |
| 5 | Sprint 1 tasks not formally assigned | Team members don't know what to work on | Whole team — needs kickoff meeting |
| 6 | Driver dashboard not yet designed | Cannot build driver-facing views until UI mockup is approved — needed before Sprint 2 | TBD |

---

## 11. Documents Being Maintained

| Document | Location | What it tracks |
|---|---|---|
| `context-report.md` | `docs/context-report.md` | Full living project overview — this document. Updated continuously. |
| `changelog.md` | `docs/changelog.md` | All notable project changes. Format: `## [Date] - [Sprint]` with `Added / Changed / Fixed / Removed` sub-sections. Entries are never deleted. |
| `code-decisions.md` | `docs/code-decisions.md` | Architecture and implementation decisions — what was decided, why, alternatives rejected, known limitations. New entries prepended at top. |
| `sprint-reviews.md` | `docs/sprint-reviews.md` | End-of-sprint review log. One entry per sprint. Entries are never overwritten. Also contains a Pre-Sprint decisions section. |
| `bug-tracker.md` | `docs/bug-tracker.md` | Bug log. Format: `BUG-001`, `BUG-002`, etc. Status updated in-place. Bugs are never deleted. Currently empty. |
| `api-documentation.md` | `docs/api-documentation.md` | REST API endpoint reference, grouped by feature (Auth, Tickets, Notifications, etc.). Currently unpopulated — will be filled as endpoints are built. |
| `meeting-minutes/` | `docs/meeting-minutes/` | Per-meeting notes files stored as individual markdown files inside this folder. |
