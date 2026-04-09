require("dotenv").config({ path: __dirname + "/../../.env" });
const mongoose = require("mongoose");
const ValidEmployee = require("../models/ValidEmployee");
const User = require("../models/User");

// ─── Universal Dev IDs — always reset these so they can be re-registered ──────
const DEV_IDS = [
  "NES-DEV-999",  // hq_admin
  "NES-DEV-888",  // staff
  "NES-DEV-777",  // staff
  "NES-DEV-666",  // distributor

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

// ─── Employee seed list ────────────────────────────────────────────────────────
// Roles in this system:
//   hq_admin    — HQ Admins with full system access
//   staff — Staff members (Stockout, Product Quality, Logistics, Pricing, General Support)
//                 Staff Category is chosen at registration — it does NOT affect the role value stored in DB
//   distributor — Third-party logistics / distributor partners
//
// Each ID is one-time use. NES-DEV-* IDs are reset on every seed run.
const EMPLOYEES = [
  // ── Universal Dev IDs (reset on every seed — always available for testing) ──
  { employeeId: "NES-DEV-999", role: "hq_admin" },
  { employeeId: "NES-DEV-888", role: "staff" },
  { employeeId: "NES-DEV-777", role: "staff" },
  { employeeId: "NES-DEV-666", role: "distributor" },

  // ── HQ Admin IDs ─────────────────────────────────────────────────────────────
  { employeeId: "NES-ADM-001", role: "hq_admin" },
  { employeeId: "NES-ADM-002", role: "hq_admin" },
  { employeeId: "NES-ADM-003", role: "hq_admin" },

  // ── Sales Staff IDs ───────────────────────────────────────────────────────────
  // Used by: Stockout Staff, Product Quality Staff, Logistics Staff,
  //          Pricing Staff, and General Support — all share role = "staff"
  { employeeId: "NES-STF-001", role: "staff" },
  { employeeId: "NES-STF-002", role: "staff" },
  { employeeId: "NES-STF-003", role: "staff" },
  { employeeId: "NES-STF-004", role: "staff" },
  { employeeId: "NES-STF-005", role: "staff" },
  { employeeId: "NES-STF-006", role: "staff" },
  { employeeId: "NES-STF-007", role: "staff" },
  { employeeId: "NES-STF-008", role: "staff" },
  { employeeId: "NES-STF-009", role: "staff" },
  { employeeId: "NES-STF-010", role: "staff" },

  // ── Distributor IDs ───────────────────────────────────────────────────────────
  { employeeId: "NES-DST-001", role: "distributor" },
  { employeeId: "NES-DST-002", role: "distributor" },
  { employeeId: "NES-DST-003", role: "distributor" },
  { employeeId: "NES-DST-004", role: "distributor" },
  { employeeId: "NES-DST-005", role: "distributor" },

  // ── Legacy IDs (kept so old accounts remain findable) ─────────────────────────
  { employeeId: "NES001",    role: "hq_admin" },
  { employeeId: "NES100",    role: "hq_admin" },
  { employeeId: "NES111",    role: "hq_admin" },
  { employeeId: "NES004",    role: "distributor" },
  { employeeId: "NES400",    role: "distributor" },
];

const run = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI not found in .env");

    await mongoose.connect(uri);
    console.log("✅  Connected to MongoDB");

    // 1. Delete any User accounts registered with the resettable dev IDs
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
    console.log("   NES-DEV-888  →  staff  (pick any Staff Category)");
    console.log("   NES-DEV-777  →  staff  (pick any Staff Category)");
    console.log("   NES-DEV-666  →  distributor");
    console.log("\n📋  Named IDs by role:");
    console.log("   HQ Admin:     NES-ADM-001 to NES-ADM-003");
    console.log("   Staff:        NES-STF-001 to NES-STF-010");
    console.log("   Distributor:  NES-DST-001 to NES-DST-005\n");

    await mongoose.disconnect();
    console.log("🔌  Disconnected. Seed complete.");
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  }
};

run();
