const router = require("express").Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

const { protect, admin } = require("../middleware/auth.middleware");

// Normal user routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin
router.post("/", protect, admin, createProduct);
router.put("/:id", protect, admin, updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

module.exports = router;
