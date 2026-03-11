const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  // who placed the order
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    enum: ["college", "visitor"]
  },
  // array of items ordered
  items: [
    {
      menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MenuItem"
      },
      name: String,
      price: Number,
      quantity: Number,
      category: String
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ["online", "cash"],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },
  // order journey
  status: {
    type: String,
    enum: ["confirmed", "preparing", "ready", "completed", "cancelled"],
    default: "confirmed"
  },
  // points earned for this order
  pointsEarned: {
    type: Number,
    default: 0
  },
  // queue position
  queuePosition: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);