const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const ValidEmployee = require('../models/ValidEmployee');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedRegisteredStockManager = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'sman@nestle.com';
    const employeeId = 'NES-DEV-444';

    // 1. Remove any existing user with this email
    await User.deleteMany({ email });
    console.log(`🗑  Cleared existing user ${email}`);

    // 2. Ensure the ID is in ValidEmployee and marked as used
    await ValidEmployee.deleteMany({ employeeId });
    await ValidEmployee.create({
        employeeId,
        role: 'stock_manager',
        isUsed: true
    });
    console.log(`✅  Reserved ${employeeId} in ValidEmployee`);

    // 3. Create the registered user
    const newUser = new User({
        fullName: 'Stock Manager One',
        email,
        password: 'password123', // Will be hashed by pre-save hook
        phone: '0712345678',
        role: 'stock_manager',
        employeeId,
        department: 'Logistics',
        officeLocation: 'Colombo Hub',
        otpVerified: true
    });

    await newUser.save();
    console.log(`🚀  Successfully created registered Stock Manager:`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: password123`);
    console.log(`   Role:     stock_manager`);
    console.log(`   Emp ID:   ${employeeId}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected.');
  } catch (err) {
    console.error('❌ Error seeding user:', err.message);
    process.exit(1);
  }
};

seedRegisteredStockManager();
