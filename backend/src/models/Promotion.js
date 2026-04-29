const mongoose = require('mongoose');
const { Schema } = mongoose;

const promotionSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ["seasonal", "discount", "bundled", "flash_sale", "other"] },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  discount: { type: Number }, // percentage
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // promotion_manager
  status: { 
    type: String, 
    enum: ["active", "inactive", "archived"],
    default: "active"
  },
  // NEW: File attachments
  attachments: [
    {
      filename: String,
      url: String,           // URL to file (base64 or Cloudinary)
      uploadedAt: { type: Date, default: Date.now },
      type: { type: String, default: 'document' } // 'poster', 'guide', 'flyer', etc.
    }
  ],
  // NEW: Tiered rewards configuration
  rewards: {
    tier1: { minUnits: { type: Number, default: 0 }, maxUnits: { type: Number, default: 100 }, rewardAmount: { type: Number, default: 10 } },
    tier2: { minUnits: { type: Number, default: 101 }, maxUnits: { type: Number, default: 500 }, rewardAmount: { type: Number, default: 50 } },
    tier3: { minUnits: { type: Number, default: 501 }, maxUnits: { type: Number, default: 999999 }, rewardAmount: { type: Number, default: 100 } }
  },
  // NEW: Sales tracking per retailer
  salesData: [
    {
      retailerId: { type: Schema.Types.ObjectId, ref: 'User' },
      unitsSold: { type: Number, default: 0 },
      submittedAt: { type: Date, default: Date.now },
      rewardTier: String,                    // 'tier1', 'tier2', 'tier3'
      rewardAmount: Number,
      rewardIssuedAt: Date
    }
  ],
  // NEW: Chat room ID
  chatRoomId: { type: String },
  participatingRetailers: [
    {
      retailerId: { type: Schema.Types.ObjectId, ref: 'User' },
      optedIn: { type: Boolean, default: false },
      optedInDate: { type: Date },
      assignedDistributor: { type: Schema.Types.ObjectId, ref: 'User' }, // distributor
      rating: { type: Number, min: 0, max: 10 }, // retailer rates promotion
      ratingDate: { type: Date },
      feedback: { type: String },
      midPromotionFeedbacks: [
        {
          rating: { type: Number, min: 0, max: 10 },
          feedback: { type: String },
          submittedAt: { type: Date, default: Date.now }
        }
      ]
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Promotion', promotionSchema);
