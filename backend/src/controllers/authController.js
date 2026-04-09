/**
 * authController.js
 *
 * Handles user registration and login for all roles.
 *
 * Key responsibilities:
 * - Validates input fields and enforces role-specific requirements
 * - Verifies employee IDs against the ValidEmployee seed list before allowing staff registration
 * - Delegates password hashing to the User model's pre-save hook
 * - Issues JWT tokens upon successful registration or login
 */

const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// The ValidEmployee model is optional — if it doesn't exist yet (e.g., before seeding),
// we load it gracefully rather than crashing the whole server on startup.
let ValidEmployee;
try {
  ValidEmployee = require("../models/ValidEmployee");
} catch (error) {
  console.warn("ValidEmployee model not found, employee validation might fail.");
}

/* ─── Helper: Validate Email Format ─────────────────────────────────────── */

// Simple regex check — rejects obvious non-emails like "notanemail" or "@test"
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/* ─── POST /api/auth/register ────────────────────────────────────────────── */

const registerUser = async (req, res) => {
  console.log("-----------------------------------------");
  console.log("📍 REGISTRATION REQUEST RECEIVED");
  console.log("📍 NODE_ENV:", process.env.NODE_ENV);
  
  // Log registration attempts in dev only — never log passwords in production
  if (process.env.NODE_ENV !== 'production') {
    const safe = { ...req.body, password: '[REDACTED]', confirmPassword: '[REDACTED]' };
    console.log("📍 Payload:", safe);
  }
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      phone,
      role,
      // Retailer-only fields
      businessName,
      businessAddress,
      taxId,
      province,
      district,
      // Employee-only fields
      employeeId,
      officeLocation,
      staffCategory,
    } = req.body;

    /* ── Step 1: Common field validation ────────────────────────────────── */

    if (!fullName || !email || !password || !confirmPassword || !phone || !role) {
      return res.status(400).json({ message: "Please provide all required common fields." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    // Ensure both password fields match before proceeding
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // Prevent submission of arbitrary role values from modified requests
    const validRoles = ["retailer", "staff", "hq_admin", "distributor"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified." });
    }

    /* ── Step 2: Role-specific field validation ───────────────────────── */

    // Retailers must supply business details so they can be identified
    if (role === "retailer") {
      if (!businessName || !businessAddress || !taxId) {
        return res.status(400).json({ message: "Retailer role requires businessName, businessAddress, and taxId." });
      }
      // Province and district are required for geo-filtering (Sprint 2)
      if (!province || !district) {
        return res.status(400).json({ message: "Province and district are required for retailer registration." });
      }
    }

    // Nestlé employees (staff, admin, distributor) must supply their employee ID
    const employeeRoles = ["staff", "hq_admin", "distributor"];
    if (employeeRoles.includes(role)) {
      if (!employeeId) {
        return res.status(400).json({ message: "Employee role requires employeeId." });
      }

      // Staff must also supply their specialisation category
      if (role === "staff" && !staffCategory) {
        return res.status(400).json({ message: "Staff must select a staff category." });
      }

      /* ── Step 3: Employee ID verification ────────────────────────────── */

      const trimmedEmpId = (employeeId || "").trim();
      const isDevMode    = process.env.NODE_ENV === "development";
      const devId        = (process.env.DEV_EMPLOYEE_ID || "").trim();

      // DEV BYPASS: If running in development and the submitted ID matches
      // DEV_EMPLOYEE_ID, skip the DB lookup entirely so testers can register
      // unlimited accounts without re-seeding or worrying about isUsed flags.
      const usingDevId = isDevMode && devId && trimmedEmpId.toUpperCase() === devId.toUpperCase();

      if (!usingDevId) {
        // PRODUCTION PATH: verify against the ValidEmployee seed collection
        if (!ValidEmployee) {
          return res.status(500).json({ message: "ValidEmployee model is not configured." });
        }

        console.log(`[Register] Looking up employeeId: "${trimmedEmpId}" role: "${role}"`);

        // Case-insensitive lookup — "NES001" matches "nes001", "Nes001", etc.
        const validEmp = await ValidEmployee.findOne({
          employeeId: { $regex: `^${trimmedEmpId.replace(/-/g, '\\-')}$`, $options: 'i' }
        });

        console.log(`[Register] ValidEmployee lookup result:`, validEmp ? `Found (isUsed=${validEmp.isUsed})` : 'NOT FOUND');

        if (!validEmp) {
          return res.status(400).json({ message: `Invalid Employee ID "${trimmedEmpId}". Contact HQ Admin to register.` });
        }

        if (validEmp.isUsed) {
          return res.status(400).json({ message: `Employee ID "${trimmedEmpId}" has already been used to register an account.` });
        }

        if (validEmp.role !== role) {
          return res.status(400).json({ message: `Employee ID "${trimmedEmpId}" is for role "${validEmp.role}", but you selected "${role}".` });
        }

        // Extra guard: check the User collection too, in case of data inconsistency
        const existingEmp = await User.findOne({ employeeId: trimmedEmpId });
        if (existingEmp) {
          return res.status(400).json({ message: `Employee ID "${trimmedEmpId}" is already registered. Run npm run seed to reset.` });
        }
      } else {
        // DEV BYPASS ACTIVE: log and continue, no DB check, no isUsed restriction
        console.log(`[Register] ⚡ Dev bypass active — skipping ValidEmployee check for ID "${trimmedEmpId}"`);
      }
    }

    /* ── Step 4: Check if email is already taken ──────────────────────── */

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    /* ── Step 5: Create and save the new user ─────────────────────────── */

    // The password is NOT hashed here — the User model's pre-save hook handles that
    // automatically before the document is written to the database.
    console.log("📍 Step 5: Creating User document...");
    const newUser = new User({
      fullName, email, password, phone, role,
      businessName, businessAddress, taxId, province, district,
      employeeId, officeLocation, staffCategory,
    });

    console.log("📍 Saving user to MongoDB...");
    try {
      await newUser.save();
      console.log("✅ User saved successfully. ID:", newUser._id);

      // Only mark the ID as used when using a real (non-dev) employee ID
      const usingDevBypass = process.env.NODE_ENV === 'development' &&
        (employeeId || '').trim().toUpperCase() === (process.env.DEV_EMPLOYEE_ID || '').trim().toUpperCase();

      if (employeeRoles.includes(role) && ValidEmployee && !usingDevBypass) {
        const trimmedEmpId = (employeeId || "").trim();
        await ValidEmployee.findOneAndUpdate(
          { employeeId: { $regex: `^${trimmedEmpId.replace(/-/g, '\\-')}$`, $options: 'i' } },
          { isUsed: true }
        );
        console.log(`[Register] Marked employeeId "${trimmedEmpId}" as used`);
      }
    } catch (saveError) {
      console.log("Save error details:", saveError);
      return res.status(500).json({ success: false, message: saveError.message });
    }

    /* ── Step 6: Issue a JWT token ────────────────────────────────────── */

    // The token payload contains just enough info to identify the user on later requests.
    // The frontend stores this token in localStorage and sends it with every API call.
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" } // Default to 1 day if not configured
    );

    /* ── Step 7: Respond with success ─────────────────────────────────── */

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      // Return only safe, non-sensitive user fields to the frontend
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
      },
    });

  } catch (error) {
    console.error("⛔ [authController] Unexpected registration error:", error);
    return res.status(500).json({ success: false, message: "Unexpected server error: " + error.message });
  }
};

/* ─── POST /api/auth/login ───────────────────────────────────────────────── */

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    /* ── Step 1: Input validation ─────────────────────────────────────── */

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    /* ── Step 2: Find the user by email ───────────────────────────────── */

    // Always lookup by lowercase email to handle case differences at registration vs login
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return a generic message — don't reveal whether the email exists
      return res.status(401).json({ message: "Invalid email or password" });
    }

    /* ── Step 3: Check account is active ─────────────────────────────── */

    // Admins can deactivate accounts; deactivated users cannot log in
    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated. Contact HQ Admin." });
    }

    /* ── Step 4: Verify the password ──────────────────────────────────── */

    // comparePassword uses bcrypt internally — no need to hash the candidate here
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    /* ── Step 5: Issue a JWT token ────────────────────────────────────── */

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    /* ── Step 6: Respond with success ─────────────────────────────────── */

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });

  } catch (error) {
    console.error("Error in loginUser:", error);
    return res.status(500).json({ message: "Server error during login." });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
