const express = require('express');
const router = express.Router();
const { 
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotion,
  retailerOptInPromotion,
  assignDistributorToRetailer,
  ratePromotion,
  getRetailerPromotions
} = require('../controllers/promotionController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Promotion Manager: create promotion
router.post('/', authenticateToken, createPromotion);

// All users: view all active promotions
router.get('/', authenticateToken, getAllPromotions);

// Get single promotion details
router.get('/:id', authenticateToken, getPromotionById);

// Promotion Manager: update promotion
router.put('/:id', authenticateToken, updatePromotion);

// Retailer: opt-in to promotion
router.post('/:id/opt-in', authenticateToken, retailerOptInPromotion);

// Promotion Manager: assign distributor to retailer for a promotion
router.post('/:id/assign-distributor', authenticateToken, assignDistributorToRetailer);

// Retailer: rate promotion
router.post('/:id/rate', authenticateToken, ratePromotion);

// Retailer: get their opted-in promotions
router.get('/retailer/my-promotions', authenticateToken, getRetailerPromotions);

module.exports = router;
