const Ticket = require("../models/Ticket");
const User = require("../models/User");
const Notification = require("../models/Notification");

const checkSLABreaches = async () => {
  try {
    const now = new Date();

    // Find all open/in_progress tickets whose SLA deadline has passed
    const breachedTickets = await Ticket.find({
      status: { $in: ["open", "in_progress"] },
      slaDeadline: { $lt: now },
      isEscalated: false,
    });

    if (breachedTickets.length === 0) return;

    const hqAdmin = await User.findOne({ role: "hq_admin" });

    for (const ticket of breachedTickets) {
      ticket.isEscalated = true;
      ticket.status = "escalated";
      ticket.escalatedAt = now;

      if (hqAdmin) {
        ticket.escalatedTo = hqAdmin._id;
      }

      await ticket.save();

      if (hqAdmin) {
        await Notification.create({
          userId: hqAdmin._id,
          type: "ticket_escalated",
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          message: `Ticket ${ticket.ticketNumber} has been auto-escalated due to SLA breach`,
        });
      }
    }

    console.log(`[SLA Checker] ${breachedTickets.length} ticket(s) auto-escalated`);
  } catch (error) {
    console.error("[SLA Checker] Error:", error.message);
  }
};

// Run every 30 minutes
setInterval(checkSLABreaches, 30 * 60 * 1000);

// Also run once on startup
checkSLABreaches();

module.exports = checkSLABreaches;
