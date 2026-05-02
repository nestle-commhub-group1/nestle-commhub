/**
 * smartStockRoutes.js
 *
 * Smart Stock Ordering endpoints.
 * Mounted at /api/stock in index.js.
 *
 * Static paths must come before /:id wildcards.
 */

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getSmartStockRecommendations,
  predictProductDemand,
  getSmartOrderSuggestion,
  calculateDemandScore,
  quickOrder,
  markProductAsHOW,
  unmarkProductFromHOW,
  getHOWProducts
} = require('../controllers/smartStockController');

// GET /api/stock/smart-recommendations
router.get('/smart-recommendations', protect, getSmartStockRecommendations);

// POST /api/stock/quick-order
router.post('/quick-order', protect, quickOrder);

// GET /api/stock/predict-demand/:productId
router.get('/predict-demand/:productId', protect, predictProductDemand);

// GET /api/stock/order-suggestion/:productId
router.get('/order-suggestion/:productId', protect, getSmartOrderSuggestion);

// POST /api/stock/calculate-demand/:productId  (admin trigger)
router.post('/calculate-demand/:productId', protect, calculateDemandScore);

// --- HOW (High-Opportunity Winner) ---
router.post('/mark-as-how',   protect, markProductAsHOW);
router.post('/unmark-as-how', protect, unmarkProductFromHOW);
router.get('/how-products',   protect, getHOWProducts);

module.exports = router;
