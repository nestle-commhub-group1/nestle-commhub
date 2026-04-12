/**
 * ticketController.js
 *
 * Handles all CRUD operations and lifecycle actions for support tickets.
 *
 * Key responsibilities:
 * - Creates tickets and auto-assigns them to sales staff
 * - Enforces role-based read access (retailers see their own, staff see assigned, admin sees all)
 * - Manages ticket status updates and escalation to HQ Admin
 * - Allocates tickets to distributors for logistics handling
 */

const Ticket       = require("../models/Ticket");
const User         = require("../models/User");
const Notification = require("../models/Notification");

/* ─── Helper: Check if a user has permission to view a ticket ────────────── */

// Returns true if the user is allowed to see this ticket based on their role.
// hq_admin and distributor have broad access; retailers and staff have scoped access.
const hasTicketAccess = (ticket, user) => {
  if (user.role === "hq_admin") return true;
  if (user.role === "retailer") {
    // Retailers can only see tickets they personally submitted
    return ticket.retailerId.toString() === user._id.toString();
  }
  if (user.role === "staff") {
    // Sales staff can only see tickets assigned specifically to them
    return ticket.assignedTo && ticket.assignedTo.toString() === user._id.toString();
  }
  if (user.role === "distributor") {
    // Distributors can only see tickets allocated to them — not all tickets
    return ticket.distributorId?.toString() === user._id.toString();
  }
  return false;
};

/* ─── POST /api/tickets ───────────────────────────────────────────────────── */

const createTicket = async (req, res) => {
  try {
    // Dev-only debug log — never logs full bodies in production
    if (process.env.NODE_ENV !== 'production') {
      console.log("Create ticket called, user:", req.user?._id);
    }

    const { category, description, attachments, priority } = req.body;

    if (!category || !description) {
      return res.status(400).json({
        success: false,
        message: "category and description are required.",
      });
    }

    // Create the ticket document — ticketNumber and slaDeadline are set automatically
    // by the pre-save hook in Ticket.js (no need to set them manually here).
    // Priority is left out for retailer submissions — it defaults to 'low' in the schema.
    // Only HQ Admin and Sales Staff can set/change priority after creation.
    const ticketData = {
      retailerId:  req.user._id,
      category,
      description,
      attachments: attachments || [],
    };

    // If the submitter is staff/admin AND they explicitly sent a priority, honour it.
    // Otherwise, do not include priority — the schema default ('low') applies.
    if (req.user.role !== 'retailer' && priority) {
      ticketData.priority = priority;
    }

    const ticket = new Ticket(ticketData);

    /* ── Auto-assignment logic ─────────────────────────────────────────── */

    // Map category to staff category
    const categoryToStaffMap = {
      stock_out: "Stockout Staff",
      product_quality: "Product Quality Staff",
      logistics_delay: "Product Quality Staff",
      pricing_issue: "General Staff",
      other: "General Staff"
    };

    const requiredStaffCategory = categoryToStaffMap[category] || "General Staff";
    console.log("Starting auto-assignment process for:", requiredStaffCategory);

    // Find staff with matching category
    let assignedStaff = await User.findOne({
      role: "staff",
      staffCategory: requiredStaffCategory,
      isActive: true
    });

    if (!assignedStaff) {
      // Fallback
      assignedStaff = await User.findOne({ role: "staff", isActive: true });
      if (!assignedStaff) {
        return res.status(400).json({ success: false, message: `No active staff available for ${requiredStaffCategory}` });
      }
    }

    ticket.assignedTo = assignedStaff._id;
    console.log("Assigned to: " + assignedStaff.email);

    await ticket.save();

    // Notify the assigned staff member so they know a new ticket is waiting
    if (ticket.assignedTo) {
      await Notification.create({
        userId:       ticket.assignedTo,
        type:         "ticket_assigned",
        ticketId:     ticket._id,
        ticketNumber: ticket.ticketNumber,
        message:      `New ticket ${ticket.ticketNumber} assigned to you from ${req.user.fullName}`,
      });
    }

    return res.status(201).json({ success: true, ticket });
  } catch (error) {
    console.error("createTicket error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─── GET /api/tickets/my ─────────────────────────────────────────────────── */

// Returns only the tickets submitted by the currently logged-in retailer.
// Used on the "My Tickets" page in the retailer dashboard.
const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ retailerId: req.user._id })
      .populate("assignedTo", "fullName email") // Include staff name and email for display
      .sort({ createdAt: -1 });                 // Newest tickets first

    return res.status(200).json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    console.error("getMyTickets error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─── GET /api/tickets ────────────────────────────────────────────────────── */

// Returns a filtered list of tickets based on the requesting user's role.
// Role-based filtering prevents staff from seeing each other's tickets
// and prevents distributors from seeing tickets not allocated to them.
const getAllTickets = async (req, res) => {
  try {
    const filter = {};

    // Build the MongoDB query filter based on the user's role
    if (req.user.role === "staff") {
      // Staff sees: tickets assigned to them + unassigned tickets (so they can self-assign)
      filter.$or = [
        { assignedTo: req.user._id },
        { assignedTo: null },
        { assignedTo: { $exists: false } }
      ];
    } else if (req.user.role === "distributor") {
      // Distributors only see tickets explicitly allocated to them
      filter.distributorId = req.user._id;
    }
    // hq_admin: no filter applied → they see every ticket in the system

    // Apply optional query string filters sent by the frontend (for the filter bar)
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.category) filter.category = req.query.category;

    const tickets = await Ticket.find(filter)
      .populate("retailerId", "fullName businessName email") // Show retailer details on each ticket
      .populate("assignedTo", "fullName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    console.error("getAllTickets error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─── GET /api/tickets/:id ────────────────────────────────────────────────── */

// Returns a single ticket by its MongoDB ID, with populated related documents.
// Includes additional permission checks to prevent cross-user access:
//   - Retailers can only view their own tickets
//   - Distributors can only view tickets allocated to them
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("retailerId",  "fullName businessName email phone")
      .populate("assignedTo",  "fullName email")
      .populate("escalatedTo", "fullName email");

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    const userId = req.user._id.toString();
    const role   = req.user.role;

    // Retailer access check — must own the ticket
    if (role === "retailer") {
      const ownerId = ticket.retailerId._id ? ticket.retailerId._id.toString() : ticket.retailerId.toString();
      if (ownerId !== userId) {
        return res.status(403).json({ success: false, message: "Not authorized to view this ticket" });
      }
    } else if (role === "distributor") {
      // Distributor access check — must be allocated to this ticket
      const distId = ticket.distributorId ? ticket.distributorId.toString() : null;
      if (distId !== userId) {
        return res.status(403).json({ success: false, message: "Not authorized to view this ticket as distributor" });
      }
    }
    // staff and hq_admin pass through without extra checks

    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error("getTicketById error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─── PUT /api/tickets/:id/status ─────────────────────────────────────────── */

// Allows staff to update a ticket's status (e.g., open → in_progress → resolved).
// Also sets resolvedAt timestamp if the new status is "resolved" (used in SLA reporting).
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

    ticket.status    = status;
    ticket.updatedAt = new Date();
    // Record exactly when the ticket was resolved so SLA metrics can be calculated later
    if (status === "resolved") ticket.resolvedAt = new Date();

    await ticket.save();

    // Notify the retailer so they know their issue has been updated
    await Notification.create({
      userId:       ticket.retailerId,
      type:         "ticket_updated",
      ticketId:     ticket._id,
      ticketNumber: ticket.ticketNumber,
      message:      `Your ticket ${ticket.ticketNumber} status has been updated to ${status}`,
    });

    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error("updateTicketStatus error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─── POST /api/tickets/:id/escalate ─────────────────────────────────────── */

// Manually escalates a ticket to HQ Admin.
// Sets isEscalated=true, status="escalated", and escalatedTo=<first hq_admin found>.
// The automatic version of this same logic runs in the slaChecker job.
const escalateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    ticket.isEscalated = true;
    ticket.status      = "escalated";
    ticket.escalatedAt = new Date();

    // Find an HQ Admin to assign the escalation to
    const hqAdmin = await User.findOne({ role: "hq_admin" });
    if (hqAdmin) {
      ticket.escalatedTo = hqAdmin._id;

      // Notify the HQ Admin so they are aware of the urgent ticket
      await Notification.create({
        userId:       hqAdmin._id,
        type:         "ticket_escalated",
        ticketId:     ticket._id,
        ticketNumber: ticket.ticketNumber,
        message:      `Ticket ${ticket.ticketNumber} has been escalated and requires your attention`,
      });
    }

    await ticket.save();
    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error("escalateTicket error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─── PUT /api/tickets/:id/allocate ──────────────────────────────────────── */

// Assigns a distributor to handle the logistical side of a ticket.
// Once allocated, the distributor can see and respond to the ticket in their own dashboard.
const allocateDistributor = async (req, res) => {
  try {
    const { distributorId } = req.body;
    if (!distributorId) {
      return res.status(400).json({ success: false, message: "distributorId is required." });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    ticket.distributorId = distributorId;
    ticket.updatedAt     = new Date();
    await ticket.save();

    // Notify the distributor so they know a ticket has been allocated to them
    await Notification.create({
      userId:       distributorId,
      type:         "ticket_assigned",
      ticketId:     ticket._id,
      ticketNumber: ticket.ticketNumber,
      message:      `A new ticket ${ticket.ticketNumber} has been allocated to you for delivery handling.`,
    });

    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error("allocateDistributor error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─── PUT /api/tickets/:id/priority ──────────────────────────────────────────────────── */

// Allows HQ Admin and Sales Staff to set or update a ticket's priority.
// Retailers are explicitly blocked — only staff/admin can triage priority.
const updateTicketPriority = async (req, res) => {
  try {
    // Role guard — retailers must not be able to call this endpoint
    if (req.user.role === 'retailer') {
      return res.status(403).json({
        success: false,
        message: 'Retailers are not permitted to update ticket priority.',
      });
    }

    const { priority, timeToResolve } = req.body;
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    const validTTR = ['1 hour', '4 hours', '8 hours', '24 hours', '48 hours'];

    if (!priority || !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Valid priority is required: low, medium, high, critical',
      });
    }

    if (timeToResolve && !validTTR.includes(timeToResolve)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timeToResolve value.',
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    ticket.priority  = priority;
    if (timeToResolve) {
      ticket.timeToResolve = timeToResolve;
      // Recalculate slaDeadline based on timeToResolve
      const timeMap = {
        "1 hour": 1,
        "4 hours": 4,
        "8 hours": 8,
        "24 hours": 24,
        "48 hours": 48
      };
      if (timeMap[timeToResolve]) {
        const hours = timeMap[timeToResolve];
        ticket.slaDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);
      }
    }
    ticket.updatedAt = new Date();
    await ticket.save();

    // Notify retailer when time is assigned
    if (timeToResolve) {
      await Notification.create({
        userId: ticket.retailerId,
        type: 'ticket_updated',
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        message: `Your ticket has been assigned. Expected resolution time: ${timeToResolve}`,
      });
    }

    return res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error('updateTicketPriority error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  updateTicketPriority,
  escalateTicket,
  allocateDistributor,
};
