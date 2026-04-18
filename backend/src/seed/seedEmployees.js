require("dotenv").config({ path: __dirname + "/../../.env" });
const mongoose = require("mongoose");
const ValidEmployee = require("../models/ValidEmployee");
const User = require("../models/User");

const QA_IDS = [
  "NES-PRM-001",
  "NES-SM-001",
  "NES-STF-001",
  "NES-ADM-001",
  "NES-DIST-001",
  "NES-DIST-002"
];

const EMPLOYEES = [
  { employeeId: "NES-DEV-999", role: "hq_admin" },
  { employeeId: "NES-DEV-888", role: "staff" },
  { employeeId: "NES-DEV-777", role: "staff" },
  { employeeId: "NES-DEV-666", role: "distributor" },
  { employeeId: "NES-DEV-555", role: "promotion_manager" },
  { employeeId: "NES-DEV-444", role: "stock_manager" },
  { employeeId: "NES-PRM-001", role: "promotion_manager" },
  { employeeId: "NES-SM-001",  role: "stock_manager" },
  { employeeId: "NES-STF-001", role: "staff" },
  { employeeId: "NES-ADM-001", role: "hq_admin" },
  { employeeId: "NES-DIST-001", role: "distributor" },
  { employeeId: "NES-DIST-002", role: "distributor" }
];

const run = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI not found in .env");

    await mongoose.connect(uri);
    console.log("✅  Connected to MongoDB");

    // Clear old test accounts
    const emailsToDelete = [
      "pm1@nestle.com", 
      "retailer1@test.com", 
      "retailer2@test.com", 
      "sm1@nestle.com", 
      "staff1@nestle.com", 
      "admin1@nestle.com", 
      "dist1@nestle.com", 
      "dist2@nestle.com"
    ];
    await User.deleteMany({ email: { $in: emailsToDelete } });
    await User.deleteMany({ employeeId: { $in: QA_IDS } });
    console.log("🗑   Cleared existing test accounts");

    await ValidEmployee.deleteMany({});
    console.log("🗑   Cleared ValidEmployee collection");

    await ValidEmployee.insertMany(EMPLOYEES);
    console.log(`✅  Inserted ${EMPLOYEES.length} ValidEmployee records`);

    await mongoose.disconnect();
    console.log("🔌  Disconnected. Seed complete.");
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  }
};

run();
