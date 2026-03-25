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
    const { message, chatRoom = "staff_retailer" } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message content is required." });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // Role-based room access check
    if (req.user.role === "distributor" && chatRoom === "staff_retailer") {
      return res.status(403).json({ success: false, message: "Distributor cannot post to staff-retailer room" });
    }
    if (req.user.role === "retailer" && chatRoom === "staff_distributor") {
      return res.status(403).json({ success: false, message: "Retailer cannot post to staff-distributor room" });
    }

    // Move ticket to in_progress when staff/admin first replies in any room
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
      chatRoom: chatRoom,
    });

    // Notify appropriate party based on room
    let notificationTarget = null;
    if (chatRoom === "staff_retailer") {
      notificationTarget = req.user.role === "retailer" ? ticket.assignedTo : ticket.retailerId;
    } else if (chatRoom === "retailer_distributor") {
      notificationTarget = req.user.role === "retailer" ? ticket.distributorId : ticket.retailerId;
    } else if (chatRoom === "staff_distributor") {
      notificationTarget = req.user.role === "distributor" ? ticket.assignedTo || ticket.escalatedTo : ticket.distributorId;
    }

    if (notificationTarget) {
      await Notification.create({
        userId: notificationTarget,
        type: "new_message",
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        message: `${req.user.fullName} sent a message on ticket ${ticket.ticketNumber}`,
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
    const { chatRoom = "staff_retailer" } = req.query;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    // Privacy logic
    if (req.user.role === "distributor" && chatRoom === "staff_retailer") {
      return res.status(403).json({ success: false, message: "Distributors cannot see staff-retailer chat" });
    }
    if (req.user.role === "retailer" && chatRoom === "staff_distributor") {
      return res.status(403).json({ success: false, message: "Retailers cannot see staff-distributor internal chat" });
    }

    const messages = await Message.find({ ticketId: ticket._id, chatRoom })
      .sort({ createdAt: 1 });

    return res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    console.error("getMessages error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};




module.exports = { sendMessage, getMessages };
