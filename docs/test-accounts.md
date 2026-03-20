# Test Accounts — Nestlé CommHub
> For development and testing use only.
> Never commit real passwords to production.

---

## Retailer Accounts

| Name | Email | Password | Role |
|------|-------|----------|------|
| Chamara Perera | chamara@test.com | password123 | Retailer |
| Dilshan Fernando | dilshan@test.com | password123 | Retailer |

Business details for Chamara:
- Business: Perera Grocery
- Address: 123 Kandy Road
- Tax ID: TAX123456

---

## Nestlé Staff Accounts

| Name | Email | Password | Role | Employee ID |
|------|-------|----------|------|-------------|
| Dilini Fernando | dilini@nestle.com | password123 | Sales Staff | NES002 |
| Admin User | admin@nestle.com | password123 | HQ Admin | NES001 |
| Kamal Jayawardena | kamal@distributor.com | password123 | Distributor | NES004 |

---

## Valid Employee IDs (for registration)

| Employee ID | Role |
|-------------|------|
| NES001 | HQ Admin |
| NES002 | Sales Staff |
| NES004 | Distributor |
| NES100 | HQ Admin |
| NES200 | Sales Staff |
| NES400 | Distributor |
| NES123456 | Sales Staff |

---

## Quick Access (Dev Launcher)
URL: http://localhost:5173/dev

---

## Notes
- All passwords are password123 for testing
- Do not use these accounts in production
- Run npm run seed to reset employee IDs
