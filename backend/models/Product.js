const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    brand: { type: String, default: "" },
    category: { type: String, default: "General" },

    description: { type: String, default: "" },

    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, default: 0, min: 0 },

    stock: { type: Number, default: 0, min: 0 },

    image: { type: String, default: "" }, // URL
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
