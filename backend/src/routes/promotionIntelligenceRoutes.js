const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getTopPerformingPromotions,
  duplicatePromotion
} = require('../controllers/promotionIntelligenceController');

router.get('/top-performers', protect, getTopPerformingPromotions);
router.post('/duplicate', protect, duplicatePromotion);

module.exports = router;
