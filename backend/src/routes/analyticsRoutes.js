const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getPromotionConversionRates,
  getLowStockAlerts,
  getTopRetailersByVolume,
  getMyOrderHistory,
  getMyTopProducts,
  getMyPerformanceVsAverage,
  getPromotionsSummary,
  getPromotionsList,
  getFeedbackSentiment,
  getStockTrend,
  getStockManagerSummary,
  getProductsList,
  getFulfillmentByRegion,
  getMyFeedbackSentiment,
} = require("../controllers/analyticsController");

/* ─── Admin / PM / Staff routes ───────────────────────────────────────────── */

// GET /api/analytics/conversions
router.get("/conversions", protect, getPromotionConversionRates);

// GET /api/analytics/low-stock?period=30d&region=Western
router.get("/low-stock", protect, getLowStockAlerts);

// GET /api/analytics/top-retailers?period=30d&region=Western
router.get("/top-retailers", protect, getTopRetailersByVolume);

// GET /api/analytics/summary?period=30d
router.get("/summary", protect, getPromotionsSummary);

// GET /api/analytics/promotions
router.get("/promotions", protect, getPromotionsList);

// GET /api/analytics/feedback
router.get("/feedback", protect, getFeedbackSentiment);

// GET /api/analytics/stock?period=30d
router.get("/stock", protect, getStockTrend);

/* ─── Stock Manager routes ────────────────────────────────────────────────── */

// GET /api/analytics/sm-summary?period=30d
router.get("/sm-summary", protect, getStockManagerSummary);

// GET /api/analytics/products?period=30d
router.get("/products", protect, getProductsList);

// GET /api/analytics/fulfillment?period=30d
router.get("/fulfillment", protect, getFulfillmentByRegion);

/* ─── Retailer-only routes ────────────────────────────────────────────────── */

// GET /api/analytics/my-orders?period=30d
router.get("/my-orders", protect, getMyOrderHistory);

// GET /api/analytics/my-products?period=30d
router.get("/my-products", protect, getMyTopProducts);

// GET /api/analytics/my-performance?period=30d
router.get("/my-performance", protect, getMyPerformanceVsAverage);

// GET /api/analytics/my-feedback
router.get("/my-feedback", protect, getMyFeedbackSentiment);
// GET /api/analytics/heatmap
const { getHeatMapData } = require("../controllers/analyticsController");
router.get("/heatmap", protect, getHeatMapData);

module.exports = router;
