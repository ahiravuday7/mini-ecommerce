const router = require("express").Router();
const { getFaqs } = require("../controllers/faq.controller");

// Public
router.get("/", getFaqs);

module.exports = router;
