const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: "Challenge", required: true },
  tokenAmount: { type: Number, required: true },
  dateEarned: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Reward", rewardSchema);
