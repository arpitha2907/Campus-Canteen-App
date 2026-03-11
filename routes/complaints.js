const express = require("express");
const router = express.Router();
const Complaint = require("../models/Complaint");
const { protect, adminOnly } = require("../middleware/auth");

// ── RAISE A COMPLAINT (user) ──────────────────────────
// POST /api/complaints
router.post("/", protect, async (req, res) => {
  try {
    const { subject, message, category } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        message: "Subject and message are required"
      });
    }

    const complaint = await Complaint.create({
      user:     req.user.id,
      userName: req.user.name,
      subject,
      message,
      category: category || "other"
    });

    // notify admin in real time
    const io = req.app.get("io");
    io.to("admin_room").emit("new_complaint", {
      complaintId: complaint._id,
      userName:    complaint.userName,
      subject:     complaint.subject,
      category:    complaint.category
    });

    res.status(201).json({
      message: "✅ Complaint submitted successfully",
      complaint
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── GET MY COMPLAINTS (user) ──────────────────────────
// GET /api/complaints/my
router.get("/my", protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      message:  "✅ Complaints fetched",
      count:    complaints.length,
      complaints
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── GET ALL COMPLAINTS (admin) ────────────────────────
// GET /api/complaints
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;

    let filter = {};
    if (status) filter.status = status;

    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      message:    "✅ All complaints fetched",
      count:      complaints.length,
      complaints
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── REPLY TO COMPLAINT (admin) ────────────────────────
// PUT /api/complaints/:id/reply
router.put("/:id/reply", protect, adminOnly, async (req, res) => {
  try {
    const { reply } = req.body;
    const io = req.app.get("io");

    if (!reply) {
      return res.status(400).json({ message: "Reply message is required" });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.adminReply = reply;
    complaint.status     = "resolved";
    await complaint.save();

    // 🔔 notify the user their complaint was replied to
    io.to(complaint.user.toString()).emit("complaint_reply", {
      complaintId: complaint._id,
      subject:     complaint.subject,
      reply,
      message:     "📩 Admin replied to your complaint!"
    });

    res.json({
      message: "✅ Reply sent and complaint resolved",
      complaint
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── UPDATE COMPLAINT STATUS (admin) ───────────────────
// PUT /api/complaints/:id/status
router.put("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ["open", "in_progress", "resolved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json({
      message: `✅ Complaint status updated to ${status}`,
      complaint
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;