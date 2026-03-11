const express = require("express");
const router = express.Router();
const MenuItem = require("../models/MenuItem");
const { protect, adminOnly } = require("../middleware/auth");

// ── GET ALL MENU ITEMS ────────────────────────────────
// GET /api/menu
// supports ?category=cooked or ?category=packed or ?category=healthy
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;

    // build filter object
    let filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }

    const items = await MenuItem.find(filter).sort({ createdAt: -1 });

    res.json({
      message: "✅ Menu fetched",
      count: items.length,
      items
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── GET SINGLE MENU ITEM ──────────────────────────────
// GET /api/menu/:id
router.get("/:id", async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── ADD MENU ITEM (admin only) ────────────────────────
// POST /api/menu
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      emoji,
      quantity,
      calories,
      isVeg
    } = req.body;

    // validate required fields
    if (!name || !price || !category) {
      return res.status(400).json({
        message: "Name, price and category are required"
      });
    }

    // validate category value
    if (!["cooked", "packed", "healthy"].includes(category)) {
      return res.status(400).json({
        message: "Category must be cooked, packed or healthy"
      });
    }

    const item = await MenuItem.create({
      name,
      description,
      price,
      category,
      emoji: emoji || "🍽️",
      quantity: quantity || 0,
      calories: calories || 0,
      isVeg: isVeg !== undefined ? isVeg : true
    });

    res.status(201).json({
      message: "✅ Menu item added",
      item
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── UPDATE MENU ITEM (admin only) ─────────────────────
// PUT /api/menu/:id
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // update only the fields that are sent
    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true } // return the updated document
    );

    res.json({
      message: "✅ Menu item updated",
      item: updatedItem
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── UPDATE QUANTITY ONLY (admin only) ─────────────────
// PUT /api/menu/:id/quantity
router.put("/:id/quantity", protect, adminOnly, async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ message: "Valid quantity required" });
    }

    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { quantity },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // emit real time stock update to all users
    const io = req.app.get("io");
    io.emit("stock_update", {
      itemId: item._id,
      name: item.name,
      quantity: item.quantity
    });

    res.json({
      message: "✅ Quantity updated",
      item
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── TOGGLE AVAILABILITY (admin only) ──────────────────
// PUT /api/menu/:id/toggle
router.put("/:id/toggle", protect, adminOnly, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    // emit real time availability update
    const io = req.app.get("io");
    io.emit("availability_update", {
      itemId: item._id,
      name: item.name,
      isAvailable: item.isAvailable
    });

    res.json({
      message: `✅ Item ${item.isAvailable ? "enabled" : "disabled"}`,
      item
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── DELETE MENU ITEM (admin only) ─────────────────────
// DELETE /api/menu/:id
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    await item.deleteOne();

    res.json({ message: "✅ Menu item deleted" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;