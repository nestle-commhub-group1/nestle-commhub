require("dotenv").config({ path: __dirname + "/../../.env" });
const mongoose = require("mongoose");
const Product = require("../models/Product");

const PRODUCTS = [
  {
    name: "Milo 400g",
    description: "Nestle Milo Chocolate Malt Drink",
    price: 850,
    category: "Beverages",
    stockQuantity: 100,
    image: "https://www.nestle.com.lk/sites/g/files/pveoqn231/files/Milo_400g.png", // Just for demo
  },
  {
    name: "Nescafe Classic 100g",
    description: "Pure Instant Coffee",
    price: 1200,
    category: "Coffee",
    stockQuantity: 50,
    image: "https://www.nestle.com.lk/sites/g/files/pveoqn231/files/Nescafe_Classic.png",
  },
  {
    name: "Maggi Noodles Chicken 75g",
    description: "Instant Noodles Chicken Flavor",
    price: 150,
    category: "Nutrition",
    stockQuantity: 500,
    image: "https://www.nestle.com.lk/sites/g/files/pveoqn231/files/Maggi_Chicken.png",
  },
  {
    name: "KitKat 4 Finger",
    description: "Crispy Wafer in Milk Chocolate",
    price: 250,
    category: "Confectionery",
    stockQuantity: 200,
    image: "https://www.nestle.com.lk/sites/g/files/pveoqn231/files/KitKat.png",
  },
  {
    name: "Nestum Rice 250g",
    description: "Infant Cereal Rice and Milk",
    price: 650,
    category: "Nutrition",
    stockQuantity: 30,
    image: "https://www.nestle.com.lk/sites/g/files/pveoqn231/files/Nestum.png",
  },
];

const run = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI not found");

    await mongoose.connect(uri);
    console.log("✅ connected to MongoDB");

    await Product.deleteMany({});
    console.log("🗑 Cleared Products");

    await Product.insertMany(PRODUCTS);
    console.log(`✅ Seeded ${PRODUCTS.length} Products`);

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
