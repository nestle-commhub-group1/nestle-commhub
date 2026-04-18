const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  retailer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      priceAtTime: {
        type: Number,
        required: true,
      },
      discountApplied: {
        type: Number, // Percentage (e.g., 5, 10, 15)
        default: 0,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  creditsUsed: {
    type: Number,
    default: 0, // Amount of promotion credits applied as discount
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "denied", "shipped", "delivered"],
    default: "pending",
  },
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  eta: {
    type: String, // Or Date
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.pre("save", async function () {
  this.updatedAt = Date.now();
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
