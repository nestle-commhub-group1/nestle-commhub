require("dotenv").config({ path: __dirname + "/../../.env" });
const mongoose = require("mongoose");
const User = require("../models/User");
const ValidEmployee = require("../models/ValidEmployee");

// Known test email patterns to wipe
const TEST_EMAILS = [
  "teststaff@nestle.com",
  "tester002@nestle.com",
  "tester001@test.com",
  "fake@nestle.com",
];

const run = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI not found in .env");

    await mongoose.connect(uri);
    console.log("✅  Connected to MongoDB");

    // Delete known test user accounts by email
    const emailDel = await User.deleteMany({ email: { $in: TEST_EMAILS } });
    console.log(`🗑   Deleted ${emailDel.deletedCount} test account(s) by email`);

    // Reset isUsed on any ValidEmployee entries that are marked used
    const reset = await ValidEmployee.updateMany({ isUsed: true }, { isUsed: false });
    console.log(`🔄  Reset isUsed=false on ${reset.modifiedCount} ValidEmployee record(s)`);

    await mongoose.disconnect();
    console.log("🔌  Done.");
  } catch (err) {
    console.error("❌  Clean failed:", err.message);
    process.exit(1);
  }
};

run();
