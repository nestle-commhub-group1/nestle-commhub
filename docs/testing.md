# Nestlé CommHub — System Test Report
**Date:** 22 March 2026
**Tester:** Antigravity (Automated)
**Sprint:** Sprint 1

| # | Test | Purpose | Result | Failure Reason |
|---|------|---------|--------|----------------|
| 1 | API Health Check | Backend is up and DB connected | PASS | N/A |
| 2 | Invalid route | Server handles unknown routes safely | PASS | N/A |
| 3 | No token returns 401 | Auth middleware blocks unauthenticated requests | PASS | N/A |
| 4 | Register retailer | Full retailer registration flow works | PASS | N/A |
| 5 | Duplicate email rejected | Duplicate email rejected | PASS | N/A |
| 6 | Missing fields rejected | Required field validation | PASS | N/A |
| 7 | Invalid employee ID rejected | Invalid EID rejected | PASS | N/A |
| 8 | Valid staff registration | Staff registration works | PASS | N/A |
| 9 | Login valid credentials | Login returns JWT and user info | PASS | N/A |
| 10 | Login wrong password | Wrong password returns 401 | PASS | N/A |
| 11 | Create ticket as retailer | Retailer can create ticket with TKT-XXXX | PASS | N/A |
| 12 | Staff cannot create ticket | Role restriction on ticket creation | PASS | N/A |
| 13 | Missing category rejected | Category required validation | PASS | N/A |
| 14 | Invalid priority rejected | Priority enum validation | PASS | N/A |
| 15 | Retailer gets own tickets | GET /api/tickets/my returns own tickets | PASS | N/A |
| 16 | Staff gets tickets | Staff can GET /api/tickets | PASS | N/A |
| 17 | Get ticket by ID | Ticket detail returned with IDs populated | PASS | N/A |
| 18 | Invalid ticket ID | Invalid ID format handled | PASS | N/A |
| 19 | SLA deadline set correctly | SLA deadline auto-set correctly (4hrs) | PASS | Verified 4 hour diff |
| 20 | Retailer cannot get all tickets | Role restriction on GET /api/tickets | PASS | N/A |
| 21 | Retailer sends message | Retailer can post to ticket chat | PASS | N/A |
| 22 | Staff replies | Staff reply updates state correctly | PASS | N/A |
| 23 | Get messages | Messages returned in creation order | PASS | N/A |
| 24 | Empty message rejected | Empty message validation | PASS | N/A |
| 25 | Message to bad ticket ID | Bad TID on message rejected | PASS | N/A |
| 26 | Staff updates status | Status update works for staff | PASS | N/A |
| 27 | Retailer cannot update status | Role restriction on status update | PASS | N/A |
| 28 | Invalid status rejected | Status enum validation | PASS | N/A |
| 29 | Staff escalates ticket | Escalation flow works | PASS | N/A |
| 30 | Retailer cannot escalate | Role restriction on escalation | PASS | N/A |

================================
FINAL TEST REPORT
================================
Total: 30
Passed: 30
Failed: 0
Pass Rate: 100%

FAILED TESTS:
None. All 30 core backend and auth tests are passing.

TOP ISSUES TO FIX:
1. Dialog Axiata API for SMS (blocked by API key)
2. Cloudinary for attachments (blocked by API config)
3. Frontend stability for large datasets
4. Session persistence on PWA refresh
5. Performance profiling for dashboard logs
