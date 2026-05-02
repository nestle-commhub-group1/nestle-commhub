# 🏛️ Nestlé CommHub: System Logic & Architecture Report

## 1. Overview
Nestlé CommHub is a unified B2B platform designed to streamline communication, promotion management, and stock optimization between Nestlé HQ and its network of retailers and distributors.

---

## 2. User Roles & Ecosystem
The system is built on a strict Role-Based Access Control (RBAC) model:

| Role | Responsibility | Key Features |
| :--- | :--- | :--- |
| **HQ Admin** | System Governance | User Management, SLA Monitoring, Global Insights. |
| **Promotion Manager (PM)** | Campaign Growth | Smart Promotion Builder, B2B/B2C Creation, ROI Analytics. |
| **Stock Manager (SM)** | Inventory Health | Smart Ordering, HOW Status Management, Demand Forecasting. |
| **Specialized Staff** | Issue Resolution | Support Hub (Logistics, Quality, Pricing, Stockout). |
| **Retailer** | Market Execution | Promotions Hub, Issue Reporting, Stock Requests. |
| **Distributor** | Logistics Fulfillment | Delivery Tracking, Promotional Materials. |

---

## 3. Core Logical Flows

### 🔄 A. The Promotion Lifecycle
1.  **Creation**: PM creates a **B2B (Bulk)** or **B2C (Customer)** promotion.
2.  **Intelligence**: The **Smart Builder** analyzes past campaign performance (ratings/sales) to suggest top-performing templates.
3.  **Distribution**: Promotions appear in the **Retailer Promotions Hub**.
4.  **Opt-in**: Retailers opt into B2B deals or activate B2C offers in their digital shelf.
5.  **Feedback Loop**: Retailers submit sales reports and performance ratings.
6.  **Analytics**: Data feeds back into the **Insights Dashboard** for PMs to measure conversion.

### 🎫 B. The Support Hub (Smart Ticket Routing)
1.  **Reporting**: Retailer submits an issue (e.g., "Pricing Discrepancy").
2.  **Classification**: The system categorizes the ticket (Stockout, Quality, Logistics, Pricing).
3.  **Routing**: The ticket is automatically assigned to a **Specialized Staff Member** based on their category.
4.  **Resolution**: Staff updates status (Open -> In Progress -> Resolved).
5.  **SLA Tracking**: Admins monitor "Time to Resolve" to ensure compliance with Nestlé standards.

### 📦 C. Smart Stock & Inventory
1.  **Demand Analysis**: The system calculates a **Demand Score** for every product based on order history.
2.  **HOW Status**: Stock Managers mark high-risk products as **"High Overstock Warning" (HOW)**.
3.  **Smart Ordering**: Retailers receive warnings or recommendations when trying to order HOW products to prevent dead stock.

---

## 4. Technical Architecture

### **Frontend (App)**
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS (Nestlé Brand Palette: `#3D2B1F`, `#F5F3F0`)
- **Visuals**: Chart.js (Dashboards), Leaflet (Issue HeatMap)
- **State**: React Hooks + AuthContext

### **Backend (API)**
- **Runtime**: Node.js + Express
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Data Models**: User (includes geo-coordinates), Promotion, Order, Ticket, Feedback, DemandAnalytics.
- **Auth**: JWT (JSON Web Tokens).
- **Services**: Specialized Controllers for Analytics (HeatMap), Promotions, and Tickets.

---

## 5. Security & Stability
- **Environment**: All secrets managed via `.env`.
- **Validation**: Mongoose schemas enforce data integrity for all 10+ collections.
- **Seeding**: A comprehensive `seed-data.js` ensures a clean, testable environment with 50+ mock entities.
