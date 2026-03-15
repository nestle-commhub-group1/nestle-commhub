const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware to protect routes by verifying JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check for Authorization header and "Bearer" prefix
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // 2. Extract token
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // 3. Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Find user by userId from token payload
      const currentUser = await User.findById(decoded.userId);
      if (!currentUser) {
        return res.status(401).json({ message: "User not found" });
      }

      // 5. Attach user object to req.user for use in subsequent middleware/controllers
      req.user = currentUser;
      next();
    } catch (err) {
      // Catch JWT errors explicitly (expired or malformed)
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ message: "Server error during authentication" });
  }
};

/**
 * Middleware to restrict route access to specific roles
 * @param  {...string} roles - Allowed roles e.g., 'hq_admin', 'regional_manager'
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user is set by the `protect` middleware
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
