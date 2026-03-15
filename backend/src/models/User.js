const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema({
  // ─── Common Fields ────────────────────────────────────────────────────────
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },

  password: {
    type: String,
    required: [true, "Password is required"],
  },

  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true,
  },

  role: {
    type: String,
    required: [true, "Role is required"],
    enum: [
      "retailer",
      "sales_staff",
      "regional_manager",
      "hq_admin",
      "distributor",
      "delivery_driver",
    ],
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  // ─── Retailer-Only Fields ─────────────────────────────────────────────────
  businessName: {
    type: String,
    trim: true,
  },

  businessAddress: {
    type: String,
    trim: true,
  },

  taxId: {
    type: String,
    trim: true,
  },

  // ─── Nestlé Employee-Only Fields ──────────────────────────────────────────
  employeeId: {
    type: String,
    trim: true,
  },

  department: {
    type: String,
    trim: true,
  },

  officeLocation: {
    type: String,
    trim: true,
  },

  // ─── Auth / Security Fields ───────────────────────────────────────────────
  resetPasswordToken: {
    type: String,
  },

  resetPasswordExpiry: {
    type: Date,
  },

  otpCode: {
    type: String,
  },

  otpExpiry: {
    type: Date,
  },

  otpVerified: {
    type: Boolean,
    default: false,
  },
});

// ─── Pre-Save Hook: Hash Password ─────────────────────────────────────────────
userSchema.pre("save", async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err;
  }
});

// ─── Instance Method: Compare Password ────────────────────────────────────────
/**
 * Compares a plain-text candidate password against the stored hashed password.
 * @param {string} candidatePassword - The plain-text password to verify.
 * @returns {Promise<boolean>} Resolves to true if the passwords match.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
