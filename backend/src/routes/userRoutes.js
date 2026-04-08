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

// Get distributors — Staff and Admin only (retailers must not see distributor contact info)
router.get('/distributors', protect, restrictTo('sales_staff', 'hq_admin'), getDistributors);

// Update own profile
router.put('/profile', protect, updateProfile);

// Update user status (Admin only)
router.put('/:id/status', protect, restrictTo('hq_admin'), updateUserStatus);

module.exports = router;
