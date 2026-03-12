const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  price: {
    type: Number,
    required: true
  },
  // cooked, packed, or healthy
  category: {
    type: String,
    enum: ["cooked", "packed", "healthy"],
    required: true
  },
  emoji: {
    type: String,
    default: "🍽️"
  },
  // how many portions are available today
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  // admin can turn items on/off
  isAvailable: {
    type: Boolean,
    default: true
  },
  // nutritional info for AI diet analyzer
  calories: {
    type: Number,
    default: 0
  },
  isVeg: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("MenuItem", menuItemSchema);