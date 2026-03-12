const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const User = require("../models/User");
const Complaint = require("../models/Complaint");
const { protect, adminOnly } = require("../middleware/auth");

// ── FULL DASHBOARD ANALYTICS ──────────────────────────
// GET /api/analytics/dashboard
router.get("/dashboard", protect, adminOnly, async (req, res) => {
  try {

    // ── 1. total revenue ────────────────────────────
    const revenueData = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    // ── 2. orders by status ─────────────────────────
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // ── 3. top selling items ────────────────────────
    const topItems = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id:       "$items.name",
          totalSold: { $sum: "$items.quantity" },
          revenue:   { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    // ── 4. category wise sales ──────────────────────
    const categoryWise = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id:       "$items.category",
          totalSold: { $sum: "$items.quantity" },
          revenue:   { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      }
    ]);

    // ── 5. peak hours (orders grouped by hour) ──────
    const peakHours = await Order.aggregate([
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // ── 6. orders by payment method ─────────────────
    const paymentStats = await Order.aggregate([
      {
        $group: {
          _id:      "$paymentMethod",
          count:    { $sum: 1 },
          revenue:  { $sum: "$totalAmount" }
        }
      }
    ]);

    // ── 7. user stats ────────────────────────────────
    const totalUsers    = await User.countDocuments({ userType: "college" });
    const totalVisitors = await User.countDocuments({ userType: "visitor" });
    const totalOrders   = await Order.countDocuments();

    // ── 8. complaint stats ───────────────────────────
    const openComplaints     = await Complaint.countDocuments({ status: "open" });
    const resolvedComplaints = await Complaint.countDocuments({ status: "resolved" });

    // ── 9. todays orders ─────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysOrders = await Order.countDocuments({
      createdAt: { $gte: today }
    });

    const todaysRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          status: { $ne: "cancelled" }
        }
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    res.json({
      message: "✅ Analytics fetched",
      data: {
        overview: {
          totalRevenue,
          totalOrders,
          totalUsers,
          totalVisitors,
          todaysOrders,
          todaysRevenue: todaysRevenue[0]?.total || 0
        },
        ordersByStatus,
        topItems,
        categoryWise,
        peakHours,
        paymentStats,
        complaints: {
          open:     openComplaints,
          resolved: resolvedComplaints
        }
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── PEAK HOURS SETTINGS ───────────────────────────────
// GET /api/analytics/peak
router.get("/peak", async (req, res) => {
  try {
    const activeOrders = await Order.countDocuments({
      status: { $in: ["confirmed", "preparing"] }
    });

    // if more than 10 active orders its peak hours
    const isPeak  = activeOrders > 10;
    const delay   = isPeak ? Math.ceil(activeOrders * 1.5) : 0;

    res.json({
      isPeak,
      activeOrders,
      estimatedDelay: delay,
      message: isPeak
        ? `⏰ Peak hours! Estimated delay: ${delay} mins`
        : "✅ Normal hours. No delay."
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── REVENUE BY DATE RANGE ─────────────────────────────
// GET /api/analytics/revenue?from=2024-01-01&to=2024-12-31
router.get("/revenue", protect, adminOnly, async (req, res) => {
  try {
    const { from, to } = req.query;

    let matchFilter = { status: { $ne: "cancelled" } };

    if (from && to) {
      matchFilter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to)
      };
    }

    const revenue = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            year:  { $year:  "$createdAt" },
            month: { $month: "$createdAt" },
            day:   { $dayOfMonth: "$createdAt" }
          },
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders:  { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    res.json({
      message: "✅ Revenue data fetched",
      revenue
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;