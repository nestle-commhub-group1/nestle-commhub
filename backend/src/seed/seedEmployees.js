require("dotenv").config();
const mongoose = require("mongoose");
const ValidEmployee = require("../models/ValidEmployee");

const sampleEmployees = [
  { employeeId: "NES001", role: "hq_admin" },
  { employeeId: "NES002", role: "sales_staff" },
  { employeeId: "NES003", role: "regional_manager" },
  { employeeId: "NES004", role: "distributor" },
  { employeeId: "NES005", role: "delivery_driver" },
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

    // Insert new sample records
    await ValidEmployee.insertMany(sampleEmployees);
    console.log("Successfully inserted 5 sample valid employee records");

    // Disconnect
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error seeding ValidEmployees:", error);
    process.exit(1);
  }
};

seedEmployees();
