const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String },
    phone: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    landmark: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String, default: "India" },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    shippingAddress: { type: shippingAddressSchema, default: {} },
    isAdmin: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false, index: true },
    blockedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function () {
  // // If password isn't modified, just exit the function early
  if (!this.isModified("password")) return;

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
