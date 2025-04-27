const mongoose = require("mongoose");

const communityPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  expenseId: { type: mongoose.Schema.Types.ObjectId, ref: "Expense" },
  content: { type: String, required: true },
  amount: { type: Number },
  category: { type: String },
  likes: { type: Number, default: 0 },
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: { type: String },
    content: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

module.exports = mongoose.model("CommunityPost", communityPostSchema);