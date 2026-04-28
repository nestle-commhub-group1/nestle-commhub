const dns = require('dns').promises;
const net = require('net');

console.log('\n=== NETWORK CONNECTIVITY TEST ===\n');

// Test 1: DNS Resolution
console.log('TEST 1: DNS Resolution');
dns.resolve('nestle-commhub.5hwgny4.mongodb.net')
  .then(addresses => {
    console.log('✅ DNS resolution successful');
    console.log('- Resolved IPs:', addresses);
    
    // Test 2: Port Connectivity
    console.log('\nTEST 2: Port 27017 Connectivity');
    const socket = net.createConnection({
      host: 'nestle-commhub.5hwgny4.mongodb.net',
      port: 27017,
      timeout: 5000
    });
    
    socket.on('connect', () => {
      console.log('✅ Port 27017 is open and reachable');
      socket.destroy();
      process.exit(0);
    });
    
    socket.on('timeout', () => {
      console.log('❌ Port 27017 timeout: Connection took too long');
      socket.destroy();
      process.exit(1);
    });
    
    socket.on('error', (err) => {
      console.log('❌ Port 27017 error:', err.message);
      process.exit(1);
    });
  })
  .catch(err => {
    console.log('❌ DNS resolution failed');
    console.log('- Error:', err.message);
    console.log('- This means the hostname cannot be resolved');
    process.exit(1);
  });
