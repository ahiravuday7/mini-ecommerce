const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    subcategories: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);
