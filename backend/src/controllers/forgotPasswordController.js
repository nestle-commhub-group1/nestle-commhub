const User = require('../models/User');
const bcrypt = require('bcryptjs');

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: "No account found with that email" });
    }

    if (!user.phoneNumber) {
      return res.status(400).json({ message: "No phone number on file. Please contact your administrator." });
    }

    const phoneStr = user.phoneNumber.toString();
    const maskedPhone = phoneStr.length > 4 
      ? '*'.repeat(phoneStr.length - 4) + phoneStr.slice(-4) 
      : phoneStr;

    return res.status(200).json({
      message: "OTP will be sent to your registered number",
      maskedPhone,
      userId: user._id
    });
    
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { userId, resetToken, newPassword } = req.body;

    if (!userId || !resetToken || !newPassword) {
      return res.status(400).json({ message: "userId, resetToken, and newPassword are required" });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Matching against User schema fields (resetPasswordToken, resetPasswordExpiry)
    if (user.resetPasswordToken !== resetToken || user.resetPasswordExpiry <= Date.now()) {
      return res.status(400).json({ message: "Reset token expired. Please try again." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;

    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
    
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword
};
