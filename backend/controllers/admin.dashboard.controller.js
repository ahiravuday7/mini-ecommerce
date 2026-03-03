const asyncHandler = require("../utils/asyncHandler");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const LOW_STOCK_THRESHOLD = 5;

const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// GET /api/admin/dashboard
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  // get total users count,total orders count,all products (only selected fields),returns plain JS objects (faster than Mongoose docs)
  const [totalUsers, totalOrders, products] = await Promise.all([
    User.countDocuments({}),
    Order.countDocuments({}),
    Product.find({})
      .select("title image stock category brand createdAt")
      .lean(),
  ]);

  // Total Sales (Ignore cancelled orders,Sum all totalPrice)
  const salesAgg = await Order.aggregate([
    { $match: { status: { $ne: "cancelled" } } }, //Only valid orders are considered (like delivered, shipped, etc.)
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$totalPrice" },
      },
    },
  ]);

  //Safely extract value , Default = 0 if no orders
  const totalSales = round2(salesAgg[0]?.totalSales || 0);

  //Top 5 selling products based on quantity sold, along with revenue
  const topSellingProductsAgg = await Order.aggregate([
    { $match: { status: { $ne: "cancelled" } } }, //Ignore cancelled orders
    { $unwind: "$items" }, //Break Items Array , Now each product becomes a separate document, Makes aggregation possible per product
    {
      $group: {
        _id: "$items.product", //Group all same products together,Take first title,image.
        title: { $first: "$items.title" },
        image: { $first: "$items.image" },
        totalQtySold: { $sum: "$items.qty" }, //Adds quantity of all orders
        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } }, //totalRevenue
      },
    },
    { $sort: { totalQtySold: -1 } }, //Best Sellers First
    { $limit: 5 }, // Only return top 5 products
    {
      $project: {
        //Keeps only required fields
        _id: 1,
        title: 1,
        image: 1,
        totalQtySold: 1,
        totalRevenue: { $round: ["$totalRevenue", 2] },
      },
    },
  ]);

  // Top 10 products with lowest stock (including out-of-stock)
  const lowStockProducts = products
    .filter((p) => Number(p.stock || 0) <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0)) //Lowest Stock First
    .slice(0, 10);

  // It calculates inventory summary stats from all products:Total products,Total stock units,Out-of-stock count,Low-stock count
  const inventoryTotals = products.reduce(
    (acc, p) => {
      const stock = Number(p.stock || 0);
      acc.totalProducts += 1;
      acc.totalUnitsInStock += stock;
      if (stock === 0) acc.outOfStockCount += 1;
      if (stock <= LOW_STOCK_THRESHOLD) acc.lowStockCount += 1;
      return acc;
    },
    {
      totalProducts: 0,
      totalUnitsInStock: 0,
      outOfStockCount: 0,
      lowStockCount: 0,
    },
  );

  // daily revenue + order count, sorts newest-first, keeps 14 days
  const dailyRevenueAgg = await Order.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    {
      // group orders by day
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        revenue: { $sum: "$totalPrice" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } }, //newest dates appear first.
    { $limit: 14 }, //keep only last 14 days
    {
      $project: {
        _id: 0,
        label: {
          $concat: [
            { $toString: "$_id.year" },
            "-",
            {
              $cond: [
                { $lt: ["$_id.month", 10] },
                { $concat: ["0", { $toString: "$_id.month" }] },
                { $toString: "$_id.month" },
              ],
            },
            "-",
            {
              $cond: [
                { $lt: ["$_id.day", 10] },
                { $concat: ["0", { $toString: "$_id.day" }] },
                { $toString: "$_id.day" },
              ],
            },
          ],
        },
        revenue: { $round: ["$revenue", 2] },
        orders: 1,
      },
    },
  ]);

  // calculates total revenue and order count, and returns the latest 12 months
  const monthlyRevenueAgg = await Order.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    {
      // Group by Month
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        revenue: { $sum: "$totalPrice" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: 12 },
    {
      $project: {
        _id: 0,
        year: "$_id.year",
        month: "$_id.month",
        revenue: { $round: ["$revenue", 2] },
        orders: 1,
      },
    },
  ]);

  res.json({
    summary: {
      totalSales,
      totalOrders,
      totalUsers,
      totalProducts: inventoryTotals.totalProducts,
    },
    topSellingProducts: topSellingProductsAgg,
    inventory: {
      threshold: LOW_STOCK_THRESHOLD,
      ...inventoryTotals,
      lowStockProducts,
    },
    revenue: {
      daily: dailyRevenueAgg.reverse(),
      monthly: monthlyRevenueAgg.reverse(),
    },
  });
});

module.exports = {
  getDashboardAnalytics,
};
