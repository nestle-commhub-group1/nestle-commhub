const User = require('../models/User');

const getDistributors = async (req, res) => {
  try {
    const distributors = await User.find({
      role: "distributor",
      isActive: true
    }).select("fullName email phone");
    res.json({
      success: true,
      distributors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    // Sanitise and cap field lengths to prevent oversized input
    const fullName = (req.body.fullName || '').trim().slice(0, 100);
    const phone    = (req.body.phone    || '').trim().slice(0, 20);

    if (!fullName) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, phone },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getDistributors,
  getAllUsers,
  updateUserStatus,
  updateProfile
};
