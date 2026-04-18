const Notification = require("../models/Notification");

// ─── GET /api/notifications ────────────────────────────────────────────────────
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.status(200).json({ success: true, unreadCount, notifications });
  } catch (error) {
    console.error("getMyNotifications error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/notifications/:id ───────────────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error("markAsRead error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/notifications/read-all ──────────────────────────────────────────
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("markAllAsRead error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE /api/notifications/clear ──────────────────────────────────────────
const clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });

    return res.status(200).json({ success: true, message: "All notifications cleared" });
  } catch (error) {
    console.error("clearNotifications error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead, clearNotifications };
