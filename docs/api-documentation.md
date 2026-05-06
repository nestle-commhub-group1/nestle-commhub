# API Documentation — Nestlé CommHub
> Backend: Node.js + Express | Database: MongoDB
> Endpoints are grouped by feature. New entries are never removed.

---

## Auth Endpoints

### POST /api/auth/register
Auth required: No
Request body:
- `fullName`: String (required)
- `email`: String (required)
- `password`: String (required, min 8 chars)
- `confirmPassword`: String (required)
- `phone`: String (required)
- `role`: String (required) — retailer, sales_staff, regional_manager, hq_admin, distributor, delivery_driver
- `businessName`: String (required for retailer)
- `businessAddress`: String (required for retailer)
- `taxId`: String (required for retailer)
- `employeeId`: String (required for staff roles)
- `department`: String (required for staff roles)
- `officeLocation`: String (optional)

Response 201:
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "jwt_token",
  "user": { "id": "...", "fullName": "...", "email": "...", "role": "...", "phone": "..." }
}
```

### POST /api/auth/login
Auth required: No
Request body:
- `email`: String (required)
- `password`: String (required)

Response 200:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token",
  "user": { "id": "...", "fullName": "...", "email": "...", "role": "...", "phone": "..." }
}
```

Error responses:
- 400: Validation error
- 401: Invalid email or password
- 403: Account deactivated

---

## Tickets

*(No endpoints documented yet)*

---

## Notifications

*(No endpoints documented yet)*

---
