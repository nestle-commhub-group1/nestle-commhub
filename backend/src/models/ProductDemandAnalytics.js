/**
 * ProductDemandAnalytics.js
 *
 * Stores computed demand intelligence for a product.
 * Populated by smartStockController.calculateDemandScore()
 * and updated by the background demand job.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const productDemandAnalyticsSchema = new Schema({
  productId: {
    type:     Schema.Types.ObjectId,
    ref:      'Product',
    required: true,
    unique:   true,
  },

  /* ── Core Score ─────────────────────────────────────────────────── */
  demandScore:         { type: Number, default: 0, min: 0, max: 10 },
  avgRequestsPerWeek:  { type: Number, default: 0 },
  fulfillmentRate:     { type: Number, default: 0, min: 0, max: 1 }, // 0-1
  growthTrend:         { type: Number, default: 0 },   // positive = growing
  retailerInterest:    { type: Number, default: 0 },   // count of unique retailers ordering

  /* ── Time-of-week pattern ──────────────────────────────────────── */
  peakDemandDay: {
    type: String,
    enum: ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'],
    default: 'MONDAY',
  },

  /* ── Seasonal demand multipliers (relative to base) ───────────── */
  seasonalDemand: {
    SUMMER:  { type: Number, default: 1.0 },
    MONSOON: { type: Number, default: 1.0 },
    WINTER:  { type: Number, default: 1.0 },
    SPRING:  { type: Number, default: 1.0 },
  },

  /* ── Historical snapshots (up to last 12 weeks) ────────────────── */
  demandHistory: [
    {
      period:          String,   // e.g. "2024-W12"
      requests:        Number,
      fulfillmentRate: Number,
    },
  ],

  /* ── Derived recommendations ─────────────────────────────────────── */
  recommendations: {
    optimalStockLevel:  { type: Number, default: 0 },
    reorderThreshold:   { type: Number, default: 0 },
    safetyStock:        { type: Number, default: 0 },
  },

  lastCalculatedAt: { type: Date, default: Date.now },
  createdAt:        { type: Date, default: Date.now },
});

module.exports = mongoose.model('ProductDemandAnalytics', productDemandAnalyticsSchema);
