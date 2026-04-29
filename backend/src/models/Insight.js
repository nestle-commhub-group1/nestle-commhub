const mongoose = require("mongoose");

const insightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },

  type: {
    type: String,
    required: [true, "Insight type is required"],
  },

  message: {
    type: String,
    required: [true, "Insight message is required"],
  },

  relatedInsight: {
    type: mongoose.Schema.Types.Mixed,
  },

  role: {
    type: String,
    required: [true, "Role is required"],
  },

  scope: {
    type: String,
    enum: ["global", "own"],
    default: "global",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Insight = mongoose.model("Insight", insightSchema);
module.exports = Insight;
