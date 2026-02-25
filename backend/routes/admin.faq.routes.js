const router = require("express").Router();
const { protect, admin } = require("../middleware/auth.middleware");
const {
  adminCreateFaq,
  adminDeleteFaq,
  adminListFaqs,
  adminToggleFaq,
  adminUpdateFaq,
} = require("../controllers/faq.controller");

router.use(protect);

// Admin
router.get("/", protect, admin, adminListFaqs);
router.post("/", protect, admin, adminCreateFaq);
router.put("/:id", protect, admin, adminUpdateFaq);
router.patch("/:id/toggle", protect, admin, adminToggleFaq);
router.delete("/:id", protect, admin, adminDeleteFaq);

module.exports = router;
