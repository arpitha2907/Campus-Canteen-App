const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // college members have USN, visitors won't
  usn: {
    type: String,
    trim: true,
    default: null
  },
  email: {
    type: String,
    trim: true,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  password: {
    type: String,
    default: null   // visitors don't have passwords
  },
  // college or visitor
  userType: {
    type: String,
    enum: ["college", "visitor"],
    default: "college"
  },
  rewardPoints: {
    type: Number,
    default: 0
  },
  // streak tracking
  lastOrderDate: {
    type: Date,
    default: null
  },
  currentStreak: {
    type: Number,
    default: 0
  }
}, { timestamps: true }); // adds createdAt and updatedAt automatically

module.exports = mongoose.model("User", userSchema);