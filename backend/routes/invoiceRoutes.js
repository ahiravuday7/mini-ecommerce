const router = require("express").Router();
const { protect } = require("../middleware/auth.middleware");
const { downloadInvoice } = require("../controllers/invoice.controller");

router.use(protect);

// endpoint same as existing frontend usage: /api/orders/:id/invoice
router.get("/:id/invoice", downloadInvoice);

module.exports = router;
