const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");

// helper (Round numbers to 2 decimal places)
const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// POST /api/orders  (place order from cart)
const placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = "COD" } = req.body;

  // Basic validation Shipping Address
  // "If any required field in shippingAddress is missing → throw error."
  if (
    !shippingAddress?.fullName ||
    !shippingAddress?.phone ||
    !shippingAddress?.addressLine1 ||
    !shippingAddress?.city ||
    !shippingAddress?.state ||
    !shippingAddress?.pincode
  ) {
    res.status(400);
    throw new Error("Shipping address is incomplete");
  }

  // // Get User Cart & replaces product ID with full product data
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
  );
  //If Cart Empty
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error("Cart is empty");
  }

  // Validate stock + build order items snapshot
  const orderItems = [];
  let itemsPrice = 0;

  //   Loop Through Cart Items
  for (const item of cart.items) {
    const p = item.product; // populated Product
    //Check Product Exists
    if (!p) {
      res.status(400);
      throw new Error("Invalid cart item product");
    }

    // Check Stock
    if (p.stock < item.qty) {
      res.status(400);
      throw new Error(
        `Not enough stock for ${p.title}. Available: ${p.stock}, Requested: ${item.qty}`,
      );
    }

    const priceSnapshot = Number(item.priceAtAdd ?? p.price); // Old price (if saved in cart), Otherwise current price

    // “Create one order item from cart product and add it to the orderItems array.”
    orderItems.push({
      product: p._id,
      title: p.title,
      image: p.image || "",
      price: priceSnapshot,
      qty: item.qty,
    });

    itemsPrice += priceSnapshot * item.qty;
  }

  itemsPrice = round2(itemsPrice);

  // Simple pricing rules (you can adjust)
  const shippingPrice = itemsPrice >= 999 ? 0 : 50; // Free shipping above ₹999
  const taxPrice = round2(itemsPrice * 0.0); // Currently 0%
  const totalPrice = round2(itemsPrice + shippingPrice + taxPrice); // Total

  // Deduct stock (Reduce stock after order)
  for (const item of cart.items) {
    const p = await Product.findById(item.product._id);
    p.stock = p.stock - item.qty;
    await p.save();
  }

  //   Create Order
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    paymentStatus: paymentMethod === "COD" ? "pending" : "pending",
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    status: "placed",
  });

  // Clear cart after placing order
  cart.items = [];
  await cart.save();

  //   Send a success response with status 201 and return the created order as JSON.
  res.status(201).json(order);
});

// GET /api/orders/my (My Orders)
const getMyOrders = asyncHandler(async (req, res) => {
  //Logged-in user's orders Latest first
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  res.json(orders);
});

// GET /api/orders/:id (owner or admin)
const getOrderById = asyncHandler(async (req, res) => {
  // Find Order
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email",
  );
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Check if user is owner or admin
  const isOwner = order.user?._id?.toString() === req.user._id.toString();
  if (!isOwner && !req.user.isAdmin) {
    res.status(403);
    throw new Error("Not allowed");
  }

  res.json(order);
});

// (Admin) GET /api/orders (Returns all orders (admin panel))
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate("user", "name email")
    .sort({ createdAt: -1 });
  res.json(orders);
});

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
};
