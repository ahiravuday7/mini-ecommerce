require("dotenv").config();

const connectDB = require("../config/db");
const Product = require("../models/Product");
const products = require("./products");

const run = async () => {
  await connectDB(process.env.MONGO_URI);

  await Product.deleteMany({});
  await Product.insertMany(products);

  console.log("Products seeded successfully!");
  process.exit(0);
};

run().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
