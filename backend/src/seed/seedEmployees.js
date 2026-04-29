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
      "dist2@nestle.com",
      "chamara@test.com",
      "sonia@nestle.com",
      "mahesh@nestle.com",
      "dilini@nestle.com",
      "kamal@distributor.com",
      "nadeeka@nestle.com"
    ];
    await User.deleteMany({ email: { $in: emailsToDelete } });
    await User.deleteMany({ employeeId: { $in: QA_IDS } });
    console.log("🗑   Cleared existing test accounts");

    await ValidEmployee.deleteMany({});
    console.log("🗑   Cleared ValidEmployee collection");

    await ValidEmployee.insertMany(EMPLOYEES);
    console.log(`✅  Inserted ${EMPLOYEES.length} ValidEmployee records`);

    // Re-insert standard dev users for DevLauncher
    const DEV_USERS = [
      {
        fullName: "Chamara Perera",
        email: "chamara@test.com",
        password: "password123", // Will be hashed by pre-save hook
        role: "retailer",
        phone: "0771234567",
        businessName: "Perera Grocery",
        businessAddress: "123 Kandy Road",
        taxId: "TAX123456",
        province: "Central",
        district: "Kandy"
      },
      {
        fullName: "Sonia Perera",
        email: "sonia@nestle.com",
        password: "password123",
        role: "promotion_manager",
        phone: "0771122334",
        employeeId: "NES-DEV-555",
        department: "Promotions",
        officeLocation: "Colombo Head Office"
      },
      {
        fullName: "Mahesh Silve",
        email: "mahesh@nestle.com",
        password: "password123",
        role: "stock_manager",
        phone: "0771239988",
        employeeId: "NES-DEV-444",
        department: "Logistics",
        officeLocation: "Colombo Main Store"
      },
      {
        fullName: "Dilini Fernando",
        email: "dilini@nestle.com",
        password: "password123",
        role: "hq_admin",
        phone: "0112345678",
        employeeId: "NES-DEV-999",
        department: "HQ Operations",
        officeLocation: "Colombo Head Office"
      },
      {
        fullName: "Kamal Jayawardena",
        email: "kamal@distributor.com",
        password: "password123",
        role: "distributor",
        phone: "0761234567",
        employeeId: "NES-DEV-666",
        department: "Distribution",
        officeLocation: "Colombo DC"
      },
      {
        fullName: "Nadeeka Perera",
        email: "nadeeka@nestle.com",
        password: "password123",
        role: "staff",
        phone: "0777654321",
        employeeId: "NES-DEV-888",
        department: "Sales & Distribution",
        officeLocation: "Colombo Head Office",
        staffCategory: "General Staff"
      }
    ];

    for (const u of DEV_USERS) {
      // Use create to trigger pre-save hooks (password hashing)
      await User.create(u);
    }
    console.log(`✅  Inserted ${DEV_USERS.length} Dev Users`);

    await mongoose.disconnect();
    console.log("🔌  Disconnected. Seed complete.");
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  }
};

run();
