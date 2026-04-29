const Order = require("../models/Order");
const Promotion = require("../models/Promotion");
const Insight = require("../models/Insight");
const User = require("../models/User");

const DAY_NAMES = [
  "Sundays",
  "Mondays",
  "Tuesdays",
  "Wednesdays",
  "Thursdays",
  "Fridays",
  "Saturdays",
];

const MIN_RECORDS = 10;

/* ═══════════════════════════════════════════════════════════════════════════════
   HELPER: Not-enough-data fallback
   ═══════════════════════════════════════════════════════════════════════════════ */

const notEnough = (label) => ({
  type: label,
  message: "Not enough data for predictions yet",
});

/* ═══════════════════════════════════════════════════════════════════════════════
   PM INSIGHTS — Promotion performance, stock trends, feedback, fulfillment
   ═══════════════════════════════════════════════════════════════════════════════ */

const generatePmInsights = async () => {
  const insights = [];

  try {
    // ── 1. Promotion performance (highest order volume per promotion) ────────
    const promotions = await Promotion.find().populate("salesData.retailerId");
    if (promotions.length < MIN_RECORDS) {
      insights.push(notEnough("promotion_performance"));
    } else {
      let topPromo = null;
      let topVolume = -1;

      for (const promo of promotions) {
        const totalUnits = promo.salesData.reduce((sum, s) => sum + (s.unitsSold || 0), 0);
        if (totalUnits > topVolume) {
          topVolume = totalUnits;
          topPromo = promo;
        }
      }

      insights.push({
        type: "promotion_performance",
        message: topPromo
          ? `Top promotion: "${topPromo.title}" with ${topVolume} total units sold`
          : "No promotion sales data available yet",
      });
    }

    // ── 2. Stock request trends by product ──────────────────────────────────
    const orders = await Order.find().populate("items.product");
    if (orders.length < MIN_RECORDS) {
      insights.push(notEnough("stock_request_trend"));
    } else {
      const productTotals = {};

      for (const order of orders) {
        for (const item of order.items) {
          const name = item.product?.name || "Unknown Product";
          productTotals[name] = (productTotals[name] || 0) + item.quantity;
        }
      }

      const sorted = Object.entries(productTotals).sort((a, b) => b[1] - a[1]);
      const top3 = sorted.slice(0, 3).map(([name, qty]) => `${name} (${qty})`).join(", ");

      insights.push({
        type: "stock_request_trend",
        message: `Most requested products: ${top3}`,
      });
    }

    // ── 3. Retailer feedback average rating ─────────────────────────────────
    const allPromos = await Promotion.find({ "participatingRetailers.rating": { $exists: true } });
    const ratings = [];

    for (const promo of allPromos) {
      for (const p of promo.participatingRetailers) {
        if (p.rating != null) ratings.push(p.rating);
      }
    }

    if (ratings.length < MIN_RECORDS) {
      insights.push(notEnough("feedback_avg_rating"));
    } else {
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      insights.push({
        type: "feedback_avg_rating",
        message: `Average retailer promotion rating: ${avg.toFixed(1)}/10 across ${ratings.length} reviews`,
      });
    }

    // ── 4. Order fulfillment rate ───────────────────────────────────────────
    const allOrders = orders.length >= MIN_RECORDS ? orders : await Order.find();
    if (allOrders.length < MIN_RECORDS) {
      insights.push(notEnough("order_fulfillment_rate"));
    } else {
      const accepted = allOrders.filter((o) => o.status === "accepted" || o.status === "shipped" || o.status === "delivered").length;
      const rate = ((accepted / allOrders.length) * 100).toFixed(1);
      insights.push({
        type: "order_fulfillment_rate",
        message: `Order fulfillment rate: ${rate}% (${accepted}/${allOrders.length} orders accepted or beyond)`,
      });
    }
  } catch (error) {
    console.error("[Insight] PM insight generation error:", error.message);
    insights.push({ type: "error", message: "Failed to generate some PM insights" });
  }

  return insights;
};

/* ═══════════════════════════════════════════════════════════════════════════════
   STOCK MANAGER INSIGHTS — Forecasts, low-stock alerts, fulfillment, patterns
   ═══════════════════════════════════════════════════════════════════════════════ */

const generateStockManagerInsights = async () => {
  const insights = [];

  try {
    const orders = await Order.find().populate("items.product retailer");

    // ── 1. Stock request forecast (avg requests per day of week) ─────────────
    if (orders.length < MIN_RECORDS) {
      insights.push(notEnough("stock_forecast"));
    } else {
      const dayBuckets = {};

      for (const order of orders) {
        const day = new Date(order.createdAt).getDay();
        if (!dayBuckets[day]) dayBuckets[day] = { total: 0, count: 0 };
        dayBuckets[day].total += order.totalAmount;
        dayBuckets[day].count += 1;
      }

      let peakDay = null;
      let peakAvg = -1;

      for (const [day, bucket] of Object.entries(dayBuckets)) {
        const avg = bucket.total / bucket.count;
        if (avg > peakAvg) {
          peakAvg = avg;
          peakDay = Number(day);
        }
      }

      insights.push({
        type: "stock_forecast",
        message: `Expect higher stock requests on ${DAY_NAMES[peakDay]} (avg: ${Math.round(peakAvg)} units)`,
      });
    }

    // ── 2. Low stock alerts (products with >80% high-quantity requests) ──────
    if (orders.length < MIN_RECORDS) {
      insights.push(notEnough("low_stock_alert"));
    } else {
      const HIGH_QTY_THRESHOLD = 50;
      const productRequests = {};

      for (const order of orders) {
        for (const item of order.items) {
          const name = item.product?.name || "Unknown Product";
          if (!productRequests[name]) productRequests[name] = { high: 0, total: 0 };
          productRequests[name].total += 1;
          if (item.quantity >= HIGH_QTY_THRESHOLD) productRequests[name].high += 1;
        }
      }

      const alerts = Object.entries(productRequests)
        .filter(([, data]) => data.total >= 5 && (data.high / data.total) > 0.8)
        .map(([name, data]) => `${name} (${Math.round((data.high / data.total) * 100)}% high-qty)`)
        .slice(0, 5);

      insights.push({
        type: "low_stock_alert",
        message: alerts.length > 0
          ? `Low stock risk — products with frequent high-quantity requests: ${alerts.join(", ")}`
          : "No products flagged for low stock risk at this time",
      });
    }

    // ── 3. Order fulfillment rate ───────────────────────────────────────────
    if (orders.length < MIN_RECORDS) {
      insights.push(notEnough("order_fulfillment_rate"));
    } else {
      const fulfilled = orders.filter((o) => o.status === "accepted" || o.status === "shipped" || o.status === "delivered").length;
      const rate = ((fulfilled / orders.length) * 100).toFixed(1);
      insights.push({
        type: "order_fulfillment_rate",
        message: `Order fulfillment rate: ${rate}% (${fulfilled}/${orders.length} orders fulfilled)`,
      });
    }

    // ── 4. Retailer order patterns (most frequent retailers) ────────────────
    if (orders.length < MIN_RECORDS) {
      insights.push(notEnough("retailer_order_pattern"));
    } else {
      const retailerCounts = {};

      for (const order of orders) {
        const name = order.retailer?.fullName || order.retailer?.businessName || String(order.retailer);
        retailerCounts[name] = (retailerCounts[name] || 0) + 1;
      }

      const sorted = Object.entries(retailerCounts).sort((a, b) => b[1] - a[1]);
      const top3 = sorted.slice(0, 3).map(([name, count]) => `${name} (${count} orders)`).join(", ");

      insights.push({
        type: "retailer_order_pattern",
        message: `Most active retailers: ${top3}`,
      });
    }
  } catch (error) {
    console.error("[Insight] Stock Manager insight generation error:", error.message);
    insights.push({ type: "error", message: "Failed to generate some Stock Manager insights" });
  }

  return insights;
};

/* ═══════════════════════════════════════════════════════════════════════════════
   RETAILER INSIGHTS — Own fulfillment rate + own feedback score
   ═══════════════════════════════════════════════════════════════════════════════ */

const generateRetailerInsights = async (userId) => {
  const insights = [];

  try {
    // ── 1. Own fulfillment rate ──────────────────────────────────────────────
    const orders = await Order.find({ retailer: userId });

    if (orders.length < MIN_RECORDS) {
      insights.push(notEnough("own_fulfillment_rate"));
    } else {
      const fulfilled = orders.filter((o) => o.status === "accepted" || o.status === "shipped" || o.status === "delivered").length;
      const rate = ((fulfilled / orders.length) * 100).toFixed(1);
      insights.push({
        type: "own_fulfillment_rate",
        message: `Your order fulfillment rate: ${rate}% (${fulfilled}/${orders.length} orders fulfilled)`,
      });
    }

    // ── 2. Own feedback score ───────────────────────────────────────────────
    const promotions = await Promotion.find({ "participatingRetailers.retailerId": userId });
    const ratings = [];

    for (const promo of promotions) {
      for (const p of promo.participatingRetailers) {
        if (p.retailerId && p.retailerId.toString() === userId.toString() && p.rating != null) {
          ratings.push(p.rating);
        }
      }
    }

    if (ratings.length < MIN_RECORDS) {
      insights.push(notEnough("own_feedback_score"));
    } else {
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      insights.push({
        type: "own_feedback_score",
        message: `Your average promotion rating: ${avg.toFixed(1)}/10 across ${ratings.length} promotions`,
      });
    }
  } catch (error) {
    console.error("[Insight] Retailer insight generation error:", error.message);
    insights.push({ type: "error", message: "Failed to generate some retailer insights" });
  }

  return insights;
};

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN: generateInsightForRole(userId, role)
   ═══════════════════════════════════════════════════════════════════════════════ */

const generateInsightForRole = async (userId, role) => {
  try {
    switch (role) {
      case "hqAdmin":
      case "staff": {
        // HQ Admin and Staff see ALL insights combined
        const [pmInsights, smInsights] = await Promise.all([
          generatePmInsights(),
          generateStockManagerInsights(),
        ]);
        return [...pmInsights, ...smInsights];
      }

      case "pm":
        return await generatePmInsights();

      case "stockManager":
        return await generateStockManagerInsights();

      case "retailer":
        return await generateRetailerInsights(userId);

      default:
        return [{ type: "unknown_role", message: `No insights available for role: ${role}` }];
    }
  } catch (error) {
    console.error("[Insight] generateInsightForRole error:", error.message);
    return [{ type: "error", message: "Failed to generate insights" }];
  }
};

/* ═══════════════════════════════════════════════════════════════════════════════
   generateInsight(userId)
   Fetches the user's role from the DB, calls generateInsightForRole, and
   saves each result as a separate Insight document.
   ═══════════════════════════════════════════════════════════════════════════════ */

// Map DB role values to insight role keys
const ROLE_MAP = {
  hq_admin: "hqAdmin",
  staff: "staff",
  promotion_manager: "pm",
  stock_manager: "stockManager",
  retailer: "retailer",
};

const generateInsight = async (userId) => {
  try {
    // Fetch the user to determine their role
    const user = await User.findById(userId).select("role");
    if (!user) {
      console.error(`[Insight] User not found for ID: ${userId}`);
      return [];
    }

    const role = ROLE_MAP[user.role] || "retailer";
    const insightResults = await generateInsightForRole(userId, role);

    const saved = [];
    for (const result of insightResults) {
      try {
        const insight = await Insight.create({
          userId,
          type: result.type,
          message: result.message,
          relatedInsight: { source: "auto_generated", role },
          role,
          scope: role === "retailer" ? "own" : "global",
        });
        saved.push(insight);
      } catch (saveError) {
        console.error(`[Insight] Failed to save insight (${result.type}):`, saveError.message);
      }
    }

    return saved;
  } catch (error) {
    console.error("[Insight] generateInsight error:", error.message);
    return [];
  }
};

// ─── GET /api/insights/latest ───────────────────────────────────────────────────
// Fetches the 10 most recent Insight documents for the logged-in user,
// filtered by their role. Retailers only see scope: 'own'.
const getLatestInsight = async (req, res) => {
  try {
    const userId = req.user._id;
    const dbRole = req.user.role; // e.g. "hq_admin", "retailer"
    const insightRole = ROLE_MAP[dbRole] || "retailer";

    // Build the query filter
    const filter = { userId, role: insightRole };

    // Retailers should only see their own scoped insights
    if (dbRole === "retailer") {
      filter.scope = "own";
    }

    const insights = await Insight.find(filter)
      .sort({ createdAt: -1 })
      .limit(10);

    if (!insights.length) {
      return res.status(404).json({ success: false, message: "No insights found." });
    }

    return res.status(200).json({ success: true, insights });
  } catch (error) {
    console.error("getLatestInsight error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { generateInsightForRole, generateInsight, getLatestInsight };
