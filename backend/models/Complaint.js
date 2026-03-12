const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  // auto-tagged by AI later
  category: {
    type: String,
    enum: ["food_quality", "delay", "billing", "hygiene", "other"],
    default: "other"
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "low"
  },
  status: {
    type: String,
    enum: ["open", "in_progress", "resolved"],
    default: "open"
  },
  adminReply: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("Complaint", complaintSchema);
