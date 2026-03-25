require("dotenv").config();
const mongoose = require("mongoose");
const ValidEmployee = require("../models/ValidEmployee");
const User = require("../models/User");

const sampleEmployees = [
  { employeeId: "NES001", role: "hq_admin" },
  { employeeId: "NES002", role: "sales_staff" },
  { employeeId: "NES004", role: "distributor" },
  { employeeId: "NES100", role: "hq_admin" },
  { employeeId: "NES111", role: "hq_admin" },
  { employeeId: "NES200", role: "sales_staff" },
  { employeeId: "NES400", role: "distributor" },
  { employeeId: "NES123456", role: "sales_staff" },
];

const seedEmployees = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not found in environment variables.");
    }

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Clear existing records
    await ValidEmployee.deleteMany({});
    console.log("Cleared existing ValidEmployee records");

    // Clear corresponding User records to make IDs available for registration again
    const employeeIds = sampleEmployees.map(emp => emp.employeeId);
    const deleteResult = await User.deleteMany({ employeeId: { $in: employeeIds } });
    console.log(`Cleared ${deleteResult.deletedCount} existing User records for these employee IDs`);

    // Insert new sample records
    await ValidEmployee.insertMany(sampleEmployees);
    console.log(`Successfully inserted ${sampleEmployees.length} sample valid employee records`);

    // Disconnect
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error seeding ValidEmployees:", error);
    process.exit(1);
  }
};

seedEmployees();
