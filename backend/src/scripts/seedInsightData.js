/**
 * seedInsightData.js
 *
 * Seeds the database with enough Orders, Promotions, and Products
 * to trigger meaningful insight generation for all roles.
 *
 * Usage:  node src/scripts/seedInsightData.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Promotion = require("../models/Promotion");
const { generateInsight } = require("../controllers/insightController");

/* ─── Nestlé Product Catalog ──────────────────────────────────────────────── */

const PRODUCTS = [
  { name: "Nescafé Gold",          description: "Premium freeze-dried coffee",      price: 1200, category: "Coffee",        stockQuantity: 500 },
  { name: "Milo Active-Go",        description: "Chocolate malt energy drink",      price: 850,  category: "Beverages",     stockQuantity: 800 },
  { name: "Maggi Noodles",         description: "2-minute instant noodles pack",    price: 120,  category: "Nutrition",      stockQuantity: 2000 },
  { name: "KitKat 4-Finger",       description: "Crispy wafer chocolate bar",       price: 250,  category: "Confectionery", stockQuantity: 1200 },
  { name: "Nestlé Milk Powder",    description: "Full cream milk powder 400g",      price: 950,  category: "Dairy",         stockQuantity: 600 },
  { name: "Nescafé Classic",       description: "Rich instant coffee 200g",         price: 780,  category: "Coffee",        stockQuantity: 700 },
  { name: "Nestomalt",             description: "Malted barley drink mix",          price: 650,  category: "Beverages",     stockQuantity: 450 },
  { name: "Maggi Seasoning",       description: "Liquid seasoning 100ml",           price: 180,  category: "Nutrition",      stockQuantity: 1500 },
];

/* ─── Helper: random element from array ───────────────────────────────────── */

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/* ─── Helper: date N days ago at a specific day-of-week ───────────────────── */

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

/* ─── Main ────────────────────────────────────────────────────────────────── */

async function seed() {
  console.log("🌱 Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected\n");

  // ── 1. Find existing users by role ────────────────────────────────────────
  const retailers = await User.find({ role: "retailer" }).limit(5);
  const admins = await User.find({ role: "hq_admin" }).limit(2);
  const pms = await User.find({ role: "promotion_manager" }).limit(2);
  const stockManagers = await User.find({ role: "stock_manager" }).limit(2);

  if (retailers.length === 0) {
    console.log("❌ No retailers found in the database. Cannot seed orders.");
    console.log("   Please register at least one retailer first.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Found ${retailers.length} retailers, ${admins.length} admins, ${pms.length} PMs, ${stockManagers.length} stock managers\n`);

  // ── 2. Seed Products ─────────────────────────────────────────────────────
  console.log("📦 Seeding products...");
  const existingProducts = await Product.find();
  let products;

  if (existingProducts.length >= 5) {
    console.log(`   Using ${existingProducts.length} existing products`);
    products = existingProducts;
  } else {
    products = await Product.insertMany(PRODUCTS);
    console.log(`   Created ${products.length} products`);
  }

  // ── 3. Seed Orders (30+ per retailer, spread across days of week) ─────────
  console.log("\n🛒 Seeding orders...");

  const statuses = ["pending", "accepted", "denied", "shipped", "delivered"];
  const statusWeights = [0.1, 0.3, 0.05, 0.25, 0.3]; // Mostly accepted/delivered

  const pickWeightedStatus = () => {
    const r = Math.random();
    let cumulative = 0;
    for (let i = 0; i < statuses.length; i++) {
      cumulative += statusWeights[i];
      if (r <= cumulative) return statuses[i];
    }
    return "pending";
  };

  let totalOrders = 0;

  for (const retailer of retailers) {
    const orderCount = rand(15, 30);

    for (let i = 0; i < orderCount; i++) {
      const numItems = rand(1, 4);
      const items = [];
      let totalAmount = 0;

      for (let j = 0; j < numItems; j++) {
        const product = pick(products);
        const quantity = rand(5, 80); // Some will be high-quantity (>50)
        const priceAtTime = product.price;
        items.push({
          product: product._id,
          quantity,
          priceAtTime,
          discountApplied: rand(0, 15),
        });
        totalAmount += priceAtTime * quantity;
      }

      // Spread orders across the last 60 days for realistic patterns
      const dayOffset = rand(0, 59);

      await Order.create({
        retailer: retailer._id,
        items,
        totalAmount,
        status: pickWeightedStatus(),
        createdAt: daysAgo(dayOffset),
        updatedAt: daysAgo(dayOffset),
      });

      totalOrders++;
    }

    console.log(`   ${retailer.fullName}: ${orderCount} orders created`);
  }

  console.log(`   Total: ${totalOrders} orders\n`);

  // ── 4. Seed Promotions with sales data and ratings ────────────────────────
  console.log("📢 Seeding promotions...");

  const promoCreator = pms[0] || admins[0] || retailers[0];
  const promoTitles = [
    "Summer Coffee Festival",
    "Back to School Bundle",
    "Milo Champions Deal",
    "KitKat Break Time Promo",
    "Maggi Family Pack Offer",
    "Nestlé Dairy Days",
    "Holiday Season Special",
    "Weekend Flash Sale",
    "Nescafé Gold Rush",
    "Year-End Clearance",
    "New Year Kickoff",
    "Festival of Flavours",
  ];

  for (const title of promoTitles) {
    const startDate = daysAgo(rand(30, 90));
    const endDate = daysAgo(rand(0, 29));

    const salesData = retailers.map((r) => ({
      retailerId: r._id,
      unitsSold: rand(20, 500),
      submittedAt: daysAgo(rand(0, 30)),
      rewardTier: pick(["tier1", "tier2", "tier3"]),
      rewardAmount: rand(10, 100),
    }));

    const participatingRetailers = retailers.map((r) => ({
      retailerId: r._id,
      optedIn: true,
      optedInDate: startDate,
      rating: rand(3, 10),
      ratingDate: daysAgo(rand(0, 15)),
      feedback: pick([
        "Great promotion, customers loved it!",
        "Good results but could be longer",
        "Average performance in my area",
        "Excellent — drove significant sales",
        "Would participate again",
        "Needs better marketing support",
      ]),
    }));

    await Promotion.create({
      title,
      description: `${title} — special offer for participating retailers`,
      category: pick(["seasonal", "discount", "bundled", "flash_sale"]),
      startDate,
      endDate,
      discount: rand(5, 30),
      createdBy: promoCreator._id,
      status: pick(["active", "inactive", "archived"]),
      salesData,
      participatingRetailers,
    });
  }

  console.log(`   Created ${promoTitles.length} promotions with sales data and ratings\n`);

  // ── 5. Generate insights for all users ───────────────────────────────────
  console.log("🧠 Generating insights...\n");

  const allUsers = [...admins, ...pms, ...stockManagers, ...retailers];

  for (const user of allUsers) {
    try {
      const insights = await generateInsight(user._id);
      console.log(`   ${user.fullName} (${user.role}): ${insights.length} insights generated`);
    } catch (err) {
      console.error(`   ❌ ${user.fullName}: ${err.message}`);
    }
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete!");
  console.log("   You can now log in and visit /admin/insights or /retailer/insights to see real data.\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
