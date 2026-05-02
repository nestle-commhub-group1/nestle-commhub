const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  promotionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Promotion",
    required: true,
  },
  retailerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
