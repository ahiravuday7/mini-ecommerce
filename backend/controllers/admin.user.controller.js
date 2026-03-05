const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");
const Order = require("../models/Order");
const Cart = require("../models/Cart");

// safe pagination,valid numeric inputs,protection from bad query values
const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const listAdminUsers = asyncHandler(async (req, res) => {
  const page = toPositiveInt(req.query.page, 1); //
  const limit = Math.min(50, toPositiveInt(req.query.limit, 10));
  const search = String(req.query.search || "").trim();
  const status = String(req.query.status || "all").toLowerCase();
  const role = String(req.query.role || "all").toLowerCase();

  // Filter Object
  const filter = {};

  // allows the admin to search users by name, email, or phone.
  if (search) {
    const regex = new RegExp(
      search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  // status filter
  if (status === "blocked") {
    filter.isBlocked = true;
  } else if (status === "active") {
    filter.isBlocked = { $ne: true };
  }

  // role filter
  if (role === "admin") {
    filter.isAdmin = true;
  } else if (role === "user") {
    filter.isAdmin = false;
  }

  const total = await User.countDocuments(filter); //Count total users matching the filter
  const pages = Math.max(1, Math.ceil(total / limit)); //Calculate total pages
  const safePage = Math.min(page, pages); //Ensure requested page is valid
  const skip = (safePage - 1) * limit; //Calculate how many records to skip

  //Fetch users from the database
  const users = await User.find(filter)
    .select(
      "_id name email phone isAdmin isBlocked blockedAt createdAt updatedAt",
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean(); //Convert to plain JavaScript objects

  //tells the admin:how many orders each user placed,how much money they spent,when their last order was
  const userIds = users.map((u) => u._id);
  const orderStats = await Order.aggregate([
    { $match: { user: { $in: userIds } } },
    {
      $group: {
        _id: "$user",
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$totalPrice" },
        lastOrderAt: { $max: "$createdAt" },
      },
    },
  ]);

  //combines users with their order statistics and returns a clean paginated admin response.
  const statsMap = new Map(orderStats.map((s) => [String(s._id), s]));
  const items = users.map((u) => {
    const stats = statsMap.get(String(u._id));
    return {
      ...u,
      totalOrders: stats?.totalOrders || 0,
      totalSpent:
        Math.round(((stats?.totalSpent || 0) + Number.EPSILON) * 100) / 100,
      lastOrderAt: stats?.lastOrderAt || null,
    };
  });

  res.json({
    items,
    page: safePage,
    pages,
    total,
    limit,
    filters: { search, status, role },
  });
});

// Fetch the user info (without password), Calculate that user’s order stats
const getAdminUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password").lean();

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const [orderStats] = await Order.aggregate([
    { $match: { user: user._id } },
    {
      $group: {
        _id: "$user",
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$totalPrice" },
        lastOrderAt: { $max: "$createdAt" },
      },
    },
  ]);

  res.json({
    user,
    stats: {
      totalOrders: orderStats?.totalOrders || 0,
      totalSpent:
        Math.round(((orderStats?.totalSpent || 0) + Number.EPSILON) * 100) /
        100,
      lastOrderAt: orderStats?.lastOrderAt || null,
    },
  });
});

// Admin can view all orders of a particular user.
const getAdminUserOrders = asyncHandler(async (req, res) => {
  const page = toPositiveInt(req.query.page, 1);
  const limit = Math.min(50, toPositiveInt(req.query.limit, 10));
  const status = String(req.query.status || "all").toLowerCase();

  const user = await User.findById(req.params.id).select("_id").lean();
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const filter = { user: user._id };
  if (status !== "all") filter.status = status;

  const total = await Order.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, pages);
  const skip = (safePage - 1) * limit;

  const items = await Order.find(filter)
    .select(
      "_id invoiceNumber totalPrice itemsPrice shippingPrice taxPrice status paymentStatus paymentMethod createdAt items",
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.json({
    items,
    page: safePage,
    pages,
    total,
    limit,
    filter: { status },
  });
});

// admin to block or unblock a user account
const setAdminUserBlockStatus = asyncHandler(async (req, res) => {
  const payloadBlocked = req.body?.isBlocked;
  if (typeof payloadBlocked !== "boolean") {
    res.status(400);
    throw new Error("isBlocked must be boolean");
  }

  const target = await User.findById(req.params.id);
  if (!target) {
    res.status(404);
    throw new Error("User not found");
  }

  if (String(target._id) === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot block or unblock your own account");
  }

  if (target.isAdmin && payloadBlocked) {
    res.status(400);
    throw new Error("Admin accounts cannot be blocked");
  }

  target.isBlocked = payloadBlocked;
  target.blockedAt = payloadBlocked ? new Date() : null;
  await target.save();

  res.json({
    message: payloadBlocked
      ? "User blocked successfully"
      : "User unblocked successfully",
    user: {
      _id: target._id,
      name: target.name,
      email: target.email,
      phone: target.phone,
      isAdmin: target.isAdmin,
      isBlocked: target.isBlocked,
      blockedAt: target.blockedAt,
    },
  });
});

//admin to permanently delete a user account
const deleteAdminUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target) {
    res.status(404);
    throw new Error("User not found");
  }

  if (String(target._id) === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot delete your own account");
  }

  if (target.isAdmin) {
    res.status(400);
    throw new Error("Admin accounts cannot be deleted");
  }

  await Promise.all([
    Cart.deleteOne({ user: target._id }),
    User.deleteOne({ _id: target._id }),
  ]);

  res.json({ message: "User deleted successfully" });
});

module.exports = {
  listAdminUsers,
  getAdminUserDetails,
  getAdminUserOrders,
  setAdminUserBlockStatus,
  deleteAdminUser,
};
