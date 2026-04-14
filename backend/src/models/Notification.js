const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },

  type: {
    type: String,
    enum: [
      "ticket_created",
      "ticket_updated",
      "ticket_assigned",
      "ticket_escalated",
      "ticket_resolved",
      "new_message",
      "promotion",
      "promotion_optin",
      "promo_material_assigned",
      "promo_delivery",
      "promotion_rating",
      "sales_report",
      "sales_reminder",
      "promo_chat",
      "warning",
    ],
    required: true,
  },

  message: {
    type: String,
    required: [true, "Notification message is required"],
  },

  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ticket",
  },

  ticketNumber: {
    type: String,
  },

  relatedPromotion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Promotion',
  },

  isRead: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
