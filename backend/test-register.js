const readline = require("readline");
const http = require("http");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

async function runRegistration() {
  console.log("\n--- Nestlé CommHub Registration Test ---\n");

  const fullName = await question("Enter Full Name: ");
  const email = await question("Enter Email: ");
  const password = await question("Enter Password: ");
  const confirmPassword = await question("Confirm Password: ");
  const phone = await question("Enter Phone Number: ");
  console.log(
    "\nValid roles: retailer, sales_staff, regional_manager, hq_admin, distributor, delivery_driver"
  );
  const role = await question("Enter Role: ");

  let businessName, businessAddress, taxId, employeeId, department;

  if (role === "retailer") {
    businessName = await question("Enter Business Name: ");
    businessAddress = await question("Enter Business Address: ");
    taxId = await question("Enter Tax ID: ");
  } else {
    employeeId = await question("Enter Employee ID: ");
    department = await question("Enter Department: ");
  }

  const payload = {
    fullName,
    email,
    password,
    confirmPassword,
    phone,
    role,
  };

  if (role === "retailer") {
    Object.assign(payload, { businessName, businessAddress, taxId });
  } else {
    Object.assign(payload, { employeeId, department });
  }

  const postData = JSON.stringify(payload);

  const options = {
    hostname: "localhost",
    port: 5001,
    path: "/api/auth/register",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  console.log("\nSending registration request...\n");

  const req = http.request(options, (res) => {
    let rawData = "";
    res.on("data", (chunk) => {
      rawData += chunk;
    });
    res.on("end", () => {
      console.log(`Status Code: ${res.statusCode}`);
      try {
        const parsedData = JSON.parse(rawData);
        console.log("Response:", JSON.stringify(parsedData, null, 2));
      } catch (e) {
        console.error("Failed to parse response:", rawData);
      }
      rl.close();
    });
  });

  req.on("error", (e) => {
    console.error(`\nRequest failed: ${e.message}`);
    console.log(
      "Make sure the backend server and MongoDB are running (npm run dev & brew services start mongodb-community)."
    );
    rl.close();
  });

  req.write(postData);
  req.end();
}

runRegistration();
