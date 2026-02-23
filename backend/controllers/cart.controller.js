const Cart = require("../models/Cart");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

// GET /api/cart
const getMyCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id); //Gets the logged-in user’s cart

  const populated = await Cart.findById(cart._id).populate({
    path: "items.product",
    select: "title price mrp image stock category brand",
  });

  res.json(populated);
});

// POST /api/cart/add
// body: { productId, qty }
const addToCart = asyncHandler(async (req, res) => {
  const { productId, qty = 1 } = req.body;

  const qtyNum = Number(qty);
  if (!productId) {
    res.status(400);
    throw new Error("productId required");
  }
  if (!qtyNum || qtyNum < 1) {
    res.status(400);
    throw new Error("qty must be >= 1");
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  if (product.stock <= 0) {
    res.status(400);
    throw new Error("Out of stock");
  }

  const cart = await getOrCreateCart(req.user._id); //Gets the logged-in user’s cart

  const existingIndex = cart.items.findIndex(
    (i) => i.product.toString() === productId,
  );

  if (existingIndex >= 0) {
    const newQty = cart.items[existingIndex].qty + qtyNum;
    if (newQty > product.stock) {
      res.status(400);
      throw new Error("Not enough stock");
    }

    cart.items[existingIndex].qty = newQty;
  } else {
    if (qtyNum > product.stock) {
      res.status(400);
      throw new Error("Not enough stock");
    }

    cart.items.push({
      product: product._id,
      qty: qtyNum,
      priceAtAdd: product.price,
    });
  }

  await cart.save();

  const populated = await Cart.findById(cart._id).populate({
    path: "items.product",
    select: "title price mrp image stock category brand",
  });

  res.status(200).json(populated);
});

// PUT /api/cart/update
// body: { productId, qty }
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, qty } = req.body;

  const qtyNum = Number(qty);
  if (!productId) {
    res.status(400);
    throw new Error("productId required");
  }
  if (!qtyNum || qtyNum < 1) {
    res.status(400);
    throw new Error("qty must be >= 1");
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  if (qtyNum > product.stock) {
    res.status(400);
    throw new Error("Not enough stock");
  }

  const cart = await getOrCreateCart(req.user._id); //Gets the logged-in user’s cart

  const existingIndex = cart.items.findIndex(
    (i) => i.product.toString() === productId,
  );

  if (existingIndex < 0) {
    res.status(404);
    throw new Error("Item not in cart");
  }

  cart.items[existingIndex].qty = qtyNum;

  // Optional: refresh snapshot price
  cart.items[existingIndex].priceAtAdd = product.price;

  await cart.save();

  const populated = await Cart.findById(cart._id).populate({
    path: "items.product",
    select: "title price mrp image stock category brand",
  });

  res.json(populated);
});

// DELETE /api/cart/remove/:productId
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params; //Extracts productId from route parameters

  const cart = await getOrCreateCart(req.user._id); //Gets the logged-in user’s cart

  const before = cart.items.length; //store the number of items before removal

  //Remove Item Using filter(), removes the matching product.
  cart.items = cart.items.filter((i) => i.product.toString() !== productId);

  // Check If Item Was Actually Removed, That means the product wasn’t found Nothing was removed
  if (cart.items.length === before) {
    res.status(404);
    throw new Error("Item not in cart");
  }

  await cart.save();

  const populated = await Cart.findById(cart._id).populate({
    path: "items.product",
    select: "title price mrp image stock category brand",
  });

  res.json(populated);
});

// DELETE /api/cart/clear
const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id); //Gets the logged-in user’s cart
  cart.items = []; //Empty the Items Array
  await cart.save();
  res.json({ message: "Cart cleared" });
});

module.exports = {
  getMyCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
