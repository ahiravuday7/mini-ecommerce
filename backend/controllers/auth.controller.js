const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const asyncHandler = require("../utils/asyncHandler");

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Register
const registerUser = asyncHandler(async (req, res) => {
  const { name, password, confirmPassword, shippingAddress } = req.body;
  const email = req.body.email?.trim().toLowerCase();
  const phone = req.body.phone?.trim();

  if (!name || !password || !confirmPassword || (!email && !phone)) {
    res.status(400);
    throw new Error(
      "Name, email or phone, password, and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error("Password and confirm password do not match");
  }

  if (!PASSWORD_REGEX.test(password)) {
    res.status(400);
    throw new Error(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
    );
  }

  if (email && !EMAIL_REGEX.test(email)) {
    res.status(400);
    throw new Error("Invalid email format");
  }
  if (phone && !PHONE_REGEX.test(phone)) {
    res.status(400);
    throw new Error("Invalid phone format");
  }

  const existsQuery = [];
  if (email) existsQuery.push({ email });
  if (phone) existsQuery.push({ phone });

  const userExists = await User.findOne({ $or: existsQuery });
  if (userExists) {
    res.status(400);
    if (email && userExists.email === email) {
      throw new Error("User with this email already exists");
    }
    if (phone && userExists.phone === phone) {
      throw new Error("User with this phone already exists");
    }
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    shippingAddress,
  });

  generateToken(res, user._id);

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    shippingAddress: user.shippingAddress,
    isAdmin: user.isAdmin,
  }); // HTTP status 201 (Created new User & Returns selected user data as JSON (without password))
});

// Login
const loginUser = asyncHandler(async (req, res) => {
  const { emailOrPhone, password } = req.body;
  const identifier = emailOrPhone?.trim();

  if (!identifier || !password) {
    res.status(400);
    throw new Error("Email or phone and password are required");
  }

  const normalizedIdentifier = identifier.toLowerCase();
  const looksLikeEmail = identifier.includes("@");
  const isEmail = EMAIL_REGEX.test(normalizedIdentifier);

  if (looksLikeEmail && !isEmail) {
    res.status(400);
    throw new Error("Invalid email format");
  }
  if (!isEmail && !PHONE_REGEX.test(identifier)) {
    res.status(400);
    throw new Error("Invalid phone format");
  }

  const user = await User.findOne(
    isEmail ? { email: normalizedIdentifier } : { phone: identifier },
  );

  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      shippingAddress: user.shippingAddress,
      isAdmin: user.isAdmin,
    }); // HTTP status 200 (OK), Returns selected user data as JSON
  } else {
    res.status(401);
    throw new Error("Invalid email/phone or password");
  }
});

// Logout
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ message: "Logged out successfully" });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
};
