const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Note: Ensure the ValidEmployee model is created to support the Employee validation.
// For now, requiring it from models directory.
let ValidEmployee;
try {
  ValidEmployee = require("../models/ValidEmployee");
} catch (error) {
  // Graceful fallback if ValidEmployee model is not yet created
  console.warn("ValidEmployee model not found, employee validation might fail.");
}

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const registerUser = async (req, res) => {
  console.log("Request body received:", req.body);
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      phone,
      role,
      businessName,
      businessAddress,
      taxId,
      employeeId,
      department,
      officeLocation,
    } = req.body;

    // 1. Validation
    if (!fullName || !email || !password || !confirmPassword || !phone || !role) {
      return res.status(400).json({ message: "Please provide all required common fields." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const validRoles = [
      "retailer",
      "sales_staff",
      "regional_manager",
      "hq_admin",
      "distributor",
      "delivery_driver",
    ];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified." });
    }

    // Role specific validation
    if (role === "retailer") {
      if (!businessName || !businessAddress || !taxId) {
        return res
          .status(400)
          .json({ message: "Retailer role requires businessName, businessAddress, and taxId." });
      }
    }

    const employeeRoles = [
      "sales_staff",
      "regional_manager",
      "hq_admin",
      "distributor",
      "delivery_driver",
    ];

    if (employeeRoles.includes(role)) {
      if (!employeeId || !department) {
        return res
          .status(400)
          .json({ message: "Employee role requires employeeId and department." });
      }

      // 2. Check ValidEmployee collection
      if (!ValidEmployee) {
        return res.status(500).json({ message: "ValidEmployee model is not configured." });
      }

      const validEmp = await ValidEmployee.findOne({ employeeId });
      if (!validEmp) {
        return res
          .status(400)
          .json({ message: "Invalid Employee ID. Contact HQ Admin to register." });
      }

      const existingEmp = await User.findOne({ employeeId });
      if (existingEmp) {
        return res.status(400).json({ message: "This Employee ID is already registered." });
      }
    }

    // 3. Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    // 4. Create new User document
    const newUser = new User({
      fullName,
      email,
      password,
      phone,
      role,
      businessName,
      businessAddress,
      taxId,
      employeeId,
      department,
      officeLocation,
    });

    // 5. Save user to database
    try {
      await newUser.save();
    } catch (saveError) {
      console.log("Save error details:", saveError);
      return res.status(500).json({
        success: false,
        message: saveError.message
      });
    }

    // 6. Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" } // Fallback to 1d if not specified
    );

    // 7. Return 201 response
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
      },
    });
  } catch (error) {
    console.log("REGISTRATION ERROR:", error.message);
    console.log("FULL ERROR STACK:", error.stack);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // 2. Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3. Check if account is active
    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: "Your account has been deactivated. Contact HQ Admin." });
    }

    // 4. Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 5. Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" } // Fallback to 1d if not specified
    );

    // 6. Return 200 response
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
