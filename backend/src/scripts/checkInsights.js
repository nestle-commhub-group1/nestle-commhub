require("dotenv").config();
const mongoose = require("mongoose");
const Insight = require("../models/Insight");
const User = require("../models/User");

async function check() {
  await mongoose.connect(process.env.MONGO_URI);

  // Find Dilini
  const dilini = await User.findOne({ email: "dilini@nestle.com" });
  if (dilini) {
    console.log("Dilini found:", dilini._id, "role:", dilini.role);
    const insights = await Insight.find({ userId: dilini._id });
    console.log("Insights for Dilini:", insights.length);
    insights.forEach(i => console.log(`  [${i.role}] ${i.type}: ${i.message}`));
  } else {
    console.log("Dilini not found");
  }

  // Check all insights
  const all = await Insight.find().select("userId role type");
  console.log("\nAll insights:", all.length);
  const byUser = {};
  all.forEach(i => {
    const key = i.userId.toString();
    if (!byUser[key]) byUser[key] = [];
    byUser[key].push(i.type);
  });
  for (const [uid, types] of Object.entries(byUser)) {
    const u = await User.findById(uid).select("fullName role email");
    console.log(`  ${u?.fullName || uid} (${u?.role}): ${types.join(", ")}`);
  }

  await mongoose.disconnect();
}

check();
