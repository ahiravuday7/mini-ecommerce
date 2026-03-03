const router = require("express").Router();
const { protect, admin } = require("../middleware/auth.middleware");
const {
  getDashboardAnalytics,
} = require("../controllers/admin.dashboard.controller");

router.get("/", protect, admin, getDashboardAnalytics);

module.exports = router;
