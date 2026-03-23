# Bug Tracker — Nestlé CommHub
> Bugs are never deleted. Status updates are made in-place. BUG numbers auto-increment.

---

### BLK-01: MongoDB Atlas not set up
**Status:** Resolved
**Fix:** Connected to MongoDB Atlas using correct srv connection string
**Resolved by:** Thihas
**Date:** 15 March 2026

---

### BUG-01: Backend PORT defaulting to 5000 instead of 5001
**Status:** Resolved
**Symptom:** When `.env` failed to load, `backend/src/index.js` fell back to port `5000` causing the frontend to get CORS errors (frontend targets port 5001).
**Fix:** Changed fallback from `process.env.PORT || 5000` to `process.env.PORT || 5001` in `backend/src/index.js`
**Resolved by:** Antigravity
**Date:** 19 March 2026

---

### BUG-02: Backend hot-reload failing on file changes
**Status:** Resolved
**Symptom:** Code changes in `backend/src/` were not restarting the server during development. `node --watch` (Node 18 experimental) is unreliable and sometimes hangs without restarting.
**Fix:** Replaced `node --watch src/index.js` with `nodemon src/index.js`; added `nodemon ^3.1.9` to `devDependencies` in `backend/package.json`.
**Resolved by:** Antigravity
**Date:** 19 March 2026

---

### BUG-03: VS Code showing 3 CSS lint warnings for @tailwind directives
**Status:** Resolved
**Symptom:** VS Code's Problems panel showed `Unknown at rule @tailwind (css(unknownAtRules))` on lines 1–3 of `app/src/index.css`. These are valid Tailwind directives but unknown to the built-in CSS validator.
**Fix:** Created `.vscode/settings.json` with `"css.validate": false` to disable the built-in CSS validator for this workspace.
**Resolved by:** Antigravity
**Date:** 19 March 2026
---

## BUG-009 — ReferenceError: token is not defined
Date: 22 March 2026
Severity: Critical
Status: Resolved
Resolved by: Antigravity
Date: 22 March 2026
Fix: Added variable declaration const token = localStorage.getItem("token") at the top of the component scope
Description: Staff Ticket Detail view crashed and returned a blank white screen because it referenced `token` internally inside the useEffect without declaring it first
File: app/src/pages/staff/TicketDetail.jsx

## BUG-008 — Retailer dashboard and My Tickets not refetching logic
Date: 22 March 2026
Severity: Medium
Status: Resolved
Resolved by: Antigravity
Date: 22 March 2026
Fix: Added an event listener (window.addEventListener("focus", fetchTickets)) and refactored the fetch logic
Description: After a user submitted a new ticket and navigated back to the dashboard, the data displayed in recent tickets and charts was stale because React Router didn't trigger a refetch off focus/navigation
File: app/src/pages/retailer/RetailerDashboard.jsx
      app/src/pages/retailer/MyTickets.jsx

## BUG-007 — SPA routing 'Not Found' error on Render
Date: 22 March 2026
Severity: High
Status: Resolved
Resolved by: Antigravity
Date: 22 March 2026
Fix: Created `app/public/_redirects` file mapped to `/* /index.html 200`
Description: Render throws a Not Found exception on refresh or direct-link load because it tries to map client-side routes to physical HTML paths
File: app/public/_redirects

## BUG-001 — Hardcoded ticket number on success screen
Date: 17 March 2026
Severity: High
Status: Resolved
Resolved by: Thihas
Date: 18 March 2026
Fix: Used response.data.ticket.ticketNumber
Description: Submit Issue success screen always shows TKT-1041 instead of the real ticket number returned from the API
File: app/src/pages/retailer/SubmitIssue.jsx

## BUG-002 — Retailer cannot view submitted tickets
Date: 17 March 2026
Severity: Critical
Status: Resolved
Resolved by: Thihas
Date: 18 March 2026
Fix: Replaced hardcoded data with real API call to GET /api/tickets/my
Description: My Tickets page on retailer portal shows hardcoded data instead of calling GET /api/tickets/my
File: app/src/pages/retailer/MyTickets.jsx

## BUG-003 — Staff cannot see retailer tickets
Date: 17 March 2026
Severity: Critical
Status: Resolved
Resolved by: Thihas
Date: 18 March 2026
Fix: Auto-assignment logic fixed. Staff can now see unassigned tickets via $or filter
Description: Sales Staff My Tickets page shows no tickets even though tickets exist in the database. Likely caused by auto-assignment logic not finding any sales_staff users or token not being sent correctly
File: app/src/pages/staff/MyTickets.jsx
     backend/src/controllers/ticketController.js

## BUG-004 — In-ticket messaging not working
Date: 17 March 2026
Severity: High
Status: Resolved
Resolved by: Thihas
Date: 18 March 2026
Fix: Message routes verified. Permission checks simplified. TicketDetail pages use useParams for real ticket ID
Description: Messages are not sending or loading in the ticket detail chat for both retailer and staff sides
File: app/src/pages/retailer/TicketDetail.jsx
     app/src/pages/staff/TicketDetail.jsx

## BUG-005 — Category and priority format mismatch
Date: 17 March 2026
Severity: High
Status: Resolved
Resolved by: Thihas
Date: 18 March 2026
Fix: Category map and priority lowercase conversion added in SubmitIssue.jsx
Description: Frontend sends "Stock Out" but backend expects "stock_out". Frontend sends "High" but backend expects "high"
File: app/src/pages/retailer/SubmitIssue.jsx

## BUG-006 — System restart script getting stuck
Date: 17 March 2026
Severity: Medium
Status: Resolved
Resolved by: Thihas
Date: 18 March 2026
Fix: run.sh replaced with robust version using timeout-based health checking
Description: run.sh gets stuck on port cleanup when ports 5001 and 5173 are already in use
File: run.sh
