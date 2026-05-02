/**
 * RetailerPromotionPreference.js
 *
 * Stores a retailer's preference and performance data for a specific promotion.
 * Created/updated when a retailer rates a promotion or explicitly toggles
 * the "Notify me on re-run" setting.
 *
 * Auto-rule: notifyOnRerun is set true if feedback rating >= 4.0 (0-10 scale),
 * unless the retailer explicitly disabled it via toggleNotification.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const retailerPromotionPreferenceSchema = new Schema({
  retailerId: {
    type:     Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  promotionId: {
    type:     Schema.Types.ObjectId,
    ref:      'Promotion',
    required: true,
  },

  /* ── Preference ── */
  notifyOnRerun: {
    type:    Boolean,
    default: false,
  },
  // Tracks whether the user manually flipped the toggle (prevents auto-override)
  notifyManuallySet: {
    type:    Boolean,
    default: false,
  },

  /* ── Snapshot of retailer's performance in this promotion ── */
  rating:       { type: Number, min: 0, max: 10 },
  feedback:     { type: String },
  unitsOrdered: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  lastOrderDate:{ type: Date },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// One preference record per retailer per promotion
retailerPromotionPreferenceSchema.index(
  { retailerId: 1, promotionId: 1 },
  { unique: true }
);

module.exports = mongoose.model('RetailerPromotionPreference', retailerPromotionPreferenceSchema);
