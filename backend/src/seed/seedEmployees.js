require("dotenv").config({ path: __dirname + "/../../.env" });
const mongoose = require("mongoose");
const ValidEmployee = require("../models/ValidEmployee");
const User = require("../models/User");

// ─── Universal Dev IDs — always reset these so they can be re-registered ──────
const DEV_IDS = [
  // New clean universal dev IDs
  "NES-DEV-999",  // hq_admin
  "NES-DEV-888",  // sales_staff
  "NES-DEV-777",  // distributor

  // Legacy test IDs (also reset for safety)
  "TEST_ADMIN",
  "TEST_STAFF",
  "TEST_DIST",
  "NES001",
  "NES002",
  "NES004",
  "NES100",
  "NES111",
  "NES200",
  "NES400",
  "NES123456",
];

const EMPLOYEES = [
  { employeeId: "NES-DEV-999", role: "hq_admin" },
  { employeeId: "NES-DEV-888", role: "sales_staff" },
  { employeeId: "NES-DEV-777", role: "distributor" },
  { employeeId: "NES001",      role: "hq_admin" },
  { employeeId: "NES002",      role: "sales_staff" },
  { employeeId: "NES004",      role: "distributor" },
  { employeeId: "NES100",      role: "hq_admin" },
  { employeeId: "NES111",      role: "hq_admin" },
  { employeeId: "NES200",      role: "sales_staff" },
  { employeeId: "NES400",      role: "distributor" },
  { employeeId: "NES123456",   role: "sales_staff" },
];

const run = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI not found in .env");

    await mongoose.connect(uri);
    console.log("✅  Connected to MongoDB");

    // 1. Delete any User accounts registered with these employee IDs
    const userDel = await User.deleteMany({ employeeId: { $in: DEV_IDS } });
    console.log(`🗑   Deleted ${userDel.deletedCount} registered User account(s) for dev IDs`);

    // 2. Wipe the whole ValidEmployee collection and re-seed fresh
    await ValidEmployee.deleteMany({});
    console.log("🗑   Cleared ValidEmployee collection");

    // 3. Insert fresh records (isUsed defaults to false)
    await ValidEmployee.insertMany(EMPLOYEES);
    console.log(`✅  Inserted ${EMPLOYEES.length} ValidEmployee records`);
    console.log("\n🔑  Universal Dev IDs ready to register:");
    console.log("   NES-DEV-999  →  hq_admin");
    console.log("   NES-DEV-888  →  sales_staff");
    console.log("   NES-DEV-777  →  distributor\n");

    await mongoose.disconnect();
    console.log("🔌  Disconnected. Seed complete.");
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  }
};

run();
