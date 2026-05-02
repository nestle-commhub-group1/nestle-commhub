/**
 * smartStockController.js
 *
 * Smart Stock Ordering — Predictive Demand & Quick Order
 *
 * Endpoints:
 *   GET  /api/stock/smart-recommendations
 *   GET  /api/stock/predict-demand/:productId
 *   GET  /api/stock/order-suggestion/:productId
 *   POST /api/stock/quick-order
 *
 * Demand Score Formula (0–10):
 *   score = (avgRequestsNorm × 30%) + (fulfillmentRate × 30%) +
 *           (growthTrendNorm × 20%) + (retailerInterestNorm × 20%)
 */

const Product                = require('../models/Product');
const ProductDemandAnalytics = require('../models/ProductDemandAnalytics');
const Order                  = require('../models/Order');
const Notification           = require('../models/Notification');
const User                   = require('../models/User');

const SM_ROLES = ['stock_manager', 'hq_admin'];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

/** Current meteorological season (Southern-hemisphere aware for Sri Lanka). */
function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 6 && month <= 9)  return 'MONSOON'; // June–Sep SW monsoon
  if (month >= 10 && month <= 1) return 'WINTER';  // Oct–Jan NE monsoon
  if (month >= 3 && month <= 5)  return 'SUMMER';  // Mar–May dry season
  return 'SPRING';                                   // Feb
}

/** ISO week string e.g. "2024-W22" */
function isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const year = d.getUTCFullYear();
  const week = Math.ceil((((d - new Date(Date.UTC(year, 0, 1))) / 86400000) + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Day name from JS getDay() */
const DAY_NAMES = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];

/**
 * Build or refresh a ProductDemandAnalytics record for a product.
 * Derives signals from historical Order data.
 */
async function buildAnalytics(productId) {
  const product = await Product.findById(productId).lean();
  if (!product) return null;

  // Pull all delivered/accepted orders containing this product (last 12 weeks)
  const since = new Date(Date.now() - 84 * 24 * 3600 * 1000); // 12 weeks
  const orders = await Order.find({
    'items.product': productId,
    status:          { $in: ['accepted', 'delivered'] },
    createdAt:       { $gte: since },
  }).lean();

  // --- Signal 1: avgRequestsPerWeek ---
  const weekMap = {};
  const dayTotals = new Array(7).fill(0);
  let totalUnits = 0;
  const retailerSet = new Set();

  orders.forEach(o => {
    const item = o.items.find(i => i.product.toString() === productId.toString());
    if (!item) return;

    const week = isoWeek(new Date(o.createdAt));
    weekMap[week] = (weekMap[week] || 0) + item.quantity;

    const day = new Date(o.createdAt).getDay();
    dayTotals[day] += item.quantity;

    totalUnits += item.quantity;
    retailerSet.add(o.retailer.toString());
  });

  const weekCount         = Math.max(Object.keys(weekMap).length, 1);
  const avgRequestsPerWeek = totalUnits / weekCount;
  const peakDayIdx        = dayTotals.indexOf(Math.max(...dayTotals));
  const peakDemandDay     = DAY_NAMES[peakDayIdx];
  const retailerInterest  = retailerSet.size;

  // --- Signal 2: fulfillmentRate (accepted+delivered / all orders for product) ---
  const allOrders = await Order.countDocuments({ 'items.product': productId, createdAt: { $gte: since } });
  const fulfillmentRate = allOrders > 0 ? orders.length / allOrders : 0.75; // default 75%

  // --- Signal 3: growthTrend ---
  // Compare last 4 weeks vs prior 4 weeks
  const weeks = Object.entries(weekMap).sort((a, b) => a[0].localeCompare(b[0]));
  const half  = Math.ceil(weeks.length / 2);
  const earlySum = weeks.slice(0, half).reduce((s, [, v]) => s + v, 0);
  const lateSum  = weeks.slice(half).reduce((s, [, v]) => s + v, 0);
  const growthTrend = earlySum > 0 ? (lateSum - earlySum) / earlySum : 0;

  // --- Normalised score (0-10) ---
  // Normalise avgRequestsPerWeek against a reference of 500 units/week
  const REF_WEEKLY = 500;
  const avgNorm          = Math.min(avgRequestsPerWeek / REF_WEEKLY, 1);
  const growthNorm       = Math.min(Math.max((growthTrend + 1) / 2, 0), 1); // -1..+1 → 0..1
  const retailerNorm     = Math.min(retailerInterest / 20, 1); // cap at 20 unique retailers

  const rawScore =
    avgNorm       * 0.30 +
    fulfillmentRate * 0.30 +
    growthNorm    * 0.20 +
    retailerNorm  * 0.20;

  const demandScore = parseFloat((rawScore * 10).toFixed(2));

  // --- Demand history (last 12 weeks) ---
  const demandHistory = weeks.slice(-12).map(([period, requests]) => ({
    period,
    requests,
    fulfillmentRate: parseFloat(fulfillmentRate.toFixed(2)),
  }));

  // --- Seasonal multipliers (simple heuristics if no real data) ---
  const base = avgRequestsPerWeek || 1;
  const seasonalDemand = {
    SUMMER:  parseFloat((base * 1.4).toFixed(0)),
    MONSOON: parseFloat((base * 0.8).toFixed(0)),
    WINTER:  parseFloat((base * 1.1).toFixed(0)),
    SPRING:  parseFloat((base * 1.0).toFixed(0)),
  };

  // --- Recommendations ---
  const optimalStockLevel = Math.ceil(avgRequestsPerWeek * 4 * 1.2);  // 4 weeks + 20% buffer
  const reorderThreshold  = Math.ceil(avgRequestsPerWeek * 1.5);       // 1.5 weeks
  const safetyStock       = Math.ceil(avgRequestsPerWeek * 0.5);       // 0.5 week

  // Upsert analytics record
  const analytics = await ProductDemandAnalytics.findOneAndUpdate(
    { productId },
    {
      productId,
      demandScore,
      avgRequestsPerWeek: parseFloat(avgRequestsPerWeek.toFixed(1)),
      fulfillmentRate:    parseFloat(fulfillmentRate.toFixed(3)),
      growthTrend:        parseFloat(growthTrend.toFixed(3)),
      retailerInterest,
      peakDemandDay,
      seasonalDemand,
      demandHistory,
      recommendations: { optimalStockLevel, reorderThreshold, safetyStock },
      lastCalculatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return { analytics, product };
}

/* ─── getSmartStockRecommendations ─────────────────────────────────────────── */

/**
 * GET /api/stock/smart-recommendations
 * Returns products ranked by demand score (>= 5 shown, sorted desc).
 */
const getSmartStockRecommendations = async (req, res) => {
  try {
    if (!SM_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const products = await Product.find().lean();

    // Compute or fetch analytics for all products
    const results = await Promise.all(
      products.map(async product => {
        let analytics = await ProductDemandAnalytics.findOne({ productId: product._id }).lean();

        // If stale (>24h) or missing, rebuild
        const stale = !analytics ||
          (Date.now() - new Date(analytics.lastCalculatedAt).getTime()) > 24 * 3600 * 1000;

        if (stale) {
          const built = await buildAnalytics(product._id);
          analytics = built?.analytics ?? analytics;
        }

        if (!analytics) {
          // No order history — assign a floor score based on stock
          analytics = {
            demandScore:         3.0,
            avgRequestsPerWeek:  0,
            fulfillmentRate:     0.75,
            growthTrend:         0,
            peakDemandDay:       'MONDAY',
            recommendations:     { optimalStockLevel: 100, reorderThreshold: 50, safetyStock: 25 },
          };
        }

        const currentStock       = product.stockQuantity;
        const recommendedOrder   = Math.max(analytics.recommendations.optimalStockLevel - currentStock, 0);
        const estimatedDemand    = Math.round(analytics.avgRequestsPerWeek * 4);
        const fulfillmentRisk    =
          currentStock < analytics.recommendations.reorderThreshold ? 'HIGH' :
          currentStock < analytics.recommendations.optimalStockLevel * 0.5 ? 'MEDIUM' : 'LOW';

        let reason = '';
        if (analytics.growthTrend > 0.2)    reason = `↑ ${Math.round(analytics.growthTrend * 100)}% demand growth trend`;
        else if (fulfillmentRisk === 'HIGH') reason = `⚠️ Stock below reorder threshold (${currentStock} units)`;
        else if (analytics.demandScore >= 7) reason = `🔥 High demand score (${analytics.demandScore}/10)`;
        else                                  reason = `Avg ${analytics.avgRequestsPerWeek} units/week`;

        return {
          productId:          product._id,
          name:               product.name,
          category:           product.category,
          price:              product.price,
          demandScore:        analytics.demandScore,
          currentStock,
          avgRequestsPerWeek: analytics.avgRequestsPerWeek,
          recommendedOrder,
          estimatedDemand,
          fulfillmentRisk,
          peakDemandDay:      analytics.peakDemandDay,
          fulfillmentRate:    analytics.fulfillmentRate,
          growthTrend:        analytics.growthTrend,
          reason,
          confidence:         Math.min(0.7 + analytics.demandScore * 0.03, 0.98),
          howStatus:          product.howStatus,
        };
      })
    );

    const sorted = results
      .filter(r => r.demandScore >= 0) // show all — frontend can filter
      .sort((a, b) => b.demandScore - a.demandScore);

    return res.status(200).json({ success: true, data: sorted });
  } catch (error) {
    console.error('[SmartStock] getSmartStockRecommendations error:', error);
    return res.status(500).json({ message: 'Failed to fetch smart recommendations' });
  }
};

/* ─── predictProductDemand ─────────────────────────────────────────────────── */

/**
 * GET /api/stock/predict-demand/:productId
 * 4-week rolling demand forecast with trend + seasonal adjustment.
 */
const predictProductDemand = async (req, res) => {
  try {
    if (!SM_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { productId } = req.params;
    const { analytics, product } = await buildAnalytics(productId) || {};

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const base       = analytics?.avgRequestsPerWeek || 50;
    const trend      = analytics?.growthTrend || 0;
    const season     = getCurrentSeason();
    const seasonMult = analytics?.seasonalDemand?.[season]
      ? analytics.seasonalDemand[season] / base
      : 1.0;

    // Apply compound growth + seasonal multiplier per week
    const weeks = [1, 2, 3, 4].map(w => {
      const growthFactor  = Math.pow(1 + trend * 0.5, w);  // dampened
      const predicted     = Math.round(base * growthFactor * seasonMult);
      return { week: w, predicted: Math.max(predicted, 0) };
    });

    const trendLabel =
      trend > 0.05  ? 'INCREASING' :
      trend < -0.05 ? 'DECREASING' : 'STABLE';

    const confidence = Math.min(0.65 + (analytics?.demandScore || 0) * 0.035, 0.97);

    return res.status(200).json({
      success: true,
      productId,
      productName:    product.name,
      currentStock:   product.stockQuantity,
      weeks,
      trend:          trendLabel,
      confidence:     parseFloat(confidence.toFixed(2)),
      peakDemandDay:  analytics?.peakDemandDay || 'MONDAY',
      currentSeason:  season,
      seasonalFactor: parseFloat(seasonMult.toFixed(2)),
    });
  } catch (error) {
    console.error('[SmartStock] predictProductDemand error:', error);
    return res.status(500).json({ message: 'Failed to predict demand' });
  }
};

/* ─── getSmartOrderSuggestion ─────────────────────────────────────────────── */

/**
 * GET /api/stock/order-suggestion/:productId
 * Returns a single recommended order qty with risk level and rationale.
 */
const getSmartOrderSuggestion = async (req, res) => {
  try {
    if (!SM_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { productId } = req.params;
    const result = await buildAnalytics(productId);
    if (!result?.product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { analytics, product } = result;
    const recommendedQty  = analytics.recommendations.optimalStockLevel;
    const toOrder         = Math.max(recommendedQty - product.stockQuantity, 0);
    const estimatedDemand = Math.round((analytics.avgRequestsPerWeek || 0) * 4);
    const confidence      = Math.min(0.70 + analytics.demandScore * 0.03, 0.98);
    const fulfillmentRisk =
      product.stockQuantity < analytics.recommendations.reorderThreshold ? 'HIGH' :
      product.stockQuantity < recommendedQty * 0.5 ? 'MEDIUM' : 'LOW';

    return res.status(200).json({
      success: true,
      productId,
      productName:       product.name,
      currentStock:      product.stockQuantity,
      recommendedOrder:  toOrder,
      optimalStockLevel: recommendedQty,
      estimatedDemand,
      fulfillmentRisk,
      confidence:        parseFloat(confidence.toFixed(2)),
      confidencePct:     Math.round(confidence * 100),
      reorderThreshold:  analytics.recommendations.reorderThreshold,
      safetyStock:       analytics.recommendations.safetyStock,
    });
  } catch (error) {
    console.error('[SmartStock] getSmartOrderSuggestion error:', error);
    return res.status(500).json({ message: 'Failed to get order suggestion' });
  }
};

/* ─── calculateDemandScore ──────────────────────────────────────────────────── */

/**
 * POST /api/stock/calculate-demand/:productId  (internal / admin)
 * Force-recalculates demand analytics for a single product.
 */
const calculateDemandScore = async (req, res) => {
  try {
    if (!SM_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await buildAnalytics(req.params.productId);
    if (!result?.analytics) {
      return res.status(404).json({ message: 'Product not found or no data' });
    }

    return res.status(200).json({ success: true, data: result.analytics });
  } catch (error) {
    console.error('[SmartStock] calculateDemandScore error:', error);
    return res.status(500).json({ message: 'Failed to calculate demand score' });
  }
};

/* ─── quickOrder ──────────────────────────────────────────────────────────── */

/**
 * POST /api/stock/quick-order
 * Body: { productId, quantity }
 *
 * Creates an order on behalf of the Stock Manager and sends them a confirmation
 * notification. The order is placed as a "stock replenishment" type.
 */
const quickOrder = async (req, res) => {
  try {
    if (!SM_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { productId, quantity } = req.body;
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'productId and quantity (>= 1) are required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const order = new Order({
      retailer:    req.user._id,   // placed by Stock Manager acting as internal retailer
      items:       [{ product: product._id, quantity, priceAtTime: product.price, discountApplied: 0 }],
      totalAmount: product.price * quantity,
      notes:       `Smart Quick Order — auto-generated by Smart Stock Ordering (${new Date().toLocaleDateString('en-GB')})`,
      status:      'pending',
    });

    await order.save();

    // Confirmation notification for the Stock Manager
    await Notification.create({
      userId:  req.user._id,
      type:    'order',
      message: `✅ Quick Order placed! Order #${order._id.toString().slice(-6).toUpperCase()} — ${quantity} units of ${product.name} (pending confirmation).`,
    });

    return res.status(201).json({
      success: true,
      orderId: order._id,
      orderRef: order._id.toString().slice(-6).toUpperCase(),
      message: `Order #${order._id.toString().slice(-6).toUpperCase()} created successfully — ${quantity} × ${product.name}`,
    });
  } catch (error) {
    console.error('[SmartStock] quickOrder error:', error);
    return res.status(500).json({ message: 'Failed to place quick order' });
  }
};

/* ─── HOW (High-Opportunity Winner) ───────────────────────────────────────── */

/**
 * POST /api/stock/mark-as-how
 * Body: { productId, reason }
 */
const markProductAsHOW = async (req, res) => {
  try {
    if (!SM_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { productId, reason } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.howStatus = {
      isHOW: true,
      markedBy: req.user._id,
      markedAt: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000), // 30 days
      reason: reason || 'Exceptional demand performance'
    };

    await product.save();

    await Notification.create({
      userId: req.user._id,
      type: 'promo',
      message: `⭐ ${product.name} is now a HOW (High-Opportunity Winner) for the next 30 days.`
    });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/stock/unmark-as-how
 * Body: { productId }
 */
const unmarkProductFromHOW = async (req, res) => {
  try {
    if (!SM_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.howStatus = { isHOW: false };
    await product.save();

    res.status(200).json({ success: true, message: 'HOW status removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/stock/how-products
 */
const getHOWProducts = async (req, res) => {
  try {
    const products = await Product.find({ 'howStatus.isHOW': true })
      .populate('howStatus.markedBy', 'fullName')
      .lean();
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSmartStockRecommendations,
  predictProductDemand,
  getSmartOrderSuggestion,
  calculateDemandScore,
  quickOrder,
  markProductAsHOW,
  unmarkProductFromHOW,
  getHOWProducts
};
