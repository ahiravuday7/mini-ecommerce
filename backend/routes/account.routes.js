const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");

const {
  getMyAccount,
  updateMyProfile,
  updateMyShippingAddress,
  deleteMyAccount,
} = require("../controllers/account.controller");

router.get("/", protect, getMyAccount);
router.put("/profile", protect, updateMyProfile);
router.put("/shipping-address", protect, updateMyShippingAddress);
router.delete("/", protect, deleteMyAccount);

module.exports = router;
