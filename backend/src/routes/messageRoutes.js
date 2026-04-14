const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getPromotionMessages, 
  sendPromotionMessage 
} = require('../controllers/messageController');

// GET messages for a specific promotion chat
router.get('/promo/:id', protect, getPromotionMessages);

// POST a message to a promotion chat
router.post('/promo/:id', protect, sendPromotionMessage);

module.exports = router;
