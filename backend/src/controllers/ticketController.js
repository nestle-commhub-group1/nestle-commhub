const Ticket = require("../models/Ticket");
const User = require("../models/User");
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

// ─── POST /api/tickets ─────────────────────────────────────────────────────────
const createTicket = async (req, res) => {
  try {
    console.log("Create ticket called");
    console.log("User:", req.user?._id);
    console.log("Body:", JSON.stringify(req.body, (key, value) => key === 'attachments' ? `[${value.length} files]` : value, 2));
    const { category, priority, description, attachments } = req.body;

    if (!category || !priority || !description) {
      return res.status(400).json({
        success: false,
        message: "category, priority, and description are required.",
      });
    }

    const ticket = new Ticket({
      retailerId: req.user._id,
      category,
      priority,
      description,
      attachments: attachments || [],
    });

    // Auto-assign to primary sales staff (NES002) or fallback to any active staff
    console.log("Starting auto-assignment process...");
    let assignedStaff = await User.findOne({
      role: "sales_staff",
      employeeId: "NES002",
      isActive: true
    });

    if (!assignedStaff) {
      assignedStaff = await User.findOne({
        role: "sales_staff",
        isActive: true
      });
    }

    if (assignedStaff) {
      ticket.assignedTo = assignedStaff._id;
      console.log("Assigned to: " + assignedStaff.email);
    } else {
      console.log("No staff available, ticket unassigned");
    }

    await ticket.save();

    // Notify assigned staff
    if (ticket.assignedTo) {
      await Notification.create({
        userId: ticket.assignedTo,
        type: "ticket_assigned",
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        message: `New ticket ${ticket.ticketNumber} assigned to you from ${req.user.fullName}`,
      });
    }

    return res.status(201).json({ success: true, ticket });
  } catch (error) {
    console.error("createTicket error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/tickets/my ───────────────────────────────────────────────────────
const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ retailerId: req.user._id })
      .populate("assignedTo", "fullName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    console.error("getMyTickets error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/tickets ──────────────────────────────────────────────────────────
const getAllTickets = async (req, res) => {
  try {
    const filter = {};

    // Filter logic:
    // sales_staff only sees their own assigned tickets
    // hq_admin and distributor see ALL tickets
    if (req.user.role === "sales_staff") {
      filter.$or = [
        { assignedTo: req.user._id },
        { assignedTo: null },
        { assignedTo: { $exists: false } }
      ];
    }

    // Apply optional query filters
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.category) filter.category = req.query.category;

    const tickets = await Ticket.find(filter)
      .populate("retailerId", "fullName businessName email")
      .populate("assignedTo", "fullName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    console.error("getAllTickets error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/tickets/:id ──────────────────────────────────────────────────────
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("retailerId", "fullName businessName email phone")
      .populate("assignedTo", "fullName email")
      .populate("escalatedTo", "fullName email");

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    const userId = req.user._id.toString();
    const role = req.user.role;

    if (role === "retailer") {
      const ownerId = ticket.retailerId._id ? ticket.retailerId._id.toString() : ticket.retailerId.toString();
      if (ownerId !== userId) {
        return res.status(403).json({ success: false, message: "Not authorized to view this ticket" });
      }
    }
    // sales_staff, hq_admin, distributor can see for now

    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error("getTicketById error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PUT /api/tickets/:id/status ──────────────────────────────────────────────
const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["open", "in_progress", "resolved", "escalated"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required: open, in_progress, resolved, escalated",
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    ticket.status = status;
    ticket.updatedAt = new Date();
    if (status === "resolved") ticket.resolvedAt = new Date();

    await ticket.save();

    // Notify retailer
    await Notification.create({
      userId: ticket.retailerId,
      type: "ticket_updated",
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      message: `Your ticket ${ticket.ticketNumber} status has been updated to ${status}`,
    });

    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error("updateTicketStatus error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/tickets/:id/escalate ───────────────────────────────────────────
const escalateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    ticket.isEscalated = true;
    ticket.status = "escalated";
    ticket.escalatedAt = new Date();

    const hqAdmin = await User.findOne({ role: "hq_admin" });
    if (hqAdmin) {
      ticket.escalatedTo = hqAdmin._id;

      await Notification.create({
        userId: hqAdmin._id,
        type: "ticket_escalated",
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        message: `Ticket ${ticket.ticketNumber} has been escalated and requires your attention`,
      });
    }

    await ticket.save();

    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error("escalateTicket error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  escalateTicket,
};
