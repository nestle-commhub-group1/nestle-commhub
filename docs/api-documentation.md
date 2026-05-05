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

### POST /api/tickets
Auth required: Yes (Retailer)
Create a new support ticket.

### GET /api/tickets/my
Auth required: Yes (Retailer)
View your own tickets.

### GET /api/tickets
Auth required: Yes (Staff/Admin/Distributor)
View all tickets.

### GET /api/tickets/:id
Auth required: Yes
Get single ticket details.

### PUT /api/tickets/:id/status
Auth required: Yes (Staff/Admin)
Update ticket status.

### POST /api/tickets/:id/messages
Auth required: Yes (Staff/Admin/Distributor)
Send a message in a ticket.

---

## Notifications

### GET /api/notifications
Auth required: Yes
Get all notifications for the current user.

### DELETE /api/notifications/clear
Auth required: Yes
Clear all notifications.

### PUT /api/notifications/read-all
Auth required: Yes
Mark all notifications as read.

### PUT /api/notifications/:id
Auth required: Yes
Mark a single notification as read.

---

## Promotions

### POST /api/promotions
Auth required: Yes (Promotion Manager)
Create a new promotion.

### GET /api/promotions
Auth required: Yes
Get all active promotions.

### GET /api/promotions/:id
Auth required: Yes
Get single promotion details.

### POST /api/promotions/:id/opt-in
Auth required: Yes (Retailer)
Opt-in to a promotion.

### POST /api/promotions/:id/sales-report
Auth required: Yes (Retailer)
Submit a sales report for an opted-in promotion.

### POST /api/promotions/:id/approve-reward
Auth required: Yes (Promotion Manager)
Approve reward and issue credits.

---

## Products & Orders

### GET /api/products
Auth required: Yes
Get product catalog.

### GET /api/orders
Auth required: Yes
Get order history.

---

## Analytics & Intelligence

### GET /api/analytics/dashboard
Auth required: Yes
Get dashboard analytics based on role.

### GET /api/stock/how-status
Auth required: Yes
Get "High Overstock Warning" status for products.
