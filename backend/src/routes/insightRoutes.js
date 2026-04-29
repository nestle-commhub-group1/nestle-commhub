const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getLatestInsight, generateInsight } = require("../controllers/insightController");

// GET /api/insights/latest — get most recent insights for current user
router.get("/latest", protect, getLatestInsight);

// POST /api/insights/generate — regenerate insights for current user
router.post("/generate", protect, async (req, res) => {
  try {
    const insights = await generateInsight(req.user._id);
    return res.status(200).json({ success: true, count: insights.length, insights });
  } catch (error) {
    console.error("Insight generation error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
