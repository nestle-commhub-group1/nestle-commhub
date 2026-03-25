const Message = require("../models/Message");
const Ticket = require("../models/Ticket");
const Notification = require("../models/Notification");

// ─── Helper: check ticket access permission ────────────────────────────────────
const hasTicketAccess = (ticket, user) => {
  if (user.role === "hq_admin" || user.role === "distributor") return true;
  if (user.role === "retailer") {
    return ticket.retailerId.toString() === user._id.toString();
  }
  if (user.role === "sales_staff") {
    return ticket.assignedTo && ticket.assignedTo.toString() === user._id.toString();
  }
  return false;
};

// ─── POST /api/tickets/:id/messages ───────────────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    console.log("sendMessage called");
    console.log("Ticket ID:", req.params.id);
    console.log("Body:", req.body);
    console.log("User:", req.user?.email);

    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message content is required." });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    // Simplified permission check: any auth user who can find the ticket can message for now
    // (As requested to resolve messaging issues before tightening security)

    // Move ticket to in_progress when staff/admin first replies
    if (ticket.status === "open" && req.user.role !== "retailer") {
      ticket.status = "in_progress";
      ticket.updatedAt = new Date();
      await ticket.save();
    }

    const newMessage = await Message.create({
      ticketId: ticket._id,
      senderId: req.user._id,
      senderName: req.user.fullName,
      senderRole: req.user.role,
      message: message.trim(),
    });

    // Notify the other party
    if (req.user.role === "retailer" && ticket.assignedTo) {
      await Notification.create({
        userId: ticket.assignedTo,
        type: "new_message",
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        message: `${req.user.fullName} sent a message on ticket ${ticket.ticketNumber}`,
      });
    } else if (req.user.role !== "retailer") {
      await Notification.create({
        userId: ticket.retailerId,
        type: "new_message",
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        message: `${req.user.fullName} replied to your ticket ${ticket.ticketNumber}`,
      });
    }

    return res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    console.error("sendMessage error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/tickets/:id/messages ────────────────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    if (!hasTicketAccess(ticket, req.user)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const messages = await Message.find({ ticketId: ticket._id }).sort({ createdAt: 1 });

    return res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    console.error("getMessages error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { sendMessage, getMessages };
};

module.exports = { sendMessage, getMessages };
