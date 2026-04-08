const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  updateTicketPriority,
  escalateTicket,
  allocateDistributor,
} = require("../controllers/ticketController");
const { sendMessage, getMessages } = require("../controllers/messageController");

// ── Ticket routes ──────────────────────────────────────────────────────────────

// POST /api/tickets — retailer creates a ticket
router.post("/", protect, restrictTo("retailer"), createTicket);

// GET /api/tickets/my — retailer views their own tickets
router.get("/my", protect, restrictTo("retailer"), getMyTickets);

// GET /api/tickets — staff/admin/distributor views all tickets
router.get("/", protect, restrictTo("sales_staff", "hq_admin", "distributor"), getAllTickets);

// GET /api/tickets/:id — any authenticated user (access checked in controller)
router.get("/:id", protect, getTicketById);

// PUT /api/tickets/:id/status — staff/admin updates status
router.put("/:id/status", protect, restrictTo("sales_staff", "hq_admin"), updateTicketStatus);

// POST /api/tickets/:id/escalate — staff/admin escalates ticket
router.post("/:id/escalate", protect, restrictTo("sales_staff", "hq_admin"), escalateTicket);

// PUT /api/tickets/:id/allocate — staff/admin assigns distributor
router.put("/:id/allocate", protect, restrictTo("sales_staff", "hq_admin"), allocateDistributor);

// PUT /api/tickets/:id/priority — ONLY staff/admin can set priority (retailers blocked)
router.put("/:id/priority", protect, restrictTo("sales_staff", "hq_admin"), updateTicketPriority);

// ── Message routes ─────────────────────────────────────────────────────────────

// POST /api/tickets/:id/messages — any authenticated user sends a message
router.post("/:id/messages", protect, sendMessage);

// GET /api/tickets/:id/messages — any authenticated user reads messages
router.get("/:id/messages", protect, getMessages);

module.exports = router;
