const express = require("express");
const router = express.Router();
const productController = require("../controllers/ProductController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, productController.getProducts);
router.get("/:id", protect, productController.getProductById);

// Stock Manager only actions
router.post("/", protect, authorize("stock_manager", "hq_admin"), productController.createProduct);
router.put("/:id", protect, authorize("stock_manager", "hq_admin"), productController.updateProduct);
router.delete("/:id", protect, authorize("stock_manager", "hq_admin"), productController.deleteProduct);

module.exports = router;
