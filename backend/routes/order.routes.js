const router = require("express").Router();
const { protect, admin } = require("../middleware/auth.middleware");
const {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
} = require("../controllers/order.controller");

router.use(protect);

// user
router.post("/", placeOrder);
router.get("/my", getMyOrders);
router.get("/:id", getOrderById);

// admin (optional)
router.get("/", admin, getAllOrders);

module.exports = router;
