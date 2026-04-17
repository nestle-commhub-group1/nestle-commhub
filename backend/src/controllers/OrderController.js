const Order = require("../models/Order");
const Product = require("../models/Product");

// Calculate discount based on quantity
const calculateDiscount = (quantity) => {
  if (quantity >= 1500) return 15;
  if (quantity >= 1000) return 10;
  if (quantity >= 500) return 5;
  return 0;
};

// Place a new order (Retailer)
exports.placeOrder = async (req, res) => {
  try {
    const { items, notes } = req.body;
    const retailerId = req.user.id || req.user._id;

    console.log(`📦 [Order] Placing order for retailer: ${retailerId}`);
    console.log(`📦 [Order] Items:`, items);

    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      console.log(`🔍 [Order] Looking for product ID: ${item.product}`);
      const product = await Product.findById(item.product);
      if (!product) {
          console.warn(`⚠️ [Order] Product NOT FOUND for ID: ${item.product}`);
          continue;
      }

      const discount = calculateDiscount(item.quantity);
      const priceAtTime = product.price;
      const subtotal = priceAtTime * item.quantity * (1 - discount / 100);

      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        priceAtTime: priceAtTime,
        discountApplied: discount,
      });

      totalAmount += subtotal;
    }

    if (processedItems.length === 0) {
        console.error("❌ [Order] No valid products found in the order request.");
        return res.status(400).json({ message: "No valid products found in your cart. Please refresh and try again." });
    }

    const order = new Order({
      retailer: retailerId,
      items: processedItems,
      totalAmount,
      notes,
    });

    await order.save();
    console.log(`✅ [Order] Success! Order ID: ${order._id}`);
    res.status(201).json(order);
  } catch (error) {
    console.error("❌ [Order] Placement failed:", error);
    res.status(400).json({ message: "Failed to place order", error: error.message });
  }
};

// Get orders for current retailer
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ retailer: req.user.id })
      .populate("items.product")
      .populate("distributor", "fullName phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all orders (Stock Manager)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("retailer", "fullName businessName businessAddress")
      .populate("items.product")
      .populate("distributor", "fullName phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update order status (Stock Manager)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, distributor, eta } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (status) order.status = status;
    if (distributor) order.distributor = distributor;
    if (eta) order.eta = eta;

    // If accepted, we might want to deduct stock, but user said:
    // "if the stock is not enough to fullfill the oder... accept or denie it for now"
    // "if products are not available stock manager will say it will take us a bit longer"
    // So we don't strictly prevent accepting based on stock.
    
    // Logic for stock deduction if accepted:
    if (status === "accepted" && order.status !== "accepted") {
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stockQuantity: -item.quantity }
            });
        }
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: "Update failed", error: error.message });
  }
};

// Favorite/Unfavorite an order (Retailer)
exports.toggleFavorite = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    
    order.isFavorite = !order.isFavorite;
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Reorder (Retailer)
exports.reorder = async (req, res) => {
    try {
        const originalOrder = await Order.findById(req.params.id);
        if (!originalOrder) return res.status(404).json({ message: "Order not found" });

        const newOrder = new Order({
            retailer: req.user.id,
            items: originalOrder.items.map(item => ({
                product: item.product,
                quantity: item.quantity,
                priceAtTime: item.priceAtTime, // Or update to current price?
                discountApplied: item.discountApplied
            })),
            totalAmount: originalOrder.totalAmount,
            notes: `Reordered from ${originalOrder._id}`
        });

        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ message: "Reorder failed", error: error.message });
    }
};

// Get orders for distributor
exports.getDistributorOrders = async (req, res) => {
    try {
        const orders = await Order.find({ distributor: req.user.id })
            .populate("retailer", "fullName businessName businessAddress businessPhone")
            .populate("items.product")
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
