const mongoose = require("mongoose");

const validEmployeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: [true, "Employee ID is required"],
    unique: true,
    trim: true,
  },
  role: {
    type: String,
    required: [true, "Role is required"],
    enum: [
      "sales_staff",
      "regional_manager",
      "hq_admin",
      "distributor",
      "delivery_driver",
    ],
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
});

const ValidEmployee = mongoose.model("ValidEmployee", validEmployeeSchema);

module.exports = ValidEmployee;
