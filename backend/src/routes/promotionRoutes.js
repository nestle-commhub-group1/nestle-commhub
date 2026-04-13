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
const { protect } = require('../middleware/authMiddleware');

// Promotion Manager: create promotion
router.post('/', protect, createPromotion);

// All users: view all active promotions
router.get('/', protect, getAllPromotions);

// Get single promotion details
router.get('/:id', protect, getPromotionById);

// Promotion Manager: update promotion
router.put('/:id', protect, updatePromotion);

// Retailer: opt-in to promotion
router.post('/:id/opt-in', protect, retailerOptInPromotion);

// Promotion Manager: assign distributor to retailer for a promotion
router.post('/:id/assign-distributor', protect, assignDistributorToRetailer);

// Retailer: rate promotion
router.post('/:id/rate', protect, ratePromotion);

// Retailer: get their opted-in promotions
router.get('/retailer/my-promotions', protect, getRetailerPromotions);

module.exports = router;
