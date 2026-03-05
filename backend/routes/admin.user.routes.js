const router = require("express").Router();
const { protect, admin } = require("../middleware/auth.middleware");
const {
  listAdminUsers,
  getAdminUserDetails,
  getAdminUserOrders,
  setAdminUserBlockStatus,
  deleteAdminUser,
} = require("../controllers/admin.user.controller");

router.use(protect, admin);

router.get("/", listAdminUsers);
router.get("/:id/orders", getAdminUserOrders);
router.get("/:id", getAdminUserDetails);
router.patch("/:id/block", setAdminUserBlockStatus);
router.delete("/:id", deleteAdminUser);

module.exports = router;
