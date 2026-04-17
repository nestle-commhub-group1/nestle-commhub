# Nestlé CommHub – QA Sprint Documentation

## Overview
This document tracks the results of the automated E2E tests for Sprint 2 (Promotions) and Sprint 3 (Stock Management). Tests are implemented using Playwright and are located in the `tests/e2e/` directory.

---

## Sprint 2: Promotion Distribution System

### Results Tracking
| Test ID | Description | Status | Date | Notes |
|---------|-------------|--------|------|-------|
| TC-PROMO-001 | PM can create promotion | ✅ PASS | 2026-04-17 | Fixed timeout issue |
| TC-PROMO-002 | PM can view active promos | ✅ PASS | 2026-04-17 | |
| TC-PROMO-003 | PM can see retailer opt-ins | ✅ PASS | 2026-04-17 | Fixed strict mode violation |
| TC-PROMO-004 | PM can assign distributor | ✅ PASS | 2026-04-17 | |
| TC-PROMO-005 | PM can message retailer | ✅ PASS | 2026-04-17 | |
| TC-PROMO-006 | Retailer view Promo Wall | ✅ PASS | 2026-04-17 | |
| TC-PROMO-007 | Retailer opt-in | ✅ PASS | 2026-04-17 | |
| TC-PROMO-008 | Retailer ask PM questions | ✅ PASS | 2026-04-17 | |
| TC-PROMO-009 | Retailer rate promotion | ✅ PASS | 2026-04-17 | |
| TC-PROMO-010 | View historical promos | ✅ PASS | 2026-04-17 | |

---

## Sprint 3: Stock Management System

### Results Tracking
| Test ID | Description | Status | Date | Notes |
|---------|-------------|--------|------|-------|
| TC-STOCK-001 | SM can create product | ✅ PASS | 2026-04-17 | Fixed timeout/multiple buttons |
| TC-STOCK-002 | SM can update stock | ✅ PASS | 2026-04-17 | |
| TC-STOCK-003 | SM can view pending orders | ✅ PASS | 2026-04-17 | |
| TC-STOCK-004 | SM can accept order | ✅ PASS | 2026-04-17 | |
| TC-STOCK-007 | Retailer view catalog | ✅ PASS | 2026-04-17 | |
| TC-STOCK-008 | Bulk discount (500+) | ✅ PASS | 2026-04-17 | |
| TC-STOCK-011 | Retailer place order | ✅ PASS | 2026-04-17 | |
| TC-STOCK-015 | Dist. view assignments | ✅ PASS | 2026-04-17 | |
| TC-STOCK-016 | Map view for delivery | ✅ PASS | 2026-04-17 | |
| TC-STOCK-017 | Mark delivered | ✅ PASS | 2026-04-17 | |

---

## Integration & Notifications
| Test ID | Description | Status | Date | Notes |
|---------|-------------|--------|------|-------|
| TC-STOCK-018 | SM notified of new order | ✅ PASS | 2026-04-17 | Implemented missing notifications UI |
| TC-STOCK-019 | Retailer notified accepted | ✅ PASS | 2026-04-17 | Fixed strict mode issue |
| TC-STOCK-020 | Dist. notified assigned | ✅ PASS | 2026-04-17 | Fixed strict mode issue |
| TC-STOCK-022 | Retailer notified delivered | ✅ PASS | 2026-04-17 | Fixed strict mode issue |

---

## Testing Strategy & Rationale
*(For Academic/Project Review)*

The automated QA testing strategy for Sprints 2 and 3 was strictly driven by **Risk-Based Testing** and the **Minimum Viable Product (MVP)** core business flows. Peripheral edge cases (such as minor UI validations, or alternative workflows like "deny order" or "favorites") have been intentionally deferred to focus heavily on the mission-critical happy paths.

**1. Sprint 2: Promotions (E2E Validation of the Happy Path)**
Tests `TC-PROMO-001` through `TC-PROMO-010` were implemented to prove the end-to-end promotion lifecycle. We had to ensure a Promotion Manager could create a promotion, it appeared on the Retailer's wall, the Retailer could opt-in, and the PM could successfully assign a distributor. If any of these links fail, the entire Promotion module is effectively useless for revenue generation.

**2. Sprint 3: Stock Management (Core Revenue Workflows)**
Tests `TC-STOCK-001` through `TC-STOCK-017` validate the most critical flow of the application: a Stock Manager creating a product, a Retailer adding it to their cart and purchasing it, and a Distributor successfully marking it delivered on a map. These tests were prioritized because they prove the core B2B purchasing logic is completely functional.

**3. Integrations (Verifying Complex Cross-Role Triggers)**
Tests `TC-STOCK-018, 019, 020, and 022` were heavily prioritized because real-time cross-role communication is the most technically complex feature of the platform. We needed automated checks to verify that actions on one dashboard traverse the backend and instantly trigger UI modals/alerts on entirely different dashboards (Retailer, Stock Manager & Distributor).

---

## Instructions for Running Tests
1. Ensure both backend and frontend servers are running locally.
2. Open the **Testing Explorer** in VS Code.
3. Click **"Run Tests"** on the `tests/e2e/` folder or individual files.
4. Update the `Status` column in this document with ✅ PASS or ❌ FAIL.
