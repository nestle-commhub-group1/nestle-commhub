const express = require("express");
const router = express.Router();
const orderController = require("../controllers/OrderController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Retailer routes
router.post("/", protect, authorize("retailer"), orderController.placeOrder);
router.get("/my", protect, authorize("retailer"), orderController.getMyOrders);
router.put("/:id/favorite", protect, authorize("retailer"), orderController.toggleFavorite);
router.post("/:id/reorder", protect, authorize("retailer"), orderController.reorder);

// Stock Manager routes
router.get("/all", protect, authorize("stock_manager", "hq_admin"), orderController.getAllOrders);
router.put("/:id/status", protect, authorize("stock_manager", "hq_admin", "distributor"), orderController.updateOrderStatus);

// Distributor routes
router.get("/distributor", protect, authorize("distributor"), orderController.getDistributorOrders);

module.exports = router;
