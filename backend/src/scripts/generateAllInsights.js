require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const { generateInsight } = require("../controllers/insightController");

async function gen() {
  await mongoose.connect(process.env.MONGO_URI);

  // Generate insights for ALL users that don't have any
  const users = await User.find();
  
  for (const user of users) {
    const Insight = require("../models/Insight");
    const existing = await Insight.countDocuments({ userId: user._id });
    if (existing > 0) {
      console.log(`  ✓ ${user.fullName} (${user.role}) — already has ${existing} insights`);
      continue;
    }

    try {
      const insights = await generateInsight(user._id);
      console.log(`  ✅ ${user.fullName} (${user.role}) — generated ${insights.length} insights`);
    } catch (err) {
      console.error(`  ❌ ${user.fullName}: ${err.message}`);
    }
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

gen();
