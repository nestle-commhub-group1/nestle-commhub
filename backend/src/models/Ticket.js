/**
 * Ticket.js
 *
 * Mongoose model for support tickets raised by retailers.
 *
 * Key responsibilities:
 * - Defines the full data structure of a ticket
 * - Auto-generates a sequential ticket number (TKT-1001, TKT-1002, ...)
 * - Auto-calculates the SLA deadline based on the ticket's priority
 * - Tracks assignment, escalation, and resolution state
 */

const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({

  ticketNumber: {
    type: String,
    unique: true,
    // Format: "TKT-XXXX" — auto-generated in the pre-save hook below.
    // Starts at TKT-1001 and increments with each new ticket.
  },

  retailerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",                           // References the User who submitted this ticket
    required: [true, "Retailer ID is required"],
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",   // References the staff User assigned to handle this ticket
    default: null, // null means the ticket is not yet assigned to anyone
  },

  distributorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",   // References a distributor User when a ticket is allocated to logistics
    default: null, // null means no distributor has been assigned yet
  },

  category: {
    type: String,
    required: [true, "Category is required"],
    // These four categories map to common Nestlé supply chain issues
    enum: ["stock_out", "product_quality", "logistics_delay", "pricing_issue"],
  },

  priority: {
    type: String,
    // Priority defaults to 'low' — retailers do NOT set this.
    // Only HQ Admin and Sales Staff may update priority after ticket creation.
    enum: ["low", "medium", "high", "critical"],
    default: "low",
  },

  // Time to resolve — set by Staff/Admin after reviewing the ticket.
  // Options match the frontend dropdown. When set, the SLA job uses this
  // value for escalation timing instead of the default priority-based deadline.
  timeToResolve: {
    type: String,
    enum: ["1 hour", "4 hours", "8 hours", "24 hours", "48 hours"],
    default: null,
  },

  status: {
    type: String,
    // Ticket lifecycle: open → in_progress → resolved (or escalated at any point)
    enum: ["open", "in_progress", "resolved", "escalated"],
    default: "open", // All new tickets start as 'open'
  },

  description: {
    type: String,
    required: [true, "Description is required"],
    // Free-text explanation of the issue submitted by the retailer
  },

  attachments: {
    type: [String], // Array of base64 encoded file strings (images, videos, etc.)
    default: [],    // Most tickets have no attachments; default prevents null errors
  },

  slaDeadline: {
    type: Date,
    // Auto-calculated in the pre-save hook based on priority:
    //   critical → 2 hours, high → 4 hours, medium → 8 hours, low → 24 hours
  },

  /* ─── Escalation Fields ───────────────────────────────────────────────── */

  isEscalated: {
    type: Boolean,
    default: false, // Becomes true when escalated manually (by staff) or automatically (SLA breach)
  },

  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // References the hq_admin User who received the escalation
  },

  escalatedAt: {
    type: Date, // Timestamp of when the escalation occurred
  },

  /* ─── Resolution Fields ───────────────────────────────────────────────── */

  resolvedAt: {
    type: Date, // Set when status changes to "resolved" — used for SLA reporting
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now, // Updated every time the ticket is modified (status changes, etc.)
  },
});

/* ─── Pre-Save Hook: Auto-generate ticketNumber + SLA Deadline ───────────── */

ticketSchema.pre("save", async function () {
  // Only run this logic when a brand new ticket is being created (not on updates)
  if (this.isNew) {

    // Count existing tickets to generate a sequential number.
    // e.g., if there are 5 tickets already, this becomes TKT-1006.
    const count = await mongoose.model("Ticket").countDocuments();
    this.ticketNumber = "TKT-" + (1001 + count);

    // Set SLA deadline based on priority level.
    // The deadline tells staff and admins how long they have to resolve the ticket
    // before it is automatically escalated by the slaChecker job.
    const now = Date.now();
    const slaMap = {
      critical: 2  * 60 * 60 * 1000, //  2 hours in milliseconds
      high:     4  * 60 * 60 * 1000, //  4 hours
      medium:   8  * 60 * 60 * 1000, //  8 hours
      low:      24 * 60 * 60 * 1000, // 24 hours
    };
    // If priority is somehow missing, fall back to the 'low' SLA (24 hours)
    this.slaDeadline = new Date(now + (slaMap[this.priority] || slaMap.low));
  }
});

const Ticket = mongoose.model("Ticket", ticketSchema);
module.exports = Ticket;
