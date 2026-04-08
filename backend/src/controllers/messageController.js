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
// Sprint 2: Messaging is ONLY between assigned Staff and assigned Distributor.
// Retailers are blocked from all messaging flows.
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    // All messages are now in the staff_distributor room — the only valid channel.
    const chatRoom = 'staff_distributor';

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message content is required." });
    }

    // Retailers are not allowed to use the messaging system at all
    if (req.user.role === 'retailer') {
      return res.status(403).json({ success: false, message: "Retailers cannot send messages on tickets." });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // Only the assigned staff and the assigned distributor can message on this ticket.
    // hq_admin can also message as they may step in to manage tickets.
    const isAssignedStaff  = req.user.role === 'sales_staff' && ticket.assignedTo?.toString() === req.user._id.toString();
    const isAssignedDist   = req.user.role === 'distributor' && ticket.distributorId?.toString() === req.user._id.toString();
    const isAdmin           = req.user.role === 'hq_admin';

    if (!isAssignedStaff && !isAssignedDist && !isAdmin) {
      return res.status(403).json({ success: false, message: "Only the assigned staff or distributor can message on this ticket." });
    }

    // If no distributor is assigned, distributors cannot message yet
    if (req.user.role === 'distributor' && !ticket.distributorId) {
      return res.status(403).json({ success: false, message: "No distributor is assigned to this ticket." });
    }

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
      chatRoom,
    });

    // Notify the other party: if staff sent, notify distributor; if distributor sent, notify assigned staff
    let notificationTarget = null;
    if (req.user.role === 'distributor') {
      notificationTarget = ticket.assignedTo || ticket.escalatedTo;
    } else {
      notificationTarget = ticket.distributorId;
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
// Sprint 2: Only staff and distributors can read messages.
// Always returns the staff_distributor room regardless of query param.
const getMessages = async (req, res) => {
  try {
    // Retailers cannot access the messaging system
    if (req.user.role === 'retailer') {
      return res.status(403).json({ success: false, message: "Retailers do not have access to ticket messages." });
    }

    const chatRoom = 'staff_distributor';
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    const messages = await Message.find({ ticketId: ticket._id, chatRoom })
      .populate('senderId', 'fullName role')
      .sort({ createdAt: 1 });

    return res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    console.error("getMessages error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};




module.exports = { sendMessage, getMessages };
