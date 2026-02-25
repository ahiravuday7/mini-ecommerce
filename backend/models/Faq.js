const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // for multi-language support
    lang: {
      type: String,
      enum: ["en", "hi"],
      default: "en",
      index: true,
    },

    // show/hide without deleting
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // controls display order within a category
    order: {
      type: Number,
      default: 0,
    },

    // helps search/filter
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

// helpful indexes for faster listing/filtering
faqSchema.index({ category: 1, lang: 1, isActive: 1, order: 1 });
faqSchema.index({
  question: "text",
  answer: "text",
  category: "text",
  tags: "text",
});

const Faq = mongoose.model("Faq", faqSchema);
module.exports = Faq;
