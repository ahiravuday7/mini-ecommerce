const mongoose = require("mongoose");

// Order Item Schema
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    title: { type: String, required: true }, // snapshot
    image: { type: String, default: "" }, // snapshot
    price: { type: Number, required: true, min: 0 }, // snapshot
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

// Shipping Address Schema
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  { _id: false },
);

// Order Schema
const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // User Reference, Which user placed the order

    items: { type: [orderItemSchema], default: [] }, //Array of products in order

    shippingAddress: { type: shippingAddressSchema, required: true },

    paymentMethod: { type: String, default: "COD" }, // for now
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"], // enum restricts a field to only a predefined set of allowed values.
      default: "pending",
    },

    itemsPrice: { type: Number, required: true, min: 0 },
    shippingPrice: { type: Number, required: true, min: 0 },
    taxPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
      default: "placed",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
