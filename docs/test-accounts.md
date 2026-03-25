# Test Accounts — Nestlé CommHub
> For development and testing use only. Never commit real passwords to production.

---

## ⚡ Quick Start Commands

> ⚠️ Commands must be run from the **`backend/`** subfolder, NOT the project root.

```bash
# Step 1 — go into the backend folder
cd "/Users/malcs/Desktop/APIIT/Comercial Computing/repo-001/nestle-commhub/backend"

# Step 2 — install dependencies (first time only)
npm install

# Step 3 — reset and seed test employee IDs
npm run seed

# Step 4 — start the backend server
npm run dev
```

Then in a second terminal tab:
```bash
cd "/Users/malcs/Desktop/APIIT/Comercial Computing/repo-001/nestle-commhub/app"
npm install   # first time only
npm run dev
```

Frontend: http://localhost:5173  
Backend:  http://localhost:5001  
Dev Launcher: http://localhost:5173/dev

---

## 🔑 Universal Dev IDs (Permanent Testing Accounts)

These IDs are reset every time you run `npm run seed`, so you can always re-register with them fresh.

| Role | Employee ID | Use to test... |
|------|-------------|----------------|
| **HQ Admin** | `NES-DEV-999` | Admin dashboard, user management, SLA monitor, allocating distributors |
| **Sales Staff** | `NES-DEV-888` | Staff dashboard, ticket handling, escalations, assigning distributors |
| **Distributor** | `NES-DEV-777` | Distributor dashboard, dual chat with retailer + staff |

**How to register with these IDs:**
1. Go to http://localhost:5173/register
2. Select **Nestlé Staff** tab
3. Enter the Employee ID above (e.g. `NES-DEV-999`)
4. Fill in the rest of the form and register

**Recommended test password:** `password123`

---

## 👤 Retailer Accounts (No Employee ID needed)

Register at http://localhost:5173/register → **Retailer** tab.

| Suggested Email | Password | Purpose |
|----------------|----------|---------|
| retailer1@test.com | password123 | Submit tickets, use retailer chat |
| retailer2@test.com | password123 | Second retailer for multi-user testing |

Business details (use any for testing):
- Business Name: Test Store
- Address: 123 Test Road, Colombo
- Tax ID: TAX-TEST-001

---

## 🔧 All Valid Employee IDs (for registration)

| Employee ID | Role |
|-------------|------|
| `NES-DEV-999` | HQ Admin (**Universal Dev ID**) |
| `NES-DEV-888` | Sales Staff (**Universal Dev ID**) |
| `NES-DEV-777` | Distributor (**Universal Dev ID**) |
| `NES001` | HQ Admin |
| `NES002` | Sales Staff |
| `NES004` | Distributor |
| `NES100` | HQ Admin |
| `NES111` | HQ Admin |
| `NES200` | Sales Staff |
| `NES400` | Distributor |
| `NES123456` | Sales Staff |

---

## ♻️ Resetting Accounts

| Command | What it does |
|---------|-------------|
| `npm run seed` | Wipes all dev ID registrations + re-seeds ValidEmployee collection. Run this to get a fresh start. |
| `npm run clean` | Resets `isUsed=false` on all employee IDs without deleting registrations. |

---

## 🧪 Testing the Distributor Feature

1. Register a **Retailer** account → submit a ticket
2. Log in as **Sales Staff** (`NES-DEV-888`) → open the ticket → click **"Assign to Distributor"** → select the distributor
3. Log in as **Distributor** (`NES-DEV-777`) → see the ticket on their dashboard → open it
4. Inside the ticket you'll see **two separate chat tabs**:
   - 🛒 **Chat with Retailer** — visible to retailer + distributor only
   - 🔒 **Internal (Nestlé)** — visible to staff + distributor only

---

## 📌 Notes
- All test passwords should be `password123`
- Do not use these accounts in production
- Employee IDs are case-sensitive (e.g. `NES-DEV-999` must be typed exactly)
- The seed script completely resets the `ValidEmployee` collection each run
