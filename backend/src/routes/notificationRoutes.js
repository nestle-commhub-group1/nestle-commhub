const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");

// GET /api/notifications — get all notifications for current user
router.get("/", protect, getMyNotifications);

// PUT /api/notifications/read-all — mark all as read (must be before /:id)
router.put("/read-all", protect, markAllAsRead);

// PUT /api/notifications/:id — mark single notification as read
router.put("/:id", protect, markAsRead);

module.exports = router;
