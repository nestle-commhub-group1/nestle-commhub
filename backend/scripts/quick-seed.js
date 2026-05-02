const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Order = require('../src/models/Order');
const Ticket = require('../src/models/Ticket');

const MONGO_URI = process.env.MONGO_URI;

async function quickSeed() {
  try {
    console.log('🌱 Quick Seed starting...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected');

    const retailerSeeds = [
      { name: 'Aruna Silva', biz: 'Silva Super Center', prov: 'Western Province', dist: 'Colombo', lat: 6.9271, lng: 79.8612, email: 'retailer1@test.com' },
      { name: 'Priyantha De Silva', biz: 'Kandy Grocers', prov: 'Central Province', dist: 'Kandy', lat: 7.2906, lng: 80.6337, email: 'retailer2@test.com' },
      { name: 'Sajith Ramanayake', biz: 'Negombo Fresh Market', prov: 'Western Province', dist: 'Gampaha', lat: 7.2008, lng: 79.8737, email: 'retailer3@test.com' },
      { name: 'Nimal Perera', biz: 'Galle Coastal Mart', prov: 'Southern Province', dist: 'Galle', lat: 6.0535, lng: 80.2210, email: 'retailer4@test.com' },
      { name: 'Sunil Wijesinghe', biz: 'Jaffna Heritage Store', prov: 'Northern Province', dist: 'Jaffna', lat: 9.6615, lng: 80.0255, email: 'retailer5@test.com' },
      { name: 'Kamal Gunaratne', biz: 'Trinco Bay Foods', prov: 'Eastern Province', dist: 'Trincomalee', lat: 8.5873, lng: 81.2152, email: 'retailer6@test.com' },
      { name: 'Ravi Kumar', biz: 'Batticaloa Central', prov: 'Eastern Province', dist: 'Batticaloa', lat: 7.7102, lng: 81.6924, email: 'retailer7@test.com' },
      { name: 'Anura Kumara', biz: 'Anuradhapura Ancient Mart', prov: 'North Central Province', dist: 'Anuradhapura', lat: 8.3114, lng: 80.4037, email: 'retailer8@test.com' },
      { name: 'Bandula Warnapura', biz: 'Ratnapura Gem Store', prov: 'Sabaragamuwa Province', dist: 'Ratnapura', lat: 6.6828, lng: 80.3992, email: 'retailer9@test.com' },
      { name: 'Dinesh Chandimal', biz: 'Matara Ocean View', prov: 'Southern Province', dist: 'Matara', lat: 5.9549, lng: 80.5550, email: 'retailer10@test.com' }
    ];

    for (const s of retailerSeeds) {
      await User.findOneAndUpdate(
        { email: s.email },
        { 
          fullName: s.name,
          role: 'retailer',
          businessName: s.biz,
          province: s.prov,
          district: s.dist,
          latitude: s.lat,
          longitude: s.lng,
          isActive: true
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Synced: ${s.biz}`);
    }

    console.log('🚀 Quick Seed Complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Quick Seed Failed:', err);
    process.exit(1);
  }
}

quickSeed();
