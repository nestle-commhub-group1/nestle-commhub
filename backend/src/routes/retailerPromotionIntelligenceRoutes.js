/**
 * retailerPromotionIntelligenceRoutes.js
 *
 * Routes for the Retailer Smart Promotions feature.
 * Mounted at /api/retailer-promo-intel
 */

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getRetailerTopPromotions,
  toggleNotification,
  getNotificationStatus,
  getSimilarCurrentPromotions,
} = require('../controllers/retailerPromotionIntelligenceController');

// NOTE: static paths must be before /:id to avoid Express treating them as params
router.get('/favorites',            protect, getRetailerTopPromotions);
router.get('/similar',              protect, getSimilarCurrentPromotions);
router.get('/notification-status',  protect, getNotificationStatus);
router.post('/:id/notify-toggle',   protect, toggleNotification);

module.exports = router;
