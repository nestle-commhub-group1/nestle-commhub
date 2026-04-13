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
  participatingRetailers: [
    {
      retailerId: { type: Schema.Types.ObjectId, ref: 'User' },
      optedIn: { type: Boolean, default: false },
      optedInDate: { type: Date },
      assignedDistributor: { type: Schema.Types.ObjectId, ref: 'User' }, // distributor
      rating: { type: Number, min: 0, max: 10 }, // retailer rates promotion
      ratingDate: { type: Date },
      feedback: { type: String }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Promotion', promotionSchema);
