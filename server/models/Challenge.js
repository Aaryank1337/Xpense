const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ["daily", "weekly", "custom"], default: "custom" },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  targetAmount: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  reward: {
    type: Number, // Number of EduTokens
    default: 10,
  },
});

module.exports = mongoose.model("Challenge", challengeSchema);
