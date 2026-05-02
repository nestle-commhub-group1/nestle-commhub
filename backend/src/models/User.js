/**
 * User.js
 *
 * Mongoose model for all user accounts in the system.
 *
 * Key responsibilities:
 * - Defines the shared fields every user has (name, email, password, role)
 * - Defines extra fields that only apply to retailers OR Nestlé employees
 * - Automatically hashes the password before saving to the database
 * - Provides a method to safely compare a login password against the hash
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Number of "salt rounds" for bcrypt — higher = more secure but slower.
// 10 is the industry-standard balance between security and performance.
const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema({

  /* ─── Common Fields (required for every user regardless of role) ────────── */

  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true, // Remove accidental leading/trailing spaces
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,    // Prevent two accounts with the same email
    lowercase: true, // Normalise to lowercase so "Test@test.com" === "test@test.com"
    trim: true,
  },

  password: {
    type: String,
    required: [true, "Password is required"],
    // NOTE: this stores the bcrypt hash, not the plain-text password
  },

  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true,
  },

  role: {
    type: String,
    required: [true, "Role is required"],
    // Only these roles are valid — any other value is rejected by Mongoose
    enum: [
      "retailer",    // External shop/business partners who submit tickets
      "staff",       // Nestlé staff who handle and resolve tickets (sub-category stored in staffCategory)
      "hq_admin",    // Nestlé HQ managers with full system access
      "distributor", // Third-party logistics partners handling deliveries
      "promotion_manager", // Managers who post promotions and assigned distributors
      "stock_manager", // Managers handling inventory and stock requests
    ],
  },

  isActive: {
    type: Boolean,
    default: true, // Accounts are active by default; admins can deactivate users
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  /* ─── Retailer-Only Fields ───────────────────────────────────────────────── */
  // These are only filled in when role === "retailer"; they are optional for others.

  businessName: {
    type: String,
    trim: true, // e.g., "ABC Supermarket"
  },

  businessAddress: {
    type: String,
    trim: true, // e.g., "123 Main St, Colombo"
  },

  taxId: {
    type: String,
    trim: true, // Business registration number — used to verify the retailer is legitimate
  },

  // Sprint 2: Province and District fields replacing the old single 'location' field.
  // These support geo-filtering and logistics routing in Sprint 3.
  province: {
    type: String,
    trim: true, // e.g., "Western Province"
  },

  district: {
    type: String,
    trim: true, // e.g., "Colombo"
  },

  credits: {
    type: Number,
    default: 0, // NEW: Earned credits from promotions to be used as discounts in stock requests
  },

  // Geo-location for heatmap visualization (Sri Lanka coordinates)
  latitude: {
    type: Number,
    default: null,
  },

  longitude: {
    type: Number,
    default: null,
  },

  /* ─── Nestlé Employee-Only Fields ───────────────────────────────────────── */
  // These are only filled in for staff, hq_admin, and distributor roles.
  // employeeId is cross-referenced against the ValidEmployee collection at registration
  // to ensure only real Nestlé staff can create employee accounts.

  employeeId: {
    type: String,
    trim: true, // e.g., "NES001" — must exist in the ValidEmployee seed list
  },

  department: {
    type: String,
    trim: true, // e.g., "Sales & Marketing"
  },

  officeLocation: {
    type: String,
    trim: true, // e.g., "Colombo Office"
  },

  // Staff specialisation category — only applicable to staff role.
  // Determines which ticket categories they are typically responsible for.
  staffCategory: {
    type: String,
    trim: true,
    enum: [
      "Stockout Staff",
      "Product Quality Staff",
      "Logistics Staff",
      "Pricing Staff",
      "General Staff",
    ],
  },

  /* ─── Auth / Security Fields ─────────────────────────────────────────────── */
  // Used for the password reset and OTP (one-time password) flows

  resetPasswordToken: {
    type: String, // Randomly generated token emailed to the user for password reset
  },

  resetPasswordExpiry: {
    type: Date, // Expiry timestamp — reset links are single-use and time-limited
  },

  otpCode: {
    type: String, // 6-digit OTP sent to the user's phone/email for verification
  },

  otpExpiry: {
    type: Date, // OTP codes expire quickly (typically 5-10 minutes) for security
  },

  otpVerified: {
    type: Boolean,
    default: false, // Becomes true once the user successfully verifies an OTP
  },
});

/* ─── Pre-Save Hook: Hash Password ────────────────────────────────────────── */

userSchema.pre("save", async function () {
  // Only re-hash if the password field was actually changed (or this is a new user).
  // Without this check, the already-hashed password would be hashed again on every save,
  // making it impossible to log in after a profile update.
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS); // Generate a random salt
    this.password = await bcrypt.hash(this.password, salt); // Replace plain text with the hash
  } catch (err) {
    throw err; // Bubble up to the caller so the save operation fails explicitly
  }
});

/* ─── Instance Method: Compare Password ───────────────────────────────────── */

/**
 * Compares a plain-text candidate password against the stored hashed password.
 * Used during login to validate the user's credentials.
 * @param {string} candidatePassword - The plain-text password to verify.
 * @returns {Promise<boolean>} Resolves to true if the passwords match.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  // bcrypt.compare handles the salt extraction and re-hashing internally
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
