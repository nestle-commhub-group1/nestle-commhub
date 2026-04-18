# Nestlé CommHub – QA Automation Test Definitions (40 Cases)

## Sprint 2: Promotion Distribution System (14 Cases)
1. **TC-VIEW-001**: Verify Retailers can access and view the active Promotions Wall.
2. **TC-VIEW-002**: Confirm promotion cards display accurate titles and descriptions from the database.
3. **TC-VIEW-003**: Ensure each promotion clearly displays its valid date range (Start - End).
4. **TC-VIEW-004**: Validate that the search bar correctly filters the promotions list by title.
5. **TC-CREATE-001**: Validate that Promotion Managers can successfully publish a new campaign with a valid title and discount.
6. **TC-CREATE-002**: Ensure the system prevents campaign creation if the title field is left blank.
7. **TC-CREATE-003**: Confirm that campaigns cannot be created with an end date in the past.
8. **TC-CREATE-004**: Verify creation of 'Tiered' (bundled) promotions with multiple product associations.
9. **TC-CREATE-005**: Check that the promotion creation form includes a functional asset upload area for PDFs/Images.
10. **TC-CREATE-006**: Positive RBAC: Verify that Retailers are blocked from accessing the Promotion Creation URL.
11. **TC-NOTIF-001**: Ensure the notification bell icon is visible to Retailers upon new promotion publication.
12. **TC-NOTIF-002**: Confirm the unread notification badge count increases when a new promotion is released.
13. **TC-NOTIF-003**: Verify Promotion Managers can view and manage their own list of published campaigns.
14. **TC-NOTIF-004**: Validate that Retailers can successfully 'Opt In' to a promotion and see the status change to 'Opted In'.

## Sprint 2: Stock Management & Order Lifecycle (21 Cases)
1. **TC-STOCK-001**: Verify Retailers can add products to the cart and submit a valid stock request.
2. **TC-STOCK-002**: Validate application of a 5% bulk discount when ordering 500+ units.
3. **TC-STOCK-003**: Validate application of a 10% bulk discount when ordering 1000+ units.
4. **TC-STOCK-004**: Validate application of a 15% bulk discount when ordering 1500+ units.
5. **TC-STOCK-005**: Confirm the shopping cart correctly calculates the subtotal before and after discounts.
6. **TC-STOCK-006**: Ensure every submitted order is assigned a unique alphanumeric Reference ID.
7. **TC-STOCK-007**: Verify the 'Confirm Order' button is disabled or hidden when the shopping cart is empty.
8. **TC-STOCK-008**: Validate that the system rejects or auto-corrects orders with a zero or negative quantity.
9. **TC-VIEW-STOCK-001**: Verify Retailers can view their historical orders in the 'Order History' tab.
10. **TC-VIEW-STOCK-002**: Ensure the stock request search bar filters products by name in real-time.
11. **TC-VIEW-STOCK-003**: Verify Stock Managers can access the 'Manage Orders' global dashboard.
12. **TC-VIEW-STOCK-004**: Confirm visibility of 'Limited Stock' indicators when inventory falls below thresholds.
13. **TC-APPROVE-001**: Validate that Stock Managers can move a 'Pending' order to 'Accepted' status.
14. **TC-APPROVE-002**: Verify that Stock Managers can 'Reject' an order with an optional reason.
15. **TC-APPROVE-003**: Confirm that accepted orders are automatically assigned to a local distributor.
16. **TC-APPROVE-004**: RBAC Check: Ensure Retailers cannot access the high-level Order Management routes.
17. **TC-APPROVE-005**: Verify the system handles high-volume orders with 5+ different product lines correctly.
18. **TC-DELIVER-001**: Confirm Distributors can log in and view their specific list of assigned delivery tasks.
19. **TC-DELIVER-002**: Verify the presence of the 'Mark Delivered' action for active delivery tasks.
20. **TC-DELIVER-003**: Confirm that clicking 'Mark Delivered' updates the order status to 'delivered' globally.
21. **TC-DELIVER-004**: Verify Retailers can track the real-time status of their orders from their own dashboard.

## Sprint 2: Feedback & Performance Monitoring (5 Cases)
1. **TC-FEEDBACK-001**: Validate Retailers can submit star ratings and text reviews for opted-in promotions.
2. **TC-FEEDBACK-002**: Verify Retailers can report actual units sold to trigger performance rewards.
3. **TC-FEEDBACK-003**: Ensure star ratings persist and remain visible to the Retailer after submission.
4. **TC-FEEDBACK-004**: Validate the system prevents submission of negative sales figures in performance reports.
5. **TC-FEEDBACK-005**: Confirm Promotion Managers can view aggregated retailer feedback in the 'Campaigns Overview' dashboard.

## Sprint 3: Promotion Rewards & Credit System (5 Cases)
1. **TC-REWARD-001**: Verify Promotion Managers can manually approve sales reports and issue credits to retailers.
2. **TC-REWARD-002**: Confirm credits are correctly added to the retailer's "Rewards Wallet" balance upon approval.
3. **TC-REWARD-003**: Validate the 1:1 reward ratio (e.g., reporting 500 units sold results in 500 credits).
4. **TC-REWARD-004**: Verify Retailers can apply their earned credit balance as a discount during the stock request checkout process.
5. **TC-REWARD-005**: Ensure the final order total is correctly calculated after applying both bulk discounts and credit-based rewards.
 