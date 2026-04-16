const express = require('express');
const router = express.Router();
const { 
  getDistributors,
  getAllUsers,
  updateUserStatus,
  updateProfile
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Get all users (Admin only)
router.get('/', protect, restrictTo('hq_admin'), getAllUsers);

// Get distributors — Staff, Admin, and Promotion Manager
router.get('/distributors', protect, restrictTo('staff', 'hq_admin', 'promotion_manager'), getDistributors);

// Update own profile
router.put('/profile', protect, updateProfile);

// Update user status (Admin only)
router.put('/:id/status', protect, restrictTo('hq_admin'), updateUserStatus);

module.exports = router;
