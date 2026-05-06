const mongoose = require('mongoose');
const { Schema } = mongoose;

const otpSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  hashedOtp: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  purpose: { type: String, enum: ['login', 'forgot_password'], required: true },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 300 }
});

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
