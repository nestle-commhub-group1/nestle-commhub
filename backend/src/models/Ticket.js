const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
  },

  retailerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Retailer ID is required"],
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["stock_out", "product_quality", "logistics_delay", "pricing_issue"],
  },

  priority: {
    type: String,
    required: [true, "Priority is required"],
    enum: ["low", "medium", "high", "critical"],
  },

  status: {
    type: String,
    enum: ["open", "in_progress", "resolved", "escalated"],
    default: "open",
  },

  description: {
    type: String,
    required: [true, "Description is required"],
  },

  attachments: {
    type: [String],
    default: [],
  },

  slaDeadline: {
    type: Date,
  },

  isEscalated: {
    type: Boolean,
    default: false,
  },

  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  escalatedAt: {
    type: Date,
  },

  resolvedAt: {
    type: Date,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ─── Pre-save: Auto-generate ticketNumber + SLA deadline ──────────────────────
ticketSchema.pre("save", async function () {
  if (this.isNew) {
    // Auto-generate ticketNumber
    const count = await mongoose.model("Ticket").countDocuments();
    this.ticketNumber = "TKT-" + (1001 + count);

    // Auto-set SLA deadline by priority
    const now = Date.now();
    const slaMap = {
      critical: 2  * 60 * 60 * 1000,
      high:     4  * 60 * 60 * 1000,
      medium:   8  * 60 * 60 * 1000,
      low:      24 * 60 * 60 * 1000,
    };
    this.slaDeadline = new Date(now + (slaMap[this.priority] || slaMap.low));
  }
});

const Ticket = mongoose.model("Ticket", ticketSchema);
module.exports = Ticket;
