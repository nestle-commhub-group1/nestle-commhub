/**
 * analyticsController.js
 *
 * Provides analytics endpoints for the PM, Stock Manager, and Retailer Dashboards.
 *
 * Role access (admin-facing):
 *   - hq_admin, staff, promotion_manager (pm) → full data
 *   - stock_manager, retailer              → null (no access)
 *
 * Role access (retailer-facing: /my-*):
 *   - retailer → own data only
 *   - all others → 403
 */

const Promotion = require("../models/Promotion");
const Order     = require("../models/Order");
const Product   = require("../models/Product");
const User      = require("../models/User");

/* ─── Allowed roles ───────────────────────────────────────────────────────── */

const ALLOWED_ROLES = ["hq_admin", "staff", "promotion_manager", "stock_manager"];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

/**
 * HIGH_QUANTITY_THRESHOLD — any single order-line with quantity >= this
 * value is considered a "high-quantity" request.
 */
const HIGH_QUANTITY_THRESHOLD = 50;

/**
 * Parse period and region from query string into a Mongo date filter
 * and an optional retailer-province filter.
 *
 * Supported period values: '7d', '30d', '90d', 'all' (default: '30d')
 */
function buildFilters(query) {
  const { period = "30d", region } = query;

  const dateFilter = {};
  if (period !== "all") {
    const days = parseInt(period, 10) || 30;
    dateFilter.createdAt = { $gte: new Date(Date.now() - days * 86400000) };
  }

  // Region is matched against the retailer's province field; resolved at call-site.
  return { dateFilter, region: region || null };
}

/**
 * GET /api/analytics/promotion-conversion-rates
 *
 * For each promotion, returns:
 *   {
 *     promotionId,
 *     promotionName,
 *     conversionRate   — (opted-in retailers / total participating entries) * 100
 *     fulfillmentRate  — (accepted+shipped+delivered orders / total orders) * 100
 *   }
 *
 * Role check:
 *   - hq_admin, staff, promotion_manager → returns data
 *   - stock_manager, retailer           → returns null
 */
const getPromotionConversionRates = async (req, res) => {
  try {
    const role = req.user?.role;

    // Role gate: only allowed roles get data
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(200).json({ data: null });
    }

    // Fetch all promotions with participating retailer info
    const promotions = await Promotion.find()
      .select("title participatingRetailers")
      .lean();

    // Collect all retailer IDs that appear in any promotion to find their orders
    const allRetailerIds = new Set();
    promotions.forEach((promo) => {
      (promo.participatingRetailers || []).forEach((pr) => {
        if (pr.retailerId) allRetailerIds.add(pr.retailerId.toString());
      });
    });

    // Pre-fetch all orders placed by participating retailers for fulfillment calc.
    // Group orders by retailer for efficient lookup.
    const orders = await Order.find({
      retailer: { $in: [...allRetailerIds] },
    })
      .select("retailer status")
      .lean();

    const ordersByRetailer = {};
    orders.forEach((order) => {
      const rid = order.retailer.toString();
      if (!ordersByRetailer[rid]) ordersByRetailer[rid] = [];
      ordersByRetailer[rid].push(order);
    });

    // Build result per promotion
    const FULFILLED_STATUSES = ["accepted", "shipped", "delivered"];

    const result = promotions.map((promo) => {
      const retailers = promo.participatingRetailers || [];
      const totalViewed = retailers.length;
      const optedInCount = retailers.filter((r) => r.optedIn).length;

      // Conversion rate: how many retailers opted in vs total entries
      const conversionRate =
        totalViewed > 0
          ? parseFloat(((optedInCount / totalViewed) * 100).toFixed(1))
          : 0;

      // Fulfillment rate: across orders from retailers in THIS promotion
      const promoRetailerIds = retailers.map((r) =>
        r.retailerId?.toString()
      ).filter(Boolean);

      let totalOrders = 0;
      let fulfilledOrders = 0;

      promoRetailerIds.forEach((rid) => {
        const retailerOrders = ordersByRetailer[rid] || [];
        totalOrders += retailerOrders.length;
        fulfilledOrders += retailerOrders.filter((o) =>
          FULFILLED_STATUSES.includes(o.status)
        ).length;
      });

      const fulfillmentRate =
        totalOrders > 0
          ? parseFloat(((fulfilledOrders / totalOrders) * 100).toFixed(1))
          : 0;

      return {
        promotionId: promo._id,
        promotionName: promo.title,
        conversionRate,
        fulfillmentRate,
      };
    });

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error("[Analytics] getPromotionConversionRates error:", error);
    return res.status(500).json({ message: "Failed to fetch promotion conversion rates" });
  }
};

/* ─── getLowStockAlerts ────────────────────────────────────────────────────── */

/**
 * GET /api/analytics/low-stock?period=30d&region=Western
 *
 * For each product, checks all order-line items in the period:
 *   - If > 80% of requests have quantity >= HIGH_QUANTITY_THRESHOLD → severity 'critical'
 *   - If the product appears in > 10 distinct orders (repeatedly requested) → severity 'low'
 *   - Otherwise the product is not flagged.
 *
 * Returns: { data: [{ productName, severity }] }
 *
 * Role check: same as getPromotionConversionRates.
 */
const getLowStockAlerts = async (req, res) => {
  try {
    const role = req.user?.role;
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(200).json({ data: null });
    }

    const { dateFilter, region } = buildFilters(req.query);

    // If a region filter is provided, first resolve retailer IDs in that region
    let retailerFilter = {};
    if (region) {
      const regionRetailers = await User.find(
        { role: "retailer", province: { $regex: region, $options: "i" } },
        "_id"
      ).lean();
      retailerFilter = { retailer: { $in: regionRetailers.map((r) => r._id) } };
    }

    // Aggregate order items grouped by product
    const pipeline = [
      { $match: { ...dateFilter, ...retailerFilter } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalRequests: { $sum: 1 },
          highQtyRequests: {
            $sum: {
              $cond: [{ $gte: ["$items.quantity", HIGH_QUANTITY_THRESHOLD] }, 1, 0],
            },
          },
          distinctOrders: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 1,
          totalRequests: 1,
          highQtyRequests: 1,
          distinctOrderCount: { $size: "$distinctOrders" },
          highQtyPct: {
            $cond: [
              { $gt: ["$totalRequests", 0] },
              { $multiply: [{ $divide: ["$highQtyRequests", "$totalRequests"] }, 100] },
              0,
            ],
          },
        },
      },
      {
        $match: {
          $or: [
            { highQtyPct: { $gt: 80 } },        // > 80 % high-qty requests
            { distinctOrderCount: { $gt: 10 } },  // repeatedly requested
          ],
        },
      },
      { $sort: { highQtyPct: -1 } },
    ];

    const agg = await Order.aggregate(pipeline);

    // Resolve product names
    const productIds = agg.map((a) => a._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select("name")
      .lean();
    const nameMap = {};
    products.forEach((p) => (nameMap[p._id.toString()] = p.name));

    const data = agg.map((item) => ({
      productName: nameMap[item._id.toString()] || "Unknown Product",
      severity: item.highQtyPct > 80 ? "critical" : "low",
    }));

    return res.status(200).json({ data });
  } catch (error) {
    console.error("[Analytics] getLowStockAlerts error:", error);
    return res.status(500).json({ message: "Failed to fetch low stock alerts" });
  }
};

/* ─── getTopRetailersByVolume ──────────────────────────────────────────────── */

/**
 * GET /api/analytics/top-retailers?period=30d&region=Western
 *
 * Returns the top 10 retailers sorted by total orders placed in the period.
 *   { data: [{ retailerName, orderCount }] }
 *
 * Role check: same as getPromotionConversionRates.
 */
const getTopRetailersByVolume = async (req, res) => {
  try {
    const role = req.user?.role;
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(200).json({ data: null });
    }

    const { dateFilter, region } = buildFilters(req.query);

    // If a region filter is provided, first resolve retailer IDs in that region
    let retailerFilter = {};
    if (region) {
      const regionRetailers = await User.find(
        { role: "retailer", province: { $regex: region, $options: "i" } },
        "_id"
      ).lean();
      retailerFilter = { retailer: { $in: regionRetailers.map((r) => r._id) } };
    }

    const pipeline = [
      { $match: { ...dateFilter, ...retailerFilter } },
      {
        $group: {
          _id: "$retailer",
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
    ];

    const agg = await Order.aggregate(pipeline);

    // Resolve retailer names (prefer businessName, fall back to fullName)
    const retailerIds = agg.map((a) => a._id);
    const retailers = await User.find({ _id: { $in: retailerIds } })
      .select("fullName businessName")
      .lean();
    const nameMap = {};
    retailers.forEach((r) => {
      nameMap[r._id.toString()] = r.businessName || r.fullName || "Unknown";
    });

    const data = agg.map((item) => ({
      retailerName: nameMap[item._id.toString()] || "Unknown Retailer",
      orderCount: item.orderCount,
    }));

    return res.status(200).json({ data });
  } catch (error) {
    console.error("[Analytics] getTopRetailersByVolume error:", error);
    return res.status(500).json({ message: "Failed to fetch top retailers" });
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  RETAILER-ONLY ENDPOINTS  (/my-*)
 *  These return 403 for any role that is NOT 'retailer'.
 * ═══════════════════════════════════════════════════════════════════════════ */

const FULFILLED_STATUSES_GLOBAL = ["accepted", "shipped", "delivered"];

/* ─── getMyOrderHistory ───────────────────────────────────────────────────── */

/**
 * GET /api/analytics/my-orders?period=30d
 *
 * Returns the retailer's own orders grouped by week.
 *   { data: [{ week: "Wk1", ordered, fulfilled, rejected }] }
 */
const getMyOrderHistory = async (req, res) => {
  try {
    if (req.user?.role !== "retailer") {
      return res.status(403).json({ message: "Retailer access only" });
    }

    const { dateFilter } = buildFilters(req.query);
    const retailerId = req.user._id;

    const orders = await Order.find({ retailer: retailerId, ...dateFilter })
      .select("status items createdAt")
      .sort({ createdAt: 1 })
      .lean();

    if (orders.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Determine the start of the period for week numbering
    const periodStart = dateFilter.createdAt?.$gte || orders[0].createdAt;
    const msPerWeek = 7 * 86400000;

    // Bucket each order into a week
    const weekMap = {};
    orders.forEach((order) => {
      const weekIndex = Math.floor((new Date(order.createdAt) - new Date(periodStart)) / msPerWeek);
      const weekLabel = `Wk${weekIndex + 1}`;

      if (!weekMap[weekLabel]) {
        weekMap[weekLabel] = { week: weekLabel, ordered: 0, fulfilled: 0, rejected: 0 };
      }

      // Sum total units across all line items in this order
      const units = (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
      weekMap[weekLabel].ordered += units;

      if (FULFILLED_STATUSES_GLOBAL.includes(order.status)) {
        weekMap[weekLabel].fulfilled += units;
      } else if (order.status === "denied") {
        weekMap[weekLabel].rejected += units;
      }
    });

    // Return sorted by week number
    const data = Object.values(weekMap).sort((a, b) => {
      const na = parseInt(a.week.replace("Wk", ""), 10);
      const nb = parseInt(b.week.replace("Wk", ""), 10);
      return na - nb;
    });

    return res.status(200).json({ data });
  } catch (error) {
    console.error("[Analytics] getMyOrderHistory error:", error);
    return res.status(500).json({ message: "Failed to fetch order history" });
  }
};

/* ─── getMyTopProducts ────────────────────────────────────────────────────── */

/**
 * GET /api/analytics/my-products?period=30d
 *
 * Returns the retailer's top 5 products by total units ordered.
 *   { data: [{ productName, unitCount }] }
 */
const getMyTopProducts = async (req, res) => {
  try {
    if (req.user?.role !== "retailer") {
      return res.status(403).json({ message: "Retailer access only" });
    }

    const { dateFilter } = buildFilters(req.query);
    const retailerId = req.user._id;

    const pipeline = [
      { $match: { retailer: retailerId, ...dateFilter } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          unitCount: { $sum: "$items.quantity" },
        },
      },
      { $sort: { unitCount: -1 } },
      { $limit: 5 },
    ];

    const agg = await Order.aggregate(pipeline);

    // Resolve product names
    const productIds = agg.map((a) => a._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select("name")
      .lean();
    const nameMap = {};
    products.forEach((p) => (nameMap[p._id.toString()] = p.name));

    const data = agg.map((item) => ({
      productName: nameMap[item._id.toString()] || "Unknown Product",
      unitCount: item.unitCount,
    }));

    return res.status(200).json({ data });
  } catch (error) {
    console.error("[Analytics] getMyTopProducts error:", error);
    return res.status(500).json({ message: "Failed to fetch top products" });
  }
};

/* ─── getMyPerformanceVsAverage ───────────────────────────────────────────── */

/**
 * GET /api/analytics/my-performance?period=30d
 *
 * Returns the retailer's own metrics compared to national averages:
 *   {
 *     myFulfillmentRate, nationalAvgFulfillmentRate,
 *     myFeedbackScore,   nationalAvgFeedbackScore,
 *     myOrderVolume,     myOrderVolumePercentile,
 *     myAvgOrderValue,   nationalAvgOrderValue
 *   }
 */
const getMyPerformanceVsAverage = async (req, res) => {
  try {
    if (req.user?.role !== "retailer") {
      return res.status(403).json({ message: "Retailer access only" });
    }

    const { dateFilter } = buildFilters(req.query);
    const retailerId = req.user._id;

    // ── 1. Fetch ALL orders in the period (for national stats) ─────────────
    const allOrders = await Order.find({ ...dateFilter })
      .select("retailer status totalAmount")
      .lean();

    // ── 2. My orders ───────────────────────────────────────────────────────
    const myOrders = allOrders.filter(
      (o) => o.retailer.toString() === retailerId.toString()
    );

    // Fulfillment rate
    const myFulfilled = myOrders.filter((o) =>
      FULFILLED_STATUSES_GLOBAL.includes(o.status)
    ).length;
    const myFulfillmentRate =
      myOrders.length > 0
        ? parseFloat(((myFulfilled / myOrders.length) * 100).toFixed(1))
        : 0;

    const allFulfilled = allOrders.filter((o) =>
      FULFILLED_STATUSES_GLOBAL.includes(o.status)
    ).length;
    const nationalAvgFulfillmentRate =
      allOrders.length > 0
        ? parseFloat(((allFulfilled / allOrders.length) * 100).toFixed(1))
        : 0;

    // Average order value
    const myTotalValue = myOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const myAvgOrderValue =
      myOrders.length > 0
        ? parseFloat((myTotalValue / myOrders.length).toFixed(0))
        : 0;

    const allTotalValue = allOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const nationalAvgOrderValue =
      allOrders.length > 0
        ? parseFloat((allTotalValue / allOrders.length).toFixed(0))
        : 0;

    // Order volume + percentile
    const myOrderVolume = myOrders.length;

    // Group order counts by retailer to compute percentile
    const volumeByRetailer = {};
    allOrders.forEach((o) => {
      const rid = o.retailer.toString();
      volumeByRetailer[rid] = (volumeByRetailer[rid] || 0) + 1;
    });
    const allVolumes = Object.values(volumeByRetailer).sort((a, b) => a - b);
    const belowMe = allVolumes.filter((v) => v < myOrderVolume).length;
    const myOrderVolumePercentile =
      allVolumes.length > 0
        ? parseFloat(((belowMe / allVolumes.length) * 100).toFixed(0))
        : 0;

    // ── 3. Feedback scores from Promotions ──────────────────────────────────
    const promotions = await Promotion.find()
      .select("participatingRetailers")
      .lean();

    let myRatingSum = 0;
    let myRatingCount = 0;
    let allRatingSum = 0;
    let allRatingCount = 0;

    promotions.forEach((promo) => {
      (promo.participatingRetailers || []).forEach((pr) => {
        if (pr.rating != null) {
          allRatingSum += pr.rating;
          allRatingCount++;
          if (pr.retailerId?.toString() === retailerId.toString()) {
            myRatingSum += pr.rating;
            myRatingCount++;
          }
        }
      });
    });

    const myFeedbackScore =
      myRatingCount > 0
        ? parseFloat((myRatingSum / myRatingCount).toFixed(1))
        : 0;
    const nationalAvgFeedbackScore =
      allRatingCount > 0
        ? parseFloat((allRatingSum / allRatingCount).toFixed(1))
        : 0;

    return res.status(200).json({
      data: {
        myFulfillmentRate,
        nationalAvgFulfillmentRate,
        myFeedbackScore,
        nationalAvgFeedbackScore,
        myOrderVolume,
        myOrderVolumePercentile,
        myAvgOrderValue,
        nationalAvgOrderValue,
      },
    });
  } catch (error) {
    console.error("[Analytics] getMyPerformanceVsAverage error:", error);
    return res.status(500).json({ message: "Failed to fetch performance data" });
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  PM DASHBOARD AGGREGATE ENDPOINTS
 * ═══════════════════════════════════════════════════════════════════════════ */

/* ─── getPromotionsSummary ────────────────────────────────────────────────── */

/**
 * GET /api/analytics/summary?period=30d
 *
 * Returns aggregate KPI cards for the PM dashboard:
 *   { activePromotions, endingSoon, totalUnitsSold, avgConversionRate,
 *     conversionDelta, avgFeedbackRating, totalReviews }
 */
const getPromotionsSummary = async (req, res) => {
  try {
    if (!ALLOWED_ROLES.includes(req.user?.role)) {
      return res.status(200).json({ data: null });
    }

    const promotions = await Promotion.find().lean();
    const activePromotions = promotions.filter((p) => p.status === "active");
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 86400000);
    const endingSoon = activePromotions.filter(
      (p) => new Date(p.endDate) <= sevenDays
    ).length;

    // Total units sold across all salesData
    let totalUnitsSold = 0;
    promotions.forEach((p) => {
      (p.salesData || []).forEach((s) => (totalUnitsSold += s.unitsSold || 0));
    });

    // Avg conversion rate (opted-in / total participating)
    let totalOptedIn = 0;
    let totalParticipating = 0;
    let totalRating = 0;
    let ratingCount = 0;

    promotions.forEach((p) => {
      const pr = p.participatingRetailers || [];
      totalParticipating += pr.length;
      totalOptedIn += pr.filter((r) => r.optedIn).length;
      pr.forEach((r) => {
        if (r.rating != null) {
          totalRating += r.rating;
          ratingCount++;
        }
      });
    });

    const avgConversionRate =
      totalParticipating > 0
        ? parseFloat(((totalOptedIn / totalParticipating) * 100).toFixed(1))
        : 0;

    const avgFeedbackRating =
      ratingCount > 0 ? parseFloat((totalRating / ratingCount).toFixed(1)) : 0;

    return res.status(200).json({
      data: {
        activePromotions: activePromotions.length,
        endingSoon,
        totalUnitsSold,
        avgConversionRate,
        conversionDelta: "+4%", // placeholder delta — requires historical comparison
        avgFeedbackRating,
        totalReviews: ratingCount,
      },
    });
  } catch (error) {
    console.error("[Analytics] getPromotionsSummary error:", error);
    return res.status(500).json({ message: "Failed to fetch summary" });
  }
};

/* ─── getPromotionsList ───────────────────────────────────────────────────── */

/**
 * GET /api/analytics/promotions
 *
 * Returns per-promotion data (for bar charts + promotion dropdown):
 *   [{ promotionId, title, totalUnitsSold, status, startDate, endDate }]
 */
const getPromotionsList = async (req, res) => {
  try {
    if (!ALLOWED_ROLES.includes(req.user?.role)) {
      return res.status(200).json({ data: null });
    }

    const promotions = await Promotion.find()
      .select("title status startDate endDate salesData")
      .lean();

    const data = promotions.map((p) => {
      const totalUnitsSold = (p.salesData || []).reduce(
        (sum, s) => sum + (s.unitsSold || 0),
        0
      );
      return {
        promotionId: p._id,
        title: p.title,
        totalUnitsSold,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
      };
    });

    // Sort by units sold descending
    data.sort((a, b) => b.totalUnitsSold - a.totalUnitsSold);

    return res.status(200).json({ data });
  } catch (error) {
    console.error("[Analytics] getPromotionsList error:", error);
    return res.status(500).json({ message: "Failed to fetch promotions list" });
  }
};

/* ─── getFeedbackSentiment ────────────────────────────────────────────────── */

/**
 * GET /api/analytics/feedback
 *
 * Returns sentiment breakdown from promotion ratings:
 *   { positive (7-10), neutral (4-6), negative (0-3), total }
 */
const getFeedbackSentiment = async (req, res) => {
  try {
    if (!ALLOWED_ROLES.includes(req.user?.role)) {
      return res.status(200).json({ data: null });
    }

    const promotions = await Promotion.find()
      .select("participatingRetailers")
      .lean();

    let positive = 0;
    let neutral = 0;
    let negative = 0;

    promotions.forEach((p) => {
      (p.participatingRetailers || []).forEach((r) => {
        if (r.rating == null) return;
        if (r.rating >= 7) positive++;
        else if (r.rating >= 4) neutral++;
        else negative++;
      });
    });

    const total = positive + neutral + negative;

    return res.status(200).json({
      data: {
        positive,
        neutral,
        negative,
        total,
        positivePct: total > 0 ? Math.round((positive / total) * 100) : 0,
        neutralPct: total > 0 ? Math.round((neutral / total) * 100) : 0,
        negativePct: total > 0 ? Math.round((negative / total) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("[Analytics] getFeedbackSentiment error:", error);
    return res.status(500).json({ message: "Failed to fetch feedback sentiment" });
  }
};

/* ─── getStockTrend ───────────────────────────────────────────────────────── */

/**
 * GET /api/analytics/stock?period=30d
 *
 * Returns daily order unit totals (for line chart — stock request trend).
 *   [{ day: "Mon", totalUnits }]
 */
const getStockTrend = async (req, res) => {
  try {
    if (!ALLOWED_ROLES.includes(req.user?.role)) {
      return res.status(200).json({ data: null });
    }

    const { dateFilter } = buildFilters(req.query);

    const pipeline = [
      { $match: { ...dateFilter } },
      { $unwind: "$items" },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" }, // 1=Sun … 7=Sat
          totalUnits: { $sum: "$items.quantity" },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const agg = await Order.aggregate(pipeline);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const data = dayNames.map((day, idx) => {
      const match = agg.find((a) => a._id === idx + 1);
      return { day, totalUnits: match ? match.totalUnits : 0 };
    });

    return res.status(200).json({ data });
  } catch (error) {
    console.error("[Analytics] getStockTrend error:", error);
    return res.status(500).json({ message: "Failed to fetch stock trend" });
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  STOCK MANAGER DASHBOARD ENDPOINTS
 *  Accessible to: hq_admin, staff, stock_manager
 * ═══════════════════════════════════════════════════════════════════════════ */

const STOCK_ALLOWED_ROLES = ["hq_admin", "staff", "stock_manager"];

/* ─── getStockManagerSummary ──────────────────────────────────────────────── */

/**
 * GET /api/analytics/sm-summary?period=30d
 *
 * Returns KPI cards for the Stock Manager dashboard:
 *   { totalStockRequests, peakDemandDay, peakDemandAvg,
 *     fulfillmentRate, lowStockAlertCount }
 */
const getStockManagerSummary = async (req, res) => {
  try {
    if (!STOCK_ALLOWED_ROLES.includes(req.user?.role)) {
      return res.status(200).json({ data: null });
    }

    const { dateFilter } = buildFilters(req.query);

    // Total stock requests (count of order line-items)
    const orders = await Order.find({ ...dateFilter })
      .select("items status createdAt")
      .lean();

    let totalStockRequests = 0;
    const dayBuckets = {}; // dayOfWeek → totalUnits

    orders.forEach((o) => {
      const dayOfWeek = new Date(o.createdAt).getDay(); // 0=Sun
      (o.items || []).forEach((item) => {
        const qty = item.quantity || 0;
        totalStockRequests += qty;
        dayBuckets[dayOfWeek] = (dayBuckets[dayOfWeek] || 0) + qty;
      });
    });

    // Peak demand day
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let peakDay = 0;
    let peakVal = 0;
    Object.entries(dayBuckets).forEach(([d, v]) => {
      if (v > peakVal) { peakDay = Number(d); peakVal = v; }
    });

    // Fulfillment rate
    const totalOrders = orders.length;
    const fulfilled = orders.filter((o) =>
      ["accepted", "shipped", "delivered"].includes(o.status)
    ).length;
    const fulfillmentRate = totalOrders > 0
      ? parseFloat(((fulfilled / totalOrders) * 100).toFixed(1))
      : 0;

    // Low stock alert count (reuse logic)
    const lowStockPipeline = [
      { $match: { ...dateFilter } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalRequests: { $sum: 1 },
          highQtyRequests: {
            $sum: { $cond: [{ $gte: ["$items.quantity", HIGH_QUANTITY_THRESHOLD] }, 1, 0] },
          },
          distinctOrders: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          totalRequests: 1,
          highQtyRequests: 1,
          distinctOrderCount: { $size: "$distinctOrders" },
          highQtyPct: {
            $cond: [
              { $gt: ["$totalRequests", 0] },
              { $multiply: [{ $divide: ["$highQtyRequests", "$totalRequests"] }, 100] },
              0,
            ],
          },
        },
      },
      {
        $match: {
          $or: [
            { highQtyPct: { $gt: 80 } },
            { distinctOrderCount: { $gt: 10 } },
          ],
        },
      },
    ];
    const lowStockAgg = await Order.aggregate(lowStockPipeline);

    return res.status(200).json({
      data: {
        totalStockRequests,
        peakDemandDay: dayNames[peakDay],
        peakDemandAvg: peakVal,
        fulfillmentRate,
        lowStockAlertCount: lowStockAgg.length,
      },
    });
  } catch (error) {
    console.error("[Analytics] getStockManagerSummary error:", error);
    return res.status(500).json({ message: "Failed to fetch SM summary" });
  }
};

/* ─── getProductsList ─────────────────────────────────────────────────────── */

/**
 * GET /api/analytics/products?period=30d
 *
 * Returns top products by order volume (for dropdown + bar chart):
 *   [{ productId, productName, requestCount }]
 */
const getProductsList = async (req, res) => {
  try {
    if (!STOCK_ALLOWED_ROLES.includes(req.user?.role)) {
      return res.status(200).json({ data: null });
    }

    const { dateFilter } = buildFilters(req.query);

    const pipeline = [
      { $match: { ...dateFilter } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          requestCount: { $sum: "$items.quantity" },
        },
      },
      { $sort: { requestCount: -1 } },
    ];

    const agg = await Order.aggregate(pipeline);

    // Resolve product names
    const productIds = agg.map((a) => a._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select("name")
      .lean();
    const nameMap = {};
    products.forEach((p) => (nameMap[p._id.toString()] = p.name));

    const data = agg.map((item) => ({
      productId: item._id,
      productName: nameMap[item._id.toString()] || "Unknown Product",
      requestCount: item.requestCount,
    }));

    return res.status(200).json({ data });
  } catch (error) {
    console.error("[Analytics] getProductsList error:", error);
    return res.status(500).json({ message: "Failed to fetch products list" });
  }
};

/* ─── getFulfillmentByRegion ──────────────────────────────────────────────── */

/**
 * GET /api/analytics/fulfillment?period=30d
 *
 * Returns fulfillment rate grouped by retailer province:
 *   [{ region, fulfillmentRate, totalOrders, fulfilledOrders }]
 */
const getFulfillmentByRegion = async (req, res) => {
  try {
    if (!STOCK_ALLOWED_ROLES.includes(req.user?.role)) {
      return res.status(200).json({ data: null });
    }

    const { dateFilter } = buildFilters(req.query);

    // Fetch orders with retailer populated for province
    const orders = await Order.find({ ...dateFilter })
      .select("retailer status")
      .lean();

    // Get all retailer IDs
    const retailerIds = [...new Set(orders.map((o) => o.retailer.toString()))];
    const retailers = await User.find({ _id: { $in: retailerIds } })
      .select("province")
      .lean();
    const provinceMap = {};
    retailers.forEach((r) => {
      provinceMap[r._id.toString()] = r.province || "Unknown";
    });

    // Group orders by province
    const regionStats = {};
    const FULFILLED = ["accepted", "shipped", "delivered"];

    orders.forEach((o) => {
      const region = provinceMap[o.retailer.toString()] || "Unknown";
      if (!regionStats[region]) {
        regionStats[region] = { totalOrders: 0, fulfilledOrders: 0 };
      }
      regionStats[region].totalOrders++;
      if (FULFILLED.includes(o.status)) {
        regionStats[region].fulfilledOrders++;
      }
    });

    const data = Object.entries(regionStats)
      .map(([region, stats]) => ({
        region,
        totalOrders: stats.totalOrders,
        fulfilledOrders: stats.fulfilledOrders,
        fulfillmentRate:
          stats.totalOrders > 0
            ? parseFloat(((stats.fulfilledOrders / stats.totalOrders) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.fulfillmentRate - a.fulfillmentRate);

    return res.status(200).json({ data });
  } catch (error) {
    console.error("[Analytics] getFulfillmentByRegion error:", error);
    return res.status(500).json({ message: "Failed to fetch fulfillment by region" });
  }
};

/* ─── getMyFeedbackSentiment ──────────────────────────────────────────────── */

/**
 * GET /api/analytics/my-feedback
 *
 * Retailer-only. Returns the retailer's own feedback sentiment breakdown:
 *   { positive, neutral, negative, total, positivePct, neutralPct, negativePct }
 */
const getMyFeedbackSentiment = async (req, res) => {
  try {
    if (req.user?.role !== "retailer") {
      return res.status(403).json({ message: "Retailer access only" });
    }

    const retailerId = req.user._id;
    const promotions = await Promotion.find()
      .select("participatingRetailers")
      .lean();

    let positive = 0;
    let neutral = 0;
    let negative = 0;

    promotions.forEach((p) => {
      (p.participatingRetailers || []).forEach((r) => {
        if (r.retailerId?.toString() !== retailerId.toString()) return;
        if (r.rating == null) return;
        if (r.rating >= 7) positive++;
        else if (r.rating >= 4) neutral++;
        else negative++;
      });
    });

    const total = positive + neutral + negative;

    return res.status(200).json({
      data: {
        positive,
        neutral,
        negative,
        total,
        positivePct: total > 0 ? Math.round((positive / total) * 100) : 0,
        neutralPct: total > 0 ? Math.round((neutral / total) * 100) : 0,
        negativePct: total > 0 ? Math.round((negative / total) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("[Analytics] getMyFeedbackSentiment error:", error);
    return res.status(500).json({ message: "Failed to fetch feedback sentiment" });
  }
};

module.exports = {
  getPromotionConversionRates,
  getLowStockAlerts,
  getTopRetailersByVolume,
  getMyOrderHistory,
  getMyTopProducts,
  getMyPerformanceVsAverage,
  getPromotionsSummary,
  getPromotionsList,
  getFeedbackSentiment,
  getStockTrend,
  getStockManagerSummary,
  getProductsList,
  getFulfillmentByRegion,
  getMyFeedbackSentiment,
};
