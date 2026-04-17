const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: 0,
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["Dairy", "Confectionery", "Beverages", "Nutrition", "Coffee"],
  },
  stockQuantity: {
    type: Number,
    required: [true, "Stock quantity is required"],
    default: 0,
  },
  image: {
    type: String,
    default: "https://via.placeholder.com/150",
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
