const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const { q, category } = req.query; //eg. q = "phone" (the search query) category = "electronics"

  const filter = {};
  if (category) filter.category = category;

  // Search by title or brand
  const qTrim = (q || "").trim(); // trim query parameters to avoid unnecessary database queries caused by whitespace-only input. eg. qTrim = "phone", " " → "" (skip search)

  if (qTrim) {
    filter.$or = [
      { title: { $regex: qTrim, $options: "i" } }, //$regex: q search term anywhere inside the product's title, $options: "i" Makes the search case-insensitive
      { brand: { $regex: qTrim, $options: "i" } }, //$regex: q search term anywhere inside the product's brand, $options: "i" Makes the search case-insensitive
    ];
  }

  const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
  //Product.find(filter): Asks the database to find all products that match the filter
  //.sort({ createdAt: -1 }): Sorts the results so the newest products appear at the top
  //.lean(): Converts the results to plain JavaScript objects to improve performance, improving performance by avoiding Mongoose document overhead
  res.json(products);
});

// GET /api/products/:id
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json(product);
});

// admin CRUD

// POST /api/products (admin)
// Get data from request
const createProduct = asyncHandler(async (req, res) => {
  const {
    title,
    brand = "",
    category = "General",
    description = "",
    price,
    mrp = 0,
    stock = 0,
    image = "",
    rating = 0,
    numReviews = 0,
  } = req.body;

  // Product must have title & Product must have price
  if (!title || !title.trim()) {
    res.status(400);
    throw new Error("title is required");
  }
  if (price === undefined || price === null) {
    res.status(400);
    throw new Error("price is required");
  }
  if (Number.isNaN(Number(price))) {
    res.status(400);
    throw new Error("price must be a valid number");
  }

  // Create product & insert into MongoDB
  const product = await Product.create({
    title: title.trim(),
    brand,
    category,
    description,
    price: Number(price),
    mrp: Number(mrp),
    stock: Number(stock),
    image,
    rating: Number(rating),
    numReviews: Number(numReviews),
  });

  // Return the newly created product as a JSON response with a 201 status code (Created)
  res.status(201).json(product);
});

// PUT /api/products/:id (admin)
// update existing product
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id); // Find product
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Identify numeric fields using Set
  const numericFields = new Set([
    "price",
    "mrp",
    "stock",
    "rating",
    "numReviews",
  ]);

  // Only these fields can be updated
  const updatableFields = [
    "title",
    "brand",
    "category",
    "description",
    "price",
    "mrp",
    "stock",
    "image",
    "rating",
    "numReviews",
  ];

  // Validate + update
  // Update only fields present in request body Missing fields will NOT be overwritten.
  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      const value = req.body[field];

      // Numeric fields validation + casting
      if (numericFields.has(field)) {
        const str = String(value).trim();

        // value === null → blocks null, str === "" → blocks empty or whitespace, " "Number.isNaN(Number(str)) → blocks "abc" etc.
        if (value === null || str === "" || Number.isNaN(Number(str))) {
          res.status(400);
          throw new Error(`${field} must be a valid number`);
        }

        product[field] = Number(str); //"500" becomes 500 (proper number).
      }

      // String fields trimming
      else if (typeof value === "string") {
        const trimmed = value.trim();

        // Special case: title must not be empty
        if (field === "title" && !trimmed) {
          res.status(400);
          throw new Error("title is required");
        }

        product[field] = trimmed;
      }

      // Other fields
      else {
        product[field] = value;
      }
    }
  });

  const updatedProduct = await product.save();
  res.json(updatedProduct);
});

// DELETE /api/products/:id (admin)
// Delete product from DB
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id); // Find product
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Delete product from DB
  await product.deleteOne();
  res.json({ message: "Product deleted" });
});

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
