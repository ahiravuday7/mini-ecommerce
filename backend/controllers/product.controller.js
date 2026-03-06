const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");

// Converts user input into a safe string by escaping regex special characters so it can be safely used inside a MongoDB $regex search.
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Normalizes tag input by converting it into a clean array of trimmed, non-empty strings (whether tags are provided as an array or a comma-separated string).
const sanitizeTags = (input) => {
  if (Array.isArray(input)) {
    return input.map((tag) => String(tag || "").trim()).filter(Boolean);
  }

  if (typeof input === "string") {
    return input
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
};

//This ensures category is always stored as a clean string.
const normalizeCategory = (value, fallback = "General") => {
  const trimmed = String(value || "").trim();
  return trimmed || fallback;
};
//This makes subcategory clean.
const normalizeSubcategory = (value) => String(value || "").trim();

// This function checks whether the incoming category/subcategory combination is valid.
const validateCategoryAndSubcategory = async (
  categoryInput,
  subcategoryInput,
) => {
  const normalizedCategory = normalizeCategory(categoryInput);
  const normalizedSubcategory = normalizeSubcategory(subcategoryInput);

  const categoryDoc = await Category.findOne({
    isActive: true,
    name: { $regex: `^${escapeRegex(normalizedCategory)}$`, $options: "i" },
  })
    .select("name subcategories")
    .lean();

  // Backward compatible mode: allow existing behavior when no categories are configured.
  if (!categoryDoc) {
    const hasActiveCategories = await Category.exists({ isActive: true });
    if (!hasActiveCategories) {
      return {
        ok: true,
        category: normalizedCategory,
        subcategory: normalizedSubcategory,
      };
    }

    return {
      ok: false,
      message: `category "${normalizedCategory}" is not configured`,
    };
  }

  // This creates a safe cleaned subcategory list from DB.
  const allowedSubcategories = (
    Array.isArray(categoryDoc.subcategories) ? categoryDoc.subcategories : []
  )
    .map((sub) => String(sub || "").trim())
    .filter(Boolean);

  //If category has no subcategories configured
  if (allowedSubcategories.length === 0) {
    return {
      ok: true,
      category: categoryDoc.name,
      subcategory: normalizedSubcategory,
    };
  }

  // If category has subcategories, subcategory becomes required
  if (!normalizedSubcategory) {
    return {
      ok: false,
      message: `subcategory is required for category "${categoryDoc.name}"`,
    };
  }

  //Check whether given subcategory is valid
  const matchedSubcategory = allowedSubcategories.find(
    (sub) => sub.toLowerCase() === normalizedSubcategory.toLowerCase(),
  );

  if (!matchedSubcategory) {
    return {
      ok: false,
      message: `subcategory "${normalizedSubcategory}" is not valid for category "${categoryDoc.name}"`,
    };
  }

  return {
    ok: true,
    category: categoryDoc.name,
    subcategory: matchedSubcategory,
  };
};

// GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const { q, category, subcategory, sort } = req.query; //eg. q = "phone" (the search query) category = "electronics"

  const filter = {};
  if (category) filter.category = String(category).trim();
  if (subcategory) filter.subcategory = String(subcategory).trim();

  // Search by title, brand, category, description, tags
  const qTrim = (q || "").trim(); // trim query parameters to avoid unnecessary database queries caused by whitespace-only input. eg. qTrim = "phone", " " → "" (skip search)

  if (qTrim) {
    const safeRegex = escapeRegex(qTrim);
    filter.$or = [
      { title: { $regex: safeRegex, $options: "i" } }, //$regex: q search term anywhere inside the product's title, $options: "i" Makes the search case-insensitive
      { brand: { $regex: safeRegex, $options: "i" } }, //$regex: q search term anywhere inside the product's brand, $options: "i" Makes the search case-insensitive
      { category: { $regex: safeRegex, $options: "i" } },
      { subcategory: { $regex: safeRegex, $options: "i" } },
      { description: { $regex: safeRegex, $options: "i" } },
      { tags: { $regex: safeRegex, $options: "i" } },
    ];
  }

  // Bestseller sorting based on total quantity sold from the Order collection
  let products = await Product.find(filter).sort({ createdAt: -1 }).lean(); //Fetch products normally

  // Check if user requested Bestseller sorting
  if (
    String(sort || "")
      .trim()
      .toLowerCase() === "bestsellers"
  ) {
    const productIds = products.map((product) => product._id); //Collect product IDs

    if (productIds.length > 0) {
      //Now we calculate how many units of each product were sold.
      const soldAgg = await Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } }, //Ignore cancelled orders
        { $unwind: "$items" }, //Now each product sale becomes a separate row.
        { $match: { "items.product": { $in: productIds } } }, //This avoids calculating sales for products not in current filter result.
        {
          $group: {
            _id: "$items.product",
            totalSold: { $sum: "$items.qty" }, //Group by product
          },
        },
      ]);

      //Convert aggregation result to Map
      const soldByProductId = new Map(
        soldAgg.map((item) => [String(item._id), Number(item.totalSold || 0)]),
      );

      //Sort products by total sold
      products = products.sort((a, b) => {
        const soldA = soldByProductId.get(String(a._id)) || 0;
        const soldB = soldByProductId.get(String(b._id)) || 0;
        if (soldB !== soldA) return soldB - soldA;

        //Then sort by newest product first.
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
    }
  }
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
    subcategory = "",
    description = "",
    tags = [],
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

  // New validation before product creation
  const hierarchyValidation = await validateCategoryAndSubcategory(
    category,
    subcategory,
  );

  if (!hierarchyValidation.ok) {
    res.status(400);
    throw new Error(hierarchyValidation.message);
  }

  // Create product & insert into MongoDB
  const product = await Product.create({
    title: title.trim(),
    brand,
    category: hierarchyValidation.category,
    subcategory: hierarchyValidation.subcategory,
    description,
    tags: sanitizeTags(tags),
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
  const originalCategory = normalizeCategory(product.category);
  const originalSubcategory = normalizeSubcategory(product.subcategory);

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
    "subcategory",
    "description",
    "tags",
    "price",
    "mrp",
    "stock",
    "image",
    "rating",
    "numReviews",
  ];

  const hierarchyFieldsUpdated =
    req.body.category !== undefined || req.body.subcategory !== undefined;

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

      // Tags normalization
      else if (field === "tags") {
        product.tags = sanitizeTags(value);
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

  //New hierarchy validation after update loop
  //category/subcategory was updated
  if (hierarchyFieldsUpdated) {
    const nextCategory = normalizeCategory(product.category);
    const nextSubcategory = normalizeSubcategory(product.subcategory);
    const categoryChanged =
      nextCategory !== originalCategory ||
      nextSubcategory !== originalSubcategory;

    //So if admin updates hierarchy, new values must be valid.
    if (categoryChanged) {
      const hierarchyValidation = await validateCategoryAndSubcategory(
        nextCategory,
        nextSubcategory,
      );

      if (!hierarchyValidation.ok) {
        res.status(400);
        throw new Error(hierarchyValidation.message);
      }

      product.category = hierarchyValidation.category;
      product.subcategory = hierarchyValidation.subcategory;
    } else {
      product.category = nextCategory;
      product.subcategory = nextSubcategory;
    }
  } else {
    // This keeps stored values normalized even when only other fields are updated.
    product.category = normalizeCategory(product.category);
    product.subcategory = normalizeSubcategory(product.subcategory);
  }

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
