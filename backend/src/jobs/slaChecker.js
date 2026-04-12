/**
 * slaChecker.js
 *
 * Background job that automatically escalates tickets that have exceeded their SLA deadline.
 *
 * Key responsibilities:
 * - Runs once on server startup and then every 30 minutes
 * - Finds open/in-progress tickets whose slaDeadline has passed
 * - Marks those tickets as escalated and notifies the HQ Admin
 */

const Ticket       = require("../models/Ticket");
const User         = require("../models/User");
const Notification = require("../models/Notification");

/* ─── checkSLABreaches ───────────────────────────────────────────────────── */

const checkSLABreaches = async () => {
  try {
    const now = new Date();

    // Find all tickets that:
    //   - Are still open or in progress (resolved/escalated tickets are ignored)
    //   - Have a slaDeadline that is in the past
    //   - Have not already been escalated (avoid re-escalating the same ticket)
    const breachedTickets = await Ticket.find({
      status:      { $in: ["open", "in_progress"] },
      slaDeadline: { $lt: now },  // $lt = "less than" — deadline is before now
      isEscalated: false,
    });

    // Nothing to do this cycle
    if (breachedTickets.length === 0) return;

    // Find the first HQ Admin user to receive the escalation notifications
    const hqAdmin = await User.findOne({ role: "hq_admin" });

    for (const ticket of breachedTickets) {
      // Mark the ticket as escalated
      ticket.isEscalated = true;
      ticket.status      = "escalated";
      ticket.escalatedAt = now;

      // Record which admin the ticket was escalated to (for audit trail)
      if (hqAdmin) {
        ticket.escalatedTo = hqAdmin._id;
      }

      await ticket.save();

      // Notify the HQ Admin for each breached ticket so they can take action
      if (hqAdmin) {
        await Notification.create({
          userId:       hqAdmin._id,
          type:         "ticket_escalated",
          ticketId:     ticket._id,
          ticketNumber: ticket.ticketNumber,
          message:      `Ticket ${ticket.ticketNumber} has been auto-escalated due to SLA breach`,
        });
      }

      // Notify the staff member that their ticket breached SLA
      if (ticket.assignedTo) {
        await Notification.create({
          userId:       ticket.assignedTo,
          type:         "warning",
          ticketId:     ticket._id,
          ticketNumber: ticket.ticketNumber,
          message:      `Ticket ${ticket.ticketNumber} has breached SLA. Auto-escalating to HQ.`,
        });
      }
    }

    console.log(`[SLA Checker] ${breachedTickets.length} ticket(s) auto-escalated`);
  } catch (error) {
    console.error("[SLA Checker] Error:", error.message);
  }
};

/* ─── Schedule ───────────────────────────────────────────────────────────── */

// Run the check every 30 minutes — frequent enough to catch breaches quickly
// without hammering the database with constant queries
setInterval(checkSLABreaches, 30 * 60 * 1000);

// Also run immediately on startup so any tickets that breached while the server
// was down are caught as soon as it restarts
checkSLABreaches();

module.exports = checkSLABreaches;
