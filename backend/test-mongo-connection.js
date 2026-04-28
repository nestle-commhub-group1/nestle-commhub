const mongoose = require('mongoose');
require('dotenv').config();

console.log('\n=== MONGODB CONNECTION TEST ===\n');

// Test 1: Environment
console.log('TEST 1: Environment Variables');
console.log('- MONGO_URI exists:', !!process.env.MONGO_URI);
console.log('- MONGO_URI value:', process.env.MONGO_URI?.substring(0, 50) + '...');
console.log('- NODE_ENV:', process.env.NODE_ENV);

if (!process.env.MONGO_URI) {
  console.log('\n❌ MONGO_URI is missing. Cannot proceed.');
  process.exit(1);
}

// Test 2: URI Validation
console.log('\nTEST 2: URI Format Validation');
const uri = process.env.MONGO_URI;
console.log('- Starts with "mongodb":', uri.startsWith('mongodb'));
console.log('- Contains "@":', uri.includes('@'));
console.log('- Contains "?":', uri.includes('?'));
console.log('- URI length:', uri.length);

// Test 3: Connection Attempt
console.log('\nTEST 3: Connection Attempt');
console.log('- Connecting to MongoDB...');

const startTime = Date.now();

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  w: 'majority'
})
  .then(() => {
    const duration = Date.now() - startTime;
    console.log('✅ Connection successful!');
    console.log('- Connection time:', duration + 'ms');
    console.log('- Connection state:', mongoose.connection.readyState);
    console.log('- Connected to:', mongoose.connection.host);
    console.log('- Database:', mongoose.connection.name);
    
    // Test 4: Database Query
    console.log('\nTEST 4: Database Query Test');
    const db = mongoose.connection.db;
    db.collection('tickets').countDocuments()
      .then(count => {
        console.log('✅ Database query successful!');
        console.log('- Document count in tickets:', count);
        process.exit(0);
      })
      .catch(err => {
        console.log('❌ Database query failed');
        console.log('- Error:', err.message);
        process.exit(1);
      });
  })
  .catch((err) => {
    const duration = Date.now() - startTime;
    console.log('❌ Connection failed!');
    console.log('- Connection time:', duration + 'ms');
    console.log('- Error name:', err.name);
    console.log('- Error code:', err.code);
    console.log('- Error message:', err.message);
    console.log('\n📋 Full Error Details:');
    console.log(err);
    
    // Error diagnosis
    console.log('\n🔍 Error Analysis:');
    if (err.name === 'MongoNetworkError') {
      console.log('→ Network error: Check IP whitelist in MongoDB Atlas');
    }
    if (err.name === 'MongoAuthenticationError') {
      console.log('→ Authentication error: Check username/password');
    }
    if (err.name === 'MongoServerSelectionError') {
      console.log('→ Server selection error: Check cluster status and connectivity');
    }
    if (err.message.includes('ENOTFOUND')) {
      console.log('→ DNS error: Cannot resolve hostname');
    }
    if (err.message.includes('ECONNREFUSED')) {
      console.log('→ Connection refused: Server not responding');
    }
    if (err.message.includes('authentication failed')) {
      console.log('→ Auth failed: Wrong credentials');
    }
    
    process.exit(1);
  });
