const express = require('express');
const router = express.Router();
const { 
  getDistributors,
  getAllUsers,
  updateUserStatus
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Get all users (Admin only)
router.get('/', protect, restrictTo('hq_admin'), getAllUsers);

// Get distributors (Available to staff/admin)
router.get('/distributors', protect, getDistributors);

// Update user status (Admin only)
router.put('/:id/status', protect, restrictTo('hq_admin'), updateUserStatus);

module.exports = router;
