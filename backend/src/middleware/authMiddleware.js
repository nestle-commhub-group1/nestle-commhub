/**
 * authMiddleware.js
 *
 * Express middleware for protecting routes and restricting access by role.
 *
 * Key responsibilities:
 * - `protect`: extracts and verifies the JWT from the Authorization header,
 *   then attaches the full user object to req.user for downstream controllers
 * - `restrictTo`: checks that the authenticated user has one of the allowed roles
 *   before granting access to a particular route
 */

const jwt  = require("jsonwebtoken");
const User = require("../models/User");

/* ─── protect ────────────────────────────────────────────────────────────── */

/**
 * Middleware to protect routes by verifying the JWT token.
 *
 * Usage: app.use('/api/protected', protect, myController)
 *
 * Flow:
 *   1. Extract the token from the "Authorization: Bearer <token>" header
 *   2. Handle dev tokens in development mode (bypasses real JWT verification)
 *   3. Verify the token signature and expiry using the JWT_SECRET
 *   4. Load the user from the database and attach to req.user
 *   5. Call next() to pass control to the next middleware or controller
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Step 1: Look for the Authorization header and confirm it uses the "Bearer" scheme
    // The header format is: "Authorization: Bearer eyJhbGciOi..."
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Extract just the token part after "Bearer "
      token = req.headers.authorization.split(" ")[1];
    }

    // No token at all — the request is not authenticated
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Step 2: Dev token bypass — ONLY active in local development, never in production.
    // DevLauncher issues tokens like "dev-token-retailer" to simulate roles without login.
    if (process.env.NODE_ENV !== 'production' && token.startsWith("dev-token-")) {
      const role = token.replace("dev-token-", ""); // Extract role from token string

      // Map each role to a known test account email in the database
      const emailMap = {
        retailer:    "chamara@test.com",
        staff: "nadeeka@nestle.com",
        hq_admin:    "dilini@nestle.com",
        distributor: "kamal@distributor.com",
        promotion_manager: "sonia@nestle.com",
        stock_manager: "mahesh@nestle.com"
      };

      const email = emailMap[role];
      if (email) {
        const devUser = await User.findOne({ email });
        if (devUser) {
          req.user = devUser; // Attach the real database user to the request
          return next();      // Skip real JWT verification
        }
      }
    }

    // Step 3 & 4: Verify the real JWT token
    try {
      // jwt.verify throws if the token is expired, malformed, or signed with the wrong secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Load the full user document from MongoDB using the userId in the token payload.
      // We use the database user (not just the token payload) so we always have
      // the latest user data (e.g., if their role was changed since they logged in).
      const currentUser = await User.findById(decoded.userId);
      if (!currentUser) {
        // The user was deleted after the token was issued
        return res.status(401).json({ message: "User not found" });
      }

      // Step 5: Attach the user to the request so controllers can use req.user
      req.user = currentUser;
      next();
    } catch (err) {
      // jwt.verify throws JWTExpiredError, JsonWebTokenError, etc.
      return res.status(401).json({ message: "Invalid or expired token" });
    }

  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ message: "Server error during authentication" });
  }
};

/* ─── restrictTo ─────────────────────────────────────────────────────────── */

/**
 * Middleware factory to restrict route access to specific roles.
 *
 * Usage: router.put('/admin-only', protect, restrictTo('hq_admin'), controller)
 *        router.get('/staff-or-admin', protect, restrictTo('staff', 'hq_admin'), controller)
 *
 * Must be used AFTER `protect` because it depends on req.user being populated.
 *
 * @param {...string} roles - One or more role strings that are allowed access.
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user is set by the `protect` middleware that runs before this one.
    // If the user's role is not in the allowed list, block the request.
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }
    next(); // Role is allowed — pass to the next handler
  };
};

module.exports = {
  protect,
  restrictTo,
  authorize: restrictTo,
};
