const http = require('http');

const API_URL = 'http://127.0.0.1:5001/api/auth/register';
const password = 'password123';

const accounts = [
  { fullName: 'Promotion Manager', email: 'pm1@nestle.com', role: 'promotion_manager', employeeId: 'NES-PRM-001', phone: '0712345678' },
  { fullName: 'Stock Manager', email: 'sm1@nestle.com', role: 'stock_manager', employeeId: 'NES-SM-001', phone: '0712345679' },
  { fullName: 'Sales Staff', email: 'staff1@nestle.com', role: 'staff', employeeId: 'NES-STF-001', staffCategory: 'Logistics', phone: '0712345680' },
  { fullName: 'HQ Admin', email: 'admin1@nestle.com', role: 'hq_admin', employeeId: 'NES-ADM-001', phone: '0712345681' },
  { fullName: 'Distributor 1', email: 'dist1@nestle.com', role: 'distributor', employeeId: 'NES-DIST-001', phone: '0712345682' },
  { fullName: 'Distributor 2', email: 'dist2@nestle.com', role: 'distributor', employeeId: 'NES-DIST-002', phone: '0712345683' },
  { 
    fullName: 'Retailer 1', 
    email: 'retailer1@test.com', 
    role: 'retailer', 
    businessName: 'Retailer 1 Shop', 
    businessAddress: '123 Retailer Lane, Colombo', 
    province: 'Western',
    district: 'Colombo',
    taxId: 'TAX-001-RET',
    phone: '0712345684' 
  },
  { 
    fullName: 'Retailer 2', 
    email: 'retailer2@test.com', 
    role: 'retailer', 
    businessName: 'Retailer 2 Shop', 
    businessAddress: '456 Retailer Road, Kandy', 
    province: 'Central',
    district: 'Kandy',
    taxId: 'TAX-002-RET',
    phone: '0712345685' 
  }
];

function post(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject({ statusCode: res.statusCode, body: body });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function setup() {
  console.log('🚀 Starting account setup...');
  for (const account of accounts) {
    try {
      const payload = {
        ...account,
        password,
        confirmPassword: password
      };
      await post(API_URL, payload);
      console.log(`✅ Created: ${account.email} (${account.role})`);
    } catch (err) {
      if (err.body && err.body.includes('already exists')) {
        console.log(`ℹ️  Exists: ${account.email}`);
      } else {
        console.error(`❌ Failed: ${account.email} - Status: ${err.statusCode}, Body: ${err.body}, Error: ${err.message}`);
      }
    }
  }
}

setup();
