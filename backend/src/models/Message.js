const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ticket",
    required: [true, "Ticket ID is required"],
  },

  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Sender ID is required"],
  },

  senderName: {
    type: String,
    required: [true, "Sender name is required"],
  },

  senderRole: {
    type: String,
    required: [true, "Sender role is required"],
  },

  message: {
    type: String,
    required: [true, "Message content is required"],
  },

  chatRoom: {
    type: String,
    default: "staff_retailer",
    enum: ["staff_retailer", "retailer_distributor", "staff_distributor"],
  },

  attachments: {
    type: [String],
    default: [],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
