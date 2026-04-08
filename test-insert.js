require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');

console.log('Connecting to:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('✅ Connected to MongoDB');
  
  const testUser = {
    fullName: 'Test User 2',
    email: 'test2@example.com',
    password: 'hash123',
    phone: '0704232675',
    role: 'retailer', // Using lowercase as per model enum
  };
  
  try {
    const result = await mongoose.connection.collection('users').insertOne(testUser);
    console.log('✅ Write succeeded:', result.insertedId);
    await mongoose.connection.collection('users').deleteOne({ _id: result.insertedId });
    console.log('✅ Cleanup succeeded');
  } catch (err) {
    console.log('❌ Write error:', err.message);
  }
  
  process.exit(0);
}).catch(err => {
  console.log('❌ Connection error:', err.message);
  process.exit(1);
});
