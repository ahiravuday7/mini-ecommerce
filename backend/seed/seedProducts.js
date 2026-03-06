require("dotenv").config();

const connectDB = require("../config/db");
const Category = require("../models/Category");
const Product = require("../models/Product");
const categories = require("./categories");
const products = require("./products");

const run = async () => {
  await connectDB(process.env.MONGO_URI);

  await Category.deleteMany({});
  await Category.insertMany(categories);

  await Product.deleteMany({});
  await Product.insertMany(products);

  console.log("Categories and products seeded successfully!");
  process.exit(0);
};

run().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
