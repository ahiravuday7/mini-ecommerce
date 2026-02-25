require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

// Error handling middleware
const { notFound, errorHandler } = require("./middleware/error.middleware");

const productRoutes = require("./routes/product.routes");
const authRoutes = require("./routes/auth.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");

// faq
const faqRoutes = require("./routes/faq.routes");
const adminFaqRoutes = require("./routes/admin.faq.routes");

const app = express();

app.set("trust proxy", 1); // important for deployed apps

// General limiter (all APIs)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

// Strict limiter (login/register brute-force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200, // stricter
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});

// Middleware
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// Strict only for auth routes
app.use("/api/auth", loginLimiter);

// General for all APIs (including /api/auth too, but strict runs first)
app.use("/api", apiLimiter);

// Routes
app.get("/", (req, res) => res.send("API running..."));
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// FAQ
app.use("/api/faqs", faqRoutes);
app.use("/api/admin/faqs", adminFaqRoutes);

// Error handling middleware (asyncHandler)
app.use(notFound);
app.use(errorHandler);

// Start
connectDB(process.env.MONGO_URI);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
