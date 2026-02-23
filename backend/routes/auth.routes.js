const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");

const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
} = require("../controllers/auth.controller");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", protect, getMe);

module.exports = router;
