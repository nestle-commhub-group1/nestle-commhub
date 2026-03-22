# Sprint Review Log — Nestlé CommHub (COMP50001)
> 3-sprint project. All sprint reviews are preserved and never overwritten.

---

## Pre-Sprint — Decisions Made (11 March 2026)

- **PWA confirmed for both frontend apps.** `retailer-portal` and `management-dashboard` will be built as Progressive Web Apps using `vite-plugin-pwa`. This eliminates the need for a separate mobile app while still serving retailers on mobile devices in the field.

- **Team responsibilities confirmed and reassigned.** Final task ownership agreed as follows:

  | Team Member | Area | Task Codes |
  |---|---|---|
  | **Thihas** | Backend, Auth & Infrastructure | `INF-01`, `INF-02`, `INF-03`, `INF-05`, `AUTH-01`–`AUTH-06` |
  | **Ryan** | Ticket System | `TKT-01`–`TKT-12`, `SLA-01`–`SLA-03`, `INF-04` (Cloudinary) |
  | **Kavinda** | Retailer Portal | `RET-01`–`RET-08`, `BOT-01`–`BOT-04`, `NOT-04` |
  | **Ganidu** | Management Dashboard | `STF-01`–`STF-05`, `MGR-01`–`MGR-06`, `ADM-01`–`ADM-08`, `BRD-01`–`BRD-03` |

  > Previous assignment had Ganidu on ticket system and Ryan on management dashboards. This was reversed.


---

## Sprint 1 — In Progress — 17 March 2026

### Progress as of 19 March 2026:
- Core ticket system fully functional
- Authentication system complete
- All dashboards connected to backend
- Mobile responsive design implemented
- 30 automated tests passing at 100%
- Ready for deployment preparation

Remaining for Sprint 1 completion:
- OTP verification screen
- Password reset flow
- Cloudinary setup for file uploads
- Deploy to Vercel and Render

### Progress as of 18 March 2026:

All 6 bugs from yesterday resolved.

Completed today:
- All bug fixes applied and verified
- Staff Dashboard fully connected to real backend data
- Notifications system live across all dashboards
- User Management connected to real API
- SLA compliance calculating dynamically
- Personalized greetings implemented
- Under development placeholders added

Verified working end to end:
- Retailer Dashboard: PASS (Real ticket counts, greeting working)
- Staff Dashboard: PASS (SLA 92%, assigned tickets showing)
- Admin Dashboard: PASS (Platform metrics showing 8 tickets)
- Notifications: PASS (Bell badge, panel, mark as read all work)
- User Management: PASS (5 real users, search and toggle work)

Still pending for Sprint 1 completion:
- OTP verification screen
- Password reset flow
- Cloudinary file uploads
- End to end ticket flow browser testing
- In-ticket messaging browser testing
- Staff ticket detail page full test

### Progress as of 17 March 2026:
Completed today:
- Full ticket system backend built and deployed (models, controllers, routes)
- SLA auto escalation job running
- All retailer portal pages built
- All staff dashboard pages built
- 6 known bugs identified and logged

---

## Sprint 1 — Completed — 15 March 2026

### Completed:
- Full authentication system (register, login, JWT, role-based routing)
- MongoDB Atlas connected
- All placeholder dashboards working
- Session persistence and logout working
- Registration validated and tested end to end
- Login validated and tested end to end
- All 6 placeholder dashboard shells: Retailer, Staff, Manager, Admin, Distributor, Driver

---

## Sprint 2 — In Progress — 19 March 2026

### Completed so far:
- Full HQ Admin dashboard UI (`AdminDashboard.jsx`) — 6 summary cards, SLA compliance table, escalated tickets, all-tickets table, activity timeline
- HQ Admin profile page (`AdminProfile.jsx`) — dark red HQ Admin badge
- User Management page (`UserManagement.jsx`) — colour-coded role badges, filter tabs, search, edit/deactivate actions
- SLA Monitor page (`SLAMonitor.jsx`) — 4 metric cards, regional breakdown, breach detail table
- Full Regional Manager dashboard UI (`ManagerDashboard.jsx`) — 4 summary cards, Western Province SLA section with priority bars, escalated tickets table, My Sales Staff grid, regional tickets table
- Regional Manager profile page (`ManagerProfile.jsx`) — purple Regional Manager badge
- Issue Heatmap page (`Heatmap.jsx`) — styled placeholder map, coloured markers, hotspot list
- Distributor Scorecards page (`DistributorScorecards.jsx`) — 3 distributor cards with performance bars and badges
- Broadcasts page (`Broadcasts.jsx`) — Send/Sent tabs, target/subject/message/attach fields, view-rate bars
- `AdminLayout.jsx` and `ManagerLayout.jsx` layout components with role-specific sidebars and notification panels
- All new routes registered in `App.jsx` with correct `ProtectedRoute` role guards
- Startup reliability fixes: nodemon, PORT default, `/api/health` endpoint, `NODE_ENV`
- `run.sh` one-command startup script — kills ports, installs deps, starts backend then frontend
- `.vscode/settings.json` CSS linter fix

### In progress:
- Retailer portal real UI (Kavinda)
- Ticket submission and management system (Ryan)
- OTP verification
- Password reset flow
- Real API integration for all dashboards (currently hardcoded placeholder data)

---

## Sprint 2 Review — *(pending)*

*(To be documented at end of Sprint 2)*

---

## Sprint 3 Review — *(pending)*

*(To be documented at end of Sprint 3)*
