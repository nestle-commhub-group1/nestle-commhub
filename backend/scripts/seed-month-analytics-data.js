const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../src/models/User");
const Product = require("../src/models/Product");
const Promotion = require("../src/models/Promotion");
const Order = require("../src/models/Order");
const Ticket = require("../src/models/Ticket");
const Feedback = require("../src/models/Feedback");
const Notification = require("../src/models/Notification");
const ProductDemandAnalytics = require("../src/models/ProductDemandAnalytics");
const RetailerPromotionPreference = require("../src/models/RetailerPromotionPreference");

const MARKER = "[analytics-seed-month]";
const DAY = 24 * 60 * 60 * 1000;

const PROMOTION_TITLES = [
  "Nescafe Western Trade Drive",
  "Milo Back-to-School Bulk Bundle",
  "KitKat Break Time Customer Offer",
  "Maggi Month-End Volume Push",
  "Nescafe Sunrise Sachet Push",
  "Maggi Family Pantry Saver",
  "Nestle Dairy Chiller Booster",
  "Cerevita Breakfast Starter Deal",
];

const AVAILABLE_TO_RETAILER_ONE = new Set([
  "Nescafe Sunrise Sachet Push",
  "Maggi Family Pantry Saver",
  "Nestle Dairy Chiller Booster",
  "Cerevita Breakfast Starter Deal",
]);

const FEEDBACK_COMMENT = "Retailer reported good customer response and clear promotion mechanics.";
const PREFERENCE_FEEDBACK = "Retailer wants to be notified when a similar promotion is repeated.";

const TICKET_REASONS_BY_CATEGORY = {
  stock_out: [
    "Nescafe Gold 200g cartons are out of stock after weekend demand and the next replenishment has not been confirmed.",
    "Milo Powder 400g stock dropped below shelf minimum before the school-term promotion display was completed.",
    "Maggi Instant Noodles multipacks sold through faster than forecast and the retailer cannot fulfill regular customer demand.",
    "Nescafe 3-in-1 sachet packs are unavailable for two consecutive delivery cycles despite confirmed retailer orders.",
    "Nestle Full Cream Milk inventory is below two days of cover and urgent replenishment is needed for morning trade.",
  ],
  product_quality: [
    "Several KitKat 4-Pack units arrived with crushed outer packaging and cannot be displayed on the front shelf.",
    "Milo Powder cartons show moisture damage on the outer cases after unloading from the delivery vehicle.",
    "Maggi Coconut Milk Powder packets from the latest batch have torn seals and need quality inspection.",
    "Nestle Cerevita packs show faded date coding, making it difficult for the retailer to verify expiry details.",
    "Nescafe Classic jars in one carton have loose lids and coffee granules visible inside the case.",
  ],
  logistics_delay: [
    "Scheduled delivery for Silva Super Center missed the morning receiving window and no updated ETA was shared.",
    "Kandy Grocers received only part of the confirmed order while the balance shipment is still unaccounted for.",
    "Promotional display materials for KitKat Break Time have not reached Negombo Fresh Market before campaign launch.",
    "Distributor vehicle breakdown delayed Maggi replenishment to Galle Coastal Mart for more than 24 hours.",
    "Trinco Bay Foods reports repeated late evening deliveries outside store receiving hours.",
  ],
  pricing_issue: [
    "Invoice discount for the Milo Back-to-School Bundle does not match the approved 10 percent campaign rate.",
    "Nescafe Western Trade Drive order was billed at standard price even though the retailer met the minimum units.",
    "KitKat customer offer shelf price differs from the price communicated in the promotion circular.",
    "Maggi Month-End Volume Push reward credit was not reflected in the retailer account after sales submission.",
    "Nestle Full Cream Milk order shows an unexpected delivery surcharge not present on previous invoices.",
  ],
  other: [
    "Retailer needs updated product images for the digital promotion wall before refreshing the store display.",
    "Store manager requested clarification on how to redeem accumulated promotion credits during stock ordering.",
    "Retailer contact number has changed and notifications are being sent to the previous phone contact.",
    "Outlet requests guidance on arranging mixed Nestle product displays for a weekend sampling event.",
    "Retailer dashboard shows an outdated business address and needs profile verification by support.",
  ],
};

let seed = 42;
function random() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

function pick(items) {
  return items[Math.floor(random() * items.length)];
}

function int(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function daysAgo(days, hour = 10) {
  const date = new Date(Date.now() - days * DAY);
  date.setHours(hour, int(0, 59), 0, 0);
  return date;
}

async function findOrCreateUser(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    const { password, ...safeUpdates } = data;
    Object.assign(existing, safeUpdates);
    await existing.save();
    return existing;
  }
  return User.create({
    phone: "+94770000000",
    password: "password123",
    isActive: true,
    ...data,
  });
}

async function findOrCreateProduct(data) {
  const existing = await Product.findOne({ name: data.name });
  if (existing) return existing;
  return Product.create({
    image: "https://via.placeholder.com/150",
    isAvailable: true,
    ...data,
  });
}

function orderTotal(items) {
  return items.reduce((sum, item) => {
    const discount = item.discountApplied || 0;
    return sum + item.quantity * item.priceAtTime * (1 - discount / 100);
  }, 0);
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  console.log("[seed-month] Connected to MongoDB");

  await Promise.all([
    Order.deleteMany({ notes: { $regex: MARKER } }),
    Ticket.deleteMany({ description: { $regex: MARKER } }),
    Promotion.deleteMany({ title: { $regex: MARKER } }),
    Promotion.deleteMany({ title: { $in: PROMOTION_TITLES } }),
    Feedback.deleteMany({ comment: { $regex: MARKER } }),
    Feedback.deleteMany({ comment: FEEDBACK_COMMENT }),
    Notification.deleteMany({ message: { $regex: MARKER } }),
    Notification.deleteMany({ message: { $regex: "Monthly analytics data seeded|Monthly stock analytics seeded|Monthly support analytics seeded" } }),
    RetailerPromotionPreference.deleteMany({ feedback: { $regex: MARKER } }),
    RetailerPromotionPreference.deleteMany({ feedback: PREFERENCE_FEEDBACK }),
  ]);

  const admin = await findOrCreateUser({
    fullName: "Dilini Fernando",
    email: "admin@nestle.com",
    role: "hq_admin",
    employeeId: "NES-ADM-001",
    department: "Head Office",
  });

  const pm = await findOrCreateUser({
    fullName: "Mahesh Wickramasinghe",
    email: "pm@nestle.com",
    role: "promotion_manager",
    employeeId: "NES-PM-001",
    department: "Marketing",
  });

  const stockManager = await findOrCreateUser({
    fullName: "Nadeeka Ratnayake",
    email: "sm@nestle.com",
    role: "stock_manager",
    employeeId: "NES-SM-001",
    department: "Inventory",
  });

  const staff = await Promise.all([
    findOrCreateUser({
      fullName: "Kasun Perera",
      email: "staff@nestle.com",
      role: "staff",
      employeeId: "NES-STF-001",
      department: "Support",
      officeLocation: "Colombo Support Desk",
      staffCategory: "General Staff",
    }),
    findOrCreateUser({
      fullName: "Buddhika Jayawardena",
      email: "stockout@nestle.com",
      role: "staff",
      employeeId: "NES-STF-002",
      department: "Supply Chain",
      officeLocation: "Colombo Supply Desk",
      staffCategory: "Stockout Staff",
    }),
    findOrCreateUser({
      fullName: "Ruwan Kumara",
      email: "quality@nestle.com",
      role: "staff",
      employeeId: "NES-STF-003",
      department: "Quality Assurance",
      officeLocation: "Quality Assurance Unit",
      staffCategory: "Product Quality Staff",
    }),
    findOrCreateUser({
      fullName: "Tharindu Wijesinghe",
      email: "logistics@nestle.com",
      role: "staff",
      employeeId: "NES-STF-004",
      department: "Logistics",
      officeLocation: "Kelaniya Distribution Hub",
      staffCategory: "Logistics Staff",
    }),
    findOrCreateUser({
      fullName: "Chaminda Silva",
      email: "pricing@nestle.com",
      role: "staff",
      employeeId: "NES-STF-005",
      department: "Finance",
      officeLocation: "Commercial Finance Desk",
      staffCategory: "Pricing Staff",
    }),
  ]);

  const distributors = await Promise.all([
    findOrCreateUser({
      fullName: "Kamal Jayawardena",
      email: "dist1@nestle.com",
      role: "distributor",
      employeeId: "NES-DIST-001",
      department: "Logistics",
    }),
    findOrCreateUser({
      fullName: "Saman Kumara",
      email: "dist2@nestle.com",
      role: "distributor",
      employeeId: "NES-DIST-002",
      department: "Logistics",
    }),
  ]);

  const retailerSeeds = [
    ["Aruna Silva", "Silva Super Center", "Western Province", "Colombo", 6.9271, 79.8612, "retailer1@test.com", 8500],
    ["Priyantha De Silva", "Kandy Grocers", "Central Province", "Kandy", 7.2906, 80.6337, "retailer2@test.com", 4200],
    ["Sajith Ramanayake", "Negombo Fresh Market", "Western Province", "Gampaha", 7.2008, 79.8737, "retailer3@test.com", 1600],
    ["Nimal Perera", "Galle Coastal Mart", "Southern Province", "Galle", 6.0535, 80.221, "retailer4@test.com", 900],
    ["Sunil Wijesinghe", "Jaffna Heritage Store", "Northern Province", "Jaffna", 9.6615, 80.0255, "retailer5@test.com", 600],
    ["Kamal Gunaratne", "Trinco Bay Foods", "Eastern Province", "Trincomalee", 8.5873, 81.2152, "retailer6@test.com", 1200],
    ["Ravi Kumar", "Batticaloa Central", "Eastern Province", "Batticaloa", 7.7102, 81.6924, "retailer7@test.com", 700],
    ["Anura Kumara", "Anuradhapura Ancient Mart", "North Central Province", "Anuradhapura", 8.3114, 80.4037, "retailer8@test.com", 400],
    ["Bandula Warnapura", "Ratnapura Gem Store", "Sabaragamuwa Province", "Ratnapura", 6.6828, 80.3992, "retailer9@test.com", 300],
    ["Dinesh Chandimal", "Matara Ocean View", "Southern Province", "Matara", 5.9549, 80.555, "retailer10@test.com", 500],
  ];

  const retailers = await Promise.all(retailerSeeds.map(([fullName, businessName, province, district, latitude, longitude, email, credits]) =>
    findOrCreateUser({
      fullName,
      email,
      role: "retailer",
      businessName,
      businessAddress: `Main Street, ${district}`,
      taxId: `TAX-${district.toUpperCase().replace(/\s+/g, "-")}`,
      province,
      district,
      latitude,
      longitude,
      credits,
    })
  ));

  const products = await Promise.all([
    findOrCreateProduct({ name: "Nescafé Gold", description: "Premium instant coffee blend.", category: "Coffee", price: 2500, stockQuantity: 180 }),
    findOrCreateProduct({ name: "Milo Powder", description: "Malt extract with cocoa and milk solids.", category: "Beverages", price: 1800, stockQuantity: 260 }),
    findOrCreateProduct({ name: "KitKat 4-Pack", description: "Crispy wafer fingers covered in milk chocolate.", category: "Confectionery", price: 450, stockQuantity: 420 }),
    findOrCreateProduct({ name: "Maggi Instant Noodles", description: "Quick-cook noodles with signature spice.", category: "Nutrition", price: 80, stockQuantity: 1400 }),
    findOrCreateProduct({ name: "Nescafé Classic", description: "Original instant coffee.", category: "Coffee", price: 1500, stockQuantity: 520 }),
    findOrCreateProduct({ name: "Maggi Coconut Milk Powder", description: "Coconut milk powder for curries.", category: "Nutrition", price: 350, stockQuantity: 900 }),
    findOrCreateProduct({ name: "Nestlé Cerevita", description: "Grain-based cereal.", category: "Nutrition", price: 650, stockQuantity: 530 }),
    findOrCreateProduct({ name: "Nescafé 3-in-1", description: "Coffee, creamer and sugar sachet.", category: "Coffee", price: 45, stockQuantity: 5200 }),
    findOrCreateProduct({ name: "KitKat Chunky", description: "Thick crispy wafer finger.", category: "Confectionery", price: 150, stockQuantity: 760 }),
    findOrCreateProduct({ name: "Nestlé Full Cream Milk", description: "Full cream milk.", category: "Dairy", price: 450, stockQuantity: 320 }),
  ]);

  await Product.updateOne(
    { _id: products[0]._id },
    { $set: { howStatus: { isHOW: true, markedBy: stockManager._id, markedAt: daysAgo(5), expiryDate: daysAgo(-25), reason: "High coffee demand in Western Province" } } }
  );
  await Product.updateOne(
    { _id: products[3]._id },
    { $set: { howStatus: { isHOW: true, markedBy: stockManager._id, markedAt: daysAgo(3), expiryDate: daysAgo(-27), reason: "Monsoon demand uplift" } } }
  );

  const promotions = await Promotion.create([
    {
      title: PROMOTION_TITLES[0],
      description: "Bulk Nescafe Gold and Nescafe Classic offer for Western Province retailers preparing for payday traffic.",
      category: "seasonal",
      startDate: daysAgo(28),
      endDate: daysAgo(-7),
      discount: 12,
      promotionType: "B2B_RETAILER",
      createdBy: pm._id,
      status: "active",
      b2bConfig: { minUnitsRequired: 80, discountPercentage: 12, targetRetailers: ["ALL"] },
    },
    {
      title: PROMOTION_TITLES[1],
      description: "School-season Milo Powder bundle for high-volume outlets near schools and tuition centers.",
      category: "bundled",
      startDate: daysAgo(24),
      endDate: daysAgo(3),
      discount: 10,
      promotionType: "B2B_RETAILER",
      createdBy: pm._id,
      status: "active",
      b2bConfig: { minUnitsRequired: 100, discountPercentage: 10, targetRetailers: ["HIGH_VOLUME"] },
    },
    {
      title: PROMOTION_TITLES[2],
      description: "Customer-facing KitKat bundle designed to increase checkout-area confectionery rotation.",
      category: "bundled",
      startDate: daysAgo(18),
      endDate: daysAgo(-12),
      promotionType: "B2C_CUSTOMER",
      createdBy: pm._id,
      status: "active",
      b2cConfig: {
        displayName: "KitKat Buy 3 Get 1",
        customerFacingPrice: 1350,
        bundleRules: "Buy 3 Get 1",
        requiresRetailerApproval: true,
        currentlyActive: retailers.slice(0, 6).map(r => r._id),
      },
    },
    {
      title: PROMOTION_TITLES[3],
      description: "Completed Maggi noodles volume campaign for retailers stocking up before month-end pantry demand.",
      category: "discount",
      startDate: daysAgo(35),
      endDate: daysAgo(8),
      discount: 15,
      promotionType: "B2B_RETAILER",
      createdBy: pm._id,
      status: "archived",
      b2bConfig: { minUnitsRequired: 150, discountPercentage: 15, targetRetailers: ["ALL"] },
    },
    {
      title: PROMOTION_TITLES[4],
      description: "Entry-level Nescafe 3-in-1 sachet offer for retailers building morning commuter sales.",
      category: "discount",
      startDate: daysAgo(3),
      endDate: daysAgo(-25),
      discount: 8,
      promotionType: "B2B_RETAILER",
      createdBy: pm._id,
      status: "active",
      b2bConfig: { minUnitsRequired: 120, discountPercentage: 8, targetRetailers: ["ALL"] },
    },
    {
      title: PROMOTION_TITLES[5],
      description: "Bulk Maggi noodles and coconut milk powder bundle for weekly pantry restocking.",
      category: "bundled",
      startDate: daysAgo(2),
      endDate: daysAgo(-28),
      discount: 14,
      promotionType: "B2B_RETAILER",
      createdBy: pm._id,
      status: "active",
      b2bConfig: { minUnitsRequired: 180, discountPercentage: 14, targetRetailers: ["ALL"] },
    },
    {
      title: PROMOTION_TITLES[6],
      description: "Dairy chiller support offer for outlets expanding Nestle Full Cream Milk display space.",
      category: "seasonal",
      startDate: daysAgo(1),
      endDate: daysAgo(-21),
      discount: 9,
      promotionType: "B2B_RETAILER",
      createdBy: pm._id,
      status: "active",
      b2bConfig: { minUnitsRequired: 90, discountPercentage: 9, targetRetailers: ["LOW_VOLUME"] },
    },
    {
      title: PROMOTION_TITLES[7],
      description: "Customer-facing Cerevita breakfast starter offer for family basket growth.",
      category: "bundled",
      startDate: daysAgo(4),
      endDate: daysAgo(-20),
      discount: 0,
      promotionType: "B2C_CUSTOMER",
      createdBy: pm._id,
      status: "active",
      b2cConfig: {
        displayName: "Cerevita Breakfast Starter",
        customerFacingPrice: 1250,
        bundleRules: "Cerevita pack with breakfast display support",
        requiresRetailerApproval: true,
        currentlyActive: retailers.slice(2, 7).map(r => r._id),
      },
    },
  ]);

  for (const promo of promotions) {
    const retailerPool = AVAILABLE_TO_RETAILER_ONE.has(promo.title)
      ? retailers.slice(1)
      : retailers;

    const participants = retailerPool.map((retailer, index) => {
      const optedIn = index < 8 || random() > 0.25;
      const rating = optedIn ? Math.max(3, Math.min(10, Math.round((6.5 + random() * 3.2) * 10) / 10)) : undefined;
      return {
        retailerId: retailer._id,
        optedIn,
        optedInDate: daysAgo(int(2, 24), 9),
        assignedDistributor: distributors[index % distributors.length]._id,
        rating,
        ratingDate: rating ? daysAgo(int(1, 14), 16) : undefined,
        feedback: rating ? (rating >= 7 ? "Strong sell-through with good shelf visibility." : "Moderate campaign response; needs better point-of-sale support.") : undefined,
        midPromotionFeedbacks: optedIn ? [{
          rating: Math.max(4, Math.round((5 + random() * 4) * 10) / 10),
          feedback: "Retailer submitted a mid-campaign update on stock movement and customer interest.",
          submittedAt: daysAgo(int(3, 20), 14),
        }] : [],
      };
    });

    const salesData = participants
      .filter(p => p.optedIn)
      .map((participant, index) => {
        const unitsSold = int(120, 1200) + (promo.promotionType === "B2B_RETAILER" ? index * 35 : 0);
        const rewardAmount = Math.round(unitsSold * 0.5);
        return {
          retailerId: participant.retailerId,
          unitsSold,
          submittedAt: daysAgo(int(1, 26), 17),
          rewardTier: unitsSold > 700 ? "tier3" : unitsSold > 300 ? "tier2" : "tier1",
        rewardAmount,
          rewardIssuedAt: random() > 0.35 ? daysAgo(int(0, 10), 12) : null,
        };
      });

    if (!AVAILABLE_TO_RETAILER_ONE.has(promo.title)) {
      const retailerOneSale = salesData.find(s => s.retailerId.toString() === retailers[0]._id.toString());
      if (retailerOneSale) {
        retailerOneSale.unitsSold = promo.title === "Nescafe Western Trade Drive" ? 860 : 540;
        retailerOneSale.rewardTier = retailerOneSale.unitsSold > 700 ? "tier3" : "tier2";
        retailerOneSale.rewardAmount = Math.round(retailerOneSale.unitsSold * 0.5);
        retailerOneSale.rewardIssuedAt = promo.title === "Nescafe Western Trade Drive" ? null : daysAgo(2, 12);
      }
    }

    promo.participatingRetailers = participants;
    promo.salesData = salesData;
    await promo.save();
  }

  const statuses = ["delivered", "shipped", "accepted", "pending", "denied"];
  const statusWeights = [0.46, 0.16, 0.2, 0.1, 0.08];
  const weightedStatus = () => {
    const r = random();
    let acc = 0;
    for (let i = 0; i < statuses.length; i++) {
      acc += statusWeights[i];
      if (r <= acc) return statuses[i];
    }
    return "pending";
  };

  const orders = [];
  for (let day = 29; day >= 0; day--) {
    const ordersToday = int(4, 9);
    for (let i = 0; i < ordersToday; i++) {
      const retailer = retailers[(day + i + int(0, retailers.length - 1)) % retailers.length];
      const lineCount = random() > 0.72 ? 2 : 1;
      const items = [];
      for (let line = 0; line < lineCount; line++) {
        const product = products[(day + i + line * 3) % products.length];
        const baseQty = product.category === "Coffee" ? int(35, 180) : product.category === "Nutrition" ? int(80, 420) : int(30, 220);
        const quantity = day < 10 && ["Coffee", "Nutrition"].includes(product.category) ? Math.round(baseQty * 1.25) : baseQty;
        items.push({
          product: product._id,
          quantity,
          priceAtTime: product.price,
          discountApplied: quantity >= 300 ? 10 : quantity >= 120 ? 5 : 0,
        });
      }

      orders.push({
        retailer: retailer._id,
        items,
        totalAmount: Math.round(orderTotal(items)),
        creditsUsed: random() > 0.82 ? int(100, 900) : 0,
        status: weightedStatus(),
        distributor: distributors[(day + i) % distributors.length]._id,
        eta: `${int(1, 5)} business days`,
        isFavorite: random() > 0.86,
        notes: `${MARKER} generated order for 30-day analytics`,
        createdAt: daysAgo(day, int(8, 18)),
        updatedAt: daysAgo(Math.max(day - 1, 0), int(8, 18)),
      });
    }
  }
  await Order.create(orders);

  const categoryStaff = {
    stock_out: staff.find(s => s.staffCategory === "Stockout Staff") || staff[0],
    product_quality: staff.find(s => s.staffCategory === "Product Quality Staff") || staff[0],
    logistics_delay: staff.find(s => s.staffCategory === "Logistics Staff") || staff[0],
    pricing_issue: staff.find(s => s.staffCategory === "Pricing Staff") || staff[0],
    other: staff.find(s => s.staffCategory === "General Staff") || staff[0],
  };

  const tickets = [];
  await Ticket.deleteMany({
    description: { $in: Object.values(TICKET_REASONS_BY_CATEGORY).flat() },
  });

  Object.entries(TICKET_REASONS_BY_CATEGORY).forEach(([category, reasons], categoryIndex) => {
    reasons.forEach((description, reasonIndex) => {
      const i = categoryIndex * 5 + reasonIndex;
      const createdAt = daysAgo(int(0, 29), int(8, 17));
      const priority = reasonIndex === 0 ? "critical" : reasonIndex === 1 ? "high" : reasonIndex === 2 ? "medium" : "low";
      const status = reasonIndex === 0 ? "escalated" : reasonIndex === 1 ? "in_progress" : reasonIndex === 2 ? "open" : "resolved";
      tickets.push({
        retailerId: retailers[(categoryIndex + reasonIndex) % retailers.length]._id,
        assignedTo: categoryStaff[category]._id,
        distributorId: category === "logistics_delay" || category === "stock_out" ? distributors[i % distributors.length]._id : null,
        category,
        priority,
        status,
        description,
        attachments: [],
        isEscalated: status === "escalated",
        escalatedTo: status === "escalated" ? admin._id : undefined,
        escalatedAt: status === "escalated" ? new Date(createdAt.getTime() + DAY) : undefined,
        resolvedAt: status === "resolved" ? new Date(createdAt.getTime() + int(1, 3) * DAY) : undefined,
        createdAt,
        updatedAt: new Date(createdAt.getTime() + int(1, 6) * 60 * 60 * 1000),
      });
    });
  });
  for (const ticket of tickets) {
    await Ticket.create(ticket);
  }

  const feedbackDocs = [];
  for (const promo of promotions) {
    for (const participant of promo.participatingRetailers.filter(p => p.rating != null).slice(0, 7)) {
      feedbackDocs.push({
        promotionId: promo._id,
        retailerId: participant.retailerId,
        rating: Math.max(1, Math.min(5, Math.round(participant.rating / 2))),
        comment: FEEDBACK_COMMENT,
        createdAt: participant.ratingDate || daysAgo(int(1, 20)),
      });
    }
  }
  await Feedback.create(feedbackDocs);

  for (const product of products) {
    const productOrders = orders.filter(order =>
      order.items.some(item => item.product.toString() === product._id.toString())
    );
    const totalUnits = productOrders.reduce((sum, order) => {
      const item = order.items.find(line => line.product.toString() === product._id.toString());
      return sum + (item?.quantity || 0);
    }, 0);
    const fulfilledOrders = productOrders.filter(order => ["accepted", "shipped", "delivered"].includes(order.status)).length;
    const fulfillmentRate = productOrders.length ? fulfilledOrders / productOrders.length : 0.75;
    const avgRequestsPerWeek = totalUnits / 4.3;
    const retailerInterest = new Set(productOrders.map(order => order.retailer.toString())).size;
    const demandScore = Math.min(10, Math.max(3, (avgRequestsPerWeek / 180) + fulfillmentRate * 4 + retailerInterest * 0.25));
    const optimalStockLevel = Math.ceil(avgRequestsPerWeek * 4 * 1.2);

    await ProductDemandAnalytics.findOneAndUpdate(
      { productId: product._id },
      {
        productId: product._id,
        demandScore: Number(demandScore.toFixed(2)),
        avgRequestsPerWeek: Number(avgRequestsPerWeek.toFixed(1)),
        fulfillmentRate: Number(fulfillmentRate.toFixed(3)),
        growthTrend: Number((0.08 + random() * 0.28).toFixed(3)),
        retailerInterest,
        peakDemandDay: pick(["MONDAY", "TUESDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
        seasonalDemand: {
          SUMMER: Math.round(avgRequestsPerWeek * 1.15),
          MONSOON: Math.round(avgRequestsPerWeek * (product.category === "Nutrition" ? 1.35 : 0.9)),
          WINTER: Math.round(avgRequestsPerWeek * (product.category === "Coffee" ? 1.25 : 1.05)),
          SPRING: Math.round(avgRequestsPerWeek),
        },
        demandHistory: Array.from({ length: 12 }, (_, index) => ({
          period: `2026-W${String(10 + index).padStart(2, "0")}`,
          requests: Math.max(20, Math.round(avgRequestsPerWeek * (0.7 + index * 0.045 + random() * 0.2))),
          fulfillmentRate: Number(Math.min(0.98, fulfillmentRate + random() * 0.06).toFixed(2)),
        })),
        recommendations: {
          optimalStockLevel,
          reorderThreshold: Math.ceil(avgRequestsPerWeek * 1.5),
          safetyStock: Math.ceil(avgRequestsPerWeek * 0.5),
        },
        lastCalculatedAt: new Date(),
      },
      { upsert: true, returnDocument: "after" }
    );
  }

  const preferenceDocs = [];
  for (const promo of promotions) {
    for (const sale of promo.salesData || []) {
      const product = pick(products);
      preferenceDocs.push({
        retailerId: sale.retailerId,
        promotionId: promo._id,
        notifyOnRerun: true,
        notifyManuallySet: false,
        rating: int(6, 10),
        feedback: PREFERENCE_FEEDBACK,
        unitsOrdered: sale.unitsSold,
        totalRevenue: sale.unitsSold * product.price,
        lastOrderDate: sale.submittedAt,
      });
    }
  }
  await RetailerPromotionPreference.insertMany(preferenceDocs, { ordered: false }).catch(error => {
    if (error.code !== 11000) throw error;
  });

  await Notification.create([
    {
      userId: pm._id,
      type: "sales_report",
      message: `Monthly analytics data seeded: ${promotions.length} promotions with retailer sales reports.`,
      createdAt: new Date(),
    },
    {
      userId: stockManager._id,
      type: "warning",
      message: `Monthly stock analytics seeded: ${orders.length} orders across ${products.length} products.`,
      createdAt: new Date(),
    },
    {
      userId: admin._id,
      type: "ticket_escalated",
      message: `Monthly support analytics seeded: ${tickets.length} tickets across retailer regions.`,
      createdAt: new Date(),
    },
  ]);

  console.log("[seed-month] Complete");
  console.log(`[seed-month] Retailers: ${retailers.length}`);
  console.log(`[seed-month] Products: ${products.length}`);
  console.log(`[seed-month] Promotions: ${promotions.length}`);
  console.log(`[seed-month] Orders: ${orders.length}`);
  console.log(`[seed-month] Tickets: ${tickets.length}`);
  console.log(`[seed-month] Feedback: ${feedbackDocs.length}`);
}

main()
  .catch(error => {
    console.error("[seed-month] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
