const Faq = require("../models/Faq");
const asyncHandler = require("../utils/asyncHandler");

// PUBLIC: Get FAQs (active only)
// GET /api/faqs?category=Payments&lang=en&q=refund

const getFaqs = asyncHandler(async (req, res) => {
  const { category, lang = "en", q } = req.query;

  // default filter: Only show FAQs that are active + Only show FAQs for requested language
  const filter = {
    isActive: true,
    lang,
  };

  // category filter
  if (category) filter.category = category.trim();

  // search filter
  if (q && q.trim()) {
    filter.$text = { $search: q.trim() };
  }

  // get FAQs from DB
  const faqs = await Faq.find(filter) //Fetch docs matching filter.
    .sort({ category: 1, order: 1, createdAt: -1 }) // A to Z category, then by order, then by createdAt (newest first)
    .select("-__v"); // Removes Mongo internal version field __v from response.

  // lightweight caching (5 minutes)
  res.set("Cache-Control", "public, max-age=300");

  res.json({
    count: faqs.length,
    faqs,
  });
});

// ADMIN: List all FAQs (including inactive)
// GET /api/admin/faqs?category=...&lang=...&isActive=true/false&q=...

const adminListFaqs = asyncHandler(async (req, res) => {
  const { category, lang, isActive, q } = req.query;

  const filter = {};

  if (typeof isActive !== "undefined") {
    filter.isActive = isActive === "true";
  }
  if (lang) filter.lang = lang;
  if (category) filter.category = category.trim();
  if (q && q.trim()) filter.$text = { $search: q.trim() };

  const faqs = await Faq.find(filter)
    .sort({ category: 1, order: 1, createdAt: -1 })
    .select("-__v");

  res.json({ count: faqs.length, faqs });
});

// ADMIN: Create FAQ
//  POST /api/admin/faqs
const adminCreateFaq = asyncHandler(async (req, res) => {
  const {
    category,
    question,
    answer,
    lang = "en",
    isActive = true,
    order = 0,
    tags = [],
  } = req.body;

  // If required fields missing → 400 Bad Request
  if (!category || !question || !answer) {
    res.status(400);
    throw new Error("category, question, and answer are required");
  }

  // Inserts new document in MongoDB, Returns created document
  const faq = await Faq.create({
    category,
    question,
    answer,
    lang,
    isActive,
    order,
    tags,
  });

  res.status(201).json(faq);
});

// ADMIN: Update FAQ
// PUT /api/admin/faqs/:id

const adminUpdateFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id); // Finds FAQ by ID
  if (!faq) {
    res.status(404);
    throw new Error("FAQ not found");
  }

  // Only updates fields that are provided in the request body
  const { category, question, answer, lang, isActive, order, tags } = req.body;

  if (typeof category !== "undefined") faq.category = category;
  if (typeof question !== "undefined") faq.question = question;
  if (typeof answer !== "undefined") faq.answer = answer;
  if (typeof lang !== "undefined") faq.lang = lang;
  if (typeof isActive !== "undefined") faq.isActive = isActive;
  if (typeof order !== "undefined") faq.order = order;
  if (typeof tags !== "undefined") faq.tags = tags;

  const updated = await faq.save();
  res.json(updated);
});

// ADMIN: Delete FAQ
// DELETE /api/admin/faqs/:id
const adminDeleteFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);
  if (!faq) {
    res.status(404);
    throw new Error("FAQ not found");
  }

  await faq.deleteOne();
  res.json({ message: "FAQ deleted" });
});

// ADMIN: Toggle active/inactive (quick action)
// PATCH /api/admin/faqs/:id/toggle
const adminToggleFaq = asyncHandler(async (req, res) => {
  const faq = await Faq.findById(req.params.id);
  if (!faq) {
    res.status(404);
    throw new Error("FAQ not found");
  }

  faq.isActive = !faq.isActive;
  const updated = await faq.save();

  res.json(updated);
});

module.exports = {
  getFaqs,
  adminListFaqs,
  adminCreateFaq,
  adminUpdateFaq,
  adminDeleteFaq,
  adminToggleFaq,
};
