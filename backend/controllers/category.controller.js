const Category = require("../models/Category");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");

// escape special characters in a string before using it in a regular expression.
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// converts the input into an array of subcategories , if it's already an array it keeps it, if it's a comma-separated string it splits it into an array, otherwise it returns an empty array.
const sanitizeSubcategories = (input) => {
  const values = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(",")
      : [];

  //Create a Map to store unique subcategories
  const deduped = new Map();

  // Loop through all subcategories
  values.forEach((value) => {
    const trimmed = String(value || "").trim(); //Convert to string and remove extra spaces
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (!deduped.has(key)) deduped.set(key, trimmed); //Add only unique values
  });

  return Array.from(deduped.values()); //Convert Map values back to array
};

const bootstrapCategoriesFromProducts = async () => {
  //gets all products from MongoDB, but only takes:category,subcategory,image
  const products = await Product.find({})
    .select("category subcategory image")
    .lean();

  const grouped = new Map(); //Map is used to group products by category name.

  //Loop through each product
  products.forEach((product) => {
    // Read and clean category name
    const categoryName = String(product?.category || "").trim();
    if (!categoryName) return;

    //Create category entry if not already grouped
    if (!grouped.has(categoryName)) {
      grouped.set(categoryName, {
        name: categoryName,
        image: String(product?.image || "").trim(),
        subcategories: [],
        isActive: true,
      });
    }

    const subcategory = String(product?.subcategory || "").trim();
    if (!subcategory) return;

    //Add unique subcategories
    const category = grouped.get(categoryName);
    if (!category.subcategories.includes(subcategory)) {
      category.subcategories.push(subcategory);
    }
  });

  //Convert grouped data into array
  const docsToInsert = Array.from(grouped.values());
  if (!docsToInsert.length) return [];

  //Insert categories into Category collection
  try {
    await Category.insertMany(docsToInsert, { ordered: false });
  } catch (err) {
    // Ignore duplicate key races; fetch final state below.
    if (err?.code !== 11000 && err?.name !== "BulkWriteError") throw err;
  }

  // Return all active categories
  return Category.find({ isActive: true })
    .select("name image subcategories isActive")
    .sort({ name: 1 })
    .lean();
};

// GET /api/categories
////API fetches categories from the database (active by default), automatically creates them from products if none exist, and returns them to the client.
const getCategories = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === "true"; //reads the query parameter from the request URL.
  const filter = includeInactive ? {} : { isActive: true }; //API returns only active categories.

  //Fetch categories from database
  let categories = await Category.find(filter)
    .select("name image subcategories isActive")
    .sort({ name: 1 })
    .lean();

  // If the Category collection is empty, the system auto-generates categories from products.
  if (categories.length === 0) {
    categories = await bootstrapCategoriesFromProducts();
    //If inactive categories were requested,Then fetch all categories again:
    if (includeInactive) {
      categories = await Category.find({})
        .select("name image subcategories isActive")
        .sort({ name: 1 })
        .lean();
    }
  }

  res.json(categories);
});

// POST /api/categories (admin)
//API creates a new category after validating the name, preventing case-insensitive duplicates, sanitizing subcategories, and then saves it to the database.
const createCategory = asyncHandler(async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) {
    res.status(400);
    throw new Error("name is required");
  }

  const existing = await Category.findOne({
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
  }).lean();
  if (existing) {
    res.status(400);
    throw new Error("category already exists");
  }

  const category = await Category.create({
    name,
    image: String(req.body?.image || "").trim(),
    subcategories: sanitizeSubcategories(req.body?.subcategories),
    isActive:
      typeof req.body?.isActive === "boolean" ? req.body.isActive : true,
  });

  res.status(201).json(category);
});

// PUT /api/categories/:id (admin)
////API updates an existing category by id after checking that it exists, validating changed fields, preventing duplicate names, sanitizing subcategories, and then saving the updated category.
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  if (req.body?.name !== undefined) {
    const nextName = String(req.body.name || "").trim();
    if (!nextName) {
      res.status(400);
      throw new Error("name is required");
    }

    const duplicate = await Category.findOne({
      _id: { $ne: category._id },
      name: { $regex: `^${escapeRegex(nextName)}$`, $options: "i" },
    }).lean();
    if (duplicate) {
      res.status(400);
      throw new Error("category already exists");
    }

    category.name = nextName;
  }

  if (req.body?.image !== undefined) {
    category.image = String(req.body.image || "").trim();
  }

  if (req.body?.subcategories !== undefined) {
    category.subcategories = sanitizeSubcategories(req.body.subcategories);
  }

  if (typeof req.body?.isActive === "boolean") {
    category.isActive = req.body.isActive;
  }

  const updated = await category.save();
  res.json(updated);
});

// DELETE /api/categories/:id (admin)
//API deletes a category only if it exists and is not currently used by any product.
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const linkedProduct = await Product.findOne({
    category: category.name,
  })
    .select("_id")
    .lean();

  if (linkedProduct) {
    res.status(400);
    throw new Error(
      "Cannot delete category. It is used by one or more products",
    );
  }

  await category.deleteOne();
  res.json({ message: "Category deleted" });
});

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
