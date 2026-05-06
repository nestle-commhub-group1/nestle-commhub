const crypto = require('crypto');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateOTP, hashOTP, verifyOTP: verifyOTPUtil } = require('../utils/otpGenerator');

const sendOTP = async (req, res) => {
  try {
    const userId = req.user._id;
    const { purpose } = req.body;

    if (!purpose || !['login', 'forgot_password'].includes(purpose)) {
      return res.status(400).json({ message: "Invalid purpose" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.phoneNumber) {
      return res.status(400).json({ message: "No phone number on file. Please update your profile first." });
    }

    const plainOtp = generateOTP();
    const hashed = hashOTP(plainOtp);

    await OTP.deleteMany({ userId, purpose });

    const newOtpDoc = new OTP({
      userId,
      hashedOtp: hashed,
      phoneNumber: user.phoneNumber,
      purpose
    });
    
    await newOtpDoc.save();

    // Forward to OTP microservice
    const microserviceUrl = process.env.OTP_MICROSERVICE_URL + '/send-otp';
    try {
      const response = await fetch(microserviceUrl, {
        method: 'POST',
        headers: {
          'x-service-secret': process.env.MICROSERVICE_SECRET,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: user.phoneNumber, otp: plainOtp })
      });

      if (!response.ok) {
        throw new Error('Microservice responded with an error');
      }

      return res.status(200).json({ message: "OTP sent to your registered number" });
    } catch (microserviceError) {
      // If microservice fails: delete the OTP document
      await OTP.findByIdAndDelete(newOtpDoc._id);
      return res.status(502).json({ message: "Failed to send OTP. Please try again." });
    }

  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const userId = req.user._id;
    const { otp, purpose } = req.body;

    if (!otp || !purpose) {
      return res.status(400).json({ message: "OTP and purpose are required" });
    }

    const otpDoc = await OTP.findOne({ userId, purpose });
    if (!otpDoc) {
      return res.status(400).json({ message: "OTP expired or not found. Please request a new one." });
    }

    if (otpDoc.attempts >= 3) {
      return res.status(429).json({ message: "Too many failed attempts. Please request a new OTP." });
    }

    const isValid = verifyOTPUtil(otp, otpDoc.hashedOtp);

    if (!isValid) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(400).json({ 
        message: "Invalid OTP", 
        attemptsLeft: 3 - otpDoc.attempts 
      });
    }

    // Valid OTP
    await OTP.findByIdAndDelete(otpDoc._id);

    if (purpose === 'forgot_password') {
      const token = crypto.randomBytes(32).toString('hex');
      const user = await User.findById(userId);
      
      if (user) {
        user.resetPasswordToken = token;
        user.resetPasswordExpiry = Date.now() + 600000;
        await user.save();
      }

      return res.status(200).json({ success: true, resetToken: token, userId });
    }

    if (purpose === 'login') {
      return res.status(200).json({ success: true, message: "OTP verified successfully" });
    }

    // Fallback if purpose doesn't match login or forgot_password, 
    // though validated in sendOTP, verifyOTP body might have unhandled purposes.
    return res.status(400).json({ message: "Invalid purpose" });

  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  sendOTP,
  verifyOTP
};
