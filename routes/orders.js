const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");

// ── PLACE ORDER ───────────────────────────────────────
// POST /api/orders
router.post("/", protect, async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;
    const io = req.app.get("io");

    // validate
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }
    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method required" });
    }

    // check stock and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);

      if (!menuItem) {
        return res.status(404).json({
          message: `Item not found: ${item.menuItemId}`
        });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({
          message: `${menuItem.name} is currently unavailable`
        });
      }

      if (menuItem.quantity < item.quantity) {
        return res.status(400).json({
          message: `Only ${menuItem.quantity} left for ${menuItem.name}`
        });
      }

      // reduce stock
      menuItem.quantity -= item.quantity;
      await menuItem.save();

      // emit real time stock update
      io.emit("stock_update", {
        itemId: menuItem._id,
        name: menuItem.name,
        quantity: menuItem.quantity
      });

      totalAmount += menuItem.price * item.quantity;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        category: menuItem.category
      });
    }

    // count active orders for queue position
    const activeOrders = await Order.countDocuments({
      status: { $in: ["confirmed", "preparing"] }
    });

    // points only for college members
    const pointsEarned = req.user.userType === "college" ? 5 : 0;

    // create the order
    const order = await Order.create({
      user: req.user.id,
      userName: req.user.name,
      userType: req.user.userType,
      items: orderItems,
      totalAmount,
      paymentMethod,
      pointsEarned,
      queuePosition: activeOrders + 1,
      status: "confirmed"
    });

    // add points to user
    if (pointsEarned > 0) {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { rewardPoints: pointsEarned }
      });
    }

    // 🔔 notify the user
    io.to(req.user.id.toString()).emit("order_confirmed", {
      orderId: order._id,
      status: "confirmed",
      totalAmount,
      queuePosition: order.queuePosition,
      pointsEarned
    });

    // 🔔 notify admin
    io.to("admin_room").emit("new_order", {
      orderId: order._id,
      userName: req.user.name,
      userType: req.user.userType,
      items: orderItems,
      totalAmount,
      paymentMethod,
      queuePosition: order.queuePosition
    });

    // 🔔 broadcast updated queue count
    io.emit("queue_update", { count: activeOrders + 1 });

    res.status(201).json({
      message: "✅ Order placed successfully",
      order
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── GET MY ORDERS (user) ──────────────────────────────
// GET /api/orders/my
router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      message: "✅ Orders fetched",
      count: orders.length,
      orders
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── GET ALL ORDERS (admin) ────────────────────────────
// GET /api/orders
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 });

    res.json({
      message: "✅ All orders fetched",
      count: orders.length,
      orders
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── UPDATE ORDER STATUS (admin) ───────────────────────
// PUT /api/orders/:id/status
router.put("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const io = req.app.get("io");

    const validStatuses = ["confirmed", "preparing", "ready", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    // 🔔 notify the specific user about their order
    io.to(order.user.toString()).emit("order_status_update", {
      orderId: order._id,
      status,
      message: statusMessage(status)
    });

    // 🔔 update queue count when order completes
    if (status === "completed" || status === "cancelled") {
      const activeOrders = await Order.countDocuments({
        status: { $in: ["confirmed", "preparing"] }
      });
      io.emit("queue_update", { count: activeOrders });
    }

    res.json({
      message: `✅ Order status updated to ${status}`,
      order
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── GET QUEUE COUNT ───────────────────────────────────
// GET /api/orders/queue
router.get("/queue", async (req, res) => {
  try {
    const count = await Order.countDocuments({
      status: { $in: ["confirmed", "preparing"] }
    });

    res.json({ count });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── helper function ───────────────────────────────────
const statusMessage = (status) => {
  const messages = {
    confirmed:  "✅ Your order has been confirmed!",
    preparing:  "👨‍🍳 Your order is being prepared!",
    ready:      "🔔 Your order is ready for pickup!",
    completed:  "🎉 Order completed. Enjoy your meal!",
    cancelled:  "❌ Your order has been cancelled."
  };
  return messages[status] || "Order updated";
};

module.exports = router;