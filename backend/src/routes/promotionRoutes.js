const express = require('express');
const router = express.Router();
const { 
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  retailerOptInPromotion,
  assignDistributorToRetailer,
  ratePromotion,
  getRetailerPromotions,
  addPromotionAttachment,
  submitSalesReport,
  sendSalesReminders,
  approveReward
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

// Promotion Manager: delete promotion
router.delete('/:id', protect, deletePromotion);

// Retailer: opt-in to promotion
router.post('/:id/opt-in', protect, retailerOptInPromotion);

// Promotion Manager: assign distributor to retailer for a promotion
router.post('/:id/assign-distributor', protect, assignDistributorToRetailer);

// Retailer: rate promotion
router.post('/:id/rate', protect, ratePromotion);

// Retailer: get their opted-in promotions
router.get('/retailer/my-promotions', protect, getRetailerPromotions);

// Promotion Manager: add attachment
router.post('/:id/attachments', protect, addPromotionAttachment);

// Retailer: submit sales report
router.post('/:id/sales-report', protect, submitSalesReport);

// Promotion Manager: approve reward and issue credits
router.post('/:id/approve-reward', protect, approveReward);

// Automated job: send sales reminders (accessible for manual trigger by PM too)
router.post('/send-sales-reminders', protect, sendSalesReminders);

module.exports = router;
