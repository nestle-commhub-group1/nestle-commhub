const crypto = require('crypto');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

const verifyOTP = (inputOtp, hashedOtp) => {
  const inputHash = hashOTP(inputOtp);
  return inputHash === hashedOtp;
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP
};
