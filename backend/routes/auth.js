const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ── helper to generate token ──────────────────────────
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ── REGISTER (College Member) ─────────────────────────
// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, usn, email, password } = req.body;

    // check all fields are present
    if (!name || !usn || !password) {
      return res.status(400).json({ message: "Name, USN and password are required" });
    }

    // check if USN already exists
    const existing = await User.findOne({ usn });
    if (existing) {
      return res.status(400).json({ message: "USN already registered" });
    }

    // hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create new user
    const user = await User.create({
      name,
      usn,
      email,
      password: hashedPassword,
      userType: "college"
    });

    // generate token
    const token = generateToken({
      id: user._id,
      name: user.name,
      role: "user",
      userType: "college"
    });

    res.status(201).json({
      message: "✅ Registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        usn: user.usn,
        email: user.email,
        userType: user.userType,
        rewardPoints: user.rewardPoints
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── LOGIN (College Member) ────────────────────────────
// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { usn, password } = req.body;

    if (!usn || !password) {
      return res.status(400).json({ message: "USN and password are required" });
    }

    // find user by USN or email
    const user = await User.findOne({
      $or: [{ usn }, { email: usn }]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // generate token
    const token = generateToken({
      id: user._id,
      name: user.name,
      role: "user",
      userType: user.userType
    });

    res.json({
      message: "✅ Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        usn: user.usn,
        email: user.email,
        userType: user.userType,
        rewardPoints: user.rewardPoints
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── VISITOR LOGIN ─────────────────────────────────────
// POST /api/auth/visitor
router.post("/visitor", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || (!email && !phone)) {
      return res.status(400).json({ message: "Name and email or phone required" });
    }

    // check if visitor already exists
    let visitor = await User.findOne({
      $or: [
        { email: email || null },
        { phone: phone || null }
      ],
      userType: "visitor"
    });

    // if not found, create new visitor
    if (!visitor) {
      visitor = await User.create({
        name,
        email: email || null,
        phone: phone || null,
        userType: "visitor"
      });
    }

    // generate token
    const token = generateToken({
      id: visitor._id,
      name: visitor.name,
      role: "user",
      userType: "visitor"
    });

    res.json({
      message: "✅ Welcome!",
      token,
      user: {
        id: visitor._id,
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone,
        userType: visitor.userType
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ── ADMIN LOGIN ───────────────────────────────────────
// POST /api/auth/admin
router.post("/admin", (req, res) => {
  const { adminId, password } = req.body;

  // hardcoded admin credentials (fine for college project)
  if (adminId !== "admin" || password !== "admin123") {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  const token = generateToken({
    id: "admin",
    name: "Canteen Admin",
    role: "admin"
  });

  res.json({
    message: "✅ Admin login successful",
    token,
    user: {
      id: "admin",
      name: "Canteen Admin",
      role: "admin"
    }
  });
});

module.exports = router;